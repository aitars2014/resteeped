-- Admin-controlled content features
-- Featured Shop, Collections, Tea of the Day

-- Featured Shops (sponsor placements)
CREATE TABLE featured_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_exclusive BOOLEAN DEFAULT false,  -- true = solo placement, false = rotation
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,  -- higher = shown first in rotation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying active featured shops
CREATE INDEX idx_featured_shops_active ON featured_shops(is_active, start_date, end_date);

-- Collections (curated tea lists)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  icon_type TEXT NOT NULL DEFAULT 'feather',  -- 'feather' or 'custom'
  icon_name TEXT,  -- Feather icon name (e.g., 'coffee', 'sun')
  icon_url TEXT,   -- Custom uploaded image URL
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection teas (many-to-many)
CREATE TABLE collection_teas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  tea_id UUID NOT NULL REFERENCES teas(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, tea_id)
);

CREATE INDEX idx_collection_teas_collection ON collection_teas(collection_id, sort_order);

-- Tea of the Day
CREATE TABLE tea_of_the_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tea_id UUID NOT NULL REFERENCES teas(id) ON DELETE CASCADE,
  featured_date DATE NOT NULL UNIQUE,  -- one tea per day max
  is_manual BOOLEAN DEFAULT true,  -- false = auto-selected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tea_of_the_day_date ON tea_of_the_day(featured_date DESC);

-- Auto-rotation pool (teas eligible for auto-selection)
CREATE TABLE tea_of_the_day_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tea_id UUID NOT NULL REFERENCES teas(id) ON DELETE CASCADE UNIQUE,
  last_featured DATE,  -- track when last shown to avoid repeats
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (public read, authenticated write)
ALTER TABLE featured_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_teas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tea_of_the_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE tea_of_the_day_pool ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read featured_shops" ON featured_shops FOR SELECT USING (true);
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public read collection_teas" ON collection_teas FOR SELECT USING (true);
CREATE POLICY "Public read tea_of_the_day" ON tea_of_the_day FOR SELECT USING (true);
CREATE POLICY "Public read tea_of_the_day_pool" ON tea_of_the_day_pool FOR SELECT USING (true);

-- Admin write access (we'll use service role key for admin panel)
-- No INSERT/UPDATE/DELETE policies needed - service role bypasses RLS
