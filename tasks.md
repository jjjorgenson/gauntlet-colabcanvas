# CollabCanvas MVP - Task List (v2.0)

## 🎯 **PROGRESS SUMMARY**
- ✅ **Phase 1: Setup + Authentication** - COMPLETE
- ✅ **Phase 2: Canvas Foundation (Single User)** - COMPLETE
- ✅ **Phase 3: Shape Creation & Manipulation (Single User)** - COMPLETE
- ✅ **Phase 4: Real-Time Sync (CRITICAL PATH)** - COMPLETE
- ✅ **Phase 5: State Persistence** - COMPLETE
- ✅ **Phase 6: Presence Awareness** - COMPLETE
- ⏳ **Phase 7: Polish + Testing** - IN PROGRESS
- ⏳ **Phase 8: Final Deployment** - PENDING

**Current Status:** 🎉 **MVP COMPLETE!** All core functionality working with real-time collaboration.
- ✅ Real-time shape sync (create, move, resize, text edit)
- ✅ Multi-user cursors with usernames
- ✅ Online users list
- ✅ TextBox editing with ownership locks
- ✅ Canvas state persistence
- 🎯 **Next: Shape deletion feature (high priority)**

### **✅ What's Currently Working:**
- **Project Structure:** Complete React + Vite project with all dependencies
- **Database Schema:** Complete with profiles, canvas_objects, user_presence tables
- **Authentication:** Email/password auth with username storage and profile creation
- **Canvas Foundation:** 5000x5000px workspace with pan/zoom functionality
- **Shape Creation:** Rectangle, Circle, and TextBox creation with color selection
- **Shape Manipulation:** Drag, resize, and text editing for all shape types
- **Real-Time Collaboration:** Multi-user shape sync with live cursors and presence
- **TextBox Editing:** Advanced text editing with ownership locks and 35-second timeout
- **ObjectStore Architecture:** External state management with useSyncExternalStore
- **Transformer Integration:** Konva Transformer for shape resizing with handles
- **Workspace Boundaries:** All shapes constrained to 5000x5000px area
- **Canvas Background:** 5% grey tint to show workspace boundaries
- **Clean UI:** Single toolbar with shape creation and color selection
- **Online Users:** Real-time user presence with colored dots and usernames
- **State Persistence:** Canvas state saved to database and restored on refresh

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

## Phase 1: Setup + Authentication ✅ COMPLETE

**Goal:** Initialize project with all dependencies, setup Supabase, and implement email+password authentication

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

### ✅ Task 1.6: Database Schema Setup
**Core Tables:**
- [x] Create `profiles` table with columns:
  - `id` (UUID, primary key, references auth.users)
  - `username` (TEXT, UNIQUE constraint)
  - `display_name` (TEXT, nullable)
  - `avatar_url` (TEXT, nullable)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

- [x] Create `canvas_objects` table with columns:
  - `id` (UUID, primary key)
  - `type` (TEXT: 'rectangle', 'circle', 'text')
  - `x`, `y`, `width`, `height` (NUMERIC)
  - `color` (TEXT)
  - `text_content` (TEXT, nullable for text shapes)
  - `font_size` (NUMERIC, default 16, nullable for text shapes)
  - `owner_id` (UUID, nullable, references profiles.id)
  - `owned_at` (TIMESTAMPTZ, nullable)
  - `created_by` (UUID, references profiles.id)
  - `created_at`, `updated_at` (TIMESTAMPTZ)

- [x] Create `user_presence` table with columns:
  - `user_id` (UUID, primary key, references profiles.id)
  - `is_online` (BOOLEAN)
  - `last_seen` (TIMESTAMPTZ)
  - `cursor_x`, `cursor_y` (NUMERIC, nullable)

**Security & Performance:**
- [x] Enable Row Level Security (RLS) on all tables
- [x] Create RLS policies for read/write access
- [x] Create performance indexes:
  - `profiles_username_idx` on `username`
  - `canvas_objects_owner_id_idx` on `owner_id`
  - `canvas_objects_owned_at_idx` on `owned_at`
  - `canvas_objects_type_idx` on `type`
