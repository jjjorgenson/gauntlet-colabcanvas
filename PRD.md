# CollabCanvas MVP - Product Requirements Document

## Project Overview
Build a real-time collaborative canvas (Figma-like) where multiple users can simultaneously create, move, and manipulate shapes while seeing each other's cursors and presence in real-time.

**Deadline:** Tuesday (24 hours from start)

---

## User Stories

### Primary User: Designer/Collaborator
- **As a designer**, I want to create basic shapes (rectangles, circles, text) on a canvas so I can build visual layouts
- **As a designer**, I want to pan and zoom around the canvas so I can navigate a large workspace
- **As a designer**, I want to move and resize objects so I can arrange my design
- **As a collaborator**, I want to see other users' cursors with their names so I know where they're working
- **As a collaborator**, I want to see changes from other users instantly so we can work together in real-time
- **As a user**, I want to know who else is online so I understand who I'm collaborating with
- **As a user**, I want my work to persist when I refresh or leave so I don't lose progress

### Secondary User: New User
- **As a new user**, I want to authenticate with a name/account so I can be identified in the collaborative space
- **As a new user**, I want to access the app via a public URL so I can start collaborating immediately

---

## Key Features for MVP

### 1. Authentication & User Management
- Email + password authentication via Supabase Auth
- Username stored in user metadata for display
- User identity persisted across sessions
- Display user name in cursor labels
- Sign up and login functionality

### 2. Canvas Foundation
- **Pan**: Click and drag to move around workspace
- **Zoom**: Mouse wheel or pinch to zoom in/out
- Large workspace (e.g., 5000x5000px virtual canvas)
- Smooth 60 FPS performance during interactions

### 3. Shape Creation & Manipulation
- **Three shape types**: Rectangles, circles, and text boxes
- Create shapes via button click or toolbar
- Move shapes by drag-and-drop
- Resize shapes with transform handles
- Basic visual properties (color, size, position)
- Text editing with double-click functionality

### 4. Real-Time Collaboration
- **Multiplayer cursors**: Show all connected users' cursor positions with name labels
- **Live object sync**: When User A creates/moves a shape, User B sees it instantly
- **Presence awareness**: List of currently online users
- Update latency targets:
  - Cursor position: <50ms
  - Object changes: <100ms

### 5. State Persistence
- Canvas state saved to backend
- All objects persist when users disconnect
- Canvas state restored when users reconnect
- Handle page refresh without data loss

### 6. Deployment
- Publicly accessible URL
- Supports 5+ concurrent users
- Stable under basic load

---

## Tech Stack Recommendations

### Backend Options

#### Option 1: Firebase (Recommended for MVP)
**Services:**
- Firestore for canvas state persistence
- Firebase Realtime Database for cursor positions
- Firebase Authentication for user management
- Firebase Hosting for deployment

**Pros:**
- Fast setup (~1-2 hours)
- Built-in real-time sync
- No server management
- Authentication handled
- Free tier sufficient for MVP
- Excellent documentation

**Cons:**
- Vendor lock-in
- Can get expensive at scale
- Less control over backend logic
- Read/write limits on free tier

**Pitfalls:**
- Firestore has charged per-read model - use Realtime DB for high-frequency updates (cursors)
- Need to structure data carefully to avoid excessive reads
- Understand security rules before deploying

---

#### Option 2: Supabase
**Services:**
- PostgreSQL with real-time subscriptions
- Built-in authentication
- Row-level security

**Pros:**
- Open source alternative to Firebase
- SQL database (more familiar for many)
- Real-time subscriptions built-in
- Generous free tier
- Can self-host later

**Cons:**
- Slightly more complex setup than Firebase
- PostgreSQL may be overkill for MVP
- Real-time features less mature than Firebase
- Need to handle connection pooling

**Pitfalls:**
- Real-time subscriptions have limitations on filter complexity
- May need to optimize queries for cursor updates
- Authentication setup requires more configuration

---

#### Option 3: Custom WebSocket Server
**Stack:**
- Node.js + Express + Socket.io
- Redis for state management
- PostgreSQL/MongoDB for persistence

**Pros:**
- Full control over architecture
- Can optimize exactly for your use case
- No vendor lock-in
- Best performance potential

**Cons:**
- Significantly more development time (4-8 hours just for backend)
- Need to handle deployment, scaling, authentication yourself
- More complex debugging
- Infrastructure management

