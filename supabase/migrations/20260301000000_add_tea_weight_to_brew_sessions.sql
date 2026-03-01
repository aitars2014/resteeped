-- Add tea weight tracking to brew sessions
ALTER TABLE brew_sessions ADD COLUMN IF NOT EXISTS tea_weight DECIMAL;
ALTER TABLE brew_sessions ADD COLUMN IF NOT EXISTS tea_weight_unit TEXT DEFAULT 'g';
