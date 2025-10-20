# Database Migration Instructions

## Step 1: Run the Database Migration

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your CanvasCollab project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration Script**
   - Copy the contents of `database/complete-migration.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

## Step 2: Verify the Migration

After running the migration, verify that the following tables exist:

- `profiles` - User profiles extending auth.users
- `shapes` - Canvas shapes (rectangles, circles, text)
- `presence` - User presence and cursor tracking

## Step 3: Test the Application

1. **Refresh your browser** (the app should still be running on http://localhost:5173)
2. **Try logging in** - authentication should work
3. **Create shapes** - rectangles, circles, and text should work
4. **Test real-time features** - open two browser windows to test collaboration

## What the Migration Does

- **Drops old tables**: Removes any existing `canvas_objects` and `user_presence` tables
- **Creates new schema**: Sets up `profiles`, `shapes`, and `presence` tables with proper relationships
- **Adds indexes**: Creates performance indexes for common queries
- **Sets up RLS**: Configures Row Level Security policies
- **Enables Realtime**: Sets up real-time subscriptions for collaboration
- **Creates functions**: Adds helper functions for user management and cleanup

## Troubleshooting

If you encounter any issues:

1. **Foreign Key Constraint Error**: If you see "violates foreign key constraint", the migration script has been updated to remove test data that was causing this issue. Re-run the migration.

2. **Check the Supabase logs** in the dashboard for detailed error messages

3. **Verify environment variables** are set correctly in your `.env.local` file

4. **Check browser console** for any remaining errors after migration

5. **Ensure RLS policies** are working correctly

The migration script is idempotent - you can run it multiple times safely.

## Common Issues Fixed

- **Removed test data insertion** that was causing foreign key constraint violations
- **Fixed field name mismatches** between frontend and database schema
- **Updated table references** from old schema to new schema
