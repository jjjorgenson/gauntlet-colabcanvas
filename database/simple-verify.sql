-- =====================================================
-- Simple Migration Verification Script
-- =====================================================
-- This script checks the migration step by step with better error handling
-- =====================================================

-- Step 1: Check if tables exist
SELECT 'STEP 1: Checking tables...' as status;

SELECT 
  'profiles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
       THEN '✅ EXISTS' 
       ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'shapes' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shapes') 
       THEN '✅ EXISTS' 
       ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'presence' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presence') 
       THEN '✅ EXISTS' 
       ELSE '❌ MISSING' 
  END as status;

-- Step 2: Check profiles table structure
SELECT 'STEP 2: Checking profiles table structure...' as status;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 3: Check shapes table structure
SELECT 'STEP 3: Checking shapes table structure...' as status;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'shapes'
ORDER BY ordinal_position;

-- Step 4: Check presence table structure
SELECT 'STEP 4: Checking presence table structure...' as status;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'presence'
ORDER BY ordinal_position;

-- Step 5: Check indexes
SELECT 'STEP 5: Checking indexes...' as status;

SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN ('profiles', 'shapes', 'presence')
ORDER BY tablename, indexname;

-- Step 6: Check RLS policies
SELECT 'STEP 6: Checking RLS policies...' as status;

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'shapes', 'presence')
ORDER BY tablename, policyname;

-- Step 7: Check triggers
SELECT 'STEP 7: Checking triggers...' as status;

SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('profiles', 'shapes', 'presence')
ORDER BY event_object_table, trigger_name;

-- Step 8: Check functions
SELECT 'STEP 8: Checking functions...' as status;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN (
  'update_updated_at_column',
  'release_expired_ownership',
  'cleanup_stale_presence',
  'handle_new_user'
)
ORDER BY routine_name;

-- Step 9: Check Realtime publication
SELECT 'STEP 9: Checking Realtime publication...' as status;

SELECT 
  pubname,
  puballtables
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- Step 10: Check if tables are in Realtime publication
SELECT 'STEP 10: Checking tables in Realtime publication...' as status;

SELECT 
  p.pubname,
  c.relname as table_name
FROM pg_publication p
JOIN pg_publication_rel pr ON p.oid = pr.prpubid
JOIN pg_class c ON pr.prrelid = c.oid
WHERE p.pubname = 'supabase_realtime'
  AND c.relname IN ('profiles', 'shapes', 'presence')
ORDER BY c.relname;

-- Step 11: Check if we have any existing profiles
SELECT 'STEP 11: Checking existing profiles...' as status;

SELECT 
  COUNT(*) as profile_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ PROFILES EXIST' ELSE '⚠️ NO PROFILES YET' END as status
FROM profiles;

-- Step 12: Summary
SELECT 'STEP 12: Migration Summary...' as status;

SELECT 
  'Migration Status' as item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shapes')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presence')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
    THEN '✅ SUCCESS - All tables created'
    ELSE '❌ FAILED - Missing tables'
  END as status;
