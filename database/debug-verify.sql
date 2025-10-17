-- =====================================================
-- Debug Verification Script
-- =====================================================
-- This script helps debug what's happening in the verification
-- =====================================================

-- Check if tables exist
SELECT 'Tables check:' as debug_step;
SELECT tablename FROM pg_tables WHERE tablename IN ('profiles', 'shapes', 'presence');

-- Check if we can access profiles table
SELECT 'Profiles access check:' as debug_step;
SELECT COUNT(*) as profile_count FROM profiles;

-- Check if we can access shapes table
SELECT 'Shapes access check:' as debug_step;
SELECT COUNT(*) as shape_count FROM shapes;

-- Check if we can access presence table
SELECT 'Presence access check:' as debug_step;
SELECT COUNT(*) as presence_count FROM presence;

-- Check Realtime publication
SELECT 'Realtime publication check:' as debug_step;
SELECT pubname FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Check if tables are in Realtime publication
SELECT 'Tables in Realtime check:' as debug_step;
SELECT 
  p.pubname,
  c.relname as table_name
FROM pg_publication p
JOIN pg_publication_rel pr ON p.oid = pr.prpubid
JOIN pg_class c ON pr.prrelid = c.oid
WHERE p.pubname = 'supabase_realtime'
  AND c.relname IN ('profiles', 'shapes', 'presence')
ORDER BY c.relname;

-- Simple test without the complex DO block
SELECT 'Simple test - creating a test shape:' as debug_step;

-- Try to create a test shape (this will fail if there are no users, but that's expected)
DO $$
DECLARE
  test_shape_id UUID;
  existing_user_id UUID;
BEGIN
  -- Get any existing user ID
  SELECT id INTO existing_user_id FROM profiles LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    INSERT INTO shapes (type, x, y, width, height, color, created_by) 
    VALUES ('rectangle', 100, 100, 150, 100, '#3B82F6', existing_user_id)
    RETURNING id INTO test_shape_id;
    
    RAISE NOTICE '✅ Test shape created with ID: %', test_shape_id;
    
    -- Clean up
    DELETE FROM shapes WHERE id = test_shape_id;
    RAISE NOTICE '✅ Test shape cleaned up';
  ELSE
    RAISE NOTICE '⚠️ No users found - skipping shape test';
  END IF;
END $$;

SELECT 'Debug verification complete!' as debug_step;
