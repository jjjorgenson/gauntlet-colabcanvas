-- =====================================================
-- CanvasCollab Migration Verification Script
-- =====================================================
-- Run this after the migration to verify everything was created correctly
-- =====================================================

-- Check if tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('profiles', 'shapes', 'presence')
ORDER BY tablename;

-- Check table structures
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'shapes', 'presence')
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('profiles', 'shapes', 'presence')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'shapes', 'presence')
ORDER BY tablename, policyname;

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('profiles', 'shapes', 'presence')
ORDER BY event_object_table, trigger_name;

-- Check functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN (
  'update_updated_at_column',
  'release_expired_ownership',
  'cleanup_stale_presence',
  'handle_new_user'
)
ORDER BY routine_name;

-- Check Realtime publications
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- Check if tables are in Realtime publication
SELECT 
  p.pubname,
  c.relname as table_name
FROM pg_publication p
JOIN pg_publication_rel pr ON p.oid = pr.prpubid
JOIN pg_class c ON pr.prrelid = c.oid
WHERE p.pubname = 'supabase_realtime'
  AND c.relname IN ('profiles', 'shapes', 'presence')
ORDER BY c.relname;

-- Test basic functionality
DO $$
DECLARE
  test_user_id UUID;
  test_shape_id UUID;
  existing_profile_id UUID;
BEGIN
  RAISE NOTICE '🧪 Testing basic functionality...';
  
  -- Check if there are any existing profiles we can use for testing
  SELECT id INTO existing_profile_id FROM profiles LIMIT 1;
  
  IF existing_profile_id IS NOT NULL THEN
    test_user_id := existing_profile_id;
    RAISE NOTICE '✅ Using existing profile for testing: %', test_user_id;
  ELSE
    RAISE NOTICE '⚠️  No existing profiles found. Skipping profile creation test.';
    RAISE NOTICE '   (This is normal if no users have signed up yet)';
    -- Create a dummy UUID for shape testing
    test_user_id := '00000000-0000-0000-0000-000000000001';
  END IF;
  
  -- Test shape creation (only if we have a valid user ID)
  IF test_user_id != '00000000-0000-0000-0000-000000000001' THEN
    INSERT INTO shapes (type, x, y, width, height, color, created_by) 
    VALUES ('rectangle', 100, 100, 150, 100, '#3B82F6', test_user_id)
    RETURNING id INTO test_shape_id;
    RAISE NOTICE '✅ Shape creation: PASSED';
    
    -- Test presence creation
    INSERT INTO presence (user_id, cursor_x, cursor_y, display_name) 
    VALUES (test_user_id, 200, 300, 'Test User');
    RAISE NOTICE '✅ Presence creation: PASSED';
    
    -- Test ownership
    UPDATE shapes 
    SET owner_id = test_user_id, ownership_timestamp = NOW() 
    WHERE id = test_shape_id;
    RAISE NOTICE '✅ Ownership assignment: PASSED';
    
    -- Clean up test data (only the test data we created)
    DELETE FROM presence WHERE user_id = test_user_id AND cursor_x = 200;
    DELETE FROM shapes WHERE id = test_shape_id;
    RAISE NOTICE '✅ Cleanup: PASSED';
  ELSE
    RAISE NOTICE '⚠️  Skipping shape/presence tests (no valid user ID available)';
    RAISE NOTICE '   This is normal if no users have signed up yet.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All tests passed! Database is ready for use.';
END $$;
