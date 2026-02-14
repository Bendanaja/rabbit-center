-- Add share fields to chats table
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS share_token VARCHAR(32) UNIQUE;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_chats_share_token ON public.chats(share_token) WHERE share_token IS NOT NULL;
