import { useRef, useCallback, useEffect, useState } from 'react'
import Konva from 'konva'
import { Transformer } from 'react-konva'
import { CanvasStage } from './CanvasStage'
import { Rectangle } from './Rectangle'
import { Circle } from './Circle'
import { TextBox } from './TextBox'
import { Cursor } from './Cursor'
import { useCanvas } from '../../hooks/useCanvas'
import { useCursors } from '../../hooks/useCursors'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { CANVAS_CONFIG, REALTIME_CONFIG, TABLES } from '../../lib/constants'
import { throttle } from '../../utils/syncHelpers'
import objectStore from '../../lib/ObjectStore'
import ownershipManager from '../../utils/OwnershipManager'
import { supabase } from '../../lib/supabase'

export const Canvas = ({ user, onlineUsers }) => {
  const stageRef = useRef(null)
  const transformerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [ownedShapes, setOwnedShapes] = useState(new Set()) // Track shapes owned by current user
  
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

  // Release current ownership (click canvas/other shape)
  const releaseCurrentOwnership = useCallback(async () => {
    if (!user?.id || ownedShapes.size === 0) return

    const ownedShapesArray = Array.from(ownedShapes)
    
    for (const shapeId of ownedShapesArray) {
      try {
        // Release ownership in database
        const { error } = await supabase
          .from(TABLES.SHAPES)
          .update({ owner_id: null, ownership_timestamp: null })
          .eq('id', shapeId)
          
        if (error) {
          console.error('Error releasing ownership:', error)
          continue
        }

        // Clear timeout
        ownershipManager.release(shapeId)

        // Update ObjectStore with ownership release
        const ownershipReleaseData = { owner_id: null, ownership_timestamp: null }
        objectStore.update(shapeId, ownershipReleaseData)
        console.log('🔄 Ownership released manually:', { shapeId, userId: user.id })

        // Update local state
        setOwnedShapes(prev => {
          const newSet = new Set(prev)
          newSet.delete(shapeId)
          return newSet
        })

        // Broadcast ownership release
        const updatedShape = objectStore.get(shapeId)
        if (updatedShape) {
          broadcastShapeChange({ ...updatedShape, ...ownershipReleaseData }, 'update')
        }
      } catch (error) {
        console.error('Error releasing ownership for shape:', shapeId, error)
      }
    }
  }, [user?.id, ownedShapes, broadcastShapeChange])

  // Handle ownership timeout
  const handleOwnershipTimeout = useCallback(async (shapeId) => {
    try {
      // Release ownership in database
      const { error } = await supabase
        .from(TABLES.SHAPES)
        .update({ owner_id: null, ownership_timestamp: null })
        .eq('id', shapeId)
        
      if (error) {
        console.error('Error releasing ownership on timeout:', error)
        return
      }

      // Update ObjectStore with ownership release
      const ownershipReleaseData = { owner_id: null, ownership_timestamp: null }
      objectStore.update(shapeId, ownershipReleaseData)
      console.log('⏰ Ownership released by timeout:', { shapeId, timestamp: new Date().toISOString() })

      // Update local state
      setOwnedShapes(prev => {
        const newSet = new Set(prev)
        newSet.delete(shapeId)
        return newSet
      })

      // Broadcast ownership release
      const updatedShape = objectStore.get(shapeId)
      if (updatedShape) {
        broadcastShapeChange({ ...updatedShape, ...ownershipReleaseData }, 'update')
      }
    } catch (error) {
      console.error('Error in handleOwnershipTimeout:', error)
    }
  }, [broadcastShapeChange])

  // Ownership acquisition handler (single transaction)
  const acquireOwnership = useCallback(async (shapeId) => {
    if (!user?.id) return false

    try {
      console.log('🔐 Attempting to acquire ownership for shape:', shapeId)
      
      // Single transaction: check ownership + acquire if unowned
      const { data, error } = await supabase
        .from(TABLES.SHAPES)
        .update({ 
          owner_id: user.id, 
          ownership_timestamp: new Date().toISOString() 
        })
        .eq('id', shapeId)
        .is('owner_id', null) // Only if unowned
        .select() // Return the updated row
        
      if (error) {
        console.error('❌ Error acquiring ownership:', error)
        return false
      }

      console.log('📊 Ownership acquisition result:', { data, error })

      if (data && data.length > 0) {
        // Successfully acquired ownership
        console.log('✅ Ownership acquired successfully!')
        setOwnedShapes(prev => new Set(prev).add(shapeId))
        
        // Update ObjectStore with ownership data
        const ownershipData = { 
          owner_id: user.id, 
          ownership_timestamp: new Date().toISOString() 
        }
        objectStore.update(shapeId, ownershipData)
        console.log('✅ Ownership acquired:', { shapeId, userId: user.id, timestamp: ownershipData.ownership_timestamp })
        
        // Start 15-second timeout
        ownershipManager.acquire(shapeId, user.id, (timeoutShapeId) => {
          handleOwnershipTimeout(timeoutShapeId)
        })
        
        // Broadcast ownership change
        const updatedShape = objectStore.get(shapeId)
        if (updatedShape) {
          broadcastShapeChange({ ...updatedShape, ...ownershipData }, 'update')
        }
        
        return true
      } else {
        console.log('❌ Failed to acquire ownership - shape may already be owned')
        return false // Shape already owned
      }
    } catch (error) {
      console.error('❌ Error in acquireOwnership:', error)
      return false
    }
  }, [user?.id, broadcastShapeChange, handleOwnershipTimeout])

  const handleStageClick = useCallback((e) => {
    // Release current ownership when clicking on empty space
    releaseCurrentOwnership()
    // Deselect all shapes when clicking on empty space
    deselectAll()
  }, [deselectAll, releaseCurrentOwnership])

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

  const handleShapeSelect = useCallback(async (shapeId) => {
    console.log('🎯 handleShapeSelect called for shape:', shapeId)
    
    // Get the shape to check current ownership
    const shape = objectStore.get(shapeId)
    if (!shape) {
      console.log('❌ Shape not found in ObjectStore:', shapeId)
      return
    }

    console.log('📋 Shape details:', { 
      id: shape.id, 
      type: shape.type, 
      owner_id: shape.owner_id, 
      current_user: user?.id 
    })

    // Always release current ownership first (single ownership model)
    await releaseCurrentOwnership()

    // If shape is unowned, try to acquire ownership
    if (!shape.owner_id) {
      console.log('🔓 Shape is unowned, attempting to acquire ownership...')
      const ownershipAcquired = await acquireOwnership(shapeId)
      if (ownershipAcquired) {
        console.log('✅ Ownership acquired, selecting shape')
        selectShape(shapeId)
      } else {
        console.log('❌ Failed to acquire ownership')
      }
    } 
    // If shape is owned by current user, just select it
    else if (shape.owner_id === user?.id) {
      console.log('👤 Shape owned by current user, selecting')
      selectShape(shapeId)
    }
    // If shape is owned by another user, don't select (no transform handles)
    else {
      console.log('🚫 Shape is owned by another user, cannot select')
    }
  }, [selectShape, acquireOwnership, releaseCurrentOwnership, user?.id])

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

  // Attach transformer to selected shape
  useEffect(() => {
    if (selectedShapeId && transformerRef.current) {
      const stage = stageRef.current
      if (stage) {
        const selectedNode = stage.findOne(`#${selectedShapeId}`)
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode])
          transformerRef.current.getLayer().batchDraw()
        }
      }
    }
  }, [selectedShapeId])

  // Periodic cleanup of expired ownership (every 15 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      if (!user?.id) return

      try {
        // Call the manual cleanup function to clean up expired ownership
        const { data, error } = await supabase
          .rpc('manual_cleanup_ownership')

        if (error) {
          // If function doesn't exist yet, just log and continue
          if (error.code === 'PGRST202') {
            console.log('📝 Database cleanup function not yet installed - run ownership-cleanup-function.sql')
            return
          }
          console.error('Error during periodic ownership cleanup:', error)
          return
        }

        if (data && data.length > 0) {
          const { cleaned_count, remaining_owned } = data[0]
          if (cleaned_count > 0) {
            console.log(`🧹 Periodic cleanup: Released ${cleaned_count} expired ownerships, ${remaining_owned} still owned`)
            
            // Update local state to reflect the cleanup
            setOwnedShapes(prev => {
              const newSet = new Set()
              // Keep only shapes that are still owned by current user
              for (const shapeId of prev) {
                const shape = objectStore.get(shapeId)
                if (shape && shape.owner_id === user.id) {
                  newSet.add(shapeId)
                }
              }
              return newSet
            })
          }
        }
      } catch (error) {
        console.error('Error in periodic ownership cleanup:', error)
      }
    }, 15000) // Run every 15 seconds

    return () => clearInterval(cleanupInterval)
  }, [user?.id])

  // Cleanup on component unmount (logout)
  useEffect(() => {
    return () => {
      // Release all owned shapes when component unmounts
      if (user?.id && ownedShapes.size > 0) {
        releaseCurrentOwnership()
      }
    }
  }, [user?.id, ownedShapes.size, releaseCurrentOwnership])



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
          const isOwnedByMe = shape.owner_id === user?.id
          const isOwnedByOther = shape.owner_id && shape.owner_id !== user?.id
          
          switch (shape.type) {
            case 'rectangle':
              return (
                <Rectangle
                  key={shape.id}
                  rectangle={shape}
                  isSelected={isSelected}
                  isOwnedByMe={isOwnedByMe}
                  isOwnedByOther={isOwnedByOther}
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
                  isOwnedByMe={isOwnedByMe}
                  isOwnedByOther={isOwnedByOther}
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
                  isOwnedByMe={isOwnedByMe}
                  isOwnedByOther={isOwnedByOther}
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
        
        {/* Transformer for selected shapes */}
        {selectedShapeId && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox
              }
              return newBox
            }}
            keepRatio={false}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            rotateEnabled={true}
            borderEnabled={false}
            anchorFill="#1F2937"
            anchorStroke="#1F2937"
            anchorSize={8}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          />
        )}
        
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
