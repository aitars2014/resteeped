-- Persist rich brew journal/check-in fields captured by the native timer.

ALTER TABLE brew_sessions
  ADD COLUMN IF NOT EXISTS infusion_number INTEGER,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1),
  ADD COLUMN IF NOT EXISTS tasting_notes TEXT[],
  ADD COLUMN IF NOT EXISTS brew_method TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_brew_sessions_public_created
  ON brew_sessions(is_public, created_at DESC);
