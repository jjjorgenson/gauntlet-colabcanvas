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
 * Create a new circle object
 */
export const createCircle = (x, y, color = '#3B82F6') => ({
  id: generateId(),
  type: 'circle',
  x,
  y,
  width: 100,
  height: 100,
  color,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

/**
 * Create a new text box object
 */
export const createTextBox = (x, y, color = '#3B82F6', text = 'Double-click to edit') => ({
  id: generateId(),
  type: 'text',
  x,
  y,
  width: 200,
  height: 50,
  color,
  text_content: text,
  font_size: 16,
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
 * Update circle position
 */
export const updateCirclePosition = (circle, newX, newY) => ({
  ...circle,
  x: newX,
  y: newY,
  updated_at: new Date().toISOString(),
})

/**
 * Update text box position
 */
export const updateTextBoxPosition = (textBox, newX, newY) => ({
  ...textBox,
  x: newX,
  y: newY,
  updated_at: new Date().toISOString(),
})

/**
 * Update any shape position (generic)
 */
export const updateShapePosition = (shape, newX, newY) => {
  switch (shape.type) {
    case 'rectangle':
      return updateRectanglePosition(shape, newX, newY)
    case 'circle':
      return updateCirclePosition(shape, newX, newY)
    case 'text':
      return updateTextBoxPosition(shape, newX, newY)
    default:
      return shape
  }
}

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

