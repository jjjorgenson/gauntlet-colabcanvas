# Product Requirements Document (PRD)
## Figma-like Collaborative Canvas Web App

### Executive Summary
A real-time collaborative canvas application where multiple users can create, manipulate, and interact with shapes simultaneously. Built with React/Konva for rich canvas interactions, Supabase for backend infrastructure, and optimized for smooth real-time collaboration with intelligent interpolation and ownership management.

---

## User Stories

### Authentication
- **US-1**: As a user, I can sign up with email/password so I can access the canvas
- **US-2**: As a user, I can log in with email/password so I can resume my work
- **US-3**: As a user, I see placeholders for future social login options (Google, Twitch)
- **US-4**: As a user, my custom color preferences persist across sessions

### Canvas Interaction
- **US-5**: As a user, I can see an infinite scrollable grid canvas
- **US-6**: As a user, I can select tools (rectangle, circle, text) from a toolbar
- **US-7**: As a user, I can click to create a shape at default size
- **US-8**: As a user, I can drag handles to resize shapes
- **US-9**: As a user, I can rotate shapes using rotation handles
- **US-10**: As a user, I can drag shapes to reposition them
- **US-11**: As a user, I can change shape colors using a color picker
- **US-12**: As a user, I can change shape z-index (bring forward/send back)

### Color Management
- **US-13**: As a user, I see 5 default colors in the color picker
- **US-14**: As a user, I can click a 6th "custom" option to open gradient picker/eyedropper
- **US-15**: As a user, my last 3 custom colors are saved and available in future sessions
- **US-16**: As a user, I can pick colors from a gradient spectrum
- **US-17**: As a user, I can use an eyedropper to sample colors from the canvas

### Real-Time Collaboration
- **US-18**: As a user, I see other users' cursors with their names
- **US-19**: As a user, I see smooth cursor movements from remote users (no jitter)
- **US-20**: As a user, I see shapes being created by other users in real-time
- **US-21**: As a user, I see shapes being moved/transformed by other users smoothly
- **US-22**: As a user, I gain ownership when I click on an unowned shape
- **US-23**: As a user, I lose ownership when I click off a shape or after 15s of inactivity
- **US-24**: As a user, I cannot modify shapes owned by other users
- **US-25**: As a user, I see visual indicators of who owns which shape

### Presence Management
- **US-26**: As a user, I see a collapsible sidebar showing all active users
- **US-27**: As a user, I see color-coded indicators matching cursor colors
- **US-28**: As a user, I see when users join or leave the session
- **US-29**: As a user, I can collapse/expand the presence sidebar

### Future AI Agent
- **US-30**: As a developer, I have a reserved interface for AI commands
- **US-31**: As a future user, I can type commands like "make two red squares"

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 18+ with Vite
- **Canvas Library**: Konva.js for high-performance 2D canvas
- **State Management**: React Context + Custom Hooks
- **Styling**: CSS Modules or Tailwind CSS
- **Real-time**: Supabase Realtime subscriptions

### Backend Stack
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth (email/password + social providers)
- **Real-time**: Supabase Realtime channels
- **Storage**: For future file uploads

### Deployment
- **Platform**: Vercel
- **Environment**: Production, Preview, Development

---

## Database Schema

### Tables

#### `users`
```javascript
{
  id: 'uuid PRIMARY KEY', // Supabase auth.users.id
  email: 'string UNIQUE NOT NULL',
  display_name: 'string',
  custom_colors: 'jsonb DEFAULT []', // Array of 3 hex colors
  theme: 'string DEFAULT "light"',
  created_at: 'timestamp DEFAULT now()',
  updated_at: 'timestamp DEFAULT now()'
}
```

**Indexes**:
- `id` (primary key)
- `email` (unique)

**RLS Policies**:
- Users can read their own record
- Users can update their own record

---

