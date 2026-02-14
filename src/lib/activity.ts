import { createAdminClient } from '@/lib/supabase/admin'

type ActivityAction = 'chat' | 'image' | 'video'

/**
 * Update customer_profiles: increment the counter for the given action
 * and set last_active_at to now. Non-blocking -- failures are logged but
 * never surface to the user.
 */
export async function trackActivity(userId: string, action: ActivityAction): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('total_messages, total_images, total_videos')
      .eq('user_id', userId)
      .single()

    if (!profile) return // no profile yet (signup may not have created one)

    const updateData: Record<string, unknown> = {
      last_active_at: new Date().toISOString(),
    }

    if (action === 'chat') {
      updateData.total_messages = (profile.total_messages || 0) + 1
    } else if (action === 'image') {
      updateData.total_images = (profile.total_images || 0) + 1
    } else if (action === 'video') {
      updateData.total_videos = (profile.total_videos || 0) + 1
    }

    await supabase
      .from('customer_profiles')
      .update(updateData)
      .eq('user_id', userId)
  } catch (err) {
    console.warn('[Activity] Failed to track activity:', err)
  }
}
