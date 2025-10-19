import { useState, useCallback, useSyncExternalStore } from 'react'
import { 
  createRectangle, 
  createCircle, 
  createTextBox, 
  updateShapePosition as updateShapePositionHelper
} from '../utils/canvasHelpers'
import objectStore from '../lib/ObjectStore'

export const useCanvas = () => {
  // Use external store for objects and selection
  const shapes = useSyncExternalStore(
    objectStore.subscribe,
    objectStore.getAll
  )
  const selectedShapeId = useSyncExternalStore(
    objectStore.subscribe,
    objectStore.getSelected
  )
  const selectedShapeIds = useSyncExternalStore(
    objectStore.subscribe,
    objectStore.getSelectedIds
  )
  
  // Keep color selection in React state (UI-only concern)
  const [selectedColor, setSelectedColor] = useState('#3B82F6')

  const addRectangle = useCallback((x, y) => {
    const newRectangle = createRectangle(x, y, selectedColor)
    objectStore.add(newRectangle)
    return newRectangle
  }, [selectedColor])

  const addCircle = useCallback((x, y) => {
    const newCircle = createCircle(x, y, selectedColor)
    objectStore.add(newCircle)
    return newCircle
  }, [selectedColor])

  const addTextBox = useCallback((x, y) => {
    const newTextBox = createTextBox(x, y, selectedColor)
    objectStore.add(newTextBox)
    return newTextBox
  }, [selectedColor])

  const updateShapePosition = useCallback((shapeId, newPosition) => {
    const shape = objectStore.get(shapeId)
    if (shape) {
      const updatedShape = updateShapePositionHelper(shape, newPosition.x, newPosition.y)
      objectStore.update(shapeId, updatedShape)
    }
  }, [])

  const selectShape = useCallback((shapeId) => {
    objectStore.setSelected(shapeId)
  }, [])

  const deselectAll = useCallback(() => {
    objectStore.clearSelection()
  }, [])

  const addToSelection = useCallback((shapeId) => {
    objectStore.addToSelection(shapeId)
  }, [])

  const removeFromSelection = useCallback((shapeId) => {
    objectStore.removeFromSelection(shapeId)
  }, [])

  const toggleSelection = useCallback((shapeId) => {
    objectStore.toggleSelection(shapeId)
  }, [])

  const isSelected = useCallback((shapeId) => {
    return objectStore.isSelected(shapeId)
  }, [])

  const setShapesFromRemote = useCallback((remoteShapes) => {
    objectStore.setAll(remoteShapes)
  }, [])

  return {
    shapes,
    selectedShapeId,
    selectedShapeIds,
    selectedColor,
    addRectangle,
    addCircle,
    addTextBox,
    updateShapePosition,
    selectShape,
    deselectAll,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    isSelected,
    setShapesFromRemote,
    setSelectedColor,
    // Expose objectStore for direct access if needed
    objectStore,
  }
}