**Pitfalls:**
- Socket.io room management can be tricky
- Need to handle reconnection logic carefully
- State synchronization requires careful thought
- Deployment more complex (need VPS or container hosting)

---

### Frontend Options

#### Option 1: React + Konva.js (Recommended)
**Pros:**
- Konva provides canvas abstraction with drag-and-drop built-in
- React for UI state management
- Large community and examples
- Good performance for MVP scale

**Cons:**
- Konva adds bundle size
- Learning curve if new to canvas libraries

---

#### Option 2: React + HTML5 Canvas (Raw)
**Pros:**
- Full control, no dependencies
- Lightweight
- Direct canvas manipulation

**Cons:**
- Need to implement drag-and-drop, hit detection, transforms yourself
- More time for basic features
- More complex for MVP timeline

---

#### Option 3: React + Fabric.js
**Pros:**
- Rich feature set for canvas manipulation
- Built-in object model
- Good for complex shapes

**Cons:**
- Heavier than Konva
- Some performance issues at scale
- More features than needed for MVP

---

### Phase 2 (AI Agent) Considerations

#### Option 1: Firebase - MODERATE Difficulty
**AI Integration Path:**
- Use Firebase Cloud Functions to call OpenAI API
- Store API keys securely in Firebase Config
- AI commands trigger Cloud Functions which manipulate Firestore

**Pros for AI Phase:**
- Secure API key storage (not exposed to client)
- Cloud Functions can call OpenAI function calling API
- AI-generated changes automatically sync via existing Firestore listeners

**Cons for AI Phase:**
- Cloud Functions have cold start delays (2-3 seconds first call)
- Limited control over request/response streaming
- Some reported reliability issues with OpenAI calls from Cloud Functions
- Need to manage function timeouts (default 60s, max 540s)

**Complexity:** Medium - straightforward integration but some performance trade-offs

---

#### Option 2: Supabase - EASIEST (Recommended for Full Project)
**AI Integration Path:**
- Use Supabase Edge Functions (Deno runtime) to call OpenAI API
- Or create a separate Node.js API service alongside Supabase
- AI changes written to PostgreSQL trigger real-time subscriptions

**Pros for AI Phase:**
- Edge Functions are faster than Firebase Cloud Functions
- Better for streaming responses (if needed later)
- PostgreSQL transactions useful for complex multi-step AI operations
- Can batch AI operations atomically
- Modern Deno runtime with TypeScript support

**Cons for AI Phase:**
- Edge Functions are newer, less documentation than Firebase
- May still want separate API service for complex AI logic

**Complexity:** Low-Medium - clean separation of concerns, good performance

---

#### Option 3: Custom WebSocket Server - MOST FLEXIBLE
**AI Integration Path:**
- Add OpenAI API calls directly in your Node.js backend
- AI commands processed in same server as real-time sync
- Full control over execution flow and optimizations

**Pros for AI Phase:**
- Complete control over AI request handling
- Can optimize for streaming, batching, caching
- No cold starts or timeout issues
- Can implement sophisticated planning/execution logic
- Easiest to debug AI behavior

**Cons for AI Phase:**
- More initial backend work (but pays off in Phase 2)
- Need to manage deployment complexity
- More code to maintain

**Complexity:** Low (if backend already built) - most natural integration

---

### Recommended Stack Based on Full Project

**For Fastest MVP + Easiest AI Extension:**
**Backend:** Supabase (PostgreSQL + Real-time + Edge Functions)  
**Frontend:** React + Konva.js  
**AI Integration:** Supabase Edge Functions → OpenAI API  
**Deployment:** Vercel (frontend) + Supabase (backend + DB)

**Reasoning:** 
- Supabase gives you 80% of Firebase's ease of setup
- Edge Functions are better suited for AI API calls than Cloud Functions
- PostgreSQL transactions help with complex AI operations
- Clean architecture that scales into Phase 2
- All in one platform for simplicity

---

### Alternative: Custom Backend (If You Have More Time)

**Backend:** Node.js + Express + Socket.io + Redis  
**Database:** PostgreSQL or MongoDB  
**Frontend:** React + Konva.js  
**AI Integration:** Direct OpenAI API calls in Express routes  
**Deployment:** Railway/Render (backend) + Vercel (frontend)

