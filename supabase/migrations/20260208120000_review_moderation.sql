-- Review moderation system
-- Adds moderation status, admin notes, and content filtering

-- Add moderation columns to tea reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by TEXT;  -- admin identifier

-- Add moderation columns to company reviews
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS moderated_by TEXT;

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_reviews_moderation ON reviews(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_reviews_moderation ON company_reviews(moderation_status, created_at DESC);

-- Content validation function (checks for links, spam patterns)
CREATE OR REPLACE FUNCTION validate_review_content(content TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  -- URL patterns
  url_pattern TEXT := '(https?://|www\.|\.com|\.net|\.org|\.io|\.co|bit\.ly|tinyurl|goo\.gl)';
  -- Common spam patterns
  spam_patterns TEXT[] := ARRAY[
    'buy now', 'click here', 'free money', 'make money', 'earn cash',
    'limited time', 'act now', 'order now', 'call now', 'visit our',
    'check out my', 'follow me', 'subscribe to', 'dm me', 'dm for',
    'promo code', 'discount code', 'use code', 'coupon'
  ];
  pattern TEXT;
BEGIN
  -- Check for null or empty
  IF content IS NULL OR content = '' THEN
    RETURN true;
  END IF;
  
  -- Check for URLs
  IF content ~* url_pattern THEN
    RETURN false;
  END IF;
  
  -- Check for spam patterns
  FOREACH pattern IN ARRAY spam_patterns LOOP
    IF lower(content) LIKE '%' || pattern || '%' THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Profanity check function (basic list - expand as needed)
CREATE OR REPLACE FUNCTION check_profanity(content TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  profanity_list TEXT[] := ARRAY[
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock',
    'pussy', 'cunt', 'bastard', 'whore', 'slut', 'fag', 'nigger', 'retard'
  ];
  word TEXT;
  clean_content TEXT;
BEGIN
  IF content IS NULL OR content = '' THEN
    RETURN false;  -- no profanity in empty content
  END IF;
  
  clean_content := lower(regexp_replace(content, '[^a-zA-Z\s]', '', 'g'));
  
  FOREACH word IN ARRAY profanity_list LOOP
    IF clean_content ~ ('\m' || word || '\M') THEN
      RETURN true;  -- profanity found
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-flag problematic reviews
CREATE OR REPLACE FUNCTION auto_moderate_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Check content validity
  IF NOT validate_review_content(NEW.review_text) THEN
    NEW.moderation_status := 'flagged';
    NEW.moderation_reason := 'Contains links or spam patterns';
    NEW.is_hidden := true;
  ELSIF check_profanity(NEW.review_text) THEN
    NEW.moderation_status := 'flagged';
    NEW.moderation_reason := 'Contains inappropriate language';
    NEW.is_hidden := true;
  ELSE
    -- Auto-approve clean content (you can change to 'pending' for manual review)
    NEW.moderation_status := 'approved';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tea reviews
DROP TRIGGER IF EXISTS auto_moderate_tea_review ON reviews;
CREATE TRIGGER auto_moderate_tea_review
  BEFORE INSERT OR UPDATE OF review_text ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_moderate_review();

-- Apply trigger to company reviews
DROP TRIGGER IF EXISTS auto_moderate_company_review ON company_reviews;
CREATE TRIGGER auto_moderate_company_review
  BEFORE INSERT OR UPDATE OF review_text ON company_reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_moderate_review();

-- Update RLS to hide flagged/rejected reviews from public
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (is_hidden = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Company reviews are viewable by everyone" ON company_reviews;
CREATE POLICY "Company reviews are viewable by everyone"
  ON company_reviews FOR SELECT
  USING (is_hidden = false OR auth.uid() = user_id);
