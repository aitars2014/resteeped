-- Allow users to insert custom teas
-- Users can only insert teas where is_custom=true and created_by is their own user id

CREATE POLICY "Users can create custom teas"
  ON teas FOR INSERT
  WITH CHECK (
    is_custom = true 
    AND created_by = auth.uid()
  );

-- Also allow users to update and delete their own custom teas
CREATE POLICY "Users can update own custom teas"
  ON teas FOR UPDATE
  USING (is_custom = true AND created_by = auth.uid());

CREATE POLICY "Users can delete own custom teas"
  ON teas FOR DELETE
  USING (is_custom = true AND created_by = auth.uid());
