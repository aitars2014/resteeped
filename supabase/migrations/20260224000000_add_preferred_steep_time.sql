-- Add preferred_steep_time column to user_teas for saving timer preferences per tea
ALTER TABLE user_teas
  ADD COLUMN IF NOT EXISTS preferred_steep_time INTEGER DEFAULT NULL;

-- Add preferred_temp_f for future use
ALTER TABLE user_teas
  ADD COLUMN IF NOT EXISTS preferred_temp_f INTEGER DEFAULT NULL;

COMMENT ON COLUMN user_teas.preferred_steep_time IS 'User preferred steep time in seconds';
COMMENT ON COLUMN user_teas.preferred_temp_f IS 'User preferred water temperature in Fahrenheit';
