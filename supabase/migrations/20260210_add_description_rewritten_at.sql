-- Add column to track when descriptions were rewritten
ALTER TABLE teas ADD COLUMN IF NOT EXISTS description_rewritten_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient querying of unrewritten teas
CREATE INDEX IF NOT EXISTS idx_teas_description_rewritten_at ON teas(description_rewritten_at) WHERE description_rewritten_at IS NULL;
