import { useRef, useCallback, useEffect } from 'react'
import Konva from 'konva'
import { CanvasStage } from './CanvasStage'
import { Rectangle } from './Rectangle'
import { Circle } from './Circle'
import { TextBox } from './TextBox'
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
    addCircle,
    addTextBox,
    updateShapePosition,
    selectShape,
    deselectAll,
    setShapesFromRemote,
    setSelectedColor,
    objectStore,
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
    isConnected,
    pendingChangesCount,
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
    // Handle stage panning - position is automatically updated by Konva
  }, [])

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return
    
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    
    if (!pointer) return
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    
    const newScale = e.evt.deltaY > 0 
      ? Math.max(CANVAS_CONFIG.MIN_ZOOM, oldScale - CANVAS_CONFIG.ZOOM_STEP)
      : Math.min(CANVAS_CONFIG.MAX_ZOOM, oldScale + CANVAS_CONFIG.ZOOM_STEP)
    
    // Smooth animated zoom
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    
    // Use Konva's built-in animation
    stage.to({
      scaleX: newScale,
      scaleY: newScale,
      x: newPos.x,
      y: newPos.y,
      duration: CANVAS_CONFIG.ZOOM_ANIMATION_DURATION / 1000, // Convert to seconds
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        stage.batchDraw()
      }
    })
  }, [])

  const handleMouseMove = useCallback((e) => {
    // Enable cursor tracking for real-time collaboration
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

  const handleAddCircle = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    
    const centerX = stage.width() / 2
    const centerY = stage.height() / 2
    
    const newCircle = addCircle(centerX, centerY)
    broadcastShapeChange(newCircle, 'create')
  }, [addCircle, broadcastShapeChange])

  const handleAddTextBox = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    
    const centerX = stage.width() / 2
    const centerY = stage.height() / 2
    
    const newTextBox = addTextBox(centerX, centerY)
    broadcastShapeChange(newTextBox, 'create')
  }, [addTextBox, broadcastShapeChange])

  // No need to pass data to parent - we'll handle toolbar directly

  const handleRectangleDragEnd = useCallback((shapeId, newPosition) => {
    updateShapePosition(shapeId, newPosition)
    
    const updatedShape = shapes.find(s => s.id === shapeId)
    if (updatedShape) {
      const shapeWithNewPos = { ...updatedShape, ...newPosition }
      broadcastShapeChange(shapeWithNewPos, 'update')
    }
  }, [shapes, updateShapePosition, broadcastShapeChange])

  const handleShapeSelect = useCallback((shapeId) => {
    selectShape(shapeId)
  }, [selectShape])

  const handleShapeDragEnd = useCallback((shapeId, newPosition) => {
    updateShapePosition(shapeId, newPosition)
    
    const updatedShape = shapes.find(s => s.id === shapeId)
    if (updatedShape) {
      const shapeWithNewPos = { ...updatedShape, ...newPosition }
      broadcastShapeChange(shapeWithNewPos, 'update')
    }
  }, [shapes, updateShapePosition, broadcastShapeChange])

  const handleShapeDragMoveBroadcast = useCallback((shapeId, newPosition) => {
    // Broadcast position updates during drag for real-time sync
    const updatedShape = shapes.find(s => s.id === shapeId)
    if (updatedShape) {
      const shapeWithNewPos = { ...updatedShape, ...newPosition }
      broadcastShapeChange(shapeWithNewPos, 'update')
    }
  }, [shapes, broadcastShapeChange])

  const handleTextChange = useCallback((shapeId, newText) => {
    // Update ObjectStore
    objectStore.update(shapeId, { text_content: newText })
    
    // Broadcast to database
    const updatedShape = objectStore.get(shapeId)
    if (updatedShape) {
      broadcastShapeChange(updatedShape, 'update')
    }
  }, [broadcastShapeChange, objectStore])

  const handleShapeTransform = useCallback((shapeId, transform) => {
    // Update ObjectStore with new dimensions and position
    objectStore.update(shapeId, {
      x: transform.x,
      y: transform.y,
      width: transform.width,
      height: transform.height
    })
    
    // Broadcast to database (throttled updates will be handled by the shape component)
    const updatedShape = objectStore.get(shapeId)
    if (updatedShape) {
      broadcastShapeChange(updatedShape, 'update')
    }
  }, [broadcastShapeChange, objectStore])

  return (
    <div className="canvas-container">
      {/* Real-time status banner */}
      {(!isConnected || pendingChangesCount > 0) && (
        <div className="realtime-status-banner">
          {!isConnected && (
            <span className="status-disconnected">
              ⚠️ Real-time connection lost. Changes may be delayed.
            </span>
          )}
          {pendingChangesCount > 0 && (
            <span className="status-pending">
              📤 {pendingChangesCount} change{pendingChangesCount !== 1 ? 's' : ''} pending sync
            </span>
          )}
        </div>
      )}

      {/* Simple toolbar integrated into canvas */}
      <div className="canvas-toolbar">
        <div className="shape-buttons">
          <button 
            onClick={handleAddRectangle}
            className="toolbar-button primary"
          >
            + Rectangle
          </button>
          <button 
            onClick={handleAddCircle}
            className="toolbar-button primary"
          >
            + Circle
          </button>
          <button 
            onClick={handleAddTextBox}
            className="toolbar-button primary"
          >
            + Text
          </button>
        </div>
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
        selectedShapeId={selectedShapeId}
      >
        {/* Render all shapes */}
        {shapes.map((shape) => {
          const isSelected = selectedShapeId === shape.id
          
          switch (shape.type) {
            case 'rectangle':
              return (
                <Rectangle
                  key={shape.id}
                  rectangle={shape}
                  isSelected={isSelected}
                  onSelect={handleShapeSelect}
                  onDragEnd={handleShapeDragEnd}
                  onDragMoveBroadcast={handleShapeDragMoveBroadcast}
                  onTransform={handleShapeTransform}
                  onTransformEnd={handleShapeTransform}
                />
              )
            case 'circle':
              return (
                <Circle
                  key={shape.id}
                  circle={shape}
                  isSelected={isSelected}
                  onSelect={handleShapeSelect}
                  onDragEnd={handleShapeDragEnd}
                  onDragMoveBroadcast={handleShapeDragMoveBroadcast}
                  onTransform={handleShapeTransform}
                  onTransformEnd={handleShapeTransform}
                />
              )
            case 'text':
              return (
                <TextBox
                  key={shape.id}
                  textBox={shape}
                  isSelected={isSelected}
                  isOwnedByMe={true}
                  isOwnedByOther={false}
                  onSelect={handleShapeSelect}
                  onDragEnd={handleShapeDragEnd}
                  onDragMoveBroadcast={handleShapeDragMoveBroadcast}
                  onTextChange={handleTextChange}
                  onTransform={handleShapeTransform}
                  onTransformEnd={handleShapeTransform}
                />
              )
            default:
              return null
          }
        })}
        
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
