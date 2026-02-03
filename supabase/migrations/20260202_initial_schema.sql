-- Resteeped Database Schema
-- Initial migration for MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEAS TABLE
-- ============================================
CREATE TABLE teas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  tea_type TEXT NOT NULL CHECK (tea_type IN ('black', 'green', 'oolong', 'white', 'puerh', 'herbal')),
  description TEXT,
  origin TEXT,
  steep_temp_f INTEGER,
  steep_time_min DECIMAL(4,2),
  steep_time_max DECIMAL(4,2),
  flavor_notes TEXT[], -- Array of flavor descriptors
  image_url TEXT,
  price_per_oz DECIMAL(10,2),
  avg_rating DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_teas_type ON teas(tea_type);
CREATE INDEX idx_teas_brand ON teas(brand_name);
CREATE INDEX idx_teas_rating ON teas(avg_rating DESC);

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  teas_tried_count INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER TEA COLLECTION
-- ============================================
CREATE TABLE user_teas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tea_id UUID NOT NULL REFERENCES teas(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('tried', 'want_to_try')) DEFAULT 'want_to_try',
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  tried_at TIMESTAMPTZ,
  UNIQUE(user_id, tea_id)
);

CREATE INDEX idx_user_teas_user ON user_teas(user_id);
CREATE INDEX idx_user_teas_tea ON user_teas(tea_id);
CREATE INDEX idx_user_teas_status ON user_teas(status);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tea_id UUID NOT NULL REFERENCES teas(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tea_id)
);

CREATE INDEX idx_reviews_tea ON reviews(tea_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ============================================
-- BREW SESSIONS (for timer history)
-- ============================================
CREATE TABLE brew_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tea_id UUID REFERENCES teas(id) ON DELETE SET NULL,
  steep_time_seconds INTEGER NOT NULL,
  temperature_f INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brew_sessions_user ON brew_sessions(user_id);
CREATE INDEX idx_brew_sessions_tea ON brew_sessions(tea_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Teas: Anyone can read, only admins can write
ALTER TABLE teas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teas are viewable by everyone"
  ON teas FOR SELECT
  USING (true);

-- Profiles: Users can read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Teas: Users can CRUD their own
ALTER TABLE user_teas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collection"
  ON user_teas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own collection"
  ON user_teas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection"
  ON user_teas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own collection"
  ON user_teas FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews: Anyone can read, users can CRUD their own
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Brew Sessions: Users can CRUD their own
ALTER TABLE brew_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brew sessions"
  ON brew_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brew sessions"
  ON brew_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'preferred_username',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update tea ratings when reviews change
CREATE OR REPLACE FUNCTION public.update_tea_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teas SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE tea_id = COALESCE(NEW.tea_id, OLD.tea_id)),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE tea_id = COALESCE(NEW.tea_id, OLD.tea_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.tea_id, OLD.tea_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_tea_rating();

-- Update profile stats when collection changes
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    teas_tried_count = (SELECT COUNT(*) FROM user_teas WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND status = 'tried'),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_tea_change
  AFTER INSERT OR UPDATE OR DELETE ON user_teas
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats();

-- Update profile review count
CREATE OR REPLACE FUNCTION public.update_review_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_count_change
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_review_count();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_teas_updated_at
  BEFORE UPDATE ON teas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
