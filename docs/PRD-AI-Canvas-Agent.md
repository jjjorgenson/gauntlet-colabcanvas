# Product Requirements Document: AI Canvas Agent

## Overview

**Product Name:** AI Canvas Command Interface  
**Version:** 1.0  
**Date:** October 2025  
**Status:** Draft

### Executive Summary
Add an AI-powered natural language command interface to the collaborative canvas application, enabling users to create and manipulate shapes using simple text commands instead of manual clicks and drags.

---

## Problem Statement

Users currently need to:
- Click through multiple UI menus to create shapes
- Manually position shapes one by one
- Perform repetitive actions for bulk operations

**Goal:** Enable users to execute canvas operations 10x faster using natural language commands like "add 2 rectangles" or "create a flowchart with 5 connected nodes."

---

## User Personas

### Primary: Power Users
- Frequent canvas users creating diagrams, wireframes, flowcharts
- Value speed and keyboard-driven workflows
- Comfortable with command interfaces (like Figma quick actions)

### Secondary: New Users
- Discovering canvas features through conversational interface
- Prefer natural language over learning UI locations
- May use voice input in future iterations

---

## Success Metrics

### Phase 1 (MVP)
- **Adoption:** 30% of active users try AI commands within first week
- **Engagement:** Users execute average 5+ AI commands per session
- **Accuracy:** 90%+ command interpretation accuracy
- **Performance:** <2 second latency from command to canvas update

### Phase 2
- **Retention:** 50% of users who try it use it in subsequent sessions
- **Complexity:** Support multi-step commands (3+ operations)
- **Time Savings:** 40% reduction in time for repetitive tasks

---

## Core Features

### MVP (Phase 1)

#### 1. Command Input Interface
**Description:** Text input field for natural language commands

**Requirements:**
- Floating command bar (keyboard shortcut: Cmd/Ctrl + K)
- Real-time typing indicator while AI processes
- Command history dropdown (last 10 commands)
- Auto-focus after shape creation for rapid iteration

**UI States:**
- Idle: Placeholder text "Ask AI to add shapes..."
- Processing: Loading indicator
- Success: Brief confirmation message
- Error: Inline error with suggestion

#### 2. Basic Shape Commands

**Supported Operations:**

**Add Shapes:**
- `add [number] [shape_type]`
- Examples: "add 2 rectangles", "add a circle", "create 5 squares"
- Shape types: rectangle, circle, ellipse, triangle, line, arrow, text

**Positioning Logic:**
- Default starting position: Center of viewport
- Multiple shapes: Arrange horizontally with 20px spacing
- Respect canvas boundaries (no shapes off-screen)

**Default Dimensions:**
- Rectangle: 120x80px
- Circle: 60px radius
- Text: Auto-width, 16px font size

#### 3. AI Command Parser

**Architecture:**
```
User Input → Claude API → Structured JSON → Command Executor → Konva Canvas → Supabase Sync
```

**System Prompt Template:**
```
You are a canvas command interpreter for a Konva-based collaborative whiteboard.

Context:
- Canvas dimensions: {width}x{height}
- Viewport center: {x}, {y}
- Existing shapes: {shape_count}

Output Format:
{
  "action": "add_shapes" | "modify_shapes" | "delete_shapes",
  "shapes": [{
    "type": "rect" | "circle" | "ellipse" | "line" | "text",
    "x": number,
    "y": number,
    "width": number,
    "height": number,
    "radius": number,
    "fill": string,
    "text": string
  }]
}

Rules:
- Position shapes 20px apart horizontally
- Use viewport center if position unspecified
- Default colors: blue (#3b82f6) for shapes
```

**Error Handling:**
- Ambiguous commands: Ask for clarification
- Invalid shape types: Suggest closest match
- API failures: Fallback to simple pattern matching

#### 4. Canvas Integration

**Command Executor:**
```javascript
executeCommand(parsedAction) {
  // 1. Create Konva shapes
  // 2. Add to Konva layer
  // 3. Batch insert to Supabase
  // 4. Broadcast to collaborators via Supabase Realtime
}
```

**Konva Shape Mapping:**
- `rect` → Konva.Rect
- `circle` → Konva.Circle
- `ellipse` → Konva.Ellipse
- `line` → Konva.Line
- `arrow` → Konva.Arrow
- `text` → Konva.Text

#### 5. Database Schema Updates

**Existing `shapes` table:**
```sql
shapes (
  id UUID PRIMARY KEY,
  canvas_id UUID REFERENCES canvases(id),
  type VARCHAR,
  x FLOAT,
  y FLOAT,
  width FLOAT,
  height FLOAT,
  radius FLOAT,
  fill VARCHAR,
  stroke VARCHAR,
  text TEXT,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**New `ai_commands` table:**
```sql
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

**Purpose:** Analytics, debugging, command history

---

## Technical Architecture

### Frontend (React + Vite)

**New Components:**
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

