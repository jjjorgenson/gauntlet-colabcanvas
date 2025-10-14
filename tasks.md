# CollabCanvas MVP - Task List (v2.0)

## 🎯 **PROGRESS SUMMARY**
- ✅ **PR #1: Project Setup & Configuration** - COMPLETE
- ✅ **PR #2: Authentication & Database Schema** - COMPLETE
- ⏳ **PR #3: Canvas Foundation & All Shapes (with Resizing)** - IN PROGRESS
- ⏳ **PR #4: Real-Time Multiplayer Sync & Presence** - PENDING
- ⏳ **PR #5: Polish & Bug Fixes** - PENDING
- ⏳ **PR #6: Documentation** - PENDING
- ⏳ **PR #7: Advanced Features** - PENDING

**Current Status:** Database setup complete! Ready to work on canvas foundation.
- 🎯 Next: Canvas foundation and shape creation

### **✅ What's Currently Working:**
- **Project Structure:** Basic React + Vite project with dependencies installed
- **File Organization:** All component and hook files exist
- **Supabase Client:** Configuration file ready (needs environment variables)

---

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── Canvas/
│   │   │   ├── Canvas.jsx
│   │   │   ├── CanvasStage.jsx
│   │   │   ├── Rectangle.jsx ✅
│   │   │   ├── Circle.jsx ✅
│   │   │   ├── TextBox.jsx ✅
│   │   │   └── Cursor.jsx
│   │   ├── Presence/
│   │   │   └── UsersList.jsx
│   │   ├── ErrorBoundary.jsx ✅ NEW
│   │   └── LoadingSpinner.jsx ✅ NEW
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCanvas.js
│   │   ├── useRealtimeSync.js
│   │   ├── useCursors.js
│   │   ├── usePresence.js
│   │   └── useOwnership.js ✅ NEW
│   ├── lib/
│   │   ├── supabase.js
│   │   └── constants.js
│   ├── utils/
│   │   ├── canvasHelpers.js
│   │   └── syncHelpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── App.css
├── .env.local
├── .gitignore
├── package.json
├── vite.config.js
├── README.md
├── PRD.md
└── tasks.md
```

---

## PR #1: Project Setup & Configuration ✅ COMPLETE

**Goal:** Initialize project with all dependencies and basic configuration

### ✅ Task 1.1: Initialize React Project
- [x] Create new Vite + React project
- [x] Install base dependencies: `react`, `react-dom`
- **Files created:**
  - `package.json` ✅
  - `vite.config.js` ✅
  - `src/main.jsx` ✅
  - `src/App.jsx` ✅
  - `src/App.css` ✅

### ✅ Task 1.2: Install & Configure Dependencies
- [x] Install Supabase client: `@supabase/supabase-js`
- [x] Install Konva: `react-konva`, `konva`
- [x] Install utilities: `uuid`
- **Files updated:**
  - `package.json` ✅

### ✅ Task 1.3: Setup Supabase Configuration
- [x] Create Supabase project in dashboard
- [x] Copy API URL and anon key
- [x] Create `.env.local` with Supabase credentials
- [x] Create Supabase client configuration file
- **Files created:**
  - `.env.local` ✅
  - `src/lib/supabase.js` ✅
  - `.gitignore` ✅

### ✅ Task 1.4: Create Basic App Structure
- [x] Setup basic routing (authenticated vs non-authenticated views)
- [x] Create placeholder components
- [x] Add basic styling reset
- **Files created:**
  - `src/lib/constants.js` ✅

### ✅ Task 1.5: Initial Deployment Setup
- [x] Create README.md with setup instructions
- [x] Create GitHub repository
- [x] Push initial code
- [x] Connect to Vercel
- [x] Deploy application
- [x] Verify deployment works
- **Deployment:**
  - GitHub: https://github.com/jjjorgenson/gauntlet-colabcanvas ✅
  - Vercel: https://gauntlet-colabcanvas.vercel.app ✅

---

## PR #2: Authentication & Database Schema ✅ COMPLETE

**Goal:** Implement email/password authentication + setup database tables

### ✅ Task 2.1: Setup Supabase Auth Configuration
- [ ] Configure Supabase Auth settings in dashboard
- [ ] Enable email/password authentication
- [ ] Configure authentication flow
- **Files:** Supabase dashboard configuration only

### ✅ Task 2.2: Create Complete Database Schema
**Core Tables:**
- [x] Create `canvas_objects` table with columns:
  - `id` (UUID, primary key)
  - `type` (TEXT: 'rectangle', 'circle', 'text')
  - `x`, `y`, `width`, `height` (NUMERIC)
  - `color` (TEXT)
  - `text_content` (TEXT, nullable for text shapes)
  - `font_size` (NUMERIC, default 16, nullable for text shapes)
  - `owner_id` (UUID, nullable, references auth.users)
  - `owned_at` (TIMESTAMPTZ, nullable)
  - `created_by` (UUID, references auth.users)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

- [x] Create `user_presence` table with columns:
  - `user_id` (UUID, primary key, references auth.users)
  - `username` (TEXT)
  - `is_online` (BOOLEAN)
  - `last_seen` (TIMESTAMPTZ)
  - `cursor_x`, `cursor_y` (NUMERIC, nullable)

**Security & Performance:**
- [x] Enable Row Level Security (RLS) on both tables
- [x] Create RLS policies for read/write access
- [x] Create performance indexes:
  - `canvas_objects_owner_id_idx` on `owner_id`
  - `canvas_objects_owned_at_idx` on `owned_at`
  - `canvas_objects_type_idx` on `type`
- [x] Enable Realtime subscriptions for both tables

**Ownership System RPC Functions:**
- [x] Create `request_shape_ownership(shape_id UUID)` function
- [x] Create `release_shape_ownership(shape_id UUID)` function
- [x] Create `release_all_ownership()` function
- [x] Create `cleanup_expired_ownership()` function

- **Files:** Supabase SQL Editor ✅

### ✅ Task 2.3: Create Authentication Components
- [ ] Build LoginForm with email + password + username fields
- [ ] Add signup/login toggle
- [ ] Add validation
- **Files created:**
  - `src/components/Auth/LoginForm.jsx` ✅
  - `src/components/Auth/AuthProvider.jsx` ✅

### ✅ Task 2.4: Create Authentication Hook
- [ ] Build `useAuth` hook for auth state management
- [ ] Handle login/logout logic
- [ ] Persist user session
- [ ] Store username in user metadata
- **Files created:**
  - `src/hooks/useAuth.js` ✅

### ✅ Task 2.5: Integrate Auth into App
- [ ] Wrap app with AuthProvider
- [ ] Show LoginForm for unauthenticated users
- [ ] Show Canvas for authenticated users
- [ ] Add logout button
- **Files updated:**
  - `src/App.jsx` ✅

### ✅ Task 2.6: Test Authentication Flow
- [ ] Test login with email/password ✅ TESTED
- [ ] Test sign up with email/username/password ✅ TESTED
- [ ] Verify auth session persistence on refresh ✅ TESTED
- [ ] Test logout functionality ✅ TESTED
- [ ] Deploy and verify on production ✅ TESTED

---

## PR #3: Canvas Foundation & All Shapes (with Resizing) ✅ COMPLETE

**Goal:** Create working canvas with pan, zoom, all shape types, and resizing (with persistence)

### ✅ Task 3.1: Setup Konva Stage
- [ ] Create CanvasStage component with Konva Stage and Layer
- [ ] Set up large workspace (5000x5000px)
- [ ] Initialize stage reference
- [ ] Wrap with forwardRef for ref passing
- **Files created:**
  - `src/components/Canvas/CanvasStage.jsx` ✅

### ✅ Task 3.2: Implement Pan Functionality
- [ ] Add mouse drag to pan canvas
- [ ] Update stage position on drag
- [ ] Test: Can pan smoothly ✅ TESTED

### ✅ Task 3.3: Implement Zoom Functionality
- [ ] Add mouse wheel zoom
- [ ] Implement zoom to cursor position
- [ ] Set min/max zoom limits
- [ ] Test: Can zoom in/out smoothly ✅ TESTED

### ✅ Task 3.4: Create All Shape Components
**Rectangle Component:**
- [ ] Build Rectangle component using Konva Rect
- [ ] Add drag-and-drop functionality with real-time updates
- [ ] Add visual feedback (shadow, stroke)
- [ ] Test: Can create and move rectangles ✅ TESTED

**Circle Component:**
- [ ] Build Circle component using Konva Circle
- [ ] Add drag-and-drop functionality with real-time updates
- [ ] Use radius from width/height (radius = width / 2)
- [ ] Add visual feedback (shadow, stroke)
- [ ] Handle selection state
- [ ] Test: Can render and drag circle ⚠️ READY FOR TESTING

**TextBox Component:**
- [ ] Build TextBox component using Konva Text + Rect
- [ ] Add drag-and-drop functionality with real-time updates
- [ ] Add double-click to edit text
- [ ] Show text input overlay when editing
- [ ] Update text_content on blur/Enter
- [ ] Handle selection state
- [ ] Set default font_size to 16
- [ ] Test: Can create, drag, and edit text ⚠️ READY FOR TESTING

- **Files created:**
  - `src/components/Canvas/Rectangle.jsx` ✅
  - `src/components/Canvas/Circle.jsx` ✅
  - `src/components/Canvas/TextBox.jsx` ✅

### ✅ Task 3.5: Build useCanvas Hook & Helpers
**Canvas State Management:**
- [ ] Create hook for canvas state management
- [ ] Implement addRectangle function
- [ ] Implement addCircle function
- [ ] Implement addTextBox function
- [ ] Implement updateShapePosition function (with real-time broadcasting)
- [ ] Implement updateTextContent function
- [ ] Implement shape selection
- [ ] Use consistent `color` field (not `fill`)
- [ ] Test: Local state management works ✅ TESTED

**Canvas Helpers:**
- [ ] Add `createRectangle(x, y, color)` function
- [ ] Add `createCircle(x, y, color)` function
- [ ] Add `createTextBox(x, y, color, text)` function
- [ ] Functions return correct shape data structures

- **Files created:**
  - `src/hooks/useCanvas.js` ✅
  - `src/utils/canvasHelpers.js` ✅

### ✅ Task 3.6: Build Main Canvas Component
- [ ] Create Canvas.jsx with toolbar
- [ ] Integrate all hooks
- [ ] Add "Rectangle" button
- [ ] Add "Circle" button
- [ ] Add "Text" button
- [ ] Add color palette (including white for text backgrounds)
- [ ] Wire up event handlers for all shape types
- [ ] Render all shape types (rectangle, circle, text)
- [ ] Test: Can create all shape types ✅ TESTED
- **Files created:**
  - `src/components/Canvas/Canvas.jsx` ✅

### ✅ Task 3.7: Connect to Database
- [ ] Build useRealtimeSync hook
- [ ] Implement broadcastShapeChange function
- [ ] Load shapes from database on mount
- [ ] Subscribe to INSERT/UPDATE/DELETE events
- [ ] Test: Create shape → appears in database ✅ TESTED
- [ ] Test: Refresh page → shapes reload ✅ TESTED
- **Files created:**
  - `src/hooks/useRealtimeSync.js` ✅
  - `src/utils/syncHelpers.js` ✅

### ✅ Task 3.8: Shape Resizing with Transformer
**Transformer Setup:**
- [ ] Import Transformer from react-konva
- [ ] Create ref for Transformer
- [ ] Add Transformer component to CanvasStage
- [ ] Attach transformer to selected shape
- [ ] Update transformer when selection changes
- [ ] Show resize handles when shape is selected

**Transform Events:**
- [ ] Add `onTransformEnd` handler to Rectangle
- [ ] Add `onTransformEnd` handler to Circle
- [ ] Add `onTransformEnd` handler to TextBox
- [ ] Update shape dimensions in useCanvas
- [ ] Broadcast resize to database
- [ ] Test: Can resize all shape types

**TextBox Resize Fixes:**
- [ ] Text positioned relative to Group (x=8, y=8 with padding)
- [ ] Text maintains font size during resize (no scaling)
- [ ] Text stays within bounds of resized box
- [ ] Text editing overlay accounts for padding
- [ ] Throttled database updates (100ms delay) to prevent stuttering

**Performance Optimization:**
- [ ] Broadcast on `onTransform` (throttled) for real-time updates to other users
- [ ] Broadcast on `onTransformEnd` for final position confirmation
- [ ] Use optimistic updates (local state updates immediately)
- [ ] Throttle resize broadcasts (100-200ms) to prevent database overload
- [ ] Test: User B sees User A's resize happening in real-time
- [ ] Test: Resize feels smooth, no lag for User A
- [ ] Test: No database overload during rapid resizing

---

## PR #4: Real-Time Multiplayer Sync & Presence ✅ COMPLETE

**Goal:** Enable real-time synchronization, multiplayer cursors, and presence awareness

### ✅ Task 4.1: Enable Real-Time Shape Sync
- [ ] Subscribe to canvas_objects INSERT events
- [ ] Subscribe to canvas_objects UPDATE events
- [ ] Subscribe to canvas_objects DELETE events
- [ ] Handle remote shape changes
- [ ] Filter out own changes (avoid duplicates)
- [ ] Test: Open 2 windows, create shape in one ✅ TESTED
- [ ] Test: Move shape in one window, updates in other ✅ TESTED

### ✅ Task 4.2: Implement Real-Time Cursor Broadcasting
- [ ] Build useCursors hook
- [ ] Track mouse position with real-time throttling (50-100ms)
- [ ] Broadcast cursor_x/cursor_y to user_presence table
- [ ] Subscribe to presence UPDATE events
- [ ] Filter out own cursor
- [ ] Test: Cursor appears in other window in real-time ✅ TESTED
- **Files created:**
  - `src/hooks/useCursors.js` ✅

### ✅ Task 4.3: Render Real-Time Cursor Labels
- [ ] Create Cursor component with dot + label
- [ ] Use black text for visibility
- [ ] Position cursor at correct coordinates with smooth updates
- [ ] Handle cursor position interpolation for smooth movement
- [ ] Test: Username appears above cursor and moves smoothly ✅ TESTED
- **Files created:**
  - `src/components/Canvas/Cursor.jsx` ✅

### ✅ Task 4.4: Build usePresence Hook
- [ ] Upsert user on mount
- [ ] Load all online users on mount
- [ ] Subscribe to presence changes
- [ ] Update last_seen periodically
- [ ] Delete presence on unmount
- **Files created:**
  - `src/hooks/usePresence.js` ✅

### ✅ Task 4.5: Create UsersList Component
- [ ] Display online users with colored dots
- [ ] Show user count
- [ ] Highlight current user
- [ ] Show "Loading..." if empty
- **Files created:**
  - `src/components/Presence/UsersList.jsx` ✅

### ✅ Task 4.6: Integrate into App
- [ ] Call usePresence in App.jsx (NOT in Canvas.jsx)
- [ ] Pass onlineUsers to UsersList via props
- [ ] Verify no duplicate usePresence calls
- [ ] Test: See yourself + others in sidebar ✅ TESTED
- **Files updated:**
  - `src/App.jsx` ✅

### ✅ Task 4.7: Make Sidebar Always Visible
- [ ] Add min-width and flex-shrink: 0 to sidebar
- [ ] Add blue border for visibility
- [ ] Add box-shadow
- [ ] Test: Sidebar never hides when resizing ✅ TESTED
- **Files updated:**
  - `src/App.css` ✅

### ✅ Task 4.8: Real-Time Integration Testing
- [ ] Test with 2 users creating/moving shapes in real-time ✅ TESTED
- [ ] Verify cursors show with correct names and move smoothly ✅ TESTED
- [ ] Test: User A drags shape → User B sees movement in real-time ✅ TESTED
- [ ] Test: User A resizes shape → User B sees resize in real-time ✅ TESTED
- [ ] Check for infinite loops ✅ TESTED
- [ ] Verify no duplicate subscriptions ✅ TESTED

---

---

## PR #5: Polish & Bug Fixes ⏳ PENDING

**Goal:** Clean up, fix bugs, optimize performance

### ✅ Task 5.1: Code Cleanup
- [ ] Remove all `console.log` debug statements ✅
- [ ] Remove unused imports ✅
- [ ] Add JSDoc comments to functions ✅
- [ ] Format code consistently ✅
- **Files updated:** All files

### ✅ Task 5.2: Error Handling
- [ ] Add error boundaries in App.jsx ✅
- [ ] Handle Supabase connection errors gracefully ✅
- [ ] Show user-friendly error messages ✅
- [ ] Add retry logic for failed syncs ✅
- **Files updated:**
  - `src/App.jsx`
  - `src/hooks/useRealtimeSync.js`
  - `src/hooks/usePresence.js`
  - `src/components/ErrorBoundary.jsx` (new)
  - `src/components/LoadingSpinner.jsx` (new)

### ☐ Task 5.3: Ownership System + Performance Optimization
**Database Changes:** (Consolidated into Task 2.2)
- [x] All database schema changes moved to Task 2.2

**Ownership System:**
- [ ] Implement ownership request on shape click/selection
- [ ] Auto-release ownership after 45-second timeout
- [ ] Release ownership on double-click blank canvas area
- [ ] Prevent editing of owned objects by others
- [ ] Allow selection of objects underneath owned objects
- [ ] Single object lock per user (clicking new shape releases previous)
- [ ] Clicking owned shape refreshes 45-second timeout

**Visual Feedback:**
- [ ] Show owned objects at 70% opacity (except text boxes)
- [ ] Show owned text boxes at 25% grey opacity
- [ ] Add lock icon overlay on owned objects
- [ ] Different cursor style for owned vs. unowned objects
- [ ] Visual feedback when trying to edit owned object

**Performance Optimization:**
- [ ] Verify cursor updates are throttled (50-100ms)
- [ ] Verify presence heartbeat is reasonable (not too frequent)
- [ ] Add throttling to all shape operations (move: 100ms, resize: 100-200ms)
- [ ] Implement debounced updates for text editing (300ms)
- [ ] Ensure real-time updates don't cause stuttering
- [ ] Test with 5+ concurrent users
- [ ] Check FPS during interactions (should be 60)
- [ ] Optimize re-renders if needed

**Testing:**
- [ ] Test: User A clicks shape → gets ownership, shows 70% opacity to User B IMMEDIATELY
- [ ] Test: User A owns shape → User B cannot edit it (visual feedback)
- [ ] Test: User A double-clicks blank canvas → releases ownership
- [ ] Test: 45-second timeout → auto-releases ownership
- [ ] Test: User B can select objects underneath owned objects
- [ ] Test: Text boxes show 25% grey opacity when owned by others IMMEDIATELY
- [ ] Test: User A clicks new shape → loses ownership of previous shape
- [ ] Test: User A clicks owned shape → refreshes 45-second timeout
- [ ] Test: Performance remains smooth with ownership system active

### ☐ Task 5.4: Shape Delete Feature (Optional)
- [ ] Add delete key handler
- [ ] Delete selected shape from local state
- [ ] Broadcast DELETE to database
- [ ] Test: Delete shape → disappears for all users ⚠️

### ☐ Task 5.5: UI/UX Improvements
- [ ] Add keyboard shortcuts (Esc to deselect, etc.)
- [ ] Add loading spinner when loading shapes
- [ ] Improve toolbar button styling
- [ ] Add hover states to shapes
- [ ] Add tooltips to toolbar buttons

### ☐ Task 5.6: Final Testing
- [ ] Test all shape types (create, move, resize, delete)
- [ ] Test with 3+ concurrent users
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile (touch events)
- [ ] Test reconnection after network loss
- [ ] Verify no memory leaks (long sessions)

---

## PR #6: Documentation ⏳ PENDING

**Goal:** Complete documentation and deployment

### ☐ Task 6.1: Update README
- [ ] Add project overview and features
- [ ] Add screenshots/GIFs of app in action
- [ ] Update setup instructions
- [ ] Document environment variables
- [ ] Add usage guide
- [ ] Add troubleshooting section
- **Files to update:**
  - `README.md`

### ☐ Task 6.2: Create SQL Migration File (Optional)
- [ ] Create `migrations.sql` with all schema setup (consolidated from Task 2.2)
- [ ] Include both tables, policies, indexes, and RPC functions
- [ ] Add comments explaining each section
- **Note:** All database setup is now consolidated in Task 2.2
- **Files to create:**
  - `migrations.sql`

### ☐ Task 6.3: Architecture Documentation
- [ ] Document component hierarchy
- [ ] Document data flow
- [ ] Document real-time sync strategy
- [ ] Document known limitations
- [ ] Add diagrams if helpful
- **Files to create:**
  - `ARCHITECTURE.md`

### ☐ Task 6.4: Final Deployment
- [ ] Push all changes to GitHub
- [ ] Verify Vercel auto-deploys
- [ ] Test production URL
- [ ] Share URL for user testing
- [ ] Monitor for errors in production

---

## PR #7: Advanced Performance & Ownership ⏳ PENDING

**Goal:** Enhanced performance optimizations and advanced ownership features

### ☐ Task 7.1: Advanced Ownership Features
- [ ] Implement ownership transfer (steal ownership)
- [ ] Add ownership conflict resolution
- [ ] Add ownership history/audit trail
- [ ] Implement group ownership for multiple objects
- [ ] Add ownership notifications/alerts

### ☐ Task 7.2: Enhanced Performance Optimizations
- [ ] Implement JSON diff/patch for updates
- [ ] Add data compression for large payloads
- [ ] Optimize network update frequency (10-20 Hz)
- [ ] Add visual interpolation for smooth movement
- [ ] Implement update queuing for offline scenarios

### ☐ Task 7.3: Advanced UI/UX Features
- [ ] Multi-select with Ctrl+click
- [ ] Group operations (move, resize, delete)
- [ ] Undo/Redo functionality
- [ ] Advanced keyboard shortcuts
- [ ] Performance monitoring dashboard

### ☐ Task 7.4: Scalability Improvements
- [ ] Test with 10+ concurrent users
- [ ] Implement object virtualization for large canvases
- [ ] Add pagination for shape loading
- [ ] Optimize memory usage for long sessions
- [ ] Add connection pooling and retry logic

---

## ⚠️ Common Issues Checklist

Before marking any PR as complete, verify:

### Data & Sync Issues
- [ ] All shapes use consistent `color` field (not `fill`)
- [ ] Database columns match code expectations (including owner_id, owned_at)
- [ ] Realtime subscriptions are enabled for both tables
- [ ] No duplicate subscriptions (check usePresence is only in App.jsx)
- [ ] Remote changes filter out own user ID to avoid duplicates
- [ ] Ownership system uses single table (canvas_objects) for efficiency

### Performance Issues
- [ ] No infinite loops (check React DevTools)
- [ ] No excessive console logging
- [ ] Cursor updates are throttled (50-100ms)
- [ ] Resize/drag broadcasts during operation (throttled) + on end
- [ ] FPS stays at 60 during interactions

### UI/UX Issues
- [ ] Sidebar is always visible (min-width, flex-shrink: 0)
- [ ] Cursor labels use black text (readable)
- [ ] Toolbar buttons are clearly labeled
- [ ] Selected shapes show visual feedback
- [ ] Loading states are present

### Testing Checklist
- [ ] Shapes persist on refresh
- [ ] Multi-user sync works (open 2 windows)
- [ ] Cursors appear with usernames
- [ ] Online users list shows all users
- [ ] All shape types work (rectangle, circle, text)
- [ ] Resize works for all shape types
- [ ] No console errors in production

---

## 📊 Success Metrics

### MVP Must Have:
- ✅ Email/password authentication with session persistence
- ✅ Real-time shape synchronization across users
- ✅ Multiplayer cursors with usernames
- ✅ Online users list in sidebar
- ✅ Canvas state persistence
- ✅ Three shape types (rectangle, circle, text)
- ✅ Shape resizing with sync
- 🚧 Basic ownership system (first-come-first-served, 45s timeout)
- ⏳ Clean, polished UI

### Nice to Have:
- Shape deletion
- Keyboard shortcuts
- Mobile support
- Undo/redo
- Export canvas

---

## 🎯 Testing Scenarios

### Scenario 1: Basic Collaboration
1. Open app in 2 browsers with different accounts
2. User A creates a rectangle → User B sees it instantly
3. User B creates a circle → User A sees it instantly
4. User A resizes rectangle → User B sees resize
5. Both users see each other's cursors moving
6. Both users appear in sidebar

### Scenario 2: Persistence & Reconnection
1. User A creates multiple shapes (rectangle, circle, text)
2. User A refreshes page → all shapes still there
3. User B joins later → sees all existing shapes
4. User A logs out and back in → canvas state restored

### Scenario 3: Multi-User Editing
1. Open app in 3 browsers
2. All 3 users create different shapes
3. All 3 users see all shapes in real-time
4. User 1 resizes a shape → Users 2 & 3 see it
5. User 2 moves a shape → Users 1 & 3 see it
6. All 3 users appear in sidebar

### Scenario 4: Text Editing
1. User A creates a text box
2. User A double-clicks and edits text
3. User B sees text update in real-time
4. User B resizes text box → User A sees resize

### Scenario 5: Ownership System
1. User A clicks on a shape → gets ownership, User B sees 70% opacity
2. User A resizes the shape → User B cannot resize (no handles visible)
3. User A double-clicks blank canvas → releases ownership, User B sees full opacity
4. User A clicks new shape → automatically releases previous ownership
5. User A owns shape for 45+ seconds → auto-releases ownership
6. User B can select objects underneath owned shapes

### Scenario 6: Performance & Real-time Updates
1. User A rapidly moves/resizes shapes → smooth performance, throttled updates
2. User B sees updates in real-time without stuttering
3. Multiple users (3+) can collaborate simultaneously
4. TextBox editing works smoothly with proper DOM cleanup
5. Transform handles only appear for owned shapes

---

---

## 🔑 **KEY DECISIONS & IMPLEMENTATION NOTES**

### **Ownership System Implementation**
- **Approach:** "Server decides, client syncs" using Supabase RPC functions
- **Database Schema:** Added `owner_id` and `owned_at` fields to `canvas_objects` table
- **Ownership Rules:**
  - First-come-first-served (single object lock per user)
  - 45-second timeout for auto-release
  - Double-click blank canvas to release all ownership
  - Click new shape automatically releases previous ownership
- **Visual Feedback:**
  - Owned shapes: 70% opacity for other users
  - TextBoxes: 70% opacity + grey background/text for other users
  - Transform handles only show for owned shapes
- **RPC Functions Created:**
  - `request_shape_ownership(shape_id)`
  - `release_shape_ownership(shape_id)`
  - `release_all_ownership()`
  - `cleanup_expired_ownership()`

### **Performance Optimizations**
- **Throttling:** All shape operations (move: 100ms, resize: 100-200ms, cursors: 50-100ms)
- **Debouncing:** Text editing updates debounced to prevent excessive DB calls
- **Real-time Updates:** Optimistic updates with server reconciliation
- **Transform Handling:** Separate `onTransform` (throttled) and `onTransformEnd` (immediate) events
- **Drag Handling:** Separate `onDragMove` (throttled) and `onDragEnd` (immediate) events

### **TextBox Implementation Challenges & Solutions**
- **Issue:** Text scaling with transform → **Solution:** Use Group with explicit dimensions, reset scale to 1
- **Issue:** DOM cleanup errors → **Solution:** Proper ref management and single cleanup function
- **Issue:** Resizing stuck at 50px → **Solution:** Set explicit width/height on Group component
- **Issue:** Stuttering during resize → **Solution:** Throttled transform updates with immediate final update
- **Issue:** Click-outside detection → **Solution:** Canvas stage click events instead of DOM events

### **Database Schema Evolution**
- **Initial:** Basic `canvas_objects` table with shape properties
- **Added:** `text_content` and `font_size` columns for text shapes
- **Added:** `owner_id` and `owned_at` columns for ownership system
- **Indexes:** Created for performance on `owner_id`, `owned_at`, and `type` columns

### **Authentication Evolution**
- **Started:** Anonymous authentication
- **Changed:** Email/password authentication for better user management
- **Session:** Persistent sessions with proper error handling

### **Real-time Sync Architecture**
- **Approach:** Supabase real-time subscriptions with optimistic updates
- **Conflict Resolution:** Server-side RPC functions for ownership decisions
- **Error Handling:** Graceful degradation with retry mechanisms
- **Debug Mode:** Toggleable logging for development

### **Database Setup Reference**
**Note:** All database setup requirements are now consolidated in **Task 2.2: Create Complete Database Schema**.

The complete SQL setup includes:
- `canvas_objects` table with all required columns (including ownership and text fields)
- `user_presence` table for real-time collaboration
- Row Level Security (RLS) policies
- Performance indexes
- Ownership management RPC functions
- Realtime subscriptions

See Task 2.2 for the complete database schema requirements.

---

**Last Updated:** After completing ownership system, performance optimizations, and TextBox implementation
