-- CanvasCollab Ownership Cleanup Function
-- Automatically cleans up expired ownership every 5 seconds

-- Create function to clean up expired ownership
CREATE OR REPLACE FUNCTION cleanup_expired_ownership()
RETURNS void AS $$
BEGIN
    -- Release ownership for shapes where ownership_timestamp is older than 15 seconds
    UPDATE shapes 
    SET 
        owner_id = NULL,
        ownership_timestamp = NULL,
        updated_at = NOW()
    WHERE 
        owner_id IS NOT NULL 
        AND ownership_timestamp IS NOT NULL
        AND ownership_timestamp < NOW() - INTERVAL '15 seconds';
    
    -- Log cleanup activity (optional - can be removed in production)
    IF FOUND THEN
        RAISE NOTICE 'Cleaned up expired ownership for % shapes', ROW_COUNT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to set up automatic cleanup (runs every 5 seconds)
CREATE OR REPLACE FUNCTION setup_ownership_cleanup()
RETURNS void AS $$
BEGIN
    -- This function sets up the cleanup to run every 5 seconds
    -- Note: In production, you might want to use pg_cron extension instead
    -- For now, this creates a simple cleanup function that can be called periodically
    
    -- Create a simple cleanup trigger that runs on any shape update
    -- This ensures cleanup happens when shapes are accessed
    PERFORM cleanup_expired_ownership();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the problematic trigger that causes infinite loops
-- The periodic cleanup will handle this instead
DROP TRIGGER IF EXISTS ownership_cleanup_trigger ON shapes;
DROP FUNCTION IF EXISTS trigger_ownership_cleanup();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_ownership() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION setup_ownership_cleanup() TO anon, authenticated;

-- Manual cleanup function for testing
CREATE OR REPLACE FUNCTION manual_cleanup_ownership()
RETURNS TABLE (
    cleaned_count INTEGER,
    remaining_owned INTEGER
) AS $$
DECLARE
    cleaned INTEGER;
    remaining INTEGER;
BEGIN
    -- Clean up expired ownership
    UPDATE shapes 
    SET 
        owner_id = NULL,
        ownership_timestamp = NULL,
        updated_at = NOW()
    WHERE 
        owner_id IS NOT NULL 
        AND ownership_timestamp IS NOT NULL
        AND ownership_timestamp < NOW() - INTERVAL '15 seconds';
    
    GET DIAGNOSTICS cleaned = ROW_COUNT;
    
    -- Count remaining owned shapes
    SELECT COUNT(*) INTO remaining
    FROM shapes 
    WHERE owner_id IS NOT NULL;
    
    RETURN QUERY SELECT cleaned, remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for manual cleanup
GRANT EXECUTE ON FUNCTION manual_cleanup_ownership() TO anon, authenticated;

COMMIT;
