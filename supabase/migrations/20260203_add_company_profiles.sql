-- ============================================
-- COMPANY PROFILES (Tea Shop/Brand Profiles)
-- ============================================
-- Adds company profiles for tea shops with ratings, reviews, and metadata

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly name (e.g., 'republic-of-tea')
  description TEXT,
  short_description TEXT, -- One-liner for cards/lists
  
  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  primary_color TEXT, -- Hex color for theming
  
  -- Contact & Location
  website_url TEXT,
  email TEXT,
  phone TEXT,
  
  -- Physical presence
  headquarters_city TEXT,
  headquarters_state TEXT,
  headquarters_country TEXT,
  has_physical_stores BOOLEAN DEFAULT false,
  store_count INTEGER DEFAULT 0,
  
  -- Business info
  founded_year INTEGER,
  specialty TEXT[], -- e.g., ['Japanese Green', 'Oolong', 'Rare Finds']
  certifications TEXT[], -- e.g., ['USDA Organic', 'Fair Trade', 'B Corp']
  
  -- Social
  instagram_handle TEXT,
  twitter_handle TEXT,
  facebook_url TEXT,
  
  -- Shipping & pricing
  ships_internationally BOOLEAN DEFAULT false,
  free_shipping_minimum DECIMAL(10,2),
  price_range TEXT CHECK (price_range IN ('budget', 'moderate', 'premium', 'luxury')),
  
  -- Ratings (computed from company_reviews)
  avg_rating DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Stats (computed from teas)
  tea_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_rating ON companies(avg_rating DESC);
CREATE INDEX idx_companies_name ON companies(name);

-- ============================================
-- COMPANY REVIEWS TABLE
-- ============================================
CREATE TABLE company_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- Specific ratings (optional)
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  shipping_rating INTEGER CHECK (shipping_rating >= 1 AND shipping_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_company_reviews_company ON company_reviews(company_id);
CREATE INDEX idx_company_reviews_user ON company_reviews(user_id);

-- ============================================
-- MODIFY TEAS TABLE - Add company relationship
-- ============================================
-- Add company_id to link teas to their company
ALTER TABLE teas ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX idx_teas_company ON teas(company_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Companies: Anyone can read
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  USING (true);

-- Company Reviews: Anyone can read, users can CRUD their own
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company reviews are viewable by everyone"
  ON company_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own company reviews"
  ON company_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company reviews"
  ON company_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company reviews"
  ON company_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update company ratings when reviews change
CREATE OR REPLACE FUNCTION public.update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companies SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM company_reviews WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)),
    rating_count = (SELECT COUNT(*) FROM company_reviews WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.company_id, OLD.company_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_company_review_change
  AFTER INSERT OR UPDATE OR DELETE ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_company_rating();

-- Update company tea count when teas change
CREATE OR REPLACE FUNCTION public.update_company_tea_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old company if tea moved
  IF OLD IS NOT NULL AND OLD.company_id IS NOT NULL THEN
    UPDATE companies SET
      tea_count = (SELECT COUNT(*) FROM teas WHERE company_id = OLD.company_id),
      updated_at = NOW()
    WHERE id = OLD.company_id;
  END IF;
  
  -- Update new company
  IF NEW IS NOT NULL AND NEW.company_id IS NOT NULL THEN
    UPDATE companies SET
      tea_count = (SELECT COUNT(*) FROM teas WHERE company_id = NEW.company_id),
      updated_at = NOW()
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tea_company_change
  AFTER INSERT OR UPDATE OR DELETE ON teas
  FOR EACH ROW EXECUTE FUNCTION public.update_company_tea_count();

-- Updated_at trigger for company_reviews
CREATE TRIGGER set_company_reviews_updated_at
  BEFORE UPDATE ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Updated_at trigger for companies
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- SEED INITIAL COMPANIES (The Steeping Room + new sources)
-- ============================================
INSERT INTO companies (name, slug, description, short_description, website_url, headquarters_city, headquarters_state, headquarters_country, specialty, price_range, ships_internationally) VALUES
(
  'The Steeping Room',
  'the-steeping-room',
  'Austin''s premier tea house and café, offering an extensive selection of loose-leaf teas from around the world paired with a seasonal food menu. Known for their knowledgeable staff and relaxing atmosphere.',
  'Austin''s premier tea house and café',
  'https://www.thesteepingroom.com/',
  'Austin',
  'TX',
  'USA',
  ARRAY['Loose Leaf', 'Tea House', 'Food Pairing'],
  'moderate',
  false
),
(
  'Republic of Tea',
  'republic-of-tea',
  'Founded in 1992, The Republic of Tea pioneered the premium tea industry in the United States. They offer over 300 varieties of teas and herbs, emphasizing quality, sustainability, and an enriching tea experience.',
  'Premium tea pioneer since 1992',
  'https://www.republicoftea.com/',
  'Novato',
  'CA',
  'USA',
  ARRAY['Premium Blends', 'Wellness', 'Gift Sets'],
  'premium',
  true
),
(
  'Rishi Tea',
  'rishi-tea',
  'Rishi Tea is a Direct Trade importer of organic teas and botanicals, working directly with farmers and artisans worldwide. Based in Milwaukee, they''re known for their commitment to quality, sustainability, and innovative botanical blends.',
  'Direct Trade organic tea importer',
  'https://www.rishi-tea.com/',
  'Milwaukee',
  'WI',
  'USA',
  ARRAY['Organic', 'Direct Trade', 'Japanese Green', 'Botanical Blends'],
  'premium',
  true
),
(
  'Adagio Teas',
  'adagio-teas',
  'Adagio Teas makes quality tea accessible to everyone with their wide selection of loose-leaf teas at reasonable prices. Known for their signature blends community, custom blend creation, and excellent customer service.',
  'Quality tea made accessible',
  'https://www.adagio.com/',
  'Garfield',
  'NJ',
  'USA',
  ARRAY['Accessible', 'Custom Blends', 'Signature Blends', 'Samplers'],
  'moderate',
  true
);

-- Link existing teas to The Steeping Room (they all came from there originally)
UPDATE teas SET company_id = (SELECT id FROM companies WHERE slug = 'the-steeping-room')
WHERE company_id IS NULL;
