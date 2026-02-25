-- Add preferred steep settings columns to user_teas
-- Fixes: TARS-69 (save unresponsive - column didn't exist)
--        TARS-70 (no save option for non-Western methods)
--        TARS-71 (save all steep settings, not just time)

ALTER TABLE user_teas
  ADD COLUMN IF NOT EXISTS preferred_steep_time INTEGER,
  ADD COLUMN IF NOT EXISTS preferred_brew_method TEXT,
  ADD COLUMN IF NOT EXISTS preferred_temperature INTEGER;
