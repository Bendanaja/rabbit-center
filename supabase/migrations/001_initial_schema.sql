-- =====================================================
-- RABBITAI DATABASE SCHEMA
-- Migration: 001_initial_schema
-- Supabase PostgreSQL
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('card', 'promptpay', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- USER PROFILES (extends auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS 'Extended user profile information';

-- =====================================================
-- USER SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'th',
    notifications_email BOOLEAN DEFAULT true,
    notifications_product_updates BOOLEAN DEFAULT true,
    notifications_usage_alerts BOOLEAN DEFAULT true,
    notifications_promotions BOOLEAN DEFAULT false,
    model_preference VARCHAR(50) DEFAULT 'gpt-3.5',
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_settings IS 'User preferences and settings';

-- =====================================================
-- CHATS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    model_id VARCHAR(50) NOT NULL DEFAULT 'gpt-3.5',
    system_prompt TEXT,
    is_archived BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.chats IS 'Chat conversations';

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_updated ON public.chats(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_user_archived ON public.chats(user_id, is_archived);

-- =====================================================
-- MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    model_id VARCHAR(50),
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    is_error BOOLEAN DEFAULT false,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.messages IS 'Chat messages';

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at ASC);

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

COMMENT ON TABLE public.subscriptions IS 'User subscription information';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- =====================================================
-- USAGE RECORDS (Daily aggregates)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    model_id VARCHAR(50) NOT NULL,
    message_count INTEGER DEFAULT 0,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date, model_id)
);

COMMENT ON TABLE public.usage_records IS 'Daily usage aggregates per user and model';

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON public.usage_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_user_model ON public.usage_records(user_id, model_id);

-- =====================================================
-- PAYMENT HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    payment_method payment_method_type NOT NULL,
    status payment_status DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.payment_history IS 'Payment transaction history';

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payment_history(created_at DESC);

-- =====================================================
-- API KEYS (for Enterprise users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(12) NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['chat:read', 'chat:write'],
    rate_limit_per_minute INTEGER DEFAULT 60,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.api_keys IS 'API keys for programmatic access';

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active) WHERE is_active = true;

-- =====================================================
-- AI MODELS CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_models (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    description TEXT,
    icon_url TEXT,
    tier VARCHAR(20) DEFAULT 'pro' CHECK (tier IN ('free', 'pro', 'enterprise')),
    input_cost_per_1k DECIMAL(10, 6),
    output_cost_per_1k DECIMAL(10, 6),
    max_tokens INTEGER DEFAULT 4096,
    context_window INTEGER DEFAULT 4096,
    supports_streaming BOOLEAN DEFAULT true,
    supports_vision BOOLEAN DEFAULT false,
    supports_function_calling BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.ai_models IS 'Available AI models configuration';

-- =====================================================
-- PRICING PLANS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_th VARCHAR(100),
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'THB',
    description TEXT,
    description_th TEXT,
    features JSONB DEFAULT '[]',
    limitations JSONB DEFAULT '{}',
    daily_message_limit INTEGER,
    models_allowed TEXT[],
    chat_history_days INTEGER,
    has_api_access BOOLEAN DEFAULT false,
    max_team_members INTEGER DEFAULT 1,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pricing_plans IS 'Subscription pricing plans';

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_records_updated_at ON public.usage_records;
CREATE TRIGGER update_usage_records_updated_at
    BEFORE UPDATE ON public.usage_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_models_updated_at ON public.ai_models;
CREATE TRIGGER update_ai_models_updated_at
    BEFORE UPDATE ON public.ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile, settings, and subscription on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (user_id, display_name)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        )
    );

    -- Create user settings with defaults
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);

    -- Create free subscription
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update chat stats when message is added
CREATE OR REPLACE FUNCTION update_chat_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_message_stats();

-- Update or insert usage record
CREATE OR REPLACE FUNCTION upsert_usage_record(
    p_user_id UUID,
    p_model_id VARCHAR(50),
    p_tokens_input INTEGER,
    p_tokens_output INTEGER
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.usage_records (user_id, model_id, date, message_count, tokens_input, tokens_output)
    VALUES (p_user_id, p_model_id, CURRENT_DATE, 1, p_tokens_input, p_tokens_output)
    ON CONFLICT (user_id, date, model_id)
    DO UPDATE SET
        message_count = usage_records.message_count + 1,
        tokens_input = usage_records.tokens_input + EXCLUDED.tokens_input,
        tokens_output = usage_records.tokens_output + EXCLUDED.tokens_output,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Get user's daily message count
CREATE OR REPLACE FUNCTION get_daily_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COALESCE(SUM(message_count), 0)
    INTO total
    FROM public.usage_records
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Check if user can send message (based on plan limits)
CREATE OR REPLACE FUNCTION can_user_send_message(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan_id VARCHAR(50);
    v_daily_limit INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Get user's plan
    SELECT s.plan_id INTO v_plan_id
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id AND s.status = 'active';

    -- Get plan's daily limit
    SELECT daily_message_limit INTO v_daily_limit
    FROM public.pricing_plans
    WHERE id = COALESCE(v_plan_id, 'free');

    -- No limit means unlimited
    IF v_daily_limit IS NULL THEN
        RETURN true;
    END IF;

    -- Get current count
    v_current_count := get_daily_message_count(p_user_id);

    RETURN v_current_count < v_daily_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- User Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- User Settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Chats policies
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
CREATE POLICY "Users can view own chats" ON public.chats
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own chats" ON public.chats;
CREATE POLICY "Users can create own chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
CREATE POLICY "Users can update own chats" ON public.chats
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;
CREATE POLICY "Users can delete own chats" ON public.chats
    FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in own chats" ON public.messages;
CREATE POLICY "Users can view messages in own chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chats.id = messages.chat_id
            AND chats.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create messages in own chats" ON public.messages;
CREATE POLICY "Users can create messages in own chats" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chats.id = messages.chat_id
            AND chats.user_id = auth.uid()
        )
    );

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Usage Records policies
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_records;
CREATE POLICY "Users can view own usage" ON public.usage_records
    FOR SELECT USING (auth.uid() = user_id);

