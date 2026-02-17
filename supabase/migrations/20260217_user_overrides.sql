-- Per-user rate limit and budget overrides (for future per-user overrides)
-- null values = use plan defaults

CREATE TABLE IF NOT EXISTS user_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  monthly_budget_thb NUMERIC(10,2) DEFAULT NULL,
  rate_chat_per_min INTEGER DEFAULT NULL,
  rate_image_per_min INTEGER DEFAULT NULL,
  rate_video_per_min INTEGER DEFAULT NULL,
  rate_search_per_min INTEGER DEFAULT NULL,
  allowed_models TEXT[] DEFAULT NULL,
  blocked_models TEXT[] DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  updated_by UUID DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_overrides_user_id ON user_overrides(user_id);
ALTER TABLE user_overrides ENABLE ROW LEVEL SECURITY;

-- Per-plan rate limit and budget overrides (admin-configurable per plan tier)
-- null values = use hardcoded PLAN_LIMITS defaults

CREATE TABLE IF NOT EXISTS plan_overrides (
  plan_id TEXT PRIMARY KEY, -- 'free', 'starter', 'pro', 'premium'
  monthly_budget_thb NUMERIC(10,2) DEFAULT NULL,
  rate_chat_per_min INTEGER DEFAULT NULL,
  rate_image_per_min INTEGER DEFAULT NULL,
  rate_video_per_min INTEGER DEFAULT NULL,
  rate_search_per_min INTEGER DEFAULT NULL,
  allowed_models TEXT[] DEFAULT NULL,
  blocked_models TEXT[] DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  updated_by UUID DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plan_overrides ENABLE ROW LEVEL SECURITY;
