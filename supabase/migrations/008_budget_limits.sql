-- Migration 008: Budget-based limits
-- Changes from count-based daily limits to monthly budget (THB) system.
-- Adds cost_thb column to daily_usage for tracking spend per day.
-- Monthly budget is calculated by SUM(cost_thb) WHERE date >= first of month.

-- Add cost tracking column to daily_usage
ALTER TABLE public.daily_usage ADD COLUMN IF NOT EXISTS cost_thb DECIMAL(10, 4) DEFAULT 0;

-- Recreate upsert function with cost parameter
CREATE OR REPLACE FUNCTION upsert_daily_usage(
    p_user_id UUID,
    p_messages INTEGER DEFAULT 0,
    p_images INTEGER DEFAULT 0,
    p_videos INTEGER DEFAULT 0,
    p_searches INTEGER DEFAULT 0,
    p_cost_thb DECIMAL(10, 4) DEFAULT 0
) RETURNS void AS $$
BEGIN
    INSERT INTO public.daily_usage (user_id, date, messages_count, images_count, videos_count, searches_count, cost_thb)
    VALUES (p_user_id, CURRENT_DATE, p_messages, p_images, p_videos, p_searches, p_cost_thb)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        messages_count = daily_usage.messages_count + EXCLUDED.messages_count,
        images_count = daily_usage.images_count + EXCLUDED.images_count,
        videos_count = daily_usage.videos_count + EXCLUDED.videos_count,
        searches_count = daily_usage.searches_count + EXCLUDED.searches_count,
        cost_thb = daily_usage.cost_thb + EXCLUDED.cost_thb,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for monthly aggregation queries
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage (user_id, date);
