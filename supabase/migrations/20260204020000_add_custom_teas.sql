-- Custom Teas: User-created tea entries
-- These are personal teas not in the main catalog

-- Add is_custom flag to teas table
ALTER TABLE teas ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE teas ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE teas ADD COLUMN IF NOT EXISTS purchase_location TEXT;
ALTER TABLE teas ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE teas ADD COLUMN IF NOT EXISTS user_notes TEXT;

-- Index for finding user's custom teas
CREATE INDEX IF NOT EXISTS idx_teas_custom ON teas(created_by) WHERE is_custom = true;

-- RLS: Users can only see their own custom teas (or public catalog teas)
CREATE POLICY "Users can view own custom teas" ON teas
  FOR SELECT USING (
    is_custom = false  -- Public catalog
    OR created_by = auth.uid()  -- Own custom teas
  );

-- Users can create custom teas
CREATE POLICY "Users can create custom teas" ON teas
  FOR INSERT WITH CHECK (
    is_custom = true 
    AND created_by = auth.uid()
  );

-- Users can update their own custom teas
CREATE POLICY "Users can update own custom teas" ON teas
  FOR UPDATE USING (
    is_custom = true 
    AND created_by = auth.uid()
  );

-- Users can delete their own custom teas
CREATE POLICY "Users can delete own custom teas" ON teas
  FOR DELETE USING (
    is_custom = true 
    AND created_by = auth.uid()
  );

-- Storage bucket for user tea photos
-- Note: Run this in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tea-photos', 'tea-photos', true);
