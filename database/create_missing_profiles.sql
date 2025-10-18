-- Create missing profiles for existing auth users
-- Run this in Supabase SQL Editor to create profiles for users who don't have them

-- Insert profiles for auth users who don't have profiles yet
INSERT INTO public.profiles (id, username, display_name)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username,
    COALESCE(au.raw_user_meta_data->>'display_name', au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as display_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email IS NOT NULL;

-- Verify the results
SELECT 
    p.id,
    p.username,
    p.display_name,
    au.email
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;