#### `shapes`
```javascript
{
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  type: 'string NOT NULL', // 'rectangle' | 'circle' | 'text'
  x: 'numeric DEFAULT 0',
  y: 'numeric DEFAULT 0',
  width: 'numeric DEFAULT 100',
  height: 'numeric DEFAULT 100',
  rotation: 'numeric DEFAULT 0', // degrees
  color: 'string DEFAULT "#000000"',
  z_index: 'integer DEFAULT 0',
  text_content: 'text', // for text shapes
  font_size: 'integer DEFAULT 16', // for text shapes
  owner_id: 'uuid REFERENCES users(id) ON DELETE SET NULL',
  ownership_timestamp: 'timestamp', // when ownership was acquired
  created_by: 'uuid REFERENCES users(id) ON DELETE SET NULL',
  created_at: 'timestamp DEFAULT now()',
  updated_at: 'timestamp DEFAULT now()'
}
```

**Indexes**:
- `id` (primary key)
- `owner_id` (for ownership queries)
- `z_index` (for rendering order)
- `created_at` (for chronological queries)

**RLS Policies**:
- All authenticated users can read all shapes
- Authenticated users can insert shapes
- Users can update shapes they own or unowned shapes
- Users can delete shapes they created

---

#### `presence`
```javascript
{
  user_id: 'uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE',
  cursor_x: 'numeric DEFAULT 0',
  cursor_y: 'numeric DEFAULT 0',
  cursor_color: 'string DEFAULT "#3b82f6"', // Assigned color for this session
  active: 'boolean DEFAULT true',
  last_seen: 'timestamp DEFAULT now()',
  display_name: 'string'
}
```

**Indexes**:
- `user_id` (primary key)
- `active` (for filtering active users)
- `last_seen` (for cleanup)

**RLS Policies**:
- All authenticated users can read all presence records
- Users can upsert their own presence record
- Automated cleanup via trigger for stale records (>30s)

---

### Realtime Channels

#### `shapes:updates`
**Purpose**: Broadcast shape CRUD operations

**Payload Structure**:
```javascript
{
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  shape: {
    id: 'uuid',
    type: 'rectangle | circle | text',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    color: '#000000',
    zIndex: 0,
    ownerId: 'uuid | null',
    ownershipTimestamp: 'timestamp',
    textContent: 'string', // if text
    fontSize: 16 // if text
  },
  userId: 'uuid' // who triggered the change
}
```

---

#### `cursors:updates`
**Purpose**: High-frequency cursor position updates

**Payload Structure**:
```javascript
{
  userId: 'uuid',
  cursorX: 0,
  cursorY: 0,
  displayName: 'string',
  color: '#3b82f6',
  timestamp: 'timestamp'
}
```

**Optimization**: Throttled to 50ms on client, interpolated locally

---

#### `presence:updates`
**Purpose**: User join/leave events

**Payload Structure**:
```javascript
{
  event: 'join' | 'leave',
  userId: 'uuid',
  displayName: 'string',
  color: '#3b82f6',
  timestamp: 'timestamp'
}
```

---

## Frontend Architecture

