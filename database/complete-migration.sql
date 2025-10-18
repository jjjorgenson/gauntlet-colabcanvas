-- CanvasCollab Complete Database Migration
-- This script drops all existing tables and recreates them with the correct schema

-- Drop existing tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS presence CASCADE;
DROP TABLE IF EXISTS shapes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    custom_colors JSONB DEFAULT '[]'::jsonb,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shapes table
CREATE TABLE shapes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('rectangle', 'circle', 'text')),
    x NUMERIC NOT NULL DEFAULT 0,
    y NUMERIC NOT NULL DEFAULT 0,
    width NUMERIC NOT NULL DEFAULT 100,
    height NUMERIC NOT NULL DEFAULT 100,
    rotation NUMERIC DEFAULT 0,
    color TEXT DEFAULT '#3B82F6',
    z_index INTEGER DEFAULT 0,
    text_content TEXT,
    font_size INTEGER DEFAULT 16,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ownership_timestamp TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create presence table
CREATE TABLE presence (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    cursor_x NUMERIC DEFAULT 0,
    cursor_y NUMERIC DEFAULT 0,
    cursor_color TEXT DEFAULT '#EF4444',
    active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_shapes_owner_id ON shapes(owner_id);
CREATE INDEX idx_shapes_z_index ON shapes(z_index);
CREATE INDEX idx_shapes_created_at ON shapes(created_at);
CREATE INDEX idx_shapes_type ON shapes(type);
CREATE INDEX idx_presence_active ON presence(active);
CREATE INDEX idx_presence_last_seen ON presence(last_seen);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shapes_updated_at BEFORE UPDATE ON shapes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presence_updated_at BEFORE UPDATE ON presence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old presence records
CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
    UPDATE presence 
    SET active = false 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
    
    DELETE FROM presence 
    WHERE last_seen < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'username',
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle username uniqueness constraint violation
        RAISE EXCEPTION 'Username already exists: %', NEW.raw_user_meta_data->>'username';
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE EXCEPTION 'Error creating user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for shapes
CREATE POLICY "Users can view all shapes" ON shapes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert shapes" ON shapes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update shapes" ON shapes
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = owner_id OR 
        owner_id IS NULL
    );

CREATE POLICY "Users can delete their own shapes" ON shapes
    FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for presence
CREATE POLICY "Users can view all presence" ON presence
    FOR SELECT USING (true);

CREATE POLICY "Users can upsert their own presence" ON presence
    FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE shapes;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;

-- Create a function to get online users with profile info
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    cursor_x NUMERIC,
    cursor_y NUMERIC,
    cursor_color TEXT,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.display_name,
        p.cursor_x,
        p.cursor_y,
        p.cursor_color,
        p.last_seen
    FROM presence p
    WHERE p.active = true
    ORDER BY p.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Sample data removed to avoid foreign key constraint violations
-- Profiles will be created automatically when users sign up via the auth trigger

COMMIT;
