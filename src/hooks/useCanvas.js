import { useState, useCallback } from 'react'
import { createRectangle, updateRectanglePosition } from '../utils/canvasHelpers'

export const useCanvas = () => {
  const [shapes, setShapes] = useState([])
  const [selectedShapeId, setSelectedShapeId] = useState(null)
  const [selectedColor, setSelectedColor] = useState('#3B82F6')

  const addRectangle = useCallback((x, y) => {
    const newRectangle = createRectangle(x, y, selectedColor)
    setShapes(prev => [...prev, newRectangle])
    return newRectangle
  }, [selectedColor])

  const updateShapePosition = useCallback((shapeId, newPosition) => {
    setShapes(prev => 
      prev.map(shape => 
        shape.id === shapeId 
          ? updateRectanglePosition(shape, newPosition.x, newPosition.y)
          : shape
      )
    )
  }, [])

  const selectShape = useCallback((shapeId) => {
    setSelectedShapeId(shapeId)
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedShapeId(null)
  }, [])

  const setShapesFromRemote = useCallback((remoteShapes) => {
    setShapes(remoteShapes)
  }, [])

  return {
    shapes,
    selectedShapeId,
    selectedColor,
    addRectangle,
    updateShapePosition,
    selectShape,
    deselectAll,
    setShapesFromRemote,
    setSelectedColor,
  }
}

