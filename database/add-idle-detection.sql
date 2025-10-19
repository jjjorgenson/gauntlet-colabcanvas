-- Add idle detection support to presence table
-- Run this in Supabase SQL Editor

-- Add last_activity column to track user activity
ALTER TABLE presence 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient idle detection queries
CREATE INDEX IF NOT EXISTS idx_presence_last_activity ON presence(last_activity);

-- Update existing records to have last_activity = last_seen
UPDATE presence 
SET last_activity = last_seen 
WHERE last_activity IS NULL;

-- Drop existing function first (in case it has different signature)
DROP FUNCTION IF EXISTS cleanup_idle_users() CASCADE;

-- Create a simple function to clean up idle users (with elevated privileges)
CREATE OR REPLACE FUNCTION cleanup_idle_users()
RETURNS INTEGER AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  -- Mark users as inactive if they haven't been active for 10 minutes
  WITH updated_users AS (
    UPDATE presence 
    SET active = false, 
        last_seen = NOW()
    WHERE active = true 
      AND last_activity < NOW() - INTERVAL '10 minutes'
    RETURNING user_id
  )
  SELECT COUNT(*) INTO deactivated_count FROM updated_users;
  
  -- Log cleanup activity
  RAISE NOTICE 'Cleaned up % idle users at %', deactivated_count, NOW();
  
  RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_idle_users() TO authenticated;

-- Create a function to get idle users (5+ minutes inactive)
CREATE OR REPLACE FUNCTION get_idle_users()
RETURNS TABLE(user_id UUID, username TEXT, last_activity TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    COALESCE(prof.username, prof.display_name, prof.email, 'Anonymous') as username,
    p.last_activity
  FROM presence p
  LEFT JOIN profiles prof ON p.user_id = prof.id
  WHERE p.active = true 
    AND p.last_activity < NOW() - INTERVAL '5 minutes'
  ORDER BY p.last_activity ASC;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'presence' AND table_schema = 'public'
ORDER BY ordinal_position;
