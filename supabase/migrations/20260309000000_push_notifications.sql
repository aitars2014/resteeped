-- Push notification tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ios',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Index for efficient lookups when sending notifications
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- RLS policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can insert/update their own tokens
CREATE POLICY "Users can manage their own push tokens"
  ON push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all tokens (for sending notifications)
-- (Service role bypasses RLS by default, so no policy needed)

-- Add notification preferences to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "dailySuggestion": false,
    "brewReminder": false,
    "newTeasFromBrands": false,
    "seasonalPrompts": false
  }'::jsonb;

-- Comment for documentation
COMMENT ON TABLE push_tokens IS 'Expo push notification tokens for each user device';
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences (all opt-in, default OFF)';