- [x] Enable Realtime subscriptions for all tables

**Database Triggers:**
- [x] Create trigger to auto-insert profile on user signup
- [x] Create trigger to copy user_metadata.username to profiles.username
- [x] Handle username uniqueness constraint violations

**Ownership System RPC Functions:**
- [x] Create `request_shape_ownership(shape_id UUID)` function
- [x] Create `release_shape_ownership(shape_id UUID)` function
- [x] Create `release_all_ownership()` function
- [x] Create `cleanup_expired_ownership()` function

- **Files:** Supabase SQL Editor ✅

### ✅ Task 1.7: Setup Supabase Auth Configuration
- [x] Configure Supabase Auth settings in dashboard
- [x] Enable email/password authentication
- [x] Configure authentication flow
- **Files:** Supabase dashboard configuration only ✅

### ✅ Task 1.8: Create Authentication Components
- [x] Build LoginForm with email + password + username fields
- [x] Add signup/login tabs (single form)
- [x] Add validation (email format, password requirements, username uniqueness)
- [x] Handle email verification requirement for login
- [x] Generic error messages for login, specific for signup
- **Files created:**
  - `src/components/Auth/LoginForm.jsx` ✅
  - `src/components/Auth/AuthProvider.jsx` ✅

### ✅ Task 1.9: Create Authentication Hook
- [x] Build `useAuth` hook for auth state management
- [x] Handle login/logout logic with email/password
- [x] Handle signup with email/password/username
- [x] Store username in user_metadata during signup
- [x] Persist user session
- [x] Handle email verification flow
- **Files created:**
  - `src/hooks/useAuth.js` ✅

### ✅ Task 1.10: Integrate Auth into App
- [x] Wrap app with AuthProvider
- [x] Show LoginForm for unauthenticated users
- [x] Show Canvas for authenticated users
- [x] Add logout button
- **Files updated:**
  - `src/App.jsx` ✅

### ✅ Task 1.11: Test Authentication Flow
- [x] Test signup with email/username/password (creates profile via trigger)
- [x] Test email verification requirement
- [x] Test login with email/password (after verification)
- [x] Test username uniqueness constraint
- [x] Verify auth session persistence on refresh
- [x] Test logout functionality
- [x] Test foreign key relationships (canvas_objects.owner_id → profiles.id)
- [ ] Deploy and verify on production

---

## Phase 2: Canvas Foundation (Single User) ✅ COMPLETE

**Goal:** Setup Konva.js Stage and Layer components with pan and zoom functionality

### ✅ Task 2.1: Setup Konva Stage
- [x] Create CanvasStage component with Konva Stage and Layer
- [x] Set up fixed 5000x5000px workspace
- [x] Reserve 200px width for sidebar (stage width = window.innerWidth - 200px)
- [x] Initialize stage reference
- [x] Wrap with forwardRef for ref passing
- [x] Add stage dimensions and positioning
- [x] Handle stage container sizing
- **Files created:**
  - `src/components/Canvas/CanvasStage.jsx` ✅

### ✅ Task 2.2: Implement Pan Functionality
- [x] Add mouse drag to pan canvas (click+drag on blank space)
- [x] Update stage position on drag
- [x] Handle drag start/end events
- [x] Add visual feedback during pan
- [x] Enforce 5000x5000 workspace boundaries
- [x] Test: Can pan smoothly in all directions
- [x] Test: Pan works at different zoom levels
- [x] Test: Shapes stay within workspace boundaries

### ✅ Task 2.3: Implement Zoom Functionality
- [x] Add mouse wheel zoom with smooth animation (200ms duration)
- [x] Implement zoom to cursor position
- [x] Set min/max zoom limits (0.1x to 5x)
- [x] Handle zoom center calculation
- [x] Add smooth zoom transitions
- [x] Test: Can zoom in/out smoothly with animation
- [x] Test: Zoom centers on cursor position
- [x] Test: Zoom limits are respected
- [x] Test: Zoom works with pan functionality