**Key Libraries:**
- `react-konva`: Canvas rendering
- `@anthropic-ai/sdk`: Claude API client
- `@supabase/supabase-js`: Database + Realtime

**State Management:**
```javascript
// New context
AICommandContext {
  executeCommand(text),
  commandHistory: [],
  isProcessing: boolean,
  lastError: string | null
}
```

### Backend Services

**API Routes:**
```
POST /api/ai/parse-command
  Body: { command: string, canvasContext: object }
  Response: { action: object, confidence: number }
  
POST /api/ai/execute-command
  Body: { canvasId: string, action: object }
  Response: { shapeIds: string[], success: boolean }
```

**Supabase Functions:**
```javascript
// Edge function for AI parsing
parse_canvas_command(command, canvas_context)
  → Returns structured action JSON

// RLS policies
- Users can only execute commands on canvases they have access to
- Command history visible only to command author
```

### Security & Privacy

**Rate Limiting:**
- 30 commands per minute per user
- 500 commands per hour per canvas

**Cost Controls:**
- Max 1000 tokens per AI request
- Cache common command patterns locally
- Fallback to pattern matching for simple commands

**Data Privacy:**
- AI commands logged with user_id
- No canvas content sent to AI (only metadata like shape count)
- Opt-out option in user settings

---

## User Experience Flow

### Happy Path
1. User presses Cmd+K
2. Command bar appears, focused
3. User types "add 3 circles"
4. Loading indicator shows (~1-2 seconds)
5. 3 circles appear on canvas in viewport center
6. Circles automatically saved to Supabase
7. Other collaborators see shapes in real-time
8. Command bar stays open for next command

### Error Path
1. User types "add a hexagon"
2. AI responds: "Hexagon not supported. Did you mean: polygon, rectangle, or circle?"
3. User selects "polygon" or retypes command
4. Continues to happy path

---

## Phase 2 Features (Future)

### Advanced Commands
- **Styling:** "make them red", "add shadows"
- **Layouts:** "arrange in a grid", "distribute evenly"
- **Relationships:** "connect shapes with arrows"
- **Selection:** "select all rectangles", "group selected"
- **Modifications:** "make the blue circle bigger"

### Context Awareness
- Track last created shapes as "them/they"
- Remember user preferences (default colors, sizes)
- Canvas-wide operations ("center everything")

### Collaborative Features
- "@mention AI agent" for shared sessions
- Command suggestions based on canvas state
- Undo/redo AI commands

### Performance Optimizations
- Local ML model for simple commands (no API latency)
- Command autocomplete with local matching
- Batch operations (create 100 shapes efficiently)

---

## Dependencies & Risks

### External Dependencies
- **Claude API:** Primary risk - service availability, cost
- **Supabase:** Database latency for multi-user sync
- **Konva:** Rendering performance with many shapes

### Mitigation Strategies
- Implement local pattern matching fallback
- Add retry logic with exponential backoff
- Monitor API costs with alerts at $100/day threshold
- Optimize Konva rendering with virtualization

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI misinterprets commands | High | Medium | Show preview before commit |
| API latency >5s | Medium | Low | Add timeout + fallback |
| Cost explosion | High | Medium | Rate limiting + caching |
| Multi-user conflicts | Medium | Medium | Operational transforms |

---

## Launch Plan

### Week 1-2: Foundation
- Set up Claude API integration
- Build command input UI component
- Create basic command parser with 5 commands

### Week 3-4: Core Features
- Implement shape creation commands
- Supabase integration for persistence
- Real-time sync with collaborators

### Week 5: Polish & Testing
- Error handling and fallbacks
- User testing with 10 beta users
- Performance optimization

### Week 6: Launch
- Feature flag rollout (10% → 50% → 100%)
- Analytics dashboard
- Documentation and help center

---

## Open Questions

1. **Pricing:** Do we absorb AI API costs or pass through to users?
2. **Scope:** Should MVP include text shape creation?
3. **UX:** Command bar vs. chat interface vs. inline editing?
4. **Limits:** Max shapes per command (prevent abuse)?
5. **Privacy:** Do we train on user commands (opt-in)?

---

## Appendix

### Example Commands (MVP)
```
✅ "add 2 rectangles"
✅ "create a circle"
✅ "add 5 squares"
✅ "make a red triangle"
✅ "add text saying Hello World"

🚫 "move the circle up" (Phase 2)
🚫 "connect all shapes" (Phase 2)
🚫 "create a flowchart" (Phase 2)
```

### API Cost Estimates
- Average command: ~200 tokens
- Cost per command: ~$0.0006
- Expected usage: 1000 commands/day = $0.60/day
- Monthly cost: ~$18

### Competitors Analysis
- **Figma:** No AI commands (only search/plugins)
- **Excalidraw:** No AI features
- **Miro:** AI for summarization, not shape creation
- **Opportunity:** First mover in AI-native canvas editing
