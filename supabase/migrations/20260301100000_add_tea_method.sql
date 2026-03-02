-- Add tea_method column: 'teabag', 'loose_leaf', 'whole_leaf', or NULL (unknown)
ALTER TABLE teas ADD COLUMN IF NOT EXISTS tea_method TEXT;

-- Backfill based on name/description patterns
UPDATE teas SET tea_method = 'teabag' 
WHERE tea_method IS NULL AND (
  name ILIKE '%teabag%' OR name ILIKE '%tea bag%' OR name ILIKE '%sachet%'
  OR description ILIKE '%teabag%' OR description ILIKE '%tea bag%' OR description ILIKE '%sachet%'
);

UPDATE teas SET tea_method = 'loose_leaf'
WHERE tea_method IS NULL AND (
  name ILIKE '%loose%leaf%' OR name ILIKE '%loose%tea%'
  OR description ILIKE '%loose leaf%' OR description ILIKE '%loose tea%'
);

UPDATE teas SET tea_method = 'whole_leaf'
WHERE tea_method IS NULL AND (
  name ILIKE '%whole%leaf%' OR name ILIKE '%full%leaf%'
  OR description ILIKE '%whole leaf%' OR description ILIKE '%full leaf%'
);