### ✅ Task 2.4: Integration Testing
- [x] Test: Pan and zoom work together seamlessly
- [x] Test: Canvas maintains state during pan/zoom
- [x] Test: Performance is smooth (60 FPS)
- [x] Test: Works on different screen sizes
- [x] Test: Sidebar space is properly reserved
- [x] Test: Click+drag panning works correctly

---

## Phase 3: Shape Creation & Manipulation (Single User) ⏳ IN PROGRESS

**Goal:** Add rectangle, circle, and text box creation with drag, resize, and text editing functionality

### ✅ Task 3.1: Create All Shape Components
**Rectangle Component:**
- [ ] Build Rectangle component using Konva Rect
- [ ] Add drag-and-drop functionality with real-time updates
- [ ] Add visual feedback (shadow, stroke)
- [ ] Test: Can create and move rectangles ✅ TESTED

**Circle Component:**
- [x] Build Circle component using Konva Circle
- [x] Add drag-and-drop functionality with real-time updates
- [x] Use radius from width/height (radius = width / 2)
- [x] Add visual feedback (shadow, stroke)
- [x] Handle selection state
- [x] Test: Can render and drag circle ✅ READY FOR TESTING

**TextBox Component:**
- [x] Build TextBox component using Konva Text + Rect
- [x] Add drag-and-drop functionality with real-time updates
- [x] Add double-click to edit text
- [x] Show text input overlay when editing
- [x] Update text_content on blur/Enter
- [x] Handle selection state
- [x] Set default font_size to 16
- [x] Test: Can create, drag, and edit text ✅ READY FOR TESTING

- **Files created:**
  - `src/components/Canvas/Rectangle.jsx` ✅
  - `src/components/Canvas/Circle.jsx` ✅
  - `src/components/Canvas/TextBox.jsx` ✅

### ✅ Task 3.2: Build useCanvas Hook & Helpers
**Canvas State Management:**
- [x] Create hook for canvas state management
- [x] Implement addRectangle function
- [x] Implement addCircle function
- [x] Implement addTextBox function
- [x] Implement updateShapePosition function (with real-time broadcasting)
- [x] Implement updateTextContent function
- [x] Implement shape selection
- [x] Use consistent `color` field (not `fill`)
- [x] Test: Local state management works ✅ TESTED

**Canvas Helpers:**
- [x] Add `createRectangle(x, y, color)` function
- [x] Add `createCircle(x, y, color)` function
- [x] Add `createTextBox(x, y, color, text)` function
- [x] Functions return correct shape data structures

- **Files created:**
  - `src/hooks/useCanvas.js` ✅
  - `src/utils/canvasHelpers.js` ✅

### ✅ Task 3.3: Build Main Canvas Component
- [x] Create Canvas.jsx with toolbar
- [x] Integrate all hooks
- [x] Add "Rectangle" button
- [x] Add "Circle" button
- [x] Add "Text" button
- [x] Add color palette (including white for text backgrounds)
- [x] Wire up event handlers for all shape types
- [x] Render all shape types (rectangle, circle, text)
- [x] Test: Can create all shape types ✅ READY FOR TESTING
- **Files created:**
  - `src/components/Canvas/Canvas.jsx` ✅

### ✅ Task 3.4: Shape Resizing with Transformer (Architecture Refactor) - COMPLETE
**Stage 1 - Core Transformer:**
- [x] Create ObjectStore class (Map-based, external to React)
- [x] Implement ObjectStore methods: update(), getAll(), subscribe()
- [x] Refactor useCanvas to use useSyncExternalStore with ObjectStore
- [x] Replace React state mutations with objectStore.update() calls
- [x] Import Transformer from react-konva
- [x] Add Transformer component to CanvasStage
- [x] Attach transformer to selected shape
- [x] Update transformer when selection changes
- [x] Show resize handles when shape is selected

**Stage 2 - Transform Events (One by One):**
- [x] Add `onTransform` and `onTransformEnd` handlers to Rectangle
- [x] Add `onTransform` and `onTransformEnd` handlers to Circle  
- [x] Add `onTransform` and `onTransformEnd` handlers to TextBox
- [x] Update shape dimensions in ObjectStore
- [x] Test: Can resize all shape types locally ✅ TESTED

