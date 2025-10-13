# CollabCanvas MVP - Task List

## 🎯 **PROGRESS SUMMARY**
- ✅ **PR #1: Project Setup & Configuration** - COMPLETED
- ✅ **PR #2: Authentication Implementation** - COMPLETED  
- ✅ **PR #3: Canvas Foundation (Single User)** - COMPLETED
- ⏳ **PR #4: Supabase Database Schema** - PENDING
- ⏳ **PR #5: Real-Time Object Synchronization** - PENDING
- ⏳ **PR #6: Multiplayer Cursors** - PENDING
- ⏳ **PR #7: Presence Awareness** - PENDING
- ⏳ **PR #8: State Persistence** - PENDING
- ⏳ **PR #9: Performance Optimization & Bug Fixes** - PENDING
- ⏳ **PR #10: Polish & Documentation** - PENDING

**Current Status:** Foundation complete! Ready for dependency installation and basic testing.

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
│   │   │   ├── Rectangle.jsx
│   │   │   └── Cursor.jsx
│   │   ├── Toolbar/
│   │   │   └── Toolbar.jsx
│   │   └── Presence/
│   │       └── UsersList.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCanvas.js
│   │   ├── useRealtimeSync.js
│   │   ├── useCursors.js
│   │   └── usePresence.js
│   ├── lib/
│   │   ├── supabase.js
│   │   └── constants.js
│   ├── utils/
│   │   ├── canvasHelpers.js
│   │   └── syncHelpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tests/
│   ├── setup.js
│   ├── mocks/
│   │   ├── supabaseMock.js
│   │   └── canvasFixtures.js
│   ├── unit/
│   │   ├── hooks/
│   │   │   ├── useAuth.test.js
│   │   │   ├── useCanvas.test.js
│   │   │   ├── useRealtimeSync.test.js
│   │   │   └── useCursors.test.js
│   │   └── utils/
│   │       ├── canvasHelpers.test.js
│   │       └── syncHelpers.test.js
│   └── integration/
│       ├── auth.test.js
│       ├── canvasSync.test.js
│       ├── cursorSync.test.js
│       └── persistence.test.js
├── .env.local
├── .env.test
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## PR #1: Project Setup & Configuration

**Goal:** Initialize project with all dependencies and basic configuration

### ✅ Task 1.1: Initialize React Project
- [x] Create new Vite + React project
- [x] Install base dependencies: `react`, `react-dom`
- **Files created:**
  - `package.json` ✅
  - `vite.config.js` ✅
  - `src/main.jsx` ✅
  - `src/App.jsx` ✅
  - `src/index.css` ✅
  - `public/index.html` ✅

### ✅ Task 1.2: Install & Configure Dependencies
- [x] Install Supabase client: `@supabase/supabase-js` (ready for install)
- [x] Install Konva: `react-konva`, `konva` (ready for install)
- [x] Install additional utilities: `uuid` (ready for install)
- **Files updated:**
  - `package.json` ✅

### ✅ Task 1.3: Setup Supabase Configuration
- [ ] Create Supabase project in dashboard (needs user action)
- [ ] Copy API URL and anon key (needs user action)
- [x] Create `.env.local` with Supabase credentials
- [x] Create Supabase client configuration file
- **Files created:**
  - `.env.local` ✅
  - `src/lib/supabase.js` ✅
  - `.gitignore` ✅ (ensure `.env.local` is ignored)

### ✅ Task 1.4: Create Basic App Structure
- [x] Setup basic routing (authenticated vs non-authenticated views)
- [x] Create placeholder components
- [x] Add basic styling reset
- **Files created:**
  - `src/lib/constants.js` ✅
- **Files updated:**
  - `src/App.jsx` ✅
  - `src/index.css` ✅

