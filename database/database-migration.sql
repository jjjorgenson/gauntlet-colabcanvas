-- =====================================================
-- CanvasCollab Database Migration Script
-- =====================================================
-- This script drops old tables and creates the new schema
-- according to the PRD specification
-- =====================================================

-- =====================================================
-- STEP 1: DROP OLD TABLES AND FUNCTIONS
-- =====================================================

-- Drop old tables (if they exist) - using IF EXISTS to avoid errors
DROP TABLE IF EXISTS canvas_objects CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;

-- Drop any old functions or triggers (using IF EXISTS to avoid errors)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop triggers only if the tables exist
DO $$
BEGIN
  -- Drop canvas_objects triggers if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'canvas_objects') THEN
    DROP TRIGGER IF EXISTS update_canvas_objects_updated_at ON canvas_objects CASCADE;
  END IF;
  
  -- Drop user_presence triggers if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_presence') THEN
    DROP TRIGGER IF EXISTS update_user_presence_updated_at ON user_presence CASCADE;
  END IF;
END $$;

-- =====================================================
-- STEP 2: CREATE NEW SCHEMA
-- =====================================================

-- Extend existing profiles table with new fields
-- (profiles table already exists with: id, username, display_name, avatar_url, created_at, updated_at)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_colors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

-- Create users view for backward compatibility (optional)
CREATE OR REPLACE VIEW users AS
SELECT 
  id,
  email,
  display_name,
  custom_colors,
  theme,
  created_at,
  updated_at
FROM profiles;

-- Create shapes table
CREATE TABLE shapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('rectangle', 'circle', 'text')),
  x NUMERIC DEFAULT 0,
  y NUMERIC DEFAULT 0,
  width NUMERIC DEFAULT 100,
  height NUMERIC DEFAULT 100,
  rotation NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#000000',
  z_index INTEGER DEFAULT 0,
  text_content TEXT,
  font_size INTEGER DEFAULT 16,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ownership_timestamp TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create presence table
CREATE TABLE presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  cursor_x NUMERIC DEFAULT 0,
  cursor_y NUMERIC DEFAULT 0,
  cursor_color TEXT DEFAULT '#3b82f6',
  active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_name TEXT
);

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

-- Profiles table indexes (if email column exists)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Shapes table indexes
CREATE INDEX idx_shapes_owner_id ON shapes(owner_id);
CREATE INDEX idx_shapes_z_index ON shapes(z_index);
CREATE INDEX idx_shapes_created_at ON shapes(created_at);
CREATE INDEX idx_shapes_created_by ON shapes(created_by);

-- Presence table indexes
CREATE INDEX idx_presence_active ON presence(active);
CREATE INDEX idx_presence_last_seen ON presence(last_seen);

-- =====================================================
-- STEP 4: CREATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shapes_updated_at
  BEFORE UPDATE ON shapes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-release shape ownership after 15 seconds
CREATE OR REPLACE FUNCTION release_expired_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Release ownership if it's been more than 15 seconds
  IF NEW.ownership_timestamp IS NOT NULL AND 
     NEW.ownership_timestamp < NOW() - INTERVAL '15 seconds' THEN
    NEW.owner_id := NULL;
    NEW.ownership_timestamp := NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-release expired ownership
CREATE TRIGGER release_expired_ownership_trigger
  BEFORE UPDATE ON shapes
  FOR EACH ROW
  EXECUTE FUNCTION release_expired_ownership();

-- Function to cleanup stale presence records
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  -- Mark users as inactive if they haven't been seen in 30 seconds
  UPDATE presence 
  SET active = false 
  WHERE last_seen < NOW() - INTERVAL '30 seconds' AND active = true;
  
  -- Delete very old presence records (older than 1 hour)
  DELETE FROM presence 
  WHERE last_seen < NOW() - INTERVAL '1 hour';
END;
$$ language 'plpgsql';

-- =====================================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables (profiles likely already has RLS enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- Profiles table policies (only add if they don't exist)
DO $$
BEGIN
  -- Check if policies exist before creating them
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read their own profile') THEN
    CREATE POLICY "Users can read their own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Shapes table policies
CREATE POLICY "All authenticated users can read all shapes" ON shapes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert shapes" ON shapes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update shapes they own or unowned shapes" ON shapes
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    (owner_id = auth.uid() OR owner_id IS NULL)
  );

CREATE POLICY "Users can delete shapes they created" ON shapes
  FOR DELETE USING (created_by = auth.uid());

-- Presence table policies
CREATE POLICY "All authenticated users can read all presence records" ON presence
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upsert their own presence record" ON presence
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: REALTIME CONFIGURATION
-- =====================================================

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE shapes;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;

-- =====================================================
-- STEP 7: HELPER FUNCTIONS
-- =====================================================

-- Function to create a profile record when they sign up (if it doesn't exist)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create profile record on signup (only if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- STEP 8: SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment the following lines if you want to add sample data for testing

-- INSERT INTO profiles (id, username, display_name, email) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'testuser', 'Test User', 'test@example.com');

-- INSERT INTO shapes (type, x, y, width, height, color, created_by) VALUES
--   ('rectangle', 100, 100, 150, 100, '#3B82F6', '00000000-0000-0000-0000-000000000001'),
--   ('circle', 300, 200, 80, 80, '#EF4444', '00000000-0000-0000-0000-000000000001');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database migration completed successfully!';
  RAISE NOTICE '📋 Extended profiles table and created: shapes, presence';
  RAISE NOTICE '🔒 RLS policies configured';
  RAISE NOTICE '⚡ Realtime enabled for shapes and presence';
  RAISE NOTICE '🔄 Triggers and functions created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update your frontend code to use the new schema';
  RAISE NOTICE '2. Test authentication flow';
  RAISE NOTICE '3. Test shape creation and real-time sync';
  RAISE NOTICE '4. Test multiplayer functionality';
END $$;