**Stage 3 - Real-time Sync (Future):**
- [ ] Broadcast on `onTransform` (throttled 50-100ms) for real-time updates
- [ ] Broadcast on `onTransformEnd` for final position confirmation
- [ ] Use optimistic updates (local state updates immediately)
- [ ] Implement interpolation for smooth remote updates
- [ ] Test: User B sees User A's resize happening in real-time

**Shape Specifications:**
- [x] Circles: Maintain aspect ratio (width = height)
- [x] Rectangles: Free resize (width ≠ height)
- [x] Text Boxes: Free resize, 50x50px minimum, fixed font size
- [x] All shapes: Constrained by 5000x5000 workspace
- [x] Text: Font size stays fixed during resize, text wraps in expanded box

**Files Created/Updated:**
- [x] `src/lib/ObjectStore.js` (new) ✅
- [x] `src/hooks/useCanvas.js` (refactor) ✅
- [x] `src/components/Canvas/CanvasStage.jsx` (add Transformer) ✅
- [x] `src/components/Canvas/Rectangle.jsx` (transform handlers) ✅
- [x] `src/components/Canvas/Circle.jsx` (transform handlers) ✅
- [x] `src/components/Canvas/TextBox.jsx` (transform handlers) ✅

**Additional Fixes:**
- [x] Fixed TextBox drag snapping issue with proper position synchronization
- [x] Fixed Circle drag positioning with radius offset handling
- [x] Added 5% grey canvas background to show workspace boundaries
- [x] Removed duplicate toolbar buttons from header

---

## Phase 4: Real-Time Sync (CRITICAL PATH) ✅ COMPLETE

**Goal:** Setup Supabase real-time subscriptions and implement cursor position broadcasting with real-time updates

### ✅ Task 4.1: Enable Real-Time Shape Sync
- [x] Subscribe to canvas_objects INSERT events
- [x] Subscribe to canvas_objects UPDATE events
- [x] Subscribe to canvas_objects DELETE events
- [x] Handle remote shape changes
- [x] Filter out own changes (avoid duplicates)
- [x] Test: Open 2 windows, create shape in one ✅ TESTED
- [x] Test: Move shape in one window, updates in other ✅ TESTED

### ✅ Task 4.2: Implement Real-Time Cursor Broadcasting
- [x] Build useCursors hook
- [x] Track mouse position with real-time throttling (50-100ms)
- [x] Broadcast cursor_x/cursor_y to user_presence table
- [x] Subscribe to presence UPDATE events
- [x] Filter out own cursor
- [x] Test: Cursor appears in other window in real-time ✅ TESTED
- **Files created:**
  - `src/hooks/useCursors.js` ✅

### ✅ Task 4.3: Render Real-Time Cursor Labels
- [x] Create Cursor component with dot + label
- [x] Use black text for visibility
- [x] Position cursor at correct coordinates with smooth updates
- [x] Handle cursor position interpolation for smooth movement
- [x] Test: Username appears above cursor and moves smoothly ✅ TESTED
- **Files created:**
  - `src/components/Canvas/Cursor.jsx` ✅

### ✅ Task 4.4: Build usePresence Hook
- [x] Upsert user on mount
- [x] Load all online users on mount
- [x] Subscribe to presence changes
- [x] Update last_seen periodically
- [x] Delete presence on unmount
- **Files created:**
  - `src/hooks/usePresence.js` ✅

### ✅ Task 4.5: Create UsersList Component
- [x] Display online users with colored dots
- [x] Show user count
- [x] Highlight current user
- [x] Show "Loading..." if empty
- **Files created:**
  - `src/components/Presence/UsersList.jsx` ✅

### ✅ Task 4.6: Integrate into App
- [x] Call usePresence in App.jsx (NOT in Canvas.jsx)
- [x] Pass onlineUsers to UsersList via props
- [x] Verify no duplicate usePresence calls
- [x] Test: See yourself + others in sidebar ✅ TESTED
- **Files updated:**
  - `src/App.jsx` ✅

