-- Temporarily disable the signup trigger to allow user creation
-- This will fix the immediate 500 error during signup

-- Drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simpler version that doesn't fail
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to insert the profile, but don't fail if it doesn't work
    BEGIN
        INSERT INTO profiles (id, email, username, display_name)
        VALUES (
            NEW.id,
            NEW.email,
            NEW.raw_user_meta_data->>'username',
            COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the user creation
            RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
