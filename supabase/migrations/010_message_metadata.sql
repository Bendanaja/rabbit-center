-- Add metadata JSONB column to messages table for storing attachment info
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Index for querying messages with attachments
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING gin (metadata) WHERE metadata IS NOT NULL;