### ✅ Task 4.7: Make Sidebar Always Visible
- [x] Add min-width and flex-shrink: 0 to sidebar
- [x] Add blue border for visibility
- [x] Add box-shadow
- [x] Test: Sidebar never hides when resizing ✅ TESTED
- **Files updated:**
  - `src/App.css` ✅

### ✅ Task 4.8: Real-Time Integration Testing
- [x] Test with 2 users creating/moving shapes in real-time ✅ TESTED
- [x] Verify cursors show with correct names and move smoothly ✅ TESTED
- [x] Test: User A drags shape → User B sees movement in real-time ✅ TESTED
- [x] Test: User A resizes shape → User B sees resize in real-time ✅ TESTED
- [x] Check for infinite loops ✅ TESTED
- [x] Verify no duplicate subscriptions ✅ TESTED

---

## Phase 5: State Persistence ✅ COMPLETE

**Goal:** Save canvas objects to Supabase PostgreSQL and handle page refresh without data loss

### ✅ Task 5.1: Database Integration
- [x] Build useRealtimeSync hook
- [x] Implement broadcastShapeChange function
- [x] Load shapes from database on mount
- [x] Subscribe to INSERT/UPDATE/DELETE events
- [x] Test: Create shape → appears in database
- [x] Test: Refresh page → shapes reload
- **Files created:**
  - `src/hooks/useRealtimeSync.js` ✅
  - `src/utils/syncHelpers.js` ✅

### ✅ Task 5.2: Handle Reconnection Logic
- [x] Implement reconnection logic for lost connections
- [x] Handle page refresh without data loss
- [x] Test: Disconnect and reconnect → state restored

---

## Phase 6: Presence Awareness ✅ COMPLETE

**Goal:** Track online users in Supabase and display list of currently connected users

### ✅ Task 6.1: Build usePresence Hook
- [x] Upsert user on mount
- [x] Load all online users on mount
- [x] Subscribe to presence changes
- [x] Update last_seen periodically
- [x] Delete presence on unmount
- **Files created:**
  - `src/hooks/usePresence.js` ✅

### ✅ Task 6.2: Create UsersList Component
- [x] Display online users with colored dots
- [x] Show user count
- [x] Highlight current user
- [x] Show "Loading..." if empty
- **Files created:**
  - `src/components/Presence/UsersList.jsx` ✅

### ✅ Task 6.3: Integrate into App
- [x] Call usePresence in App.jsx (NOT in Canvas.jsx)
- [x] Pass onlineUsers to UsersList via props
- [x] Verify no duplicate usePresence calls
- [x] Test: See yourself + others in sidebar
- **Files updated:**
  - `src/App.jsx` ✅

### ✅ Task 6.4: Make Sidebar Always Visible
- [x] Add min-width and flex-shrink: 0 to sidebar
- [x] Add blue border for visibility
- [x] Add box-shadow
- [x] Test: Sidebar never hides when resizing
- **Files updated:**
  - `src/App.css` ✅

---

## Phase 7: Polish + Testing ⏳ IN PROGRESS

**Goal:** Clean up, fix bugs, optimize performance

### ✅ Task 7.1: Code Cleanup
- [x] Remove all `console.log` debug statements ✅
- [x] Remove unused imports ✅
- [x] Add JSDoc comments to functions ✅
- [x] Format code consistently ✅
- **Files updated:** All files

### ✅ Task 7.2: Error Handling
- [x] Add error boundaries in App.jsx ✅
- [x] Handle Supabase connection errors gracefully ✅
- [x] Show user-friendly error messages ✅
- [x] Add retry logic for failed syncs ✅
- **Files updated:**
  - `src/App.jsx`
  - `src/hooks/useRealtimeSync.js`
  - `src/hooks/usePresence.js`
  - `src/components/ErrorBoundary.jsx` (new)
  - `src/components/LoadingSpinner.jsx` (new)

