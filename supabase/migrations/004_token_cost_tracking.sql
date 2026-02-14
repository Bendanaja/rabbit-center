-- =====================================================
-- TOKEN COST TRACKING (Internal Only)
-- Migration: 004_token_cost_tracking
-- Tracks actual API costs per usage for profitability monitoring
-- This data is NEVER exposed to customers
-- =====================================================

-- =====================================================
-- USAGE COST LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.usage_cost_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('chat', 'image', 'video')),
    model_key VARCHAR(100) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    estimated_cost_thb DECIMAL(10, 4) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.usage_cost_log IS 'Internal cost tracking per API call. Never expose to customers.';

CREATE INDEX IF NOT EXISTS idx_usage_cost_log_user ON public.usage_cost_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_cost_log_date ON public.usage_cost_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_cost_log_action ON public.usage_cost_log(action);

-- =====================================================
-- MONTHLY COST SUMMARY VIEW (for admin dashboard)
-- =====================================================

CREATE OR REPLACE VIEW public.monthly_cost_summary AS
SELECT
    date_trunc('month', created_at) AS month,
    action,
    COUNT(*) AS total_requests,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(estimated_cost_usd) AS total_cost_usd,
    SUM(estimated_cost_thb) AS total_cost_thb,
    AVG(estimated_cost_usd) AS avg_cost_per_request_usd
FROM public.usage_cost_log
GROUP BY date_trunc('month', created_at), action
ORDER BY month DESC, action;

COMMENT ON VIEW public.monthly_cost_summary IS 'Monthly aggregated cost summary for admin reporting';

-- =====================================================
-- PER-USER COST SUMMARY VIEW (for admin)
-- =====================================================

CREATE OR REPLACE VIEW public.user_cost_summary AS
SELECT
    user_id,
    date_trunc('month', created_at) AS month,
    action,
    COUNT(*) AS total_requests,
    SUM(estimated_cost_thb) AS total_cost_thb
FROM public.usage_cost_log
WHERE created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY user_id, date_trunc('month', created_at), action
ORDER BY total_cost_thb DESC;

COMMENT ON VIEW public.user_cost_summary IS 'Per-user monthly cost breakdown for identifying heavy users';

-- =====================================================
-- RLS POLICIES (admin-only access)
-- =====================================================

ALTER TABLE public.usage_cost_log ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can see cost data
DROP POLICY IF EXISTS "Admins can view cost logs" ON public.usage_cost_log;
CREATE POLICY "Admins can view cost logs" ON public.usage_cost_log
    FOR SELECT USING (is_admin(auth.uid()));

-- Service role can insert (used by API routes via admin client)
DROP POLICY IF EXISTS "Service can insert cost logs" ON public.usage_cost_log;
CREATE POLICY "Service can insert cost logs" ON public.usage_cost_log
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.usage_cost_log TO authenticated;
GRANT INSERT ON public.usage_cost_log TO authenticated;
GRANT SELECT ON public.monthly_cost_summary TO authenticated;
GRANT SELECT ON public.user_cost_summary TO authenticated;

-- =====================================================
-- UPDATE PRICING PLANS TO MATCH NEW LIMITS
-- =====================================================

UPDATE public.pricing_plans SET
    daily_message_limit = 30,
    models_allowed = ARRAY['seed-1-6-flash'],
    features = '["30 ข้อความต่อวัน", "โมเดล Seed 1.6 Flash", "ประวัติแชท 7 วัน"]'::jsonb
WHERE id = 'free';

UPDATE public.pricing_plans SET
    daily_message_limit = 100,
    models_allowed = ARRAY['seed-1-6-flash', 'deepseek-v3-2', 'glm-4'],
    features = '["100 ข้อความต่อวัน", "3 โมเดล AI", "สร้างรูป 3 รูป/วัน", "สร้างวิดีโอ 1 ชิ้น/วัน", "ประวัติแชท 30 วัน"]'::jsonb
WHERE id = 'starter';

UPDATE public.pricing_plans SET
    price_monthly = 499,
    daily_message_limit = 200,
    models_allowed = ARRAY[]::TEXT[],
    features = '["200 ข้อความต่อวัน", "ทุกโมเดล AI", "สร้างรูป 8 รูป/วัน", "สร้างวิดีโอ 2 ชิ้น/วัน", "ประวัติแชทไม่จำกัด"]'::jsonb
WHERE id = 'pro';

UPDATE public.pricing_plans SET
    price_monthly = 799,
    daily_message_limit = 400,
    models_allowed = ARRAY[]::TEXT[],
    features = '["400 ข้อความต่อวัน", "ทุกโมเดล AI", "สร้างรูป 10 รูป/วัน", "สร้างวิดีโอ 3 ชิ้น/วัน", "API access", "ความเร็วสูงสุด"]'::jsonb
WHERE id = 'premium';
