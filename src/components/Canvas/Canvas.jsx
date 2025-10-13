import { useRef, useCallback, useEffect } from 'react'
import { CanvasStage } from './CanvasStage'
import { Rectangle } from './Rectangle'
import { Cursor } from './Cursor'
import { useCanvas } from '../../hooks/useCanvas'
import { useCursors } from '../../hooks/useCursors'
import { usePresence } from '../../hooks/usePresence'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { CANVAS_CONFIG } from '../../lib/constants'

export const Canvas = ({ user }) => {
  const stageRef = useRef(null)
  
  const {
    shapes,
    selectedShapeId,
    selectedColor,
    addRectangle,
    updateShapePosition,
    selectShape,
    deselectAll,
    setShapesFromRemote,
    setSelectedColor,
  } = useCanvas()

  const {
    otherCursors,
    myCursor,
    updateCursorPosition,
  } = useCursors({ 
    userId: user?.id, 
    username: user?.user_metadata?.username || 'Anonymous' 
  })

  const {
    onlineUsers,
  } = usePresence({ 
    userId: user?.id, 
    username: user?.user_metadata?.username || 'Anonymous' 
  })

  const {
    broadcastShapeChange,
  } = useRealtimeSync({ 
    shapes, 
    setShapesFromRemote, 
    userId: user?.id 
  })

  const handleStageClick = useCallback((e) => {
    // Deselect all shapes when clicking on empty space
    deselectAll()
  }, [deselectAll])

  const handleStageDrag = useCallback((e) => {
    // Handle stage panning
    const stage = e.target
    const newPos = {
      x: stage.x(),
      y: stage.y()
    }
    // Update cursor position during drag
    updateCursorPosition(newPos.x, newPos.y)
  }, [updateCursorPosition])

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault()
    
    const stage = e.target
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    
    const newScale = e.evt.deltaY > 0 
      ? Math.max(CANVAS_CONFIG.MIN_ZOOM, oldScale - CANVAS_CONFIG.ZOOM_STEP)
      : Math.min(CANVAS_CONFIG.MAX_ZOOM, oldScale + CANVAS_CONFIG.ZOOM_STEP)
    
    stage.scale({ x: newScale, y: newScale })
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    
    stage.position(newPos)
    stage.batchDraw()
  }, [])

  const handleMouseMove = useCallback((e) => {
    const stage = e.target.getStage()
    if (stage) {
      const pointer = stage.getPointerPosition()
      if (pointer) {
        updateCursorPosition(pointer.x, pointer.y)
      }
    }
  }, [updateCursorPosition])

  const handleAddRectangle = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    
    const centerX = stage.width() / 2
    const centerY = stage.height() / 2
    
    const newRectangle = addRectangle(centerX, centerY)
    broadcastShapeChange(newRectangle, 'create')
  }, [addRectangle, broadcastShapeChange])

  // No need to pass data to parent - we'll handle toolbar directly

  const handleRectangleDragEnd = useCallback((shapeId, newPosition) => {
    updateShapePosition(shapeId, newPosition)
    
    const updatedShape = shapes.find(s => s.id === shapeId)
    if (updatedShape) {
      const shapeWithNewPos = { ...updatedShape, ...newPosition }
      broadcastShapeChange(shapeWithNewPos, 'update')
    }
  }, [shapes, updateShapePosition, broadcastShapeChange])

  const handleRectangleSelect = useCallback((shapeId) => {
    selectShape(shapeId)
  }, [selectShape])

  return (
    <div className="canvas-container">
      {/* Simple toolbar integrated into canvas */}
      <div className="canvas-toolbar">
        <button 
          onClick={handleAddRectangle}
          className="toolbar-button primary"
        >
          + Add Rectangle
        </button>
        <div className="color-palette">
          {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
            <button
              key={color}
              className={`color-button ${selectedColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              title={color}
            />
          ))}
        </div>
      </div>
      
      <CanvasStage
        ref={stageRef}
        onStageClick={handleStageClick}
        onStageDrag={handleStageDrag}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
      >
        {/* Render rectangles */}
        {shapes.map((shape) => (
          <Rectangle
            key={shape.id}
            rectangle={shape}
            isSelected={selectedShapeId === shape.id}
            onSelect={handleRectangleSelect}
            onDragEnd={handleRectangleDragEnd}
          />
        ))}
        
        {/* Render other users' cursors */}
        {otherCursors.map((cursor) => (
          <Cursor
            key={cursor.user_id}
            x={cursor.cursor_x}
            y={cursor.cursor_y}
            username={cursor.username}
            color={cursor.color || '#3B82F6'}
          />
        ))}
      </CanvasStage>
    </div>
  )
}
