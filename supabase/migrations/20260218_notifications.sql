-- Notification System: broadcasts + user_notifications
-- Admin creates broadcasts, users see them in real-time

-- Table: broadcasts (admin creates notification here)
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  target_plan VARCHAR(50) DEFAULT NULL,
  action_url TEXT DEFAULT NULL,
  action_label VARCHAR(100) DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_notifications (lazy-create when user reads/dismisses)
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ DEFAULT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, broadcast_id)
);

-- Indexes
CREATE INDEX idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_broadcast ON user_notifications(broadcast_id);
CREATE INDEX idx_broadcasts_active ON broadcasts(is_active, expires_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