-- Payment History policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
CREATE POLICY "Users can view own payments" ON public.payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- API Keys policies
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
CREATE POLICY "Users can view own API keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own API keys" ON public.api_keys;
CREATE POLICY "Users can create own API keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
CREATE POLICY "Users can update own API keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;
CREATE POLICY "Users can delete own API keys" ON public.api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Public read for models and plans
DROP POLICY IF EXISTS "Anyone can view active models" ON public.ai_models;
CREATE POLICY "Anyone can view active models" ON public.ai_models
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.pricing_plans;
CREATE POLICY "Anyone can view active plans" ON public.pricing_plans
    FOR SELECT USING (is_active = true);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed AI Models
INSERT INTO public.ai_models (id, name, provider, description, tier, input_cost_per_1k, output_cost_per_1k, max_tokens, context_window, display_order) VALUES
('gpt-4', 'GPT-4', 'OpenAI', 'Most powerful model for complex tasks', 'pro', 0.03, 0.06, 8192, 8192, 1),
('gpt-3.5', 'GPT-3.5 Turbo', 'OpenAI', 'Fast and efficient for general tasks', 'free', 0.0005, 0.0015, 4096, 16385, 2),
('claude-3-opus', 'Claude 3 Opus', 'Anthropic', 'Best for nuanced, thoughtful responses', 'pro', 0.015, 0.075, 4096, 200000, 3),
('claude-2', 'Claude 2', 'Anthropic', 'Reliable AI assistant', 'pro', 0.008, 0.024, 4096, 100000, 4),
('gemini-pro', 'Gemini Pro', 'Google', 'Advanced model from Google', 'pro', 0.00025, 0.0005, 8192, 32768, 5),
('mistral-large', 'Mistral Large', 'Mistral', 'European AI with strong reasoning', 'pro', 0.008, 0.024, 8192, 32768, 6),
('llama-3-70b', 'Llama 3 70B', 'Meta', 'Powerful open-source model', 'pro', 0.0007, 0.0009, 4096, 8192, 7)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    input_cost_per_1k = EXCLUDED.input_cost_per_1k,
    output_cost_per_1k = EXCLUDED.output_cost_per_1k,
    max_tokens = EXCLUDED.max_tokens,
    context_window = EXCLUDED.context_window,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- Seed Pricing Plans
INSERT INTO public.pricing_plans (id, name, name_th, price_monthly, description, description_th, daily_message_limit, models_allowed, chat_history_days, has_api_access, max_team_members, display_order, features) VALUES
('free', 'Free', 'ฟรี', 0, 'Perfect for trying out', 'เหมาะสำหรับทดลองใช้งาน', 50, ARRAY['gpt-3.5'], 7, false, 1, 1,
 '["50 messages per day", "GPT-3.5 Turbo only", "7 days chat history", "Normal speed"]'::jsonb),
('pro', 'Pro', 'โปร', 299, 'For serious users', 'สำหรับผู้ใช้งานจริงจัง', NULL, ARRAY['gpt-4', 'gpt-3.5', 'claude-3-opus', 'claude-2', 'gemini-pro', 'mistral-large', 'llama-3-70b'], NULL, false, 1, 2,
 '["Unlimited messages", "All AI models", "Unlimited chat history", "Maximum speed", "Export conversations", "Custom prompts"]'::jsonb),
('enterprise', 'Enterprise', 'องค์กร', 1499, 'For teams and businesses', 'สำหรับทีมและธุรกิจ', NULL, ARRAY['gpt-4', 'gpt-3.5', 'claude-3-opus', 'claude-2', 'gemini-pro', 'mistral-large', 'llama-3-70b'], NULL, true, 10, 3,
 '["Everything in Pro", "API access", "Team members (up to 10)", "Admin dashboard", "SSO integration", "Dedicated support", "Custom model fine-tuning", "SLA guarantee"]'::jsonb)
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
-- REALTIME PUBLICATION
-- =====================================================

-- Enable realtime for specific tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE
    public.chats,
    public.messages,
    public.subscriptions;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON public.ai_models TO anon, authenticated;
GRANT SELECT ON public.pricing_plans TO anon, authenticated;

GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.usage_records TO authenticated;
GRANT SELECT ON public.payment_history TO authenticated;
GRANT ALL ON public.api_keys TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_daily_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_send_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_usage_record(UUID, VARCHAR, INTEGER, INTEGER) TO authenticated;
