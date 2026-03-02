-- Add steeping settings to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS brew_method TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS steep_time_seconds INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS temperature_f INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tea_weight DECIMAL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tea_weight_unit TEXT;

-- Drop the old unique constraint (one review per user per tea)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_tea_id_key;

-- Add new unique constraint: one review per user per tea per steeping config
-- Using COALESCE so NULLs don't create duplicates
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_tea_settings_idx 
ON reviews (user_id, tea_id, COALESCE(brew_method, ''), COALESCE(steep_time_seconds, 0), COALESCE(temperature_f, 0));