### Directory Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── SignupForm.jsx
│   │   └── AuthProvider.jsx
│   ├── canvas/
│   │   ├── Canvas.jsx               # Main Konva Stage wrapper
│   │   ├── Grid.jsx                 # Background grid
│   │   ├── ShapeRenderer.jsx        # Renders all shapes
│   │   ├── RemoteCursor.jsx         # Single remote cursor
│   │   └── RemoteCursors.jsx        # All remote cursors
│   ├── shapes/
│   │   ├── Rectangle.jsx            # Konva Rect with transforms
│   │   ├── Circle.jsx               # Konva Circle with transforms
│   │   ├── TextBox.jsx              # Konva Text with editing
│   │   └── ShapeTransformer.jsx     # Konva Transformer component
│   ├── toolbar/
│   │   ├── Toolbar.jsx              # Main toolbar container
│   │   ├── ToolButton.jsx           # Individual tool button
│   │   ├── ColorPicker.jsx          # Color selection UI
│   │   ├── CustomColorPicker.jsx    # Gradient/eyedropper
│   │   └── ZIndexControls.jsx       # Bring forward/send back
│   ├── sidebar/
│   │   ├── PresenceSidebar.jsx      # Collapsible user list
│   │   └── UserItem.jsx             # Single user in list
│   ├── ai/
│   │   └── AICommandInput.jsx       # Future AI interface
│   └── layout/
│       ├── AppLayout.jsx            # Main app wrapper
│       └── Header.jsx               # Top navigation
├── hooks/
│   ├── useAuth.js                   # Auth state & methods
│   ├── useSupabase.js               # Supabase client hook
│   ├── useShapes.js                 # Shape CRUD operations
│   ├── useShapeSubscription.js      # Realtime shape updates
│   ├── useCursorTracking.js         # Local cursor tracking
│   ├── useCursorSubscription.js     # Remote cursor updates
│   ├── usePresence.js               # Presence management
│   ├── useOwnership.js              # Ownership logic & timers
│   ├── useColorPersistence.js       # User color preferences
│   └── useCanvasInteraction.js      # Canvas event handling
├── context/
│   ├── AuthContext.jsx              # Auth state provider
│   ├── CanvasContext.jsx            # Canvas state (zoom, pan, tool)
│   ├── ShapesContext.jsx            # Shapes state & operations
│   └── PresenceContext.jsx          # Active users state
├── utils/
│   ├── supabaseClient.js            # Supabase initialization
│   ├── InterpolationManager.js      # Singleton for smooth updates
│   ├── ownershipManager.js          # Ownership timeout logic
│   ├── colorUtils.js                # Color manipulation helpers
│   ├── canvasUtils.js               # Canvas coordinate helpers
│   ├── shapeFactory.js              # Create default shapes
│   └── constants.js                 # App-wide constants
├── config/
│   └── supabase.config.js           # Supabase configuration
└── App.jsx                          # Root component
```

---

### Key Frontend Modules

#### `InterpolationManager.js` (Singleton)
**Purpose**: Centralized interpolation for cursors and shapes to prevent jitter

**Responsibilities**:
- Track interpolation targets for each entity (cursor/shape by ID)
- Use requestAnimationFrame for smooth updates
- Apply easing functions (ease-out)
- Different delays: cursors ~50ms, shapes 100-200ms
- Batch updates to minimize Konva redraws

**API**:
```javascript
InterpolationManager.addTarget(id, type, currentPos, targetPos, duration)
InterpolationManager.removeTarget(id)
InterpolationManager.getPosition(id)
InterpolationManager.start()
InterpolationManager.stop()
```

---

#### `ownershipManager.js`
**Purpose**: Handle shape ownership acquisition, release, and timeout

**Responsibilities**:
- Track ownership timestamps per shape
- Implement 15-second inactivity timeout
- Emit events when ownership changes
- Clear ownership on click-off
- Validate ownership before allowing edits

**API**:
```javascript
ownershipManager.acquire(shapeId, userId)
ownershipManager.release(shapeId)
ownershipManager.isOwner(shapeId, userId)
ownershipManager.startInactivityTimer(shapeId)
ownershipManager.resetInactivityTimer(shapeId)
```

---

#### Canvas State Management
**Tool Selection**:
```javascript
{
  activeTool: 'select' | 'rectangle' | 'circle' | 'text',
  selectedShapeId: 'uuid | null',
  viewport: { x: 0, y: 0, scale: 1 },
  gridVisible: true
}
```

**Shape State**:
```javascript
{
  shapes: Map<uuid, shape>, // Local shape cache
  localUpdates: Map<uuid, pendingUpdate>, // Optimistic updates
  isDragging: false,
  isTransforming: false
}
```

---

## Performance Optimizations

### Frontend Optimizations
1. **Selective Rendering**: Only update Konva nodes that changed
2. **Batched Updates**: Group multiple shape updates into single Supabase call
3. **Throttling**: Cursor updates throttled to 50ms
4. **Debouncing**: Shape position updates debounced to 200ms
5. **Memoization**: React.memo for RemoteCursor, ShapeRenderer components
6. **Virtual Scrolling**: For presence sidebar with many users
7. **Web Workers**: Consider for heavy interpolation calculations

### Backend Optimizations
1. **Database Indexes**: On owner_id, z_index, created_at
2. **RLS Policies**: Optimized queries with proper indexes
3. **Realtime Filters**: Subscribe only to relevant channels
4. **Presence Cleanup**: Postgres trigger to remove stale presence records
5. **Connection Pooling**: Supabase handles this automatically

---

## Security Considerations

### Authentication
- Email verification required before canvas access
- Password strength validation (min 8 chars)
- Session management via Supabase Auth

### Authorization (RLS)
- Users can only update shapes they own or unowned shapes
- Users can only update their own user record
- Users can only delete shapes they created

### Input Validation
- Sanitize text input for TextBox shapes
- Validate numeric bounds for x, y, width, height
- Validate color hex format
- Rate limiting on shape creation (max 100/min per user)

---

## Future Enhancements

### Phase 2
- Undo/Redo functionality
- Shape grouping
- Copy/paste shapes
- More shape types (line, arrow, polygon)
- Image upload and placement
- Layer panel for z-index management

### Phase 3
- Comments/annotations on shapes
- Shape locking
- Export canvas as PNG/SVG
- Canvas templates
- Multiplayer sessions/rooms

### Phase 4
- AI Agent integration
  - Natural language commands
  - Shape generation from descriptions
  - Layout suggestions
  - Auto-alignment and distribution

---

## Diagrams

### System Architecture
```
Client Browser
├── React App (Vite)
├── Konva Canvas
├── InterpolationManager
└── Supabase Client
    ├── Auth Service
    ├── PostgreSQL
    └── Realtime Engine

