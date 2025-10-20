# CanvasCollab Project Context - January 2025

## 🎯 Current Project State

**Project**: Real-time collaborative canvas application  
**Tech Stack**: React + Vite, Konva.js, Supabase (PostgreSQL + Realtime)  
**Current Branch**: `feature/ai-canvas-agent`  
**Last Completed**: Click-and-drag ownership system  
**Next Feature**: AI Canvas Agent (natural language commands)

---

## 🏗️ Architecture Overview

### Frontend Structure
```
src/
├── components/
│   ├── Canvas/
│   │   ├── Canvas.jsx          # Main canvas orchestrator
│   │   ├── Rectangle.jsx       # Rectangle shape component
│   │   ├── Circle.jsx          # Circle shape component
│   │   └── TextBox.jsx         # Text shape component
│   └── UI/                     # UI components
├── hooks/
│   ├── useCanvas.js           # Canvas state management
│   ├── useCursors.js          # User cursor tracking
│   └── useRealtimeSync.js     # Supabase real-time sync
├── utils/
│   ├── canvasHelpers.js       # Shape creation utilities
│   └── OwnershipManager.js    # Client-side ownership timers
└── lib/
    └── ObjectStore.js         # External state management
```

### Backend (Supabase)
```
Database Tables:
├── profiles          # User profiles
├── shapes           # Canvas shapes with ownership
└── presence         # User presence/cursors

Functions:
├── cleanup_expired_ownership()  # Cleanup expired ownership
└── manual_cleanup_ownership()   # Manual cleanup trigger
```

---

## ✅ Recently Completed Features

### Click-and-Drag Ownership System
**Status**: ✅ COMPLETED & MERGED TO MAIN

**What it does**:
- Enforces "no modification without ownership" principle
- Blocks drag operations on shapes owned by other users
- Acquires ownership automatically when dragging unowned shapes
- Shows transform handles after ownership acquisition

**Key Implementation**:
- Modified all shape components (Rectangle, Circle, TextBox) with ownership checks
- Added `handleDragStartWithOwnership` function in Canvas.jsx
- Ownership acquisition happens BEFORE drag starts
- Visual feedback: owned shapes show red border + reduced opacity

**Files Modified**:
- `src/components/Canvas/Canvas.jsx` - Added ownership logic
- `src/components/Canvas/Rectangle.jsx` - Added ownership checks
- `src/components/Canvas/Circle.jsx` - Added ownership checks  
- `src/components/Canvas/TextBox.jsx` - Added ownership checks
- `database/ownership-cleanup-function.sql` - Database cleanup functions

---

## 🚀 Next Feature: AI Canvas Agent

### Overview
**Goal**: Add natural language command interface for 10x faster canvas operations  
**Example Commands**: "add 2 rectangles", "create a circle", "add 5 squares"

### Technical Architecture
```
User Input → Claude API → Structured JSON → Command Executor → Konva Canvas → Supabase Sync
```

### MVP Features (Phase 1)
1. **Command Input Interface**
   - Floating command bar (Cmd/Ctrl + K)
   - Real-time processing indicator
   - Command history dropdown
   - Auto-focus for rapid iteration

2. **Basic Shape Commands**
   - `add [number] [shape_type]`
   - Shape types: rectangle, circle, ellipse, triangle, line, arrow, text
   - Default positioning: viewport center with 20px spacing

3. **AI Command Parser**
   - Claude API integration
   - Structured JSON output
   - Error handling with suggestions
   - Fallback to pattern matching

4. **Canvas Integration**
   - Command executor for Konva shapes
   - Batch Supabase inserts
   - Real-time sync with collaborators

5. **Database Schema**
   - New `ai_commands` table for analytics
   - Command history and debugging

### New Components to Build
```
/components
  /AICommandBar
    - CommandInput.jsx
    - CommandHistory.jsx
    - ProcessingIndicator.jsx
  /AIAgent
    - CommandParser.js
    - CommandExecutor.js
    - KonvaShapeFactory.js
```

---

## 🔧 Current Codebase Integration Points

### Key Files to Understand
1. **`src/components/Canvas/Canvas.jsx`**
   - Main orchestrator with ownership system
   - Shape rendering and event handling
   - Real-time sync integration

