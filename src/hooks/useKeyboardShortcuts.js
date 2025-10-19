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
 * @param {Function} onShapeDuplicated - Callback when shape is duplicated
 * @param {Function} onShapeMoved - Callback when shape is moved
 * @param {Function} onDeselect - Callback to deselect all shapes
 */
export const useKeyboardShortcuts = ({
  selectedShapeId,
  userId,
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

  // Delete selected shape
  const deleteSelectedShape = useCallback(async () => {
    if (!selectedShapeId || !userId) return

    try {
      console.log('🗑️ Deleting shape:', selectedShapeId)
      
      // Remove from Supabase
      const { error } = await supabase
        .from(TABLES.SHAPES)
        .delete()
        .eq('id', selectedShapeId)
        .eq('created_by', userId) // Only delete own shapes

      if (error) {
        console.error('❌ Error deleting shape:', error)
        return
      }

      // Remove from ObjectStore
      objectStore.remove(selectedShapeId)
      
      // Notify parent component
      onShapeDeleted?.(selectedShapeId)
      
      console.log('✅ Shape deleted successfully')
    } catch (error) {
      console.error('💥 Failed to delete shape:', error)
    }
  }, [selectedShapeId, userId, onShapeDeleted])

  // Duplicate selected shape
  const duplicateSelectedShape = useCallback(async () => {
    if (!selectedShapeId || !userId) return

    try {
      const originalShape = objectStore.get(selectedShapeId)
      if (!originalShape) return

      console.log('📋 Duplicating shape:', selectedShapeId)
      
      // Create new shape with same properties but offset position
      const duplicatedShape = {
        id: generateId(),
        type: originalShape.type,
        x: originalShape.x + 20, // Offset by 20px
        y: originalShape.y + 20, // Offset by 20px
        width: originalShape.width,
        height: originalShape.height,
        color: originalShape.color,
        rotation: originalShape.rotation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId,
        text_content: originalShape.text_content,
        font_size: originalShape.font_size
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from(TABLES.SHAPES)
        .insert(duplicatedShape)
        .select()
        .single()

      if (error) {
        console.error('❌ Error duplicating shape:', error)
        return
      }

      // Add to ObjectStore
      objectStore.add(data)
      
      // Select the new shape
      objectStore.setSelected(data.id)
      
      // Notify parent component
      onShapeDuplicated?.(data)
      
      console.log('✅ Shape duplicated successfully:', data.id)
    } catch (error) {
      console.error('💥 Failed to duplicate shape:', error)
    }
  }, [selectedShapeId, userId, onShapeDuplicated])

  // Move selected shape (throttled)
  const moveSelectedShape = useCallback(async (direction) => {
    if (!selectedShapeId || !userId) return

    const shape = objectStore.get(selectedShapeId)
    if (!shape) return

    const moveDistance = 10
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
        return
    }

    try {
      // Update in Supabase
      const { error } = await supabase
        .from(TABLES.SHAPES)
        .update({ 
          x: newX, 
          y: newY, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedShapeId)
        .eq('created_by', userId) // Only move own shapes

      if (error) {
        console.error('❌ Error moving shape:', error)
        return
      }

      // Update in ObjectStore
      objectStore.update(selectedShapeId, { x: newX, y: newY })
      
      // Notify parent component
      onShapeMoved?.(selectedShapeId, { x: newX, y: newY })
      
    } catch (error) {
      console.error('💥 Failed to move shape:', error)
    }
  }, [selectedShapeId, userId, onShapeMoved])

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

    const { key, ctrlKey } = event

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
        if (selectedShapeId) {
          deleteSelectedShape()
        }
        break

      case 'd':
        if (ctrlKey && selectedShapeId) {
          duplicateSelectedShape()
        }
        break

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (selectedShapeId) {
          throttledMove(key)
        }
        break

      case 'Escape':
        onDeselect?.()
        break

      default:
        // Do nothing for other keys
        break
    }
  }, [
    shouldIgnoreKeyboardEvent,
    selectedShapeId,
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
