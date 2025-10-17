import { useState, useCallback } from 'react'
import { createRectangle } from '../utils/shapeFactory'
import { updateRectanglePosition } from '../utils/canvasHelpers'

export const useCanvas = () => {
  const [shapes, setShapes] = useState([])
  const [selectedShapeId, setSelectedShapeId] = useState(null)
  const [selectedColor, setSelectedColor] = useState('#3B82F6')

  const addRectangle = useCallback((x, y, createdBy = null) => {
    const newRectangle = createRectangle(x, y, selectedColor, createdBy)
    setShapes(prev => [...prev, newRectangle])
    return newRectangle
  }, [selectedColor])

  const updateShapePosition = useCallback((shapeId, newPosition) => {
    setShapes(prev => 
      prev.map(shape => 
        shape.id === shapeId 
          ? {
              ...updateRectanglePosition(shape, newPosition.x, newPosition.y),
              updatedAt: new Date().toISOString()
            }
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

  const updateShapeRotation = useCallback((shapeId, rotation) => {
    setShapes(prev => 
      prev.map(shape => 
        shape.id === shapeId 
          ? { ...shape, rotation, updatedAt: new Date().toISOString() }
          : shape
      )
    )
  }, [])

  const updateShapeZIndex = useCallback((shapeId, zIndex) => {
    setShapes(prev => 
      prev.map(shape => 
        shape.id === shapeId 
          ? { ...shape, zIndex, updatedAt: new Date().toISOString() }
          : shape
      )
    )
  }, [])

  const updateShapeColor = useCallback((shapeId, color) => {
    setShapes(prev => 
      prev.map(shape => 
        shape.id === shapeId 
          ? { ...shape, color, updatedAt: new Date().toISOString() }
          : shape
      )
    )
  }, [])

  const updateShapeOwnership = useCallback((shapeId, ownerId) => {
    setShapes(prev => 
      prev.map(shape => 
        shape.id === shapeId 
          ? { 
              ...shape, 
              ownerId, 
              ownershipTimestamp: ownerId ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString() 
            }
          : shape
      )
    )
  }, [])

  return {
    shapes,
    selectedShapeId,
    selectedColor,
    addRectangle,
    updateShapePosition,
    updateShapeRotation,
    updateShapeZIndex,
    updateShapeColor,
    updateShapeOwnership,
    selectShape,
    deselectAll,
    setShapesFromRemote,
    setSelectedColor,
  }
}

