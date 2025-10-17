# Database Migration Guide

## Overview
This guide will help you migrate from the old database schema to the new PRD-compliant schema.

## Steps to Execute

### 1. Backup (Optional but Recommended)
Before making any changes, consider backing up your current data if you have any important information in the old tables.

### 2. Run the Migration Script
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database-migration.sql`
4. Click "Run" to execute the migration

### 3. Verify the Migration
1. In the same SQL Editor, copy and paste the contents of `verify-migration.sql`
2. Click "Run" to verify everything was created correctly
3. Check the output for any errors

### 4. Update Frontend Code
After the database migration is complete, we'll need to update the frontend code to use the new schema.

## What the Migration Does

### Drops Old Tables
- `canvas_objects` (old schema)
- `user_presence` (old schema)
- Any associated functions and triggers

### Extends Existing Tables
- `profiles` - Extends existing profiles table with new fields (email, custom_colors, theme)

### Creates New Tables
- `shapes` - Canvas shapes with ownership management
- `presence` - Real-time user presence and cursor tracking

### Sets Up Security
- Row Level Security (RLS) policies
- Proper authentication integration
- Ownership-based access control

### Enables Real-time
- Realtime subscriptions for shapes and presence
- Automatic cleanup of stale data
- Ownership timeout management

## Expected Results

After running the migration, you should see:
- ✅ profiles table extended with new fields
- ✅ 2 new tables created (shapes, presence)
- ✅ RLS policies configured
- ✅ Realtime enabled
- ✅ Triggers and functions working
- ✅ All verification tests passing

## Next Steps

Once the migration is complete:
1. Update the frontend code to use the new schema
2. Test authentication flow
3. Test shape creation and manipulation
4. Test real-time collaboration
5. Test multiplayer functionality

## Troubleshooting

If you encounter any issues:
1. Check the Supabase logs for error messages
2. Verify your environment variables are correct
3. Ensure you have the necessary permissions in Supabase
4. Check that Realtime is enabled in your Supabase project settings

## Support

If you need help with the migration, check:
- Supabase documentation
- The PRD.md file for schema specifications
- The tasks.md file for implementation details
