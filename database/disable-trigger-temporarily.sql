-- Temporarily disable the trigger to allow signup testing
-- This is a quick fix to get signup working

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
