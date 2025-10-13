import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a unique ID for canvas objects
 */
export const generateId = () => uuidv4()

/**
 * Create a new rectangle object
 */
export const createRectangle = (x, y, color = '#3B82F6') => ({
  id: generateId(),
  type: 'rectangle',
  x,
  y,
  width: 100,
  height: 100,
  color,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

/**
 * Update rectangle position
 */
export const updateRectanglePosition = (rectangle, newX, newY) => ({
  ...rectangle,
  x: newX,
  y: newY,
  updated_at: new Date().toISOString(),
})

/**
 * Check if a point is inside a rectangle
 */
export const isPointInRectangle = (point, rectangle) => {
  return (
    point.x >= rectangle.x &&
    point.x <= rectangle.x + rectangle.width &&
    point.y >= rectangle.y &&
    point.y <= rectangle.y + rectangle.height
  )
}

/**
 * Convert stage coordinates to canvas coordinates
 */
export const stageToCanvas = (stagePos, stageScale, stagePosition) => {
  return {
    x: (stagePos.x - stagePosition.x) / stageScale.x,
    y: (stagePos.y - stagePosition.y) / stageScale.y,
  }
}

/**
 * Convert canvas coordinates to stage coordinates
 */
export const canvasToStage = (canvasPos, stageScale, stagePosition) => {
  return {
    x: canvasPos.x * stageScale.x + stagePosition.x,
    y: canvasPos.y * stageScale.y + stagePosition.y,
  }
}

