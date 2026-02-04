-- Teaware Schema for Resteeped
-- Supports: gaiwans, teapots, cups, accessories, etc.

-- Teaware categories enum
CREATE TYPE teaware_category AS ENUM (
  'gaiwan',
  'teapot', 
  'cup',
  'pitcher',
  'tea_tray',
  'tea_pet',
  'tea_tools',
  'canister',
  'travel_set',
  'kettle',
  'other'
);

-- Materials enum
CREATE TYPE teaware_material AS ENUM (
  'porcelain',
  'yixing_clay',
  'jianshui_clay',
  'glass',
  'cast_iron',
  'silver',
  'ceramic',
  'stoneware',
  'bamboo',
  'wood',
  'other'
);

-- Clay types for Yixing/specialty clay
CREATE TYPE clay_type AS ENUM (
  'zi_sha',        -- Purple sand
  'hong_ni',       -- Red clay
  'duan_ni',       -- Yellow/tan clay
  'zi_ni',         -- Purple clay
  'qing_shui_ni',  -- Clear water clay
  'di_cao_qing',   -- Bottom slot green
  'jianshui',      -- Jianshui purple pottery
  'huaning',       -- Huaning clay
  'other'
);

-- Main teaware table
CREATE TABLE IF NOT EXISTS teaware (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Classification
  category teaware_category NOT NULL,
  material teaware_material NOT NULL,
  clay_type clay_type,  -- For clay items
  
  -- Specs
  capacity_ml INTEGER,
  dimensions_cm TEXT,  -- "8.5 x 6 x 9" format
  weight_grams INTEGER,
  
  -- For teapots/gaiwans - what teas work best
  recommended_teas TEXT[],  -- ['puerh', 'oolong', 'black']
  
  -- Sourcing
  company_id UUID REFERENCES companies(id),
  artisan_name TEXT,
  origin_region TEXT,  -- "Yixing, Jiangsu, China"
  
  -- Commerce
  price_usd DECIMAL(10,2),
  product_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  
  -- Media
  image_url TEXT,
  images TEXT[],  -- Array of image URLs
  
  -- Ratings (computed)
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's teaware collection
CREATE TABLE IF NOT EXISTS user_teaware (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  teaware_id UUID REFERENCES teaware(id) ON DELETE CASCADE,
  
  -- Ownership details
  nickname TEXT,  -- User's name for this piece
  acquired_date DATE,
  purchase_price DECIMAL(10,2),
  
  -- Condition/notes
  condition TEXT,  -- 'new', 'excellent', 'good', 'fair', 'seasoning'
  notes TEXT,
  
  -- Seasoning log for clay pieces
  dedicated_tea_type TEXT,  -- What tea type this is seasoned for
  seasoning_sessions INTEGER DEFAULT 0,
  
  -- Photos
  user_photos TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, teaware_id)
);

-- Link brew sessions to teaware used
ALTER TABLE brew_sessions 
ADD COLUMN IF NOT EXISTS teaware_id UUID REFERENCES teaware(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teaware_category ON teaware(category);
CREATE INDEX IF NOT EXISTS idx_teaware_material ON teaware(material);
CREATE INDEX IF NOT EXISTS idx_teaware_company ON teaware(company_id);
CREATE INDEX IF NOT EXISTS idx_teaware_price ON teaware(price_usd);
CREATE INDEX IF NOT EXISTS idx_user_teaware_user ON user_teaware(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_teaware_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teaware_updated_at
  BEFORE UPDATE ON teaware
  FOR EACH ROW
  EXECUTE FUNCTION update_teaware_timestamp();

CREATE TRIGGER user_teaware_updated_at
  BEFORE UPDATE ON user_teaware
  FOR EACH ROW
  EXECUTE FUNCTION update_teaware_timestamp();

-- RLS Policies
ALTER TABLE teaware ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teaware ENABLE ROW LEVEL SECURITY;

-- Everyone can read teaware catalog
CREATE POLICY "Teaware is viewable by everyone" ON teaware
  FOR SELECT USING (true);

-- Users can manage their own teaware collection
CREATE POLICY "Users can view own teaware collection" ON user_teaware
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to teaware collection" ON user_teaware
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teaware" ON user_teaware
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from teaware collection" ON user_teaware
  FOR DELETE USING (auth.uid() = user_id);
