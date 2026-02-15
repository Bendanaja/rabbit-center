-- Add searches_count to daily_usage for web search quota tracking
ALTER TABLE public.daily_usage ADD COLUMN IF NOT EXISTS searches_count INTEGER DEFAULT 0;

-- Recreate upsert_daily_usage with searches parameter (backward compatible)
CREATE OR REPLACE FUNCTION upsert_daily_usage(
    p_user_id UUID,
    p_messages INTEGER DEFAULT 0,
    p_images INTEGER DEFAULT 0,
    p_videos INTEGER DEFAULT 0,
    p_searches INTEGER DEFAULT 0
) RETURNS void AS $$
BEGIN
    INSERT INTO public.daily_usage (user_id, date, messages_count, images_count, videos_count, searches_count)
    VALUES (p_user_id, CURRENT_DATE, p_messages, p_images, p_videos, p_searches)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        messages_count = daily_usage.messages_count + EXCLUDED.messages_count,
        images_count = daily_usage.images_count + EXCLUDED.images_count,
        videos_count = daily_usage.videos_count + EXCLUDED.videos_count,
        searches_count = daily_usage.searches_count + EXCLUDED.searches_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