Vercel Platform
├── Static Hosting
└── Edge Functions
```

### Data Flow
```
User 1 creates shape
→ Optimistic local update
→ INSERT to Supabase
→ Supabase broadcasts to User 2
→ InterpolationManager animates (150ms)
→ Smooth appearance on User 2's canvas
```

### Ownership State Machine
```
Unowned ←→ Owned (current user)
   ↓
Locked (other user owns)
```

---

## Critical Performance Patterns

### 1. Selective Konva Updates
```javascript
// BAD: Updates entire layer
layer.draw();

// GOOD: Updates only changed nodes
shape.draw();
// or batch multiple updates
layer.batchDraw();
```

### 2. Debounce Supabase Updates
```javascript
const debouncedUpdate = useMemo(
  () => debounce((shapeId, updates) => {
    supabase.from('shapes').update(updates).eq('id', shapeId);
  }, 200),
  []
);
```

### 3. Throttle Cursor Broadcasts
```javascript
const throttledBroadcast = useMemo(
  () => throttle((x, y) => {
    supabase.channel('cursors:updates').send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: { userId, x, y }
    });
  }, 50),
  [userId]
);
```

---

## Environment Variables

### `.env.local` (Development)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### `.env.example` (Template)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Recommended Libraries

### Core (Required)
- `react` (18+)
- `react-dom` (18+)
- `vite` (5+)
- `konva` (9+)
- `react-konva` (18+)
- `@supabase/supabase-js` (2+)

### Utilities (Recommended)
- `lodash` (for debounce, throttle)
- `uuid` (if not using Supabase-generated IDs)

### Optional
- `react-hot-toast` (notifications)
- `lucide-react` (icons)
- `tailwindcss` (styling)

---

## Success Criteria

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