**Reasoning:**
- Most flexibility for AI agent implementation
- No vendor lock-in
- Best performance potential
- But requires more upfront investment (worth it if you're comfortable with backend)

---

## Out of Scope for MVP

### Explicitly NOT included:
- AI Canvas Agent (Phase 2)
- Text layers with advanced formatting
- Rotation, advanced transforms
- Multi-select (shift-click, drag-to-select)
- Layer management and z-ordering
- Delete, duplicate, undo/redo
- Advanced color pickers or style panels
- Export/save functionality
- Real-time chat or comments
- Permissions or access control
- Advanced conflict resolution (use last-write-wins)

---

## Critical Success Factors

### The MVP Must Demonstrate:
1. **Solid multiplayer foundation** - Two users can see each other and their changes
2. **Smooth performance** - No lag, stuttering, or FPS drops during basic operations
3. **State persistence** - Canvas survives page refresh
4. **Deployed and accessible** - Working URL that anyone can visit

### Test Scenario (Self-Check):
1. Open app in two different browsers
2. Authenticate with different names
3. See both cursors moving in real-time
4. Create a shape in Browser 1 → appears in Browser 2 instantly
5. Move a shape in Browser 2 → updates in Browser 1 instantly
6. Refresh Browser 1 → canvas state restored, shapes still there
7. Both users can continue editing without issues

---

## Development Priorities

### Phase 1: Setup + Authentication
- Initialize React project with Vite/Create-React-App
- Setup Supabase project and client configuration
- Implement email + password authentication with username storage
- Deploy "Hello World" to Vercel to verify deployment pipeline
- Confirm Supabase connection working

### Phase 2: Canvas Foundation (Single User)
- Setup Konva.js Stage and Layer components
- Implement pan functionality (drag background)
- Implement zoom functionality (mouse wheel)
- Create large workspace (5000x5000px virtual canvas)
- Basic canvas rendering with smooth performance

### Phase 3: Shape Creation & Manipulation (Single User)
- Add rectangle, circle, and text box creation (buttons or toolbar)
- Implement drag-to-move for all shape types
- Add resize functionality with transform handles
- Add text editing with double-click
- Add basic properties (position, size, color)
- Test smooth interactions at 60 FPS

### Phase 4: Real-Time Sync (CRITICAL PATH)
- Setup Supabase real-time subscriptions
- Implement cursor position broadcasting with real-time updates
- Add cursor rendering with user labels and smooth movement
- Implement object creation sync for all shape types
- Implement object movement sync with real-time updates
- Implement object resize sync with real-time updates
- Test with multiple browser windows
- **Success criteria:** Two users see each other's cursors and shape changes instantly

### Phase 5: State Persistence
- Save canvas objects to Supabase PostgreSQL
- Load canvas state on page load
- Handle page refresh without data loss
- Implement reconnection logic

### Phase 6: Presence Awareness
- Track online users in Supabase
- Display list of currently connected users
- Show/hide cursors as users join/leave
- Update presence on connect/disconnect

### Phase 7: Polish + Testing
- Fix sync edge cases and race conditions
- Optimize performance under load
- Test with 3-5 concurrent users
- Handle error states gracefully
- Ensure deployed version is stable

### Phase 8: Final Deployment
- Deploy to production (Vercel)
- Verify public URL accessibility
- Load test with multiple users
- Document setup in README
- Create brief architecture overview

---

## Risk Mitigation

### High-Risk Areas:
1. **Real-time sync complexity** - Start with cursor sync first (simplest), then object sync
2. **State conflicts** - Use last-write-wins for MVP (document this choice)
3. **Performance under load** - Test with 3-5 users early, throttle updates if needed
4. **Time management** - Cut scope aggressively if running behind. Working multiplayer > more features

### Fallback Plan:
If real-time sync is failing at hour 16:
- Simplify to "refresh to see changes" model
- Focus on state persistence
- Document limitations
- Ensure deploy works

---

## Success Metrics

### Must Have:
- ✅ Two users can collaborate simultaneously
- ✅ Cursors visible with names
- ✅ Shapes sync in <100ms
- ✅ Canvas persists on refresh
- ✅ Deployed URL works
- ✅ No critical bugs

### Nice to Have:
- 60 FPS maintained
- 5+ concurrent users supported
- Clean UI/UX
- Smooth interactions