### ☐ Task 7.3: Shape Delete Feature - HIGH PRIORITY
- [ ] Add delete key handler (Delete key)
- [ ] Delete selected shape from local state
- [ ] Broadcast DELETE to database
- [ ] Test: Delete shape → disappears for all users
- [ ] Add visual feedback for deletion

### ☐ Task 7.4: Ownership System + Performance Optimization
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

### ☐ Task 7.5: UI/UX Improvements
- [ ] Add keyboard shortcuts (Esc to deselect, etc.)
- [ ] Add loading spinner when loading shapes
- [ ] Improve toolbar button styling
- [ ] Add hover states to shapes
- [ ] Add tooltips to toolbar buttons

### ☐ Task 7.6: Final Testing
- [ ] Test all shape types (create, move, resize, delete)
- [ ] Test with 3+ concurrent users
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile (touch events)
- [ ] Test reconnection after network loss
- [ ] Verify no memory leaks (long sessions)

---

## Phase 8: Final Deployment ⏳ PENDING

**Goal:** Deploy to production, verify public URL accessibility, and create documentation

### ☐ Task 8.1: Deploy to Production
- [ ] Push all changes to GitHub
- [ ] Verify Vercel auto-deploys
- [ ] Test production URL
- [ ] Load test with multiple users
- [ ] Monitor for errors in production

### ☐ Task 8.2: Update README
- [ ] Add project overview and features
- [ ] Add screenshots/GIFs of app in action
- [ ] Update setup instructions
- [ ] Document environment variables
- [ ] Add usage guide
- [ ] Add troubleshooting section
- **Files to update:**
  - `README.md`

### ☐ Task 8.3: Create SQL Migration File (Optional)
- [ ] Create `migrations.sql` with all schema setup (consolidated from Task 1.6)
- [ ] Include both tables, policies, indexes, and RPC functions
- [ ] Add comments explaining each section
- **Note:** All database setup is now consolidated in Task 1.6
- **Files to create:**
  - `migrations.sql`

### ☐ Task 8.4: Architecture Documentation
- [ ] Document component hierarchy
- [ ] Document data flow
- [ ] Document real-time sync strategy
- [ ] Document known limitations
- [ ] Add diagrams if helpful
- **Files to create:**
  - `ARCHITECTURE.md`

---

## 🚀 **FUTURE ENHANCEMENTS (Post-MVP)**

### Advanced Canvas Features
- [ ] **Keyboard Shortcuts:** Ctrl+Plus/Minus for zoom, Ctrl+0 for reset, Space+Drag for pan
- [ ] **Edge-based Cursor Panning:** Pan when cursor reaches viewable edge (5px threshold) - REMOVED (too aggressive)
- [ ] **Shape-based Panning:** Pan when dragging shape reaches viewable edge (50px threshold)
- [ ] **Viewport Culling:** Optimize rendering for large canvases with many objects
- [ ] **Mobile Support:** Touch events for pan/zoom on mobile devices
- [ ] **Canvas Grid:** Optional grid overlay for alignment
- [ ] **Ruler/Guides:** Measurement tools and alignment guides

### Advanced Ownership Features
- [ ] Implement ownership transfer (steal ownership)
- [ ] Add ownership conflict resolution
- [ ] Add ownership history/audit trail
- [ ] Implement group ownership for multiple objects
- [ ] Add ownership notifications/alerts

### Enhanced Performance Optimizations
- [ ] Implement JSON diff/patch for updates
- [ ] Add data compression for large payloads
- [ ] Optimize network update frequency (10-20 Hz)
- [ ] Add visual interpolation for smooth movement
- [ ] Implement update queuing for offline scenarios

### Advanced UI/UX Features
- [ ] Multi-select with Ctrl+click
- [ ] Group operations (move, resize, delete)
- [ ] Undo/Redo functionality
- [ ] Advanced keyboard shortcuts
- [ ] Performance monitoring dashboard

### Scalability Improvements
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
- ✅ TextBox editing with ownership locks (35s timeout)
- ✅ Clean, polished UI

### Nice to Have:
- Advanced keyboard shortcuts
- Mobile support
- Undo/redo
- Export canvas
- Multi-select operations

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
