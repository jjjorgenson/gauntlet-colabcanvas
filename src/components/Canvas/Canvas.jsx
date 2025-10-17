import { useRef, useCallback, useEffect, useState } from 'react'
import { CanvasStage } from './CanvasStage'
import { Rectangle } from './Rectangle'
import { Circle } from './Circle'
import { Text } from './Text'
import { Cursor } from './Cursor'
import { useCanvas } from '../../hooks/useCanvas'
import { useShapes } from '../../hooks/useShapes'
import { useCursors } from '../../hooks/useCursors'
import { usePresence } from '../../hooks/usePresence'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import ownershipManager from '../../utils/OwnershipManager'
import { CANVAS_CONFIG } from '../../lib/constants'

export const Canvas = ({ user, onShapeCreate }) => {
  const stageRef = useRef(null)
  const userId = user?.id
  const username = user?.user_metadata?.username || 'Anonymous'
  const displayName = user?.user_metadata?.display_name || username
  
  // Text editing state
  const [editingText, setEditingText] = useState(null)
  const [editText, setEditText] = useState('')
  
  // Use the new useShapes hook for database operations
  const {
    shapes,
    loading: shapesLoading,
    error: shapesError,
    createShape,
    updateShape,
    deleteShape,
    getOwnedShapes,
  } = useShapes(userId)

  // Keep useCanvas for local state management
  const {
    selectedShapeId,
    selectedColor,
    updateShapePosition,
    updateShapeRotation,
    updateShapeZIndex,
    updateShapeColor,
    updateShapeOwnership,
    selectShape,
    deselectAll,
    setSelectedColor,
  } = useCanvas()

  const {
    otherCursors,
    isActive,
    updateCursorPosition,
    setUserActive,
    setUserInactive,
  } = useCursors({ 
    userId, 
    username,
    displayName,
    cursorColor: selectedColor
  })

  const {
    onlineUsers,
    isOnline,
    setOnline,
    setOffline,
  } = usePresence({ 
    userId, 
    username,
    displayName
  })

  const {
    broadcastShapeChange,
  } = useRealtimeSync({ 
    shapes, 
    setShapesFromRemote: () => {}, // No longer needed with useShapes
    userId 
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

  const handleAddRectangle = useCallback(async () => {
    const stage = stageRef.current
    if (!stage || !userId) return
    
    const centerX = stage.width() / 2
    const centerY = stage.height() / 2
    
    try {
      const newShape = await createShape('rectangle', centerX, centerY, { 
        color: selectedColor 
      })
      if (newShape) {
        // Acquire ownership of the new shape
        ownershipManager.acquireOwnership(newShape.id, userId, { 
          autoRelease: true, 
          timeout: 15000 
        })
        selectShape(newShape.id)
      }
    } catch (error) {
      console.error('Error creating rectangle:', error)
    }
  }, [createShape, selectedColor, userId, selectShape])

  const handleAddCircle = useCallback(async () => {
    const stage = stageRef.current
    if (!stage || !userId) return
    
    const centerX = stage.width() / 2
    const centerY = stage.height() / 2
    
    try {
      const newShape = await createShape('circle', centerX, centerY, { 
        color: selectedColor 
      })
      if (newShape) {
        ownershipManager.acquireOwnership(newShape.id, userId, { 
          autoRelease: true, 
          timeout: 15000 
        })
        selectShape(newShape.id)
      }
    } catch (error) {
      console.error('Error creating circle:', error)
    }
  }, [createShape, selectedColor, userId, selectShape])

  const handleAddText = useCallback(async () => {
    const stage = stageRef.current
    if (!stage || !userId) return
    
    const centerX = stage.width() / 2
    const centerY = stage.height() / 2
    
    try {
      const newShape = await createShape('text', centerX, centerY, { 
        color: selectedColor,
        textContent: 'Double-click to edit',
        fontSize: 16
      })
      if (newShape) {
        ownershipManager.acquireOwnership(newShape.id, userId, { 
          autoRelease: true, 
          timeout: 15000 
        })
        selectShape(newShape.id)
      }
    } catch (error) {
      console.error('Error creating text:', error)
    }
  }, [createShape, selectedColor, userId, selectShape])

  const handleRectangleDragStart = useCallback((shapeId) => {
    // Acquire ownership when starting to drag
    ownershipManager.acquireOwnership(shapeId, userId)
  }, [userId])

  const handleRectangleDragEnd = useCallback(async (shapeId, newPosition) => {
    // Update local state immediately for responsive UI
    updateShapePosition(shapeId, newPosition)
    
    // Update database
    try {
      await updateShape(shapeId, newPosition)
    } catch (error) {
      console.error('Error updating shape position:', error)
    }
  }, [updateShapePosition, updateShape])

  const handleRectangleRotate = useCallback(async (shapeId, rotation) => {
    // Update local state immediately
    updateShapeRotation(shapeId, rotation)
    
    // Update database
    try {
      await updateShape(shapeId, { rotation })
    } catch (error) {
      console.error('Error updating shape rotation:', error)
    }
  }, [updateShapeRotation, updateShape])

  const handleRectangleResize = useCallback(async (shapeId, dimensions) => {
    // Update local state immediately
    updateShapePosition(shapeId, dimensions)
    
    // Update database
    try {
      await updateShape(shapeId, dimensions)
    } catch (error) {
      console.error('Error updating shape size:', error)
    }
  }, [updateShapePosition, updateShape])

  const handleRectangleSelect = useCallback((shapeId) => {
    selectShape(shapeId)
    
    // Try to acquire ownership when selecting
    if (userId && !ownershipManager.isOwner(shapeId, userId)) {
      ownershipManager.acquireOwnership(shapeId, userId, { 
        autoRelease: true, 
        timeout: 15000 
      })
    }
  }, [selectShape, userId])

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedShapeId || !userId) return
    
    try {
      const success = await deleteShape(selectedShapeId)
      if (success) {
        deselectAll()
      }
    } catch (error) {
      console.error('Error deleting shape:', error)
    }
  }, [selectedShapeId, deleteShape, deselectAll, userId])

  const handleColorChange = useCallback(async (color) => {
    setSelectedColor(color)
    
    if (selectedShapeId) {
      try {
        await updateShape(selectedShapeId, { color })
        updateShapeColor(selectedShapeId, color)
      } catch (error) {
        console.error('Error updating shape color:', error)
      }
    }
  }, [selectedShapeId, setSelectedColor, updateShape, updateShapeColor])

  // Text editing handlers
  const handleTextEditStart = useCallback((textShape) => {
    setEditingText(textShape)
    setEditText(textShape.textContent || 'Double-click to edit')
  }, [])

  const handleTextEditSave = useCallback(async (newText) => {
    if (editingText && newText !== editingText.textContent) {
      try {
        await updateShape(editingText.id, { textContent: newText })
      } catch (error) {
        console.error('Error updating text:', error)
      }
    }
    setEditingText(null)
    setEditText('')
  }, [editingText, updateShape])

  const handleTextEditCancel = useCallback(() => {
    setEditingText(null)
    setEditText('')
  }, [])

  // Expose shape creation functions to parent component
  useEffect(() => {
    if (onShapeCreate) {
      onShapeCreate({
        addRectangle: handleAddRectangle,
        addCircle: handleAddCircle,
        addText: handleAddText,
        selectedColor,
        onColorChange: handleColorChange
      })
    }
  }, [onShapeCreate, handleAddRectangle, handleAddCircle, handleAddText, selectedColor, handleColorChange])

  // Initialize ownership manager
  useEffect(() => {
    if (userId) {
      ownershipManager.start()
    }
    
    return () => {
      ownershipManager.stop()
    }
  }, [userId])

  return (
    <div className="canvas-container">
      <CanvasStage
        ref={stageRef}
        onStageClick={handleStageClick}
        onStageDrag={handleStageDrag}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
      >
        {/* Render shapes with new schema support */}
        {shapes.map((shape) => {
          const commonProps = {
            isSelected: selectedShapeId === shape.id,
            onSelect: handleRectangleSelect,
            onDragEnd: handleRectangleDragEnd,
            onDragStart: handleRectangleDragStart,
            onRotate: handleRectangleRotate,
            onResize: handleRectangleResize,
            onColorChange: handleColorChange,
            currentUserId: userId,
            isOwned: ownershipManager.isOwner(shape.id, userId)
          }

          // Render shape based on type
          switch (shape.type) {
            case 'rectangle':
              return <Rectangle key={shape.id} {...commonProps} rectangle={shape} />
            case 'circle':
              return <Circle key={shape.id} {...commonProps} circle={shape} />
            case 'text':
              return <Text 
                key={shape.id} 
                {...commonProps} 
                text={shape}
                onTextEditStart={handleTextEditStart}
                isEditing={editingText?.id === shape.id}
              />
            default:
              console.warn(`Unknown shape type: ${shape.type}`)
              return <Rectangle key={shape.id} {...commonProps} rectangle={shape} />
          }
        })}
        
        {/* Render other users' cursors */}
        {otherCursors.map((cursor) => (
          <Cursor
            key={cursor.userId}
            x={cursor.cursorX}
            y={cursor.cursorY}
            username={cursor.username}
            color={cursor.cursorColor || '#3B82F6'}
          />
        ))}
      </CanvasStage>
      
      {/* HTML input overlay for text editing */}
      {editingText && (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTextEditSave(editText)
            } else if (e.key === 'Escape') {
              handleTextEditCancel()
            }
          }}
          onBlur={() => handleTextEditSave(editText)}
          style={{
            position: 'absolute',
            left: editingText.x,
            top: editingText.y,
            fontSize: editingText.fontSize || 16,
            fontFamily: 'Arial, sans-serif',
            color: editingText.color,
            background: 'white',
            border: '2px solid #3b82f6',
            outline: 'none',
            padding: '2px 4px',
            borderRadius: '2px',
            minWidth: '100px',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
          autoFocus
        />
      )}
    </div>
  )
}
