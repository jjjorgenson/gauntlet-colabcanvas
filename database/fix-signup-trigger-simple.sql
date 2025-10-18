-- Fix the signup trigger - all tables exist, just need the trigger to work
-- This should fix the 500 error during signup

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile with the username from signup metadata
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
        -- If username already exists, use email as fallback
        INSERT INTO profiles (id, email, username, display_name)
        VALUES (
            NEW.id,
            NEW.email,
            NEW.email, -- Use email as username if username taken
            COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
        );
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
