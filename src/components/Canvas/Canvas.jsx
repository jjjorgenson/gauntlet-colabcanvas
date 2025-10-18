import { useRef, useCallback, useEffect, useState } from 'react'
import Konva from 'konva'
import { CanvasStage } from './CanvasStage'
import { Rectangle } from './Rectangle'
import { Circle } from './Circle'
import { TextBox } from './TextBox'
import { Cursor } from './Cursor'
import { useCanvas } from '../../hooks/useCanvas'
import { useCursors } from '../../hooks/useCursors'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { CANVAS_CONFIG, REALTIME_CONFIG } from '../../lib/constants'
import { throttle } from '../../utils/syncHelpers'
import objectStore from '../../lib/ObjectStore'

export const Canvas = ({ user, onlineUsers }) => {
  const stageRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  
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
    username: user?.user_metadata?.username || 'Anonymous',
    isDragging // Pass drag state to cursor hook
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
        // Debug: Log mouse move events
        if (isDragging) {
          console.log('Mouse move during drag (Stage level):', { x: pointer.x, y: pointer.y })
        }
        updateCursorPosition(pointer.x, pointer.y)
      }
    }
  }, [updateCursorPosition, isDragging])

  // Drag state handlers for cursor coordination
  const handleDragStart = useCallback((shapeId) => {
    console.log('Drag started for shape:', shapeId)
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback((shapeId, newPosition) => {
    console.log('Drag ended for shape:', shapeId)
    setIsDragging(false)
    updateShapePosition(shapeId, newPosition)
    broadcastShapeChange(objectStore.get(shapeId), 'update')
  }, [updateShapePosition, broadcastShapeChange, objectStore])

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
    setIsDragging(false) // End drag state
    updateShapePosition(shapeId, newPosition)
    
    const updatedShape = shapes.find(s => s.id === shapeId)
    if (updatedShape) {
      const shapeWithNewPos = { ...updatedShape, ...newPosition }
      broadcastShapeChange(shapeWithNewPos, 'update')
    }
  }, [shapes, updateShapePosition, broadcastShapeChange])

  const handleShapeDragMoveBroadcast = useCallback((shapeId, newPosition) => {
    // Update local ObjectStore immediately (no throttling for instant UI response)
    objectStore.update(shapeId, newPosition)
    
    // NO database broadcast during drag - only sync on drag end for performance
    // This makes local editing completely smooth and snappy
  }, [])

  const handleTextChange = useCallback((shapeId, newText) => {
    // Update ObjectStore
    objectStore.update(shapeId, { text_content: newText })
    
    // Broadcast to database
    const updatedShape = objectStore.get(shapeId)
    if (updatedShape) {
      broadcastShapeChange(updatedShape, 'update')
    }
  }, [broadcastShapeChange, objectStore])

  const changeShapeColor = useCallback((shapeIdOrIds, newColor) => {
    // Handle both single shape ID and array of shape IDs
    const shapeIds = Array.isArray(shapeIdOrIds) ? shapeIdOrIds : [shapeIdOrIds]
    
    // Update ObjectStore with new color for all shapes
    shapeIds.forEach(shapeId => {
      objectStore.update(shapeId, { color: newColor })
    })
    
    // Broadcast color changes to database for all shapes
    shapeIds.forEach(shapeId => {
      const updatedShape = objectStore.get(shapeId)
      if (updatedShape) {
        broadcastShapeChange(updatedShape, 'update')
      }
    })
  }, [broadcastShapeChange, objectStore])

  const handleColorClick = useCallback((color) => {
    if (selectedShapeId) {
      // Change color of selected shape (immediate feedback)
      changeShapeColor(selectedShapeId, color)
    } else {
      // Set color for new shapes (current behavior)
      setSelectedColor(color)
    }
  }, [selectedShapeId, changeShapeColor, setSelectedColor])

  const handleShapeTransform = useCallback((shapeId, transform) => {
    // Update local ObjectStore immediately (no throttling for instant UI response)
    objectStore.update(shapeId, {
      x: transform.x,
      y: transform.y,
      width: transform.width,
      height: transform.height,
      rotation: transform.rotation
    })
    
    // NO database broadcast during transform - only sync on transform end for performance
    // This makes local resizing completely smooth and snappy
  }, [])

  const handleShapeTransformEnd = useCallback((shapeId, transform) => {
    // Update local ObjectStore with final position
    objectStore.update(shapeId, {
      x: transform.x,
      y: transform.y,
      width: transform.width,
      height: transform.height,
      rotation: transform.rotation
    })
    
    // Broadcast final position to database (only on transform end)
    const updatedShape = objectStore.get(shapeId)
    if (updatedShape) {
      broadcastShapeChange(updatedShape, 'update')
    }
  }, [broadcastShapeChange])

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
          {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => {
            // Determine which color should show as 'active'
            let isActive = false
            if (selectedShapeId) {
              // If a shape is selected, show its current color as active
              const selectedShape = objectStore.get(selectedShapeId)
              isActive = selectedShape?.color === color
            } else {
              // If no shape selected, show selectedColor for new shapes as active
              isActive = selectedColor === color
            }
            
            return (
              <button
                key={color}
                className={`color-button ${isActive ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
                title={color}
              />
            )
          })}
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
                  onDragStart={handleDragStart}
                  onDragEnd={handleShapeDragEnd}
                  onDragMoveBroadcast={handleShapeDragMoveBroadcast}
                  onTransform={handleShapeTransform}
                  onTransformEnd={handleShapeTransformEnd}
                  onCursorUpdate={updateCursorPosition}
                />
              )
            case 'circle':
              return (
                <Circle
                  key={shape.id}
                  circle={shape}
                  isSelected={isSelected}
                  onSelect={handleShapeSelect}
                  onDragStart={handleDragStart}
                  onDragEnd={handleShapeDragEnd}
                  onDragMoveBroadcast={handleShapeDragMoveBroadcast}
                  onTransform={handleShapeTransform}
                  onTransformEnd={handleShapeTransformEnd}
                  onCursorUpdate={updateCursorPosition}
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
                  onDragStart={handleDragStart}
                  onDragEnd={handleShapeDragEnd}
                  onDragMoveBroadcast={handleShapeDragMoveBroadcast}
                  onTextChange={handleTextChange}
                  onTransform={handleShapeTransform}
                  onTransformEnd={handleShapeTransformEnd}
                  onCursorUpdate={updateCursorPosition}
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
            isDragging={cursor.isDragging || false}
          />
        ))}
      </CanvasStage>
    </div>
  )
}
