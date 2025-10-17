# Database Migration Files

This directory contains all database-related files for the CanvasCollab project.

## Files

### Migration Scripts
- **`database-migration.sql`** - Complete migration script that:
  - Drops old tables (`canvas_objects`, `user_presence`)
  - Extends existing `profiles` table with new fields
  - Creates new `shapes` and `presence` tables
  - Sets up RLS policies, triggers, and Realtime subscriptions

### Verification Scripts
- **`verify-migration.sql`** - Comprehensive verification script
- **`simple-verify.sql`** - Step-by-step verification (if needed)
- **`debug-verify.sql`** - Debug version for troubleshooting

## Usage

1. **Run Migration**: Execute `database-migration.sql` in your Supabase SQL Editor
2. **Verify Migration**: Execute `verify-migration.sql` to confirm everything worked
3. **Troubleshoot**: Use `simple-verify.sql` or `debug-verify.sql` if needed

## Schema Overview

### Tables Created/Modified
- **`profiles`** - Extended with `email`, `custom_colors`, `theme` fields
- **`shapes`** - Canvas shapes with ownership management
- **`presence`** - Real-time user presence and cursor tracking

### Features Enabled
- ✅ Row Level Security (RLS) policies
- ✅ Realtime subscriptions for multiplayer
- ✅ Ownership management with 15-second timeout
- ✅ Automatic cleanup of stale presence records
- ✅ Triggers for updated_at timestamps

## Migration Status
✅ **COMPLETED** - All tables created and verified successfully
