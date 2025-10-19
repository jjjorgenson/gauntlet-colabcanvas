import { useEffect, useCallback, useRef } from 'react'
import { throttle } from '../utils/syncHelpers'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/constants'
import { generateId } from '../utils/canvasHelpers'
import objectStore from '../lib/ObjectStore'

/**
 * Custom hook for handling keyboard shortcuts in the Canvas
 * @param {Object} params
 * @param {string|null} selectedShapeId - Currently selected shape ID
 * @param {string} userId - Current user ID
 * @param {Function} onShapeDeleted - Callback when shape is deleted
 * @param {Function} onShapeDuplicated - Callback when shape is duplicated (Ctrl+D)
 * @param {Function} onShapeMoved - Callback when shape is moved
 * @param {Function} onDeselect - Callback to deselect all shapes
 */
export const useKeyboardShortcuts = ({
  selectedShapeId,
  selectedShapeIds = [],
  userId,
  updateActivity,
  onShapeDeleted,
  onShapeDuplicated,
  onShapeMoved,
  onDeselect
}) => {
  const throttleRef = useRef(null)

  // Check if we should ignore keyboard events (e.g., when typing in AI command bar)
  const shouldIgnoreKeyboardEvent = useCallback((event) => {
    const target = event.target
    const tagName = target.tagName.toLowerCase()
    
    // Ignore if typing in input, textarea, or contenteditable elements
    if (tagName === 'input' || tagName === 'textarea' || target.contentEditable === 'true') {
      return true
    }
    
    // Ignore if AI command bar is focused
    if (target.closest('.ai-command-bar')) {
      return true
    }
    
    return false
  }, [])

  // Delete selected shapes
  const deleteSelectedShape = useCallback(async () => {
    if (selectedShapeIds.length === 0 || !userId) return

    try {
      console.log('🗑️ Deleting shapes:', selectedShapeIds)
      
      // Remove from Supabase
      const { error } = await supabase
        .from(TABLES.SHAPES)
        .delete()
        .in('id', selectedShapeIds)
        .eq('created_by', userId) // Only delete own shapes

      if (error) {
        console.error('❌ Error deleting shapes:', error)
        return
      }

      // Remove from ObjectStore
      selectedShapeIds.forEach(shapeId => {
        objectStore.remove(shapeId)
        onShapeDeleted?.(shapeId)
      })
      
      console.log('✅ Shapes deleted successfully')
    } catch (error) {
      console.error('💥 Failed to delete shapes:', error)
    }
  }, [selectedShapeIds, userId, onShapeDeleted])

  // Duplicate selected shapes
  const duplicateSelectedShape = useCallback(async () => {
    if (selectedShapeIds.length === 0 || !userId) return

    try {
      console.log('📋 Duplicating shapes:', selectedShapeIds)
      
      // Get all original shapes
      const originalShapes = selectedShapeIds
        .map(id => objectStore.get(id))
        .filter(Boolean)
      
      if (originalShapes.length === 0) return

      // Create duplicated shapes with offset positions
      const duplicatedShapes = originalShapes.map((originalShape, index) => ({
        id: generateId(),
        type: originalShape.type,
        x: originalShape.x + 20 + (index * 10), // Offset by 20px + index * 10px
        y: originalShape.y + 20 + (index * 10), // Offset by 20px + index * 10px
        width: originalShape.width,
        height: originalShape.height,
        color: originalShape.color,
        rotation: originalShape.rotation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId,
        text_content: originalShape.text_content,
        font_size: originalShape.font_size
      }))

      // Insert into Supabase
      const { data, error } = await supabase
        .from(TABLES.SHAPES)
        .insert(duplicatedShapes)
        .select()

      if (error) {
        console.error('❌ Error duplicating shapes:', error)
        return
      }

      // Add to ObjectStore and select all new shapes
      data.forEach(duplicatedShape => {
        objectStore.add(duplicatedShape)
        onShapeDuplicated?.(duplicatedShape)
      })
      
      // Select all duplicated shapes
      objectStore.clearSelection()
      data.forEach(duplicatedShape => {
        objectStore.addToSelection(duplicatedShape.id)
      })
      
      console.log('✅ Shapes duplicated successfully:', data.map(s => s.id))
    } catch (error) {
      console.error('💥 Failed to duplicate shapes:', error)
    }
  }, [selectedShapeIds, userId, onShapeDuplicated])

  // Move selected shapes (throttled)
  const moveSelectedShape = useCallback(async (direction) => {
    if (selectedShapeIds.length === 0 || !userId) return

    const moveDistance = 10
    const shapes = selectedShapeIds
      .map(id => objectStore.get(id))
      .filter(Boolean)
    
    if (shapes.length === 0) return

    // Calculate new positions for all shapes
    const updates = shapes.map(shape => {
      let newX = shape.x
      let newY = shape.y

      switch (direction) {
        case 'ArrowUp':
          newY -= moveDistance
          break
        case 'ArrowDown':
          newY += moveDistance
          break
        case 'ArrowLeft':
          newX -= moveDistance
          break
        case 'ArrowRight':
          newX += moveDistance
          break
        default:
          return null
      }

      return { id: shape.id, x: newX, y: newY }
    }).filter(Boolean)

    if (updates.length === 0) return

    try {
      // Update all shapes in Supabase
      const { error } = await supabase
        .from(TABLES.SHAPES)
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedShapeIds)
        .eq('created_by', userId) // Only move own shapes

      if (error) {
        console.error('❌ Error moving shapes:', error)
        return
      }

      // Update each shape individually with new position
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from(TABLES.SHAPES)
          .update({ 
            x: update.x, 
            y: update.y, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', update.id)

        if (updateError) {
          console.error('❌ Error updating shape position:', updateError)
          continue
        }

        // Update in ObjectStore
        objectStore.update(update.id, { x: update.x, y: update.y })
        
        // Notify parent component
        onShapeMoved?.(update.id, { x: update.x, y: update.y })
      }
      
      console.log('✅ Shapes moved successfully')
    } catch (error) {
      console.error('💥 Failed to move shapes:', error)
    }
  }, [selectedShapeIds, userId, onShapeMoved])

  // Throttled version of move function
  const throttledMove = useCallback(
    throttle(moveSelectedShape, 100), // 100ms throttle
    [moveSelectedShape]
  )

  // Handle keyboard events
  const handleKeyDown = useCallback((event) => {
    // Ignore if typing in input fields
    if (shouldIgnoreKeyboardEvent(event)) {
      return
    }

    const { key, ctrlKey, shiftKey } = event

    // Prevent browser defaults for our shortcuts
    if (key === 'Delete' || key === 'Backspace' || 
        (ctrlKey && key === 'd') || 
        key.startsWith('Arrow') || 
        key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
    }

    // Handle shortcuts
    switch (key) {
      case 'Delete':
      case 'Backspace':
        if (selectedShapeIds.length > 0) {
          // Track activity for shape deletion
          if (updateActivity) updateActivity()
          deleteSelectedShape()
        }
        break

      case 'd':
        if (ctrlKey && selectedShapeIds.length > 0) {
          // Track activity for shape duplication
          if (updateActivity) updateActivity()
          duplicateSelectedShape()
        }
        break

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (selectedShapeIds.length > 0) {
          // Track activity for shape movement
          if (updateActivity) updateActivity()
          throttledMove(key)
        }
        break

      case 'Escape':
        // Track activity for deselection
        if (updateActivity) updateActivity()
        onDeselect?.()
        break

      default:
        // Do nothing for other keys
        break
    }
  }, [
    shouldIgnoreKeyboardEvent,
    selectedShapeId,
    updateActivity,
    deleteSelectedShape,
    duplicateSelectedShape,
    throttledMove,
    onDeselect
  ])

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])

  // Cleanup throttle on unmount
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        throttleRef.current.cancel?.()
      }
    }
  }, [])

  return {
    // Expose functions for manual triggering if needed
    deleteSelectedShape,
    duplicateSelectedShape,
    moveSelectedShape: throttledMove
  }
}
