# Schema Migration Scratchpad

## Current State Analysis

### Database Schema Status
✅ **Database Backend**: 100% complete with new PRD-compliant schema
- `profiles` table (extends auth.users)
- `shapes` table (replaces canvas_objects)
- `presence` table (replaces user_presence)

### Frontend Code Status
❌ **Frontend Code**: Still references old schema

## Schema Mapping: Old → New

### Table Names
| Old (Frontend) | New (Database) | Status |
|----------------|----------------|---------|
| `canvas_objects` | `shapes` | ❌ Needs update |
| `user_presence` | `presence` | ❌ Needs update |

### Field Names (Database → JavaScript)
| Database (snake_case) | JavaScript (camelCase) | Current Usage |
|----------------------|------------------------|---------------|
| `id` | `id` | ✅ Already correct |
| `type` | `type` | ✅ Already correct |
| `x`, `y` | `x`, `y` | ✅ Already correct |
| `width`, `height` | `width`, `height` | ✅ Already correct |
| `rotation` | `rotation` | ❌ Missing in current code |
| `color` | `color` | ✅ Already correct |
| `z_index` | `zIndex` | ❌ Missing in current code |
| `text_content` | `textContent` | ❌ Missing in current code |
| `font_size` | `fontSize` | ❌ Missing in current code |
| `owner_id` | `ownerId` | ❌ Missing in current code |
| `ownership_timestamp` | `ownershipTimestamp` | ❌ Missing in current code |
| `created_by` | `createdBy` | ❌ Missing in current code |
| `created_at` | `createdAt` | ✅ Already correct |
| `updated_at` | `updatedAt` | ✅ Already correct |

## Files That Need Updates

### 1. Constants (`src/lib/constants.js`)
```javascript
// OLD
export const TABLES = {
  CANVAS_OBJECTS: 'canvas_objects',
  USER_PRESENCE: 'user_presence',
}

// NEW
export const TABLES = {
  SHAPES: 'shapes',
  PRESENCE: 'presence',
  PROFILES: 'profiles',
}
```

### 2. Canvas Helpers (`src/utils/canvasHelpers.js`)
- Add missing fields: `rotation`, `zIndex`, `textContent`, `fontSize`, `ownerId`, `ownershipTimestamp`, `createdBy`
- Update shape creation to include all required fields

### 3. Hooks That Need Updates
- `useCanvas.js` - Update to use new schema
- `useCursors.js` - Update to use `presence` table
- `usePresence.js` - Update to use `presence` table
- `useRealtimeSync.js` - Update to use new table names

### 4. Components That Need Updates
- All shape components need to handle new fields
- Auth components need to work with `profiles` table

## Core Utilities Dependencies & Order

### Implementation Order (Dependencies)
1. **ShapeFactory** (No dependencies)
   - Creates default shape objects with all required fields
   - Used by other utilities and hooks

2. **ColorUtils** (No dependencies)
   - Color manipulation helpers
   - Used by ShapeFactory and components

3. **CanvasUtils** (No dependencies)
   - Coordinate conversion helpers
   - Used by components and hooks

4. **OwnershipManager** (Depends on: ShapeFactory)
   - Shape ownership and timeout logic
   - Uses shape objects from ShapeFactory

5. **InterpolationManager** (No dependencies)
   - Smooth animation management
   - Independent utility

## Dependencies Check
✅ **All required packages are installed**:
- `@supabase/supabase-js`: ^2.75.0
- `konva`: ^10.0.2
- `react`: ^19.1.1
- `react-dom`: ^19.1.1
- `react-konva`: ^19.0.10
- `uuid`: ^13.0.0

## Next Steps
1. Update constants.js with new table names
2. Update canvasHelpers.js with new schema fields
3. Create ShapeFactory utility
4. Update useCanvas hook to use new schema
5. Test basic shape creation
6. Implement remaining core utilities
7. Update remaining hooks and components

## Testing Strategy
- Test each component individually after updates
- Use Supabase database directly (no mocking)
- Test with multiple browser windows for real-time features
- Security scan before committing feature