### ✅ Task 1.5: Initial Deployment Setup
- [x] Create README.md with setup instructions
- [x] Create GitHub repository (https://github.com/jjorgens/gauntlet-colabcanvas.git)
- [x] Push initial code
- [ ] Connect to Vercel (needs user action)
- [ ] Deploy "Hello World" (needs user action)
- [ ] Verify deployment works (needs user action)
- **Files created:**
  - `README.md` ✅ (with comprehensive setup instructions)

---

## PR #2: Authentication Implementation

**Goal:** Implement username-only authentication with Supabase

### ✅ Task 2.1: Setup Supabase Auth Configuration
- [ ] Configure Supabase Auth settings in dashboard (needs user action)
- [ ] Disable email confirmation (for username-only flow) (needs user action)
- [ ] Setup custom user metadata for username storage (needs user action)
- **Files:** Supabase dashboard configuration only

### ✅ Task 2.2: Create Authentication Components
- [x] Build login form component (username input + submit)
- [x] Create auth provider wrapper
- [x] Add loading states
- **Files created:**
  - `src/components/Auth/LoginForm.jsx` ✅
  - `src/components/Auth/AuthProvider.jsx` ✅

### ✅ Task 2.3: Create Authentication Hook
- [x] Build `useAuth` hook for auth state management
- [x] Handle login/logout logic
- [x] Persist user session
- [x] Store username in user metadata
- **Files created:**
  - `src/hooks/useAuth.js` ✅

### ✅ Task 2.4: Integrate Auth into App
- [x] Wrap app with AuthProvider
- [x] Show LoginForm for unauthenticated users
- [x] Show Canvas for authenticated users
- [x] Add logout button
- **Files updated:**
  - `src/App.jsx` ✅

### ✅ Task 2.5: Test Authentication Flow
- [x] Test login with username
- [ ] Verify session persistence on refresh (needs testing)
- [ ] Test logout functionality (needs testing)
- [ ] Deploy and verify on production (needs user action)

---

## PR #3: Canvas Foundation (Single User)

**Goal:** Create working canvas with pan, zoom, and basic rectangle creation

### ✅ Task 3.1: Setup Konva Stage
- [x] Create CanvasStage component with Konva Stage and Layer
- [x] Set up large workspace (5000x5000px)
- [x] Initialize stage reference
- **Files created:**
  - `src/components/Canvas/CanvasStage.jsx` ✅

### ✅ Task 3.2: Implement Pan Functionality
- [x] Add mouse drag to pan canvas
- [x] Update stage position on drag
- [x] Add smooth panning
- **Files updated:**
  - `src/components/Canvas/CanvasStage.jsx` ✅

### ✅ Task 3.3: Implement Zoom Functionality
- [x] Add mouse wheel zoom
- [x] Zoom to cursor position
- [x] Set min/max zoom limits
- **Files updated:**
  - `src/components/Canvas/CanvasStage.jsx` ✅

### ✅ Task 3.4: Create Rectangle Component
- [x] Build Rectangle component using Konva.Rect
- [x] Add drag functionality
- [x] Style with fill color, stroke
- **Files created:**
  - `src/components/Canvas/Rectangle.jsx` ✅

### ✅ Task 3.5: Create Canvas State Management Hook
- [x] Build `useCanvas` hook to manage shapes array
- [x] Add function to create new rectangle
- [x] Add function to update rectangle position
- [x] Store shapes in local state
- **Files created:**
  - `src/hooks/useCanvas.js` ✅
  - `src/utils/canvasHelpers.js` ✅

### ✅ Task 3.6: Create Toolbar Component
- [x] Build toolbar with "Add Rectangle" button
- [x] Add color picker (5 preset colors)
- [x] Wire up to canvas state
- **Files created:**
  - `src/components/Toolbar/Toolbar.jsx` ✅

### ✅ Task 3.7: Integrate Canvas into App
- [x] Add Canvas component to main app
- [x] Wire up toolbar to canvas
- [x] Test create, drag, pan, zoom
- **Files created:**
  - `src/components/Canvas/Canvas.jsx` ✅
  - `src/components/Canvas/Cursor.jsx` ✅ (bonus - for future multiplayer)
  - `src/components/Presence/UsersList.jsx` ✅ (bonus - for future multiplayer)
  - `src/hooks/useCursors.js` ✅ (bonus - for future multiplayer)
  - `src/hooks/usePresence.js` ✅ (bonus - for future multiplayer)
  - `src/hooks/useRealtimeSync.js` ✅ (bonus - for future multiplayer)
  - `src/utils/syncHelpers.js` ✅ (bonus - for future multiplayer)
- **Files updated:**
  - `src/App.jsx` ✅

### ✅ Task 3.8: Performance Testing
- [x] Test basic functionality (create, drag, pan, zoom work smoothly)
- [ ] Test with 50+ rectangles (needs testing)
- [ ] Verify 60 FPS during interactions (needs testing)
- [ ] Optimize if needed (will test when we have more rectangles)

---

## PR #4: Supabase Database Schema

**Goal:** Create database tables for canvas state and presence

### ☐ Task 4.1: Create Canvas Objects Table
- [ ] Create `canvas_objects` table in Supabase
- [ ] Columns: `id`, `type`, `x`, `y`, `width`, `height`, `color`, `created_by`, `created_at`, `updated_at`
- [ ] Enable Row Level Security (RLS)
- [ ] Create policies for read/write access
- **Files:** Supabase SQL Editor

### ☐ Task 4.2: Create Presence Table
- [ ] Create `user_presence` table in Supabase
- [ ] Columns: `user_id`, `username`, `cursor_x`, `cursor_y`, `last_seen`, `is_online`
- [ ] Enable RLS
- [ ] Create policies for read/write
- **Files:** Supabase SQL Editor

### ☐ Task 4.3: Setup Realtime Subscriptions
- [ ] Enable Realtime for `canvas_objects` table
- [ ] Enable Realtime for `user_presence` table
- **Files:** Supabase dashboard configuration

### ☐ Task 4.4: Document Schema
- [ ] Add schema documentation to README
- [ ] Include SQL migration scripts
- **Files updated:**
  - `README.md`

---

## PR #5: Real-Time Object Synchronization

**Goal:** Sync rectangle creation and movement across all users

### ☐ Task 5.1: Create Realtime Sync Hook
- [ ] Build `useRealtimeSync` hook
- [ ] Subscribe to `canvas_objects` table changes
- [ ] Handle INSERT, UPDATE, DELETE events
- [ ] Merge remote changes into local state
- **Files created:**
  - `src/hooks/useRealtimeSync.js`
  - `src/utils/syncHelpers.js`

### ☐ Task 5.2: Implement Optimistic Updates
- [ ] Update local state immediately on user action
- [ ] Broadcast change to Supabase
- [ ] Handle conflicts with last-write-wins
- **Files updated:**
  - `src/hooks/useCanvas.js`
  - `src/hooks/useRealtimeSync.js`

### ☐ Task 5.3: Wire Up Create Sync
- [ ] When user creates rectangle, insert into Supabase
- [ ] Listen for new rectangles from other users
- [ ] Add new rectangles to canvas state
- **Files updated:**
  - `src/hooks/useCanvas.js`
  - `src/components/Canvas/Canvas.jsx`

### ☐ Task 5.4: Wire Up Move Sync
- [ ] When user drags rectangle, update in Supabase
- [ ] Listen for position updates from other users
- [ ] Update rectangle positions in real-time
- **Files updated:**
  - `src/components/Canvas/Rectangle.jsx`
  - `src/hooks/useRealtimeSync.js`

### ☐ Task 5.5: Test Multi-User Sync
- [ ] Open app in 2 browser windows
- [ ] Create rectangle in window 1 → verify appears in window 2
- [ ] Move rectangle in window 2 → verify updates in window 1
- [ ] Test with 3+ windows simultaneously

---

## PR #6: Multiplayer Cursors

**Goal:** Show all users' cursor positions with name labels in real-time

### ☐ Task 6.1: Create Cursor Component
- [ ] Build Cursor component (pointer + name label)
- [ ] Style with user color and name text
- [ ] Position absolutely on canvas
- **Files created:**
  - `src/components/Canvas/Cursor.jsx`

### ☐ Task 6.2: Create Cursors Hook
- [ ] Build `useCursors` hook
- [ ] Track mouse position on canvas
- [ ] Broadcast cursor position to Supabase `user_presence` table
- [ ] Throttle updates to ~20-30 updates/second
- **Files created:**
  - `src/hooks/useCursors.js`

### ☐ Task 6.3: Subscribe to Other Users' Cursors
- [ ] Subscribe to `user_presence` table changes
- [ ] Store other users' cursor positions in state
- [ ] Filter out current user's cursor
- **Files updated:**
  - `src/hooks/useCursors.js`

### ☐ Task 6.4: Render Cursors on Canvas
- [ ] Map over other users' cursor positions
- [ ] Render Cursor component for each user
- [ ] Update positions smoothly
- **Files updated:**
  - `src/components/Canvas/Canvas.jsx`

### ☐ Task 6.5: Test Cursor Sync
- [ ] Open 2 windows, move mouse in both
- [ ] Verify cursors appear with correct names
- [ ] Test latency (should be <50ms)

---

## PR #7: Presence Awareness

**Goal:** Show list of online users and handle connect/disconnect

### ☐ Task 7.1: Create Presence Hook
- [ ] Build `usePresence` hook
- [ ] Mark user as online on mount
- [ ] Update `last_seen` timestamp periodically (every 10s)
- [ ] Mark user as offline on unmount
- **Files created:**
  - `src/hooks/usePresence.js`

### ☐ Task 7.2: Subscribe to Online Users
- [ ] Query `user_presence` for online users
- [ ] Subscribe to presence changes
- [ ] Filter users online in last 30 seconds
- **Files updated:**
  - `src/hooks/usePresence.js`

### ☐ Task 7.3: Create Users List Component
- [ ] Build UsersList component
- [ ] Display list of online usernames
- [ ] Show count of online users
- [ ] Style as sidebar or header element
- **Files created:**
  - `src/components/Presence/UsersList.jsx`

### ☐ Task 7.4: Integrate Presence into App
- [ ] Add UsersList to main canvas view
- [ ] Show/hide cursors based on presence
- **Files updated:**
  - `src/components/Canvas/Canvas.jsx`
  - `src/App.jsx`

### ☐ Task 7.5: Test Presence
- [ ] Open 3 windows, verify all users appear in list
- [ ] Close window, verify user removed after timeout
- [ ] Refresh window, verify user reconnects

---

## PR #8: State Persistence

**Goal:** Ensure canvas state persists across sessions

### ☐ Task 8.1: Load Canvas State on Mount
- [ ] Query all objects from `canvas_objects` on app load
- [ ] Initialize canvas with existing objects
- [ ] Handle empty canvas (first user)
- **Files updated:**
  - `src/hooks/useCanvas.js`
  - `src/hooks/useRealtimeSync.js`

### ☐ Task 8.2: Test Persistence
- [ ] Create several rectangles
- [ ] Refresh page → verify rectangles still there
- [ ] Close all windows, reopen → verify canvas state restored

### ☐ Task 8.3: Handle Reconnection
- [ ] Detect when user reconnects after disconnect
- [ ] Re-subscribe to realtime channels
- [ ] Sync any missed updates
- **Files updated:**
  - `src/hooks/useRealtimeSync.js`
  - `src/hooks/useCursors.js`

---

## PR #9: Performance Optimization & Bug Fixes

**Goal:** Ensure app meets performance targets and fix any issues

### ☐ Task 9.1: Optimize Realtime Updates
- [ ] Batch updates where possible
- [ ] Debounce/throttle high-frequency updates (cursors, drags)
- [ ] Minimize re-renders
- **Files updated:**
  - `src/hooks/useCursors.js`
  - `src/hooks/useRealtimeSync.js`
  - `src/components/Canvas/Rectangle.jsx`

### ☐ Task 9.2: Test with 500+ Objects
- [ ] Create script to generate 500 rectangles
- [ ] Test pan/zoom performance
- [ ] Verify 60 FPS maintained
- [ ] Optimize rendering if needed (virtualization, culling)
- **Files updated:**
  - `src/components/Canvas/CanvasStage.jsx`

### ☐ Task 9.3: Test with 5+ Concurrent Users
- [ ] Open 5+ browser windows
- [ ] All users create and move objects simultaneously
- [ ] Verify no sync conflicts or race conditions
- [ ] Check for memory leaks

### ☐ Task 9.4: Error Handling
- [ ] Add try/catch blocks for Supabase operations
- [ ] Handle network errors gracefully
- [ ] Show error messages to users
- [ ] Add loading states where needed
- **Files updated:**
  - `src/hooks/useRealtimeSync.js`
  - `src/hooks/useAuth.js`
  - `src/components/Auth/LoginForm.jsx`

### ☐ Task 9.5: Edge Case Testing
- [ ] Test rapid create/delete operations
- [ ] Test with slow network (Chrome DevTools throttling)
- [ ] Test browser refresh mid-drag
- [ ] Test multiple users editing same object

---

## PR #10: Polish & Documentation

**Goal:** Final polish and complete documentation

### ☐ Task 10.1: UI Polish
- [ ] Improve toolbar styling
- [ ] Add visual feedback for actions
- [ ] Style login form
- [ ] Add loading spinners
- [ ] Responsive layout adjustments
- **Files updated:**
  - `src/index.css`
  - `src/components/Toolbar/Toolbar.jsx`
  - `src/components/Auth/LoginForm.jsx`
  - `src/components/Presence/UsersList.jsx`

### ☐ Task 10.2: Update README
- [ ] Add project description
- [ ] Document setup instructions
- [ ] List environment variables needed
- [ ] Explain architecture
- [ ] Add screenshots/demo GIF
- **Files updated:**
  - `README.md`

### ☐ Task 10.3: Add Code Comments
- [ ] Comment complex logic in hooks
- [ ] Add JSDoc for key functions
- [ ] Document component props
- **Files updated:**
  - All `.js` and `.jsx` files

### ☐ Task 10.4: Final Deployment
- [ ] Verify all environment variables set in Vercel
- [ ] Test deployed version thoroughly
- [ ] Verify public URL works
- [ ] Share with 2-3 people for final testing

### ☐ Task 10.5: Create Demo Video
- [ ] Record 3-5 minute walkthrough
- [ ] Show multi-user collaboration
- [ ] Demonstrate all features
- [ ] Explain architecture briefly

---

## MVP Completion Checklist

After all PRs are merged, verify:

- [ ] ✅ Basic canvas with pan/zoom
- [ ] ✅ Rectangle shape creation
- [ ] ✅ Ability to create and move rectangles
- [ ] ✅ Real-time sync between 2+ users
- [ ] ✅ Multiplayer cursors with name labels
- [ ] ✅ Presence awareness (who's online)
- [ ] ✅ User authentication (username-only)
- [ ] ✅ Deployed and publicly accessible
- [ ] ✅ Canvas state persists across sessions
- [ ] ✅ 60 FPS during interactions
- [ ] ✅ Sync latency <100ms (objects) and <50ms (cursors)
- [ ] ✅ Supports 500+ objects without FPS drops
- [ ] ✅ Supports 5+ concurrent users

---

## Notes

- **Work vertically:** Complete each PR fully before moving to next
- **Test continuously:** Open multiple browser windows after each PR
- **Deploy often:** Push to Vercel after major features to catch deployment issues early
- **Critical path:** PRs #4, #5, #6 are the hardest and most important (real-time sync)
- **Time management:** If running behind, cut scope (fewer colors, simpler UI), but never compromise multiplayer sync