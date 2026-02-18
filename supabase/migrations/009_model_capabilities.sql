-- Add capabilities column to ai_models
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}';

-- Seed existing models with their known capabilities
UPDATE ai_models SET capabilities = '{chat-image-gen}' WHERE id IN ('nano-banana', 'nano-banana-pro');
UPDATE ai_models SET capabilities = '{t2i}' WHERE id = 'seedream-3';
UPDATE ai_models SET capabilities = '{t2i,i2i}' WHERE id IN ('seedream-4', 'seedream-4-5');
