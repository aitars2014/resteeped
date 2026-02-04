-- Fix reviews-profiles relationship for PostgREST nested selects
-- PGRST200 error: PostgREST couldn't detect the relationship between reviews and profiles
-- because reviews.user_id referenced auth.users, not profiles directly.

-- Drop the existing foreign key to auth.users
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Add foreign key to profiles (which has the same id as auth.users.id)
-- This allows PostgREST to detect the relationship for nested selects
ALTER TABLE reviews 
  ADD CONSTRAINT reviews_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Do the same for user_teas table (preemptively, same pattern)
ALTER TABLE user_teas DROP CONSTRAINT IF EXISTS user_teas_user_id_fkey;
ALTER TABLE user_teas 
  ADD CONSTRAINT user_teas_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Do the same for brew_sessions table
ALTER TABLE brew_sessions DROP CONSTRAINT IF EXISTS brew_sessions_user_id_fkey;
ALTER TABLE brew_sessions 
  ADD CONSTRAINT brew_sessions_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
