-- Fix signup trigger to handle username field properly
-- This fixes the 500 error during user signup

-- Update the handle_new_user function to properly handle username
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
