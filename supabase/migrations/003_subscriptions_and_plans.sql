-- =====================================================
-- SUBSCRIPTIONS & PLANS ENHANCEMENT
-- Migration: 003_subscriptions_and_plans
-- Adds daily_usage, payment_transactions tables
-- Updates subscriptions plan_id to support new tiers
-- =====================================================

-- =====================================================
-- UPDATE SUBSCRIPTIONS TABLE
-- Change plan_id CHECK constraint to new plan tiers
-- =====================================================

-- Drop old CHECK constraint and add new one
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_id_check
    CHECK (plan_id IN ('free', 'starter', 'pro', 'premium'));

-- Update any existing 'enterprise' plan subscriptions to 'premium'
UPDATE public.subscriptions SET plan_id = 'premium' WHERE plan_id = 'enterprise';

-- =====================================================
-- DAILY USAGE TABLE (for plan enforcement)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    messages_count INTEGER DEFAULT 0,
    images_count INTEGER DEFAULT 0,
    videos_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

COMMENT ON TABLE public.daily_usage IS 'Daily usage tracking per user for plan limit enforcement';

CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage(user_id, date DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_daily_usage_updated_at ON public.daily_usage;
CREATE TRIGGER update_daily_usage_updated_at
    BEFORE UPDATE ON public.daily_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PAYMENT TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_ref VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.payment_transactions IS 'Payment transaction records';

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON public.payment_transactions(created_at DESC);

-- =====================================================
-- UPSERT DAILY USAGE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_daily_usage(
    p_user_id UUID,
    p_messages INTEGER DEFAULT 0,
    p_images INTEGER DEFAULT 0,
    p_videos INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.daily_usage (user_id, date, messages_count, images_count, videos_count)
    VALUES (p_user_id, CURRENT_DATE, p_messages, p_images, p_videos)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        messages_count = daily_usage.messages_count + EXCLUDED.messages_count,
        images_count = daily_usage.images_count + EXCLUDED.images_count,
        videos_count = daily_usage.videos_count + EXCLUDED.videos_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- daily_usage policies
DROP POLICY IF EXISTS "Users can view own daily usage" ON public.daily_usage;
CREATE POLICY "Users can view own daily usage" ON public.daily_usage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all daily usage" ON public.daily_usage;
CREATE POLICY "Admins can view all daily usage" ON public.daily_usage
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert daily usage" ON public.daily_usage;
CREATE POLICY "System can insert daily usage" ON public.daily_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update daily usage" ON public.daily_usage;
CREATE POLICY "System can update daily usage" ON public.daily_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- payment_transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all transactions" ON public.payment_transactions
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage transactions" ON public.payment_transactions;
CREATE POLICY "Admins can manage transactions" ON public.payment_transactions
    FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON public.daily_usage TO authenticated;
GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO authenticated;

GRANT EXECUTE ON FUNCTION upsert_daily_usage(UUID, INTEGER, INTEGER, INTEGER) TO authenticated;

-- =====================================================
-- UPDATE PRICING PLANS (new tier structure)
-- =====================================================

-- Clear old plans and insert new ones
DELETE FROM public.pricing_plans WHERE id IN ('free', 'pro', 'enterprise');

INSERT INTO public.pricing_plans (id, name, name_th, price_monthly, description, description_th, daily_message_limit, models_allowed, chat_history_days, has_api_access, max_team_members, display_order, features) VALUES
('free', 'Free', 'ฟรี', 0, 'Get started with AI chat', 'เริ่มต้นใช้งาน AI แชท', 20, ARRAY['gpt-4o-mini'], 7, false, 1, 1,
 '["20 messages per day", "1 AI model", "7 days chat history", "Basic support"]'::jsonb),
('starter', 'Starter', 'สตาร์ทเตอร์', 149, 'For regular AI users', 'สำหรับผู้ใช้งาน AI ประจำ', 100, ARRAY['gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet'], 30, false, 1, 2,
 '["100 messages per day", "3 AI models", "30 days chat history", "Image generation (5/day)", "Standard support"]'::jsonb),
('pro', 'Pro', 'โปร', 399, 'For power users', 'สำหรับผู้ใช้งานระดับสูง', 500, ARRAY['gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet', 'gemini-pro', 'deepseek-r1'], NULL, false, 1, 3,
 '["500 messages per day", "All AI models", "Unlimited chat history", "Image generation (20/day)", "Video generation (5/day)", "Priority support"]'::jsonb),
('premium', 'Premium', 'พรีเมียม', 899, 'Unlimited everything', 'ไม่จำกัดทุกอย่าง', NULL, ARRAY['gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet', 'gemini-pro', 'deepseek-r1'], NULL, true, 5, 4,
 '["Unlimited messages", "All AI models", "Unlimited chat history", "Unlimited image generation", "Unlimited video generation", "API access", "Team members (up to 5)", "Priority support"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_th = EXCLUDED.name_th,
    price_monthly = EXCLUDED.price_monthly,
    description = EXCLUDED.description,
    description_th = EXCLUDED.description_th,
    daily_message_limit = EXCLUDED.daily_message_limit,
    models_allowed = EXCLUDED.models_allowed,
    chat_history_days = EXCLUDED.chat_history_days,
    has_api_access = EXCLUDED.has_api_access,
    max_team_members = EXCLUDED.max_team_members,
    display_order = EXCLUDED.display_order,
    features = EXCLUDED.features;

-- =====================================================
-- SEED ADDITIONAL SYSTEM CONFIG
-- =====================================================

INSERT INTO public.system_config (key, value, category, description, is_public) VALUES
('default_plan', '"free"'::jsonb, 'plans', 'Default plan for new users', false),
('enable_image_gen', 'true'::jsonb, 'features', 'Enable image generation feature', false),
('enable_video_gen', 'true'::jsonb, 'features', 'Enable video generation feature', false),
('promptpay_number', '""'::jsonb, 'payment', 'PromptPay number for payment', false)
ON CONFLICT (key) DO NOTHING;

-- Update site_name to RabbitHub AI
UPDATE public.system_config SET value = '"RabbitHub AI"'::jsonb WHERE key = 'site_name';
