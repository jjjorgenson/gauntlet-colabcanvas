-- CollabCanvas Database Migration
-- Run this in Supabase SQL Editor to update the schema

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create updated canvas_objects table with foreign keys to profiles
CREATE TABLE IF NOT EXISTS public.canvas_objects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('rectangle', 'circle', 'text')),
    x NUMERIC NOT NULL DEFAULT 0,
    y NUMERIC NOT NULL DEFAULT 0,
    width NUMERIC NOT NULL DEFAULT 100,
    height NUMERIC NOT NULL DEFAULT 100,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    text_content TEXT,
    font_size NUMERIC DEFAULT 16,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    owned_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create updated user_presence table with foreign key to profiles
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    cursor_x NUMERIC,
    cursor_y NUMERIC
);

-- 4. Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Create RLS policies for canvas_objects
CREATE POLICY "Users can view all canvas objects" ON public.canvas_objects
    FOR SELECT USING (true);

CREATE POLICY "Users can insert canvas objects" ON public.canvas_objects
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update canvas objects" ON public.canvas_objects
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = owner_id);

CREATE POLICY "Users can delete own canvas objects" ON public.canvas_objects
    FOR DELETE USING (auth.uid() = created_by);

-- 7. Create RLS policies for user_presence
CREATE POLICY "Users can view all presence" ON public.user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON public.user_presence
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence" ON public.user_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presence" ON public.user_presence
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create performance indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS canvas_objects_owner_id_idx ON public.canvas_objects(owner_id);
CREATE INDEX IF NOT EXISTS canvas_objects_owned_at_idx ON public.canvas_objects(owned_at);
CREATE INDEX IF NOT EXISTS canvas_objects_type_idx ON public.canvas_objects(type);
CREATE INDEX IF NOT EXISTS canvas_objects_created_by_idx ON public.canvas_objects(created_by);

-- 9. Enable Realtime subscriptions (only add if not already present)
DO $$
BEGIN
    -- Add profiles table to realtime publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
    
    -- Add canvas_objects table to realtime publication (if not already present)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'canvas_objects'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_objects;
    END IF;
    
    -- Add user_presence table to realtime publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'user_presence'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
    END IF;
END $$;

-- 10. Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if user_metadata.username exists
    IF NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
        INSERT INTO public.profiles (id, username, display_name)
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'username',
            COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Create ownership management RPC functions (drop existing first)
DROP FUNCTION IF EXISTS public.request_shape_ownership(UUID);
DROP FUNCTION IF EXISTS public.release_shape_ownership(UUID);
DROP FUNCTION IF EXISTS public.release_all_ownership();
DROP FUNCTION IF EXISTS public.cleanup_expired_ownership();

CREATE FUNCTION public.request_shape_ownership(shape_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_owner UUID;
    current_owned_at TIMESTAMPTZ;
BEGIN
    -- Get current ownership info
    SELECT owner_id, owned_at INTO current_owner, current_owned_at
    FROM public.canvas_objects
    WHERE id = shape_id;
    
    -- If no owner or ownership expired (45 seconds), grant ownership
    IF current_owner IS NULL OR 
       (current_owned_at IS NOT NULL AND NOW() - current_owned_at > INTERVAL '45 seconds') THEN
        
        UPDATE public.canvas_objects
        SET owner_id = auth.uid(), owned_at = NOW()
        WHERE id = shape_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION public.release_shape_ownership(shape_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.canvas_objects
    SET owner_id = NULL, owned_at = NULL
    WHERE id = shape_id AND owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION public.release_all_ownership()
RETURNS VOID AS $$
BEGIN
    UPDATE public.canvas_objects
    SET owner_id = NULL, owned_at = NULL
    WHERE owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION public.cleanup_expired_ownership()
RETURNS VOID AS $$
BEGIN
    UPDATE public.canvas_objects
    SET owner_id = NULL, owned_at = NULL
    WHERE owned_at IS NOT NULL AND NOW() - owned_at > INTERVAL '45 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canvas_objects_updated_at
    BEFORE UPDATE ON public.canvas_objects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration complete!
-- The database now has:
-- 1. profiles table with username uniqueness
-- 2. Foreign key relationships from canvas_objects to profiles
-- 3. Auto-profile creation on user signup (if username provided)
-- 4. All RLS policies and indexes
-- 5. Ownership management functions
-- 6. Realtime subscriptions enabled
