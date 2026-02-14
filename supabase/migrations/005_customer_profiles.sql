-- Customer profiles for Big Data collection
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    display_name VARCHAR(100),
    avatar_url TEXT,
    signup_source VARCHAR(20) DEFAULT 'email', -- email, google, facebook, github, line
    device_info JSONB DEFAULT '{}'::jsonb, -- browser, OS, device type
    preferences JSONB DEFAULT '{}'::jsonb,
    total_messages INTEGER DEFAULT 0,
    total_images INTEGER DEFAULT 0,
    total_videos INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_customer_profiles_phone ON public.customer_profiles(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX idx_customer_profiles_source ON public.customer_profiles(signup_source);
CREATE INDEX idx_customer_profiles_active ON public.customer_profiles(last_active_at DESC);
CREATE INDEX idx_customer_profiles_created ON public.customer_profiles(created_at DESC);

-- RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.customer_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.customer_profiles
    FOR UPDATE USING (auth.uid() = user_id);
-- Service role inserts (on signup)
CREATE POLICY "Service can insert profiles" ON public.customer_profiles
    FOR INSERT WITH CHECK (true);
-- Admins can view all
CREATE POLICY "Admins can view all profiles" ON public.customer_profiles
    FOR SELECT USING (is_admin(auth.uid()));

GRANT ALL ON public.customer_profiles TO authenticated;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_profiles_updated_at
    BEFORE UPDATE ON public.customer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Analytics views for admin
CREATE OR REPLACE VIEW public.customer_analytics AS
SELECT
    COUNT(*) AS total_users,
    COUNT(phone_number) AS users_with_phone,
    COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '24 hours') AS active_24h,
    COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '7 days') AS active_7d,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS new_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_7d,
    jsonb_object_agg(COALESCE(signup_source, 'unknown'), source_count) AS by_source
FROM public.customer_profiles
CROSS JOIN LATERAL (
    SELECT signup_source, COUNT(*) AS source_count
    FROM public.customer_profiles
    GROUP BY signup_source
) src
LIMIT 1;

GRANT SELECT ON public.customer_analytics TO authenticated;
