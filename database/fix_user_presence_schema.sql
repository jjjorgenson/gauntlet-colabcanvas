-- Fix user_presence table schema
-- Run this in Supabase SQL Editor to fix the schema mismatch

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_presence' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the table and recreate it with the correct schema
-- This will fix all the column issues at once
DROP TABLE IF EXISTS public.user_presence CASCADE;

-- Recreate the user_presence table with the correct schema
CREATE TABLE public.user_presence (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    cursor_x NUMERIC,
    cursor_y NUMERIC
);

-- Re-enable Row Level Security
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for user_presence
CREATE POLICY "Users can view all presence" ON public.user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON public.user_presence
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence" ON public.user_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presence" ON public.user_presence
    FOR DELETE USING (auth.uid() = user_id);

-- Re-enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Verify the final schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_presence' AND table_schema = 'public'
ORDER BY ordinal_position;