2. **`src/hooks/useCanvas.js`**
   - Canvas state management
   - Shape CRUD operations
   - Uses ObjectStore for external state

3. **`src/hooks/useRealtimeSync.js`**
   - Supabase real-time subscriptions
   - Shape change broadcasting
   - Connection management

4. **`lib/ObjectStore.js`**
   - External state management
   - Shape storage and notifications
   - Selected shape tracking

### Database Schema
```sql
-- Existing shapes table (already has ownership fields)
shapes (
  id UUID PRIMARY KEY,
  type VARCHAR,
  x FLOAT, y FLOAT,
  width FLOAT, height FLOAT,
  radius FLOAT,
  fill VARCHAR, stroke VARCHAR,
  text TEXT,
  owner_id UUID,           -- Current owner
  ownership_timestamp TIMESTAMP, -- Ownership timestamp
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- New table for AI commands
ai_commands (
  id UUID PRIMARY KEY,
  canvas_id UUID REFERENCES canvases(id),
  user_id UUID REFERENCES users(id),
  command_text TEXT,
  parsed_action JSONB,
  status VARCHAR, -- 'success', 'error', 'pending'
  error_message TEXT,
  execution_time_ms INT,
  created_at TIMESTAMP
)
```

---

## 🎯 Implementation Strategy

### Phase 1: Foundation (Week 1-2)
1. **Set up Claude API integration**
   - Install `@anthropic-ai/sdk`
   - Create API client with rate limiting
   - Implement system prompt template

2. **Build command input UI**
   - Create AICommandBar component
   - Implement Cmd/Ctrl + K shortcut
   - Add processing states and error handling

3. **Create basic command parser**
   - Start with 5 simple commands
   - Pattern matching fallback
   - JSON output validation

### Phase 2: Core Features (Week 3-4)
1. **Implement shape creation commands**
   - Integrate with existing shape creation logic
   - Batch operations for multiple shapes
   - Positioning logic (viewport center + spacing)

2. **Supabase integration**
   - Create ai_commands table
   - Log all commands for analytics
   - Real-time sync with collaborators

### Phase 3: Polish & Testing (Week 5-6)
1. **Error handling and fallbacks**
2. **Performance optimization**
3. **User testing and feedback**

---

## 🔑 Key Technical Decisions

### Ownership System
- **15-second timeout** for ownership
- **Client-side timers** with OwnershipManager
- **Database cleanup** via periodic RPC calls
- **Visual feedback** for owned shapes

### Real-time Sync
- **Supabase Realtime** for live updates
- **Optimistic updates** for immediate UI feedback
- **Conflict resolution** via ownership system
- **Connection resilience** with retry logic

### State Management
- **ObjectStore** for external state management
- **React Context** for component state
- **Custom hooks** for business logic
- **Konva.js** for canvas rendering

---

## 🚨 Important Notes

### Current Branch Status
- **Main branch**: Contains completed click-and-drag ownership
- **Current branch**: `feature/ai-canvas-agent` (new feature)
- **Dev server**: Running on `http://localhost:5173/`

### Dependencies
- **React 18** with Vite
- **Konva.js** for canvas rendering
- **Supabase** for backend services
- **Need to add**: `@anthropic-ai/sdk` for Claude API

### Environment Setup
- **Supabase project**: Already configured
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with RLS policies
- **Real-time**: Supabase Realtime subscriptions

---

## 📋 Next Steps for Handoff

1. **Review PRD**: `PRD-AI-Canvas-Agent.md` contains full specification
2. **Understand ownership system**: Key to preventing conflicts
3. **Set up Claude API**: Get API key and configure client
4. **Start with command bar UI**: Foundation for all AI features
5. **Test with existing shapes**: Ensure compatibility with ownership system

---

## 🎯 Success Metrics

### Phase 1 (MVP)
- 30% of users try AI commands within first week
- 90%+ command interpretation accuracy
- <2 second latency from command to canvas update
- 5+ AI commands per session average

### Technical Goals
- Seamless integration with existing ownership system
- Real-time sync with collaborators
- Fallback to pattern matching for reliability
- Cost control with rate limiting

---

*Last Updated: January 2025*  
*Project Status: Ready for AI Canvas Agent implementation*

