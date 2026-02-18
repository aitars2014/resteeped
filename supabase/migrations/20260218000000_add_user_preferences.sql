-- Add preference columns to profiles for onboarding preference capture
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS preferred_tea_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS caffeine_preference text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_flavors text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz DEFAULT NULL;

-- Allow users to update their own preferences
CREATE POLICY "Users can update own preferences" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
