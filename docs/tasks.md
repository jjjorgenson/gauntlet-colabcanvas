# Task Manifest for Figma-like Collaborative Canvas

This manifest organizes all development tasks for building the collaborative canvas application. Tasks are grouped by domain and ordered by dependency.

---

## **PHASE 1: Project Setup & Configuration**

### 1.1 Environment Setup
- [ ] Create `.env.local` with Supabase keys (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Create `.env.example` template for environment variables
- [ ] Add `.env.local` to `.gitignore`
- [ ] Install core dependencies: `react`, `react-dom`, `vite`
- [ ] Install Konva: `konva`, `react-konva`
- [ ] Install Supabase: `@supabase/supabase-js`
- [ ] Configure Vite for environment variables
- [ ] Set up ESLint and Prettier configurations
- [ ] Create `jsconfig.json` for path aliases (`@/` -> `src/`)

### 1.2 Project Structure
- [ ] Create directory structure as outlined in PRD
- [ ] Create `src/components/` with subdirectories (auth, canvas, shapes, toolbar, sidebar, ai, layout)
- [ ] Create `src/hooks/` directory
- [ ] Create `src/context/` directory
- [ ] Create `src/utils/` directory
- [ ] Create `src/config/` directory
- [ ] Create placeholder `index.jsx` files in each component subdirectory

---

## **PHASE 2: Supabase Backend Configuration**

### 2.1 Database Tables
- [ ] Create `users` table with schema:
  - `id` (uuid, primary key, references auth.users)
  - `email` (string, unique, not null)
  - `display_name` (string)
  - `custom_colors` (jsonb, default [])
  - `theme` (string, default 'light')
  - `created_at`, `updated_at` (timestamps)
- [ ] Create `shapes` table with schema:
  - `id` (uuid, primary key)
  - `type` (string, not null)
  - `x`, `y`, `width`, `height`, `rotation` (numeric)
  - `color` (string, default '#000000')
  - `z_index` (integer, default 0)
  - `text_content` (text, nullable)
  - `font_size` (integer, default 16)
  - `owner_id` (uuid, foreign key to users, nullable)
  - `ownership_timestamp` (timestamp, nullable)
  - `created_by` (uuid, foreign key to users)
  - `created_at`, `updated_at` (timestamps)
- [ ] Create `presence` table with schema:
  - `user_id` (uuid, primary key, foreign key to users)
  - `cursor_x`, `cursor_y` (numeric, default 0)
  - `cursor_color` (string, default '#3b82f6')
  - `active` (boolean, default true)
  - `last_seen` (timestamp, default now())
  - `display_name` (string)

### 2.2 Database Indexes
- [ ] Add index on `shapes.owner_id`
- [ ] Add index on `shapes.z_index`
- [ ] Add index on `shapes.created_at`
- [ ] Add index on `presence.active`
- [ ] Add index on `presence.last_seen`

### 2.3 Row Level Security (RLS)
- [ ] Enable RLS on `users` table
  - Policy: Users can read own record
  - Policy: Users can update own record
- [ ] Enable RLS on `shapes` table
  - Policy: All authenticated users can read all shapes
  - Policy: Authenticated users can insert shapes
  - Policy: Users can update shapes they own or unowned shapes
  - Policy: Users can delete shapes they created
- [ ] Enable RLS on `presence` table
  - Policy: All authenticated users can read all presence records
  - Policy: Users can upsert their own presence record

### 2.4 Database Triggers
- [ ] Create trigger for `users.updated_at` on update
- [ ] Create trigger for `shapes.updated_at` on update
- [ ] Create trigger to auto-release shape ownership after 15 seconds:
  - Trigger function checks `ownership_timestamp`
  - Sets `owner_id` to NULL if > 15 seconds
  - Runs periodically via pg_cron or on shape access
- [ ] Create trigger to cleanup stale `presence` records:
  - Mark users inactive if `last_seen` > 30 seconds
  - Runs every 30 seconds

### 2.5 Realtime Configuration
- [ ] Enable Realtime for `shapes` table
- [ ] Enable Realtime for `presence` table
- [ ] Configure Realtime broadcast channels:
  - `shapes:updates`
  - `cursors:updates`
  - `presence:updates`

### 2.6 Authentication Setup
- [ ] Enable Email/Password authentication in Supabase dashboard
- [ ] Configure email templates (confirmation, password reset)
- [ ] Enable email confirmation requirement
- [ ] Add placeholder settings for Google OAuth (disabled, future)
- [ ] Add placeholder settings for Twitch OAuth (disabled, future)
- [ ] Set up redirect URLs for localhost and Vercel production

---

## **PHASE 3: Core Utilities & Configuration**

### 3.1 Supabase Client (`src/utils/supabaseClient.js`)
- [ ] Initialize Supabase client with env variables
- [ ] Export singleton instance
- [ ] Add error handling for missing env variables
- [ ] Add helper functions for auth state checking

### 3.2 Constants (`src/utils/constants.js`)
- [ ] Define default shape sizes (rectangle: 100x100, circle: 50 radius, text: 200x50)
- [ ] Define default colors array (5 colors)
- [ ] Define cursor interpolation delay (50ms)
- [ ] Define shape interpolation delay (150ms)
- [ ] Define ownership timeout (15000ms)
- [ ] Define grid size and color
- [ ] Define z-index increment/decrement value
- [ ] Define tool types enum: 'select', 'rectangle', 'circle', 'text'

### 3.3 Color Utils (`src/utils/colorUtils.js`)
- [ ] Function to validate hex color format
- [ ] Function to convert hex to RGB
- [ ] Function to convert RGB to hex
- [ ] Function to generate random color
- [ ] Function to get contrast color (for cursor labels)
- [ ] Function to parse and validate custom colors array

### 3.4 Canvas Utils (`src/utils/canvasUtils.js`)
- [ ] Function to convert screen coordinates to canvas coordinates (accounting for zoom/pan)
- [ ] Function to convert canvas coordinates to screen coordinates
- [ ] Function to calculate bounding box of selected shapes
- [ ] Function to check if point is within shape bounds
- [ ] Function to calculate grid snap position
- [ ] Function to constrain position within canvas bounds (optional)

### 3.5 Shape Factory (`src/utils/shapeFactory.js`)
- [ ] Function `createRectangle(x, y, userId)` - returns default rectangle object
- [ ] Function `createCircle(x, y, userId)` - returns default circle object
- [ ] Function `createText(x, y, userId)` - returns default text object
- [ ] Function to generate unique shape ID (or use Supabase UUID)
- [ ] Function to validate shape data before saving

### 3.6 Interpolation Manager (`src/utils/InterpolationManager.js`)
- [ ] Create singleton class `InterpolationManager`
- [ ] Property `targets` - Map of entity ID to interpolation state
- [ ] Property `isRunning` - boolean flag
- [ ] Property `animationFrameId` - for requestAnimationFrame
- [ ] Method `addTarget(id, type, currentPos, targetPos, duration, easing)`
  - Store target with start time, current, target, duration
  - Type: 'cursor' or 'shape'
- [ ] Method `removeTarget(id)` - remove from targets Map
- [ ] Method `getPosition(id)` - return current interpolated position
- [ ] Method `start()` - begin animation loop with requestAnimationFrame
- [ ] Method `stop()` - cancel animation frame
- [ ] Method `tick(timestamp)` - update all targets, calculate eased positions
  - Use ease-out cubic easing function
  - Remove targets that reached their destination
- [ ] Method `clear()` - clear all targets
- [ ] Export singleton instance

### 3.7 Ownership Manager (`src/utils/ownershipManager.js`)
- [ ] Create `ownershipManager` object
- [ ] Property `timers` - Map of shapeId to timeout ID
- [ ] Method `acquire(shapeId, userId, callback)` - set ownership, start inactivity timer
- [ ] Method `release(shapeId, callback)` - clear ownership, clear timer
- [ ] Method `isOwner(shapeId, userId)` - check if user owns shape
- [ ] Method `resetInactivityTimer(shapeId, userId, callback)` - reset 15s timer on interaction
- [ ] Method `clearTimer(shapeId)` - clear timeout for shape
- [ ] Method `clearAllTimers()` - cleanup on unmount
- [ ] Emit event or callback when ownership times out

---

## **PHASE 4: Context Providers**

### 4.1 Auth Context (`src/context/AuthContext.jsx`)
- [ ] Create `AuthContext` with createContext
- [ ] Create `AuthProvider` component
  - State: `user` (current user object or null)
  - State: `session` (Supabase session)
  - State: `loading` (boolean)
- [ ] Method `signUp(email, password, displayName)` - call Supabase auth.signUp, create user record
- [ ] Method `signIn(email, password)` - call Supabase auth.signInWithPassword
- [ ] Method `signOut()` - call Supabase auth.signOut
- [ ] Method `updateProfile(displayName, customColors)` - update user record
- [ ] useEffect to listen to Supabase auth state changes (onAuthStateChange)
- [ ] Export `useAuth` custom hook to access context

### 4.2 Canvas Context (`src/context/CanvasContext.jsx`)
- [ ] Create `CanvasContext` with createContext
- [ ] Create `CanvasProvider` component
  - State: `activeTool` ('select' | 'rectangle' | 'circle' | 'text')
  - State: `selectedShapeId` (uuid or null)
  - State: `viewport` ({ x, y, scale })
  - State: `gridVisible` (boolean)
- [ ] Method `setActiveTool(tool)` - update active tool
- [ ] Method `selectShape(shapeId)` - update selected shape
- [ ] Method `deselectShape()` - clear selection
- [ ] Method `setViewport(x, y, scale)` - update viewport
- [ ] Method `toggleGrid()` - toggle grid visibility
- [ ] Export `useCanvas` custom hook

### 4.3 Shapes Context (`src/context/ShapesContext.jsx`)
- [ ] Create `ShapesContext` with createContext
- [ ] Create `ShapesProvider` component
  - State: `shapes` (Map of shapeId to shape object)
  - State: `localUpdates` (Map of shapeId to pending update)
- [ ] Method `addShape(shape)` - add to local Map, optimistic update
- [ ] Method `updateShape(shapeId, updates)` - update in Map, track in localUpdates
- [ ] Method `deleteShape(shapeId)` - remove from Map
- [ ] Method `setShapes(shapesArray)` - replace entire Map (on initial load)
- [ ] Method `applyRemoteUpdate(shape)` - merge remote update, resolve conflicts
- [ ] Export `useShapes` custom hook

### 4.4 Presence Context (`src/context/PresenceContext.jsx`)
- [ ] Create `PresenceContext` with createContext
- [ ] Create `PresenceProvider` component
  - State: `activeUsers` (Map of userId to user object)
  - State: `remoteCursors` (Map of userId to cursor position)
- [ ] Method `addUser(user)` - add to activeUsers Map
- [ ] Method `removeUser(userId)` - remove from Maps
- [ ] Method `updateCursor(userId, x, y)` - update cursor position
- [ ] Method `getActiveUsers()` - return array of active users
- [ ] Export `usePresence` custom hook

---

## **PHASE 5: Custom Hooks**

### 5.1 Supabase Hook (`src/hooks/useSupabase.js`)
- [ ] Import supabaseClient
- [ ] Return client instance for use in components
- [ ] Optionally add helper methods (getClient, isConnected)

### 5.2 Auth Hook (`src/hooks/useAuth.js`)
- [ ] Re-export AuthContext hook (or implement here if not using context)
- [ ] Access `user`, `session`, `loading` from AuthContext
- [ ] Access `signUp`, `signIn`, `signOut`, `updateProfile` methods

### 5.3 Shapes CRUD Hook (`src/hooks/useShapes.js`)
- [ ] Import ShapesContext
- [ ] Function `createShape(type, x, y)`:
  - Generate shape object with shapeFactory
  - Add to local shapes (optimistic)
  - Insert into Supabase `shapes` table
  - Handle errors, rollback optimistic update if failed
- [ ] Function `updateShapePosition(shapeId, x, y)`:
  - Update local shape immediately
  - Debounce Supabase update (200ms)
  - Check ownership before updating
- [ ] Function `updateShapeSize(shapeId, width, height)`:
  - Update local shape immediately
  - Debounce Supabase update (200ms)
  - Check ownership before updating
- [ ] Function `updateShapeRotation(shapeId, rotation)`:
  - Update local shape immediately
  - Debounce Supabase update (200ms)
  - Check ownership before updating
- [ ] Function `updateShapeColor(shapeId, color)`:
  - Update local shape immediately
  - Update Supabase immediately (no debounce for color)
  - Check ownership before updating
- [ ] Function `updateShapeZIndex(shapeId, direction)`:
  - Calculate new z-index (increment/decrement)
  - Update local shape immediately
  - Update Supabase immediately
  - Check ownership before updating
- [ ] Function `deleteShape(shapeId)`:
  - Remove from local shapes
  - Delete from Supabase
  - Check if user created the shape before deleting
- [ ] Function `loadShapes()`:
  - Fetch all shapes from Supabase on mount
  - Populate ShapesContext
- [ ] Return object with all CRUD functions

### 5.4 Shape Subscription Hook (`src/hooks/useShapeSubscription.js`)
- [ ] Accept `userId` as parameter
- [ ] useEffect to subscribe to `shapes:updates` channel
- [ ] On 'INSERT' event:
  - If event.userId !== current user, add shape to local state
  - Add to InterpolationManager with 150ms delay
- [ ] On 'UPDATE' event:
  - If event.userId !== current user, update shape
  - If shape is moving, add to InterpolationManager
  - If shape color/z-index changed, update immediately
- [ ] On 'DELETE' event:
  - Remove shape from local state
  - Remove from InterpolationManager
- [ ] Cleanup: unsubscribe on unmount
- [ ] Handle reconnection logic

### 5.5 Cursor Tracking Hook (`src/hooks/useCursorTracking.js`)
- [ ] State: `localCursor` ({ x, y })
- [ ] useEffect to listen to Stage mousemove events
- [ ] Throttle cursor updates to 50ms
- [ ] On mousemove:
  - Update local cursor state
  - Broadcast to Supabase `cursors:updates` channel
  - Update presence table with new cursor position
- [ ] Return `localCursor` state

### 5.6 Cursor Subscription Hook (`src/hooks/useCursorSubscription.js`)
- [ ] Accept `userId` as parameter
- [ ] useEffect to subscribe to `cursors:updates` channel
- [ ] On cursor update event:
  - If event.userId !== current user
  - Add cursor target to InterpolationManager (50ms delay)
  - Update PresenceContext with cursor data
- [ ] Cleanup: unsubscribe on unmount
- [ ] Return `remoteCursors` from PresenceContext

### 5.7 Presence Hook (`src/hooks/usePresence.js`)
- [ ] Access PresenceContext
- [ ] useEffect to subscribe to `presence:updates` channel
- [ ] On 'join' event:
  - Add user to activeUsers
  - Assign cursor color
  - Show notification (optional)
- [ ] On 'leave' event:
  - Remove user from activeUsers
  - Remove cursor from remoteCursors
  - Show notification (optional)
- [ ] On mount, insert current user into presence table
- [ ] Set up heartbeat interval (every 10s) to update `last_seen`
- [ ] On unmount, mark user inactive or delete presence record
- [ ] Return `activeUsers`, `remoteCursors`

### 5.8 Ownership Hook (`src/hooks/useOwnership.js`)
- [ ] Import ownershipManager
- [ ] Function `acquireOwnership(shapeId)`:
  - Call ownershipManager.acquire
  - Update shape in Supabase with owner_id and ownership_timestamp
  - Broadcast ownership change via shapes:updates channel
- [ ] Function `releaseOwnership(shapeId)`:
  - Call ownershipManager.release
  - Update shape in Supabase (set owner_id to null)
  - Broadcast ownership change
- [ ] Function `checkOwnership(shapeId)`:
  - Return boolean if current user owns shape
- [ ] Function `handleShapeInteraction(shapeId)`:
  - If shape unowned, acquire ownership
  - If owned by current user, reset inactivity timer
  - If owned by another user, return false (block interaction)
- [ ] Return object with ownership functions

### 5.9 Color Persistence Hook (`src/hooks/useColorPersistence.js`)
- [ ] State: `customColors` (array of 3 hex colors)
- [ ] useEffect to load custom colors from user record on mount
- [ ] Function `saveCustomColor(color)`:
  - Add to customColors array (max 3, FIFO)
  - Update user record in Supabase
  - Update local state
- [ ] Return `customColors`, `saveCustomColor`

### 5.10 Canvas Interaction Hook (`src/hooks/useCanvasInteraction.js`)
- [ ] Access CanvasContext
- [ ] Access ShapesContext
- [ ] Access useOwnership hook
- [ ] Function `handleStageClick(e)`:
  - Get click position
  - If activeTool !== 'select':
    - Create new shape at click position
    - Call createShape from useShapes
  - If activeTool === 'select':
    - Check if clicked on shape
    - If yes, select shape and acquire ownership
    - If no, deselect current shape and release ownership
- [ ] Function `handleShapeDragStart(shapeId)`:
  - Check ownership
  - If not owned, acquire ownership
  - Set isDragging flag
- [ ] Function `handleShapeDragMove(shapeId, x, y)`:
  - Update shape position locally
  - Reset inactivity timer
- [ ] Function `handleShapeDragEnd(shapeId)`:
  - Call updateShapePosition (triggers debounced Supabase update)
  - Clear isDragging flag
- [ ] Function `handleShapeTransform(shapeId, width, height, rotation)`:
  - Update shape size/rotation locally
  - Reset inactivity timer
- [ ] Function `handleShapeTransformEnd(shapeId)`:
  - Call updateShapeSize/updateShapeRotation (triggers Supabase update)
- [ ] Return event handler functions

---

## **PHASE 6: UI Components**

### 6.1 Auth Components

#### `src/components/auth/LoginForm.jsx`
- [ ] Create form with email and password inputs
- [ ] Submit button calls `signIn` from useAuth
- [ ] Display error messages for failed login
- [ ] Link to SignupForm
- [ ] Loading state during authentication
- [ ] Form validation (email format, password min length)

#### `src/components/auth/SignupForm.jsx`
- [ ] Create form with email, password, confirm password, display name inputs
- [ ] Submit button calls `signUp` from useAuth
- [ ] Password strength indicator
- [ ] Display error messages
- [ ] Link back to LoginForm
- [ ] Email format validation
- [ ] Password match validation

#### `src/components/auth/AuthProvider.jsx`
- [ ] Wrapper component that checks auth state
- [ ] If not authenticated, render LoginForm or SignupForm
- [ ] If authenticated, render children (main app)
- [ ] Handle loading state (show spinner)

---

### 6.2 Layout Components

#### `src/components/layout/Header.jsx`
- [ ] Display app logo/title
- [ ] Show current user's display name
- [ ] Sign out button
- [ ] Optional: theme toggle button
- [ ] Styling: fixed header, background color, padding

#### `src/components/layout/AppLayout.jsx`
- [ ] Main container with Header, Canvas, Toolbar, Sidebar
- [ ] Flexbox or grid layout
- [ ] Handle responsive design (optional)
- [ ] Pass necessary props to child components

---

### 6.3 Canvas Components

#### `src/components/canvas/Canvas.jsx`
- [ ] Import Stage, Layer from react-konva
- [ ] Render Konva Stage with full viewport dimensions
- [ ] State for stage position (pan) and scale (zoom)
- [ ] Implement pan on drag (when activeTool is 'select' and no shape selected)
- [ ] Implement zoom on mouse wheel
- [ ] Render Grid component
- [ ] Render ShapeRenderer component
- [ ] Render RemoteCursors component
- [ ] Handle stage click event (call handleStageClick from useCanvasInteraction)
- [ ] Update viewport in CanvasContext on pan/zoom
- [ ] Set up ref to Stage for coordinate conversions

#### `src/components/canvas/Grid.jsx`
- [ ] Accept props: `width`, `height`, `gridSize`, `visible`
- [ ] Use Konva Line to draw grid lines
- [ ] Optimize rendering (only visible grid lines)
- [ ] Use React.memo for performance
- [ ] Conditionally render based on `visible` prop

#### `src/components/canvas/ShapeRenderer.jsx`
- [ ] Access shapes from ShapesContext
- [ ] Map over shapes array
- [ ] For each shape, render appropriate component:
  - If type === 'rectangle', render Rectangle
  - If type === 'circle', render Circle
  - If type === 'text', render TextBox
- [ ] Pass shape data, event handlers to shape components
- [ ] Sort shapes by z-index before rendering
- [ ] Use React.memo and key prop for performance

#### `src/components/canvas/RemoteCursor.jsx`
- [ ] Accept props: `userId`, `displayName`, `color`, `position`
- [ ] Use InterpolationManager to get smooth cursor position
- [ ] Render cursor as Konva Group with:
  - Arrow or circle shape
  - Label with user's display name
- [ ] Style cursor with user's color
- [ ] Use React.memo for performance
- [ ] Update position via requestAnimationFrame or subscription

#### `src/components/canvas/RemoteCursors.jsx`
- [ ] Access remoteCursors from PresenceContext
- [ ] Map over remoteCursors and render RemoteCursor for each
- [ ] Filter out current user's cursor
- [ ] Use React.memo

---

### 6.4 Shape Components

#### `src/components/shapes/Rectangle.jsx`
- [ ] Import Rect, Transformer from react-konva
- [ ] Accept props: `shape`, `isSelected`, `onSelect`, `onChange`, `onTransformEnd`
- [ ] Render Konva Rect with shape properties (x, y, width, height, fill, rotation)
- [ ] Handle click event to select shape
- [ ] Handle drag event to move shape
- [ ] Handle transform event to resize/rotate
- [ ] If isSelected, attach Transformer
- [ ] Check ownership before allowing interactions
- [ ] Visual indicator if shape is owned by another user (e.g., lock icon, opacity)
- [ ] Use React.memo

#### `src/components/shapes/Circle.jsx`
- [ ] Import Circle, Transformer from react-konva
- [ ] Similar structure to Rectangle
- [ ] Render Konva Circle with radius calculated from width/height
- [ ] Handle click, drag, transform events
- [ ] Attach Transformer if selected
- [ ] Check ownership
- [ ] Use React.memo

#### `src/components/shapes/TextBox.jsx`
- [ ] Import Text, Transformer from react-konva
- [ ] Accept props: `shape`, `isSelected`, `onSelect`, `onChange`, `onTransformEnd`
- [ ] Render Konva Text with text content, font size
- [ ] Handle double-click to enter edit mode:
  - Create HTML textarea overlay
  - Position textarea over Konva text
  - On blur or Enter, save text and remove textarea
- [ ] Handle drag and transform events
- [ ] Attach Transformer if selected
- [ ] Check ownership
- [ ] Use React.memo

#### `src/components/shapes/ShapeTransformer.jsx`
- [ ] Import Transformer from react-konva
- [ ] Accept props: `shapeRef`, `isSelected`
- [ ] Render Konva Transformer attached to shape node
- [ ] Enable resize, rotate handles
- [ ] Constrain proportions (optional)
- [ ] Hide transformer if not selected
- [ ] Use useEffect to attach/detach transformer to shape node
- [ ] Use React.memo

---

### 6.5 Toolbar Components

#### `src/components/toolbar/Toolbar.jsx`
- [ ] Container for all toolbar buttons
- [ ] Render ToolButton for each tool (select, rectangle, circle, text)
- [ ] Render ColorPicker
- [ ] Render ZIndexControls
- [ ] Highlight active tool
- [ ] Vertical or horizontal layout
- [ ] Styling: fixed position, background, padding

#### `src/components/toolbar/ToolButton.jsx`
- [ ] Accept props: `tool`, `icon`, `label`, `isActive`, `onClick`
- [ ] Render button with icon/label
- [ ] Apply active styling if isActive
- [ ] Call onClick with tool type
- [ ] Use React.memo

#### `src/components/toolbar/ColorPicker.jsx`
- [ ] Display 5 default colors as clickable swatches
- [ ] Display "Custom" button (6th option)
- [ ] On default color click, update selected shape color
- [ ] On custom click, open CustomColorPicker modal/popover
- [ ] Display user's 3 saved custom colors (from useColorPersistence)
- [ ] Indicate currently selected color
- [ ] Disable if no shape selected

#### `src/components/toolbar/CustomColorPicker.jsx`
- [ ] Render gradient color picker (HTML5 color input or library)
- [ ] Render eyedropper button (if browser supports EyeDropper API)
- [ ] On color select, call saveCustomColor from useColorPersistence
- [ ] Apply selected color to active shape
- [ ] Close modal on color selection
- [ ] Provide hex input field for manual entry

#### `src/components/toolbar/ZIndexControls.jsx`
- [ ] Render "Bring Forward" button
- [ ] Render "Send Backward" button
- [ ] On click, call updateShapeZIndex from useShapes
- [ ] Disable buttons if no shape selected
- [ ] Show current z-index (optional)

---

### 6.6 Sidebar Components

#### `src/components/sidebar/PresenceSidebar.jsx`
- [ ] Access activeUsers from usePresence
- [ ] Render collapsible sidebar (default open)
- [ ] Header with "Active Users" title and collapse button
- [ ] Map over activeUsers and render UserItem for each
- [ ] Show user count
- [ ] Animate collapse/expand
- [ ] Styling: fixed position (right side), background, padding, scrollable

#### `src/components/sidebar/UserItem.jsx`
- [ ] Accept props: `user` (userId, displayName, color)
- [ ] Render user's display name
- [ ] Render color-coded circle/icon matching cursor color
- [ ] Indicate current user (e.g., "You")
- [ ] Use React.memo

---

### 6.7 AI Components

#### `src/components/ai/AICommandInput.jsx`
- [ ] Render text input field with placeholder "Type AI command..."
- [ ] On submit, log command (future: send to AI service)
- [ ] Display "Coming Soon" message or disabled state
- [ ] Position fixed (e.g., bottom center)
- [ ] Styling: input bar, send button

---

## **PHASE 7: Main App Component**

### 7.1 `src/App.jsx`
- [ ] Import all context providers
- [ ] Import AuthProvider
- [ ] Import AppLayout
- [ ] Wrap app with context providers:
  - AuthProvider (outermost)
  - CanvasProvider
  - ShapesProvider
  - PresenceProvider
- [ ] Inside AuthProvider, render AppLayout (only if authenticated)
- [ ] Initialize InterpolationManager on app mount
- [ ] Start InterpolationManager animation loop
- [ ] Cleanup InterpolationManager on unmount
- [ ] Add global error boundary (optional)

---

## **PHASE 8: Performance Optimization**

### 8.1 Konva Optimization
- [ ] Use `React.memo` on all shape components
- [ ] Implement `shouldComponentUpdate` logic for Konva nodes (via memo)
- [ ] Use `listening={false}` on non-interactive shapes (remote shapes not owned)
- [ ] Batch Konva layer draws (layer.batchDraw() instead of layer.draw())
- [ ] Use `perfectDrawEnabled={false}` on Stage for better performance
- [ ] Implement virtualization for shapes (only render visible shapes in viewport)
- [ ] Cache Konva nodes where applicable (cache() method)

### 8.2 React Optimization
- [ ] Use `React.memo` on RemoteCursor, UserItem, ToolButton components
- [ ] Use `useMemo` for expensive calculations (shape sorting by z-index)
- [ ] Use `useCallback` for event handlers passed to child components
- [ ] Avoid unnecessary re-renders by splitting context into smaller pieces
- [ ] Use React DevTools Profiler to identify bottlenecks

### 8.3 Supabase Optimization
- [ ] Batch shape updates when possible (multiple shape moves in one transaction)
- [ ] Use debouncing for position updates (200ms)
- [ ] Use throttling for cursor updates (50ms)
- [ ] Implement optimistic UI updates (update local state before Supabase)
- [ ] Handle Supabase errors gracefully, rollback optimistic updates if needed
- [ ] Use Supabase connection pooling (automatic)
- [ ] Index frequently queried columns (already done in Phase 2)

### 8.4 Interpolation Optimization
- [ ] Ensure InterpolationManager uses requestAnimationFrame efficiently
- [ ] Remove targets from InterpolationManager when reached destination
- [ ] Batch Konva updates in tick() method (update multiple shapes, then draw once)
- [ ] Profile interpolation performance, adjust delays if needed
- [ ] Consider using Web Workers for complex interpolation calculations (future)

### 8.5 Network Optimization
- [ ] Compress Realtime payloads (Supabase handles this)
- [ ] Implement reconnection logic for lost connections
- [ ] Queue updates during offline periods, sync when reconnected
- [ ] Use Supabase's built-in presence tracking efficiently

---

## **PHASE 9: Testing & Debugging**

### 9.1 Unit Tests (Optional but Recommended)
- [ ] Test utility functions (colorUtils, canvasUtils, shapeFactory)
- [ ] Test InterpolationManager methods
- [ ] Test ownershipManager methods
- [ ] Test custom hooks in isolation (with mock Supabase)

### 9.2 Integration Tests
- [ ] Test auth flow (signup, login, logout)
- [ ] Test shape creation and manipulation
- [ ] Test ownership acquisition and timeout
- [ ] Test real-time synchronization (two users in same canvas)
- [ ] Test cursor tracking and interpolation
- [ ] Test color persistence

### 9.3 Manual Testing Checklist
- [ ] Create account and log in
- [ ] Create rectangle, circle, text shapes
- [ ] Drag and resize shapes
- [ ] Rotate shapes
- [ ] Change shape colors (default and custom)
- [ ] Bring forward / send backward
- [ ] Test ownership timeout (15 seconds)
- [ ] Test multi-user collaboration (open two browser windows)
- [ ] Test cursor synchronization across users
- [ ] Test shape synchronization across users
- [ ] Test presence sidebar (users joining/leaving)
- [ ] Test ownership blocking (user B cannot edit shape owned by user A)
- [ ] Test pan and zoom canvas
- [ ] Test grid visibility toggle
- [ ] Test custom color picker and persistence
- [ ] Test logout and login with same account (colors persist)

### 9.4 Performance Testing
- [ ] Test with 100+ shapes on canvas
- [ ] Test with 10+ concurrent users
- [ ] Measure frame rate during heavy interaction
- [ ] Profile InterpolationManager performance
- [ ] Monitor Supabase realtime latency
- [ ] Test on slower network connections
- [ ] Test on mobile devices (optional)

### 9.5 Debugging Tasks
- [ ] Set up logging for Supabase errors
- [ ] Add console logs for ownership changes (development only)
- [ ] Add console logs for realtime events (development only)
- [ ] Implement error boundary to catch React errors
- [ ] Add Sentry or similar error tracking (optional)
- [ ] Debug stuttering or jitter issues (adjust interpolation delays)
- [ ] Debug ownership race conditions (two users clicking shape simultaneously)

---

## **PHASE 10: Vercel Deployment**

### 10.1 Vercel Configuration
- [ ] Create `vercel.json` with build settings (if needed)
- [ ] Configure environment variables in Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Set up production, preview, and development environments
- [ ] Configure domain (optional)
- [ ] Set up SSL certificate (automatic with Vercel)

### 10.2 Build Optimization
- [ ] Ensure Vite build is optimized (minification, tree-shaking)
- [ ] Configure asset optimization in Vite config
- [ ] Set up code splitting for large components
- [ ] Configure caching headers in `vercel.json`
- [ ] Test production build locally (`npm run build && npm run preview`)

### 10.3 Deployment Tasks
- [ ] Push code to GitHub repository
- [ ] Connect repository to Vercel
- [ ] Configure build command: `npm run build`
- [ ] Configure output directory: `dist`
- [ ] Trigger initial deployment
- [ ] Test deployed application
- [ ] Set up automatic deployments on push to main branch
- [ ] Configure preview deployments for pull requests

### 10.4 Post-Deployment
- [ ] Update Supabase redirect URLs to include Vercel production URL
- [ ] Test authentication flow in production
- [ ] Test real-time features in production
- [ ] Monitor error logs in Vercel dashboard
- [ ] Set up Vercel Analytics (optional)
- [ ] Configure custom domain DNS (optional)

---

## **PHASE 11: Documentation & Polish**

### 11.1 Code Documentation
- [ ] Add JSDoc comments to utility functions
- [ ] Add comments to complex logic (InterpolationManager, ownershipManager)
- [ ] Document component props with PropTypes or comments
- [ ] Create README.md with setup instructions
- [ ] Document environment variables in README
- [ ] Document Supabase table setup instructions

### 11.2 User Documentation
- [ ] Create user guide (how to use tools, colors, collaboration)
- [ ] Add tooltips to toolbar buttons
- [ ] Add loading states and empty states
- [ ] Add error messages for common issues
- [ ] Create onboarding flow (optional)

### 11.3 Visual Polish
- [ ] Design consistent color scheme
- [ ] Add smooth transitions and animations
- [ ] Improve button hover states
- [ ] Add icons to toolbar buttons (use icon library or SVG)
- [ ] Improve spacing and alignment
- [ ] Add subtle shadows and borders
- [ ] Test UI on different screen sizes

### 11.4 Accessibility
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works (tab through buttons)
- [ ] Add focus indicators
- [ ] Test with screen reader (optional)
- [ ] Ensure sufficient color contrast

---

## **PHASE 12: Future Enhancements (Post-MVP)**

### 12.1 Additional Features
- [ ] Implement undo/redo functionality
- [ ] Add shape grouping
- [ ] Add copy/paste shapes
- [ ] Add more shape types (line, arrow, polygon, star)
- [ ] Add image upload and placement
- [ ] Add layer panel for z-index management
- [ ] Add shape locking (prevent accidental edits)
- [ ] Add comments/annotations on shapes
- [ ] Add export canvas as PNG/SVG
- [ ] Add canvas templates

### 12.2 AI Agent Integration
- [ ] Set up AI service (OpenAI API, Claude API, etc.)
- [ ] Implement natural language command parsing
- [ ] Create shape generation from text descriptions
- [ ] Add layout suggestions
- [ ] Add auto-alignment and distribution
- [ ] Add smart shape recommendations

### 12.3 Social Features
- [ ] Add multiplayer sessions/rooms
- [ ] Add canvas sharing links
- [ ] Add permissions (view-only, edit access)
- [ ] Add canvas versioning/history
- [ ] Add activity feed (who did what)

### 12.4 Performance Improvements
- [ ] Implement Web Workers for heavy calculations
- [ ] Add service worker for offline support
- [ ] Implement lazy loading for large canvases
- [ ] Optimize bundle size (code splitting)
- [ ] Add server-side rendering (SSR) if needed

---

## **Task Prioritization Summary**

### Critical Path (Must Complete for MVP):
1. **Phase 1**: Project setup
2. **Phase 2**: Supabase backend (tables, RLS, Realtime)
3. **Phase 3**: Core utilities (especially InterpolationManager, ownershipManager)
4. **Phase 4**: Context providers (Auth, Canvas, Shapes, Presence)
5. **Phase 5**: Custom hooks (Auth, Shapes, Subscriptions, Ownership)
6. **Phase 6**: UI components (Canvas, Shapes, Toolbar, Sidebar)
7. **Phase 7**: Main App component
8. **Phase 10**: Vercel deployment

### Important but Not Blocking:
- **Phase 8**: Performance optimization (iterate after MVP)
- **Phase 9**: Testing (ongoing throughout development)
- **Phase 11**: Documentation & polish (iterate after MVP)

### Future Work:
- **Phase 12**: All future enhancements

---

## **Estimated Task Counts by Module**

### Backend (Supabase): ~25 tasks
- Database tables, indexes, RLS policies, triggers, Realtime config

### Frontend Core (Utils, Hooks, Context): ~45 tasks
- Utilities, custom hooks, context providers

### Frontend UI (Components): ~40 tasks
- Auth, layout, canvas, shapes, toolbar, sidebar, AI components

### Performance & Testing: ~25 tasks
- Optimization, unit tests, integration tests, manual testing

### Deployment & Documentation: ~15 tasks
- Vercel deployment, documentation, polish

### **Total: ~150 tasks**

---

## **Development Tips**

1. **Start with Authentication**: Get login/signup working first before anything else
2. **Test Supabase Connection Early**: Verify database queries and Realtime subscriptions work
3. **Build Canvas Incrementally**: Start with static shapes, then add interaction, then real-time
4. **Test with Two Browser Windows**: Crucial for validating real-time collaboration
5. **Monitor Interpolation Performance**: Use browser DevTools Performance tab to profile
6. **Handle Edge Cases**: Multiple users clicking same shape, network disconnections, ownership timeouts
7. **Use Browser Console**: Temporarily log events for debugging real-time sync issues
8. **Start with Simple Shapes**: Rectangle only, then add circle and text
9. **Defer AI Agent**: Focus on core collaboration features first, AI can be added later
10. **Iterate on UX**: Get MVP working, then polish animations and interactions

---

## **Key Development Milestones**

### Milestone 1: Authentication Working
- User can sign up, log in, log out
- User profile persists

### Milestone 2: Basic Canvas
- User can create rectangles on canvas
- Shapes persist in Supabase
- Shapes can be dragged and resized

### Milestone 3: Real-Time Shapes
- Two users see each other's shapes
- Shape updates sync across users
- Basic ownership implemented

### Milestone 4: Cursors & Presence
- Remote cursors visible
- Presence sidebar shows active users
- Cursors move smoothly (interpolation working)

### Milestone 5: Full Feature Set
- All shape types working
- Color picker with custom colors
- Z-index controls
- Ownership timeout implemented
- Smooth interpolation for all updates

### Milestone 6: Production Ready
- Deployed to Vercel
- Performance optimized
- Tested with multiple users
- Documentation complete

---

## **Common Pitfalls to Avoid**

1. **Over-updating Konva**: Only redraw affected layers/shapes, not entire canvas
2. **Realtime Event Loops**: Don't broadcast updates back to the user who triggered them
3. **Ownership Race Conditions**: Use timestamps and server-side validation
4. **Memory Leaks**: Clean up timers, subscriptions, InterpolationManager targets
5. **Interpolation Delays**: Too short = jittery, too long = laggy (tune to ~50-150ms)
6. **Unbounded Database Growth**: Consider shape limits or cleanup old canvases
7. **Missing Error Handling**: Always handle Supabase errors, network failures
8. **Forgetting to Unsubscribe**: Always clean up Realtime subscriptions in useEffect
9. **Optimistic Updates Without Rollback**: If Supabase fails, revert local state
10. **Not Testing Multi-User**: Many bugs only appear with concurrent users

---

## **Success Criteria**

✅ **MVP Complete When:**
- Users can sign up, log in, and create shapes
- Multiple users can collaborate in real-time
- Shapes sync smoothly across users without jitter
- Ownership system prevents conflicts
- Custom colors persist across sessions
- App deployed and accessible on Vercel

✅ **Production Ready When:**
- All MVP features work reliably
- Performance is smooth (60fps interactions)
- No critical bugs in testing
- Documentation complete
- Error handling in place
- Deployed with proper environment configuration

---

# End of Task Manifest

**Total Tasks: ~150**
**Estimated Development Time: 3-4 weeks (1 developer, full-time)**
**MVP Timeline: 2 weeks with aggressive prioritization**

Use this manifest with Cursor to plan development sprints. Check off tasks as completed and adjust based on findings during implementation.