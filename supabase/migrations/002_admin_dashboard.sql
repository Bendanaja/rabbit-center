-- =====================================================
-- ADMIN DASHBOARD SCHEMA EXTENSION
-- Migration: 002_admin_dashboard
-- =====================================================

-- Admin Roles Enum
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('owner', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Flagged Content Status
DO $$ BEGIN
    CREATE TYPE flag_status AS ENUM ('pending', 'reviewed', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ADMIN USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role admin_role NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '[]'::jsonb,
    assigned_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

-- =====================================================
-- SYSTEM CONFIG TABLE (site settings)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FLAGGED CHATS (content moderation)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.flagged_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    flagged_by UUID REFERENCES auth.users(id),
    reason VARCHAR(255),
    details TEXT,
    status flag_status DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flagged_chats_status ON public.flagged_chats(status);
CREATE INDEX IF NOT EXISTS idx_flagged_chats_created ON public.flagged_chats(created_at DESC);

-- =====================================================
-- USER BANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL,
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    is_permanent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_active ON public.user_bans(is_active) WHERE is_active = true;

-- =====================================================
-- ADMIN ACTIVITY LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON public.admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON public.admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON public.admin_activity_log(action);

-- =====================================================
-- ANALYTICS AGGREGATES (pre-computed for dashboard)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_chats INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0,
    revenue_amount DECIMAL(10, 2) DEFAULT 0,
    revenue_currency VARCHAR(3) DEFAULT 'THB',
    avg_messages_per_user DECIMAL(10, 2) DEFAULT 0,
    model_usage JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily(date DESC);

-- =====================================================
-- MODEL LIMITS (dynamic rate limits per model)
-- =====================================================
ALTER TABLE public.ai_models ADD COLUMN IF NOT EXISTS daily_limit INTEGER;
ALTER TABLE public.ai_models ADD COLUMN IF NOT EXISTS hourly_limit INTEGER;
ALTER TABLE public.ai_models ADD COLUMN IF NOT EXISTS cooldown_seconds INTEGER DEFAULT 0;
ALTER TABLE public.ai_models ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = p_user_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is owner
CREATE OR REPLACE FUNCTION is_owner(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = p_user_id AND role = 'owner' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_bans
        WHERE user_id = p_user_id
        AND is_active = true
        AND (is_permanent = true OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.admin_activity_log (admin_user_id, action, resource_type, resource_id, details)
    VALUES (p_admin_user_id, p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin role
CREATE OR REPLACE FUNCTION get_admin_role(p_user_id UUID)
RETURNS admin_role AS $$
DECLARE
    v_role admin_role;
BEGIN
    SELECT role INTO v_role FROM public.admin_users
    WHERE user_id = p_user_id AND is_active = true;
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Admin users policies
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can manage admins" ON public.admin_users;
CREATE POLICY "Owners can manage admins" ON public.admin_users
    FOR ALL USING (is_owner(auth.uid()));

-- System config policies
DROP POLICY IF EXISTS "Admins can view system config" ON public.system_config;
CREATE POLICY "Admins can view system config" ON public.system_config
    FOR SELECT USING (is_admin(auth.uid()) OR is_public = true);

DROP POLICY IF EXISTS "Owners can modify system config" ON public.system_config;
CREATE POLICY "Owners can modify system config" ON public.system_config
    FOR ALL USING (is_owner(auth.uid()));

-- Flagged chats policies
DROP POLICY IF EXISTS "Admins can view flagged chats" ON public.flagged_chats;
CREATE POLICY "Admins can view flagged chats" ON public.flagged_chats
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update flagged chats" ON public.flagged_chats;
CREATE POLICY "Admins can update flagged chats" ON public.flagged_chats
    FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert flagged chats" ON public.flagged_chats;
CREATE POLICY "Admins can insert flagged chats" ON public.flagged_chats
    FOR INSERT WITH CHECK (true);

-- User bans policies
DROP POLICY IF EXISTS "Admins can view bans" ON public.user_bans;
CREATE POLICY "Admins can view bans" ON public.user_bans
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can create bans" ON public.user_bans;
CREATE POLICY "Admins can create bans" ON public.user_bans
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update bans" ON public.user_bans;
CREATE POLICY "Admins can update bans" ON public.user_bans
    FOR UPDATE USING (is_admin(auth.uid()));

-- Activity log policies
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_log
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_log;
CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_log
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Analytics policies
DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics_daily;
CREATE POLICY "Admins can view analytics" ON public.analytics_daily
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage analytics" ON public.analytics_daily;
CREATE POLICY "Admins can manage analytics" ON public.analytics_daily
    FOR ALL USING (is_admin(auth.uid()));

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT ON public.system_config TO authenticated;
GRANT ALL ON public.flagged_chats TO authenticated;
GRANT ALL ON public.user_bans TO authenticated;
GRANT ALL ON public.admin_activity_log TO authenticated;
GRANT ALL ON public.analytics_daily TO authenticated;

GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_banned(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_activity(UUID, VARCHAR, VARCHAR, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_role(UUID) TO authenticated;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed system config defaults
INSERT INTO public.system_config (key, value, category, description, is_public) VALUES
('site_name', '"RabbitAI"'::jsonb, 'general', 'Site name', true),
('site_description', '"AI Chat Platform with Multiple Models"'::jsonb, 'general', 'Site description', true),
('maintenance_mode', 'false'::jsonb, 'general', 'Enable maintenance mode', false),
('signup_enabled', 'true'::jsonb, 'general', 'Allow new signups', false),
('max_free_messages_per_day', '50'::jsonb, 'limits', 'Free tier message limit', false),
('max_pro_messages_per_day', '1000'::jsonb, 'limits', 'Pro tier message limit', false),
('default_model', '"openai/gpt-4o-mini"'::jsonb, 'ai', 'Default AI model', false),
('available_models', '["openai/gpt-4o-mini", "openai/gpt-4o", "anthropic/claude-3.5-sonnet", "google/gemini-pro"]'::jsonb, 'ai', 'Available models', false)
ON CONFLICT (key) DO NOTHING;
