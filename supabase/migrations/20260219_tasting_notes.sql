-- Tasting Notes: Editorial content for teas
CREATE TABLE IF NOT EXISTS tasting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tea_id UUID NOT NULL REFERENCES teas(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  source_attribution TEXT, -- e.g. "Based on flavor profiles from Harney & Sons"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tea_id)
);

CREATE INDEX idx_tasting_notes_tea ON tasting_notes(tea_id);

-- Allow anyone to read tasting notes
ALTER TABLE tasting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasting notes are publicly readable"
  ON tasting_notes FOR SELECT
  USING (true);

-- Only service role can insert/update (batch generation)
CREATE POLICY "Service role can manage tasting notes"
  ON tasting_notes FOR ALL
  USING (auth.role() = 'service_role');
