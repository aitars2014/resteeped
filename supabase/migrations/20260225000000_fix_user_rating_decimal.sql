-- Allow decimal ratings (0.1 to 5.0) to match the UI slider
ALTER TABLE user_teas 
  ALTER COLUMN user_rating TYPE NUMERIC(2,1),
  DROP CONSTRAINT IF EXISTS user_teas_user_rating_check;

ALTER TABLE user_teas 
  ADD CONSTRAINT user_teas_user_rating_check 
  CHECK (user_rating >= 0.1 AND user_rating <= 5.0);

-- Also update reviews table if it has the same constraint
ALTER TABLE reviews
  ALTER COLUMN rating TYPE NUMERIC(2,1);
