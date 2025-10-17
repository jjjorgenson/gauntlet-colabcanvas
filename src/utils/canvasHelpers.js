import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a unique ID for canvas objects
 */
export const generateId = () => uuidv4()

/**
 * Create a new rectangle object with all required schema fields
 */
export const createRectangle = (x, y, color = '#3B82F6', createdBy = null) => ({
  id: generateId(),
  type: 'rectangle',
  x,
  y,
  width: 100,
  height: 100,
  rotation: 0,
  color,
  zIndex: 0,
  textContent: null,
  fontSize: 16,
  ownerId: null,
  ownershipTimestamp: null,
  createdBy,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

/**
 * Update rectangle position
 */
export const updateRectanglePosition = (rectangle, newX, newY) => ({
  ...rectangle,
  x: newX,
  y: newY,
  updatedAt: new Date().toISOString(),
})

/**
 * Update rectangle size
 */
export const updateRectangleSize = (rectangle, newWidth, newHeight) => ({
  ...rectangle,
  width: newWidth,
  height: newHeight,
  updatedAt: new Date().toISOString(),
})

/**
 * Update rectangle rotation
 */
export const updateRectangleRotation = (rectangle, newRotation) => ({
  ...rectangle,
  rotation: newRotation,
  updatedAt: new Date().toISOString(),
})

/**
 * Update rectangle color
 */
export const updateRectangleColor = (rectangle, newColor) => ({
  ...rectangle,
  color: newColor,
  updatedAt: new Date().toISOString(),
})

/**
 * Update rectangle z-index
 */
export const updateRectangleZIndex = (rectangle, newZIndex) => ({
  ...rectangle,
  zIndex: newZIndex,
  updatedAt: new Date().toISOString(),
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

/**
 * Convert database shape record to JavaScript object
 */
export const shapeFromDB = (dbShape) => ({
  id: dbShape.id,
  type: dbShape.type,
  x: dbShape.x,
  y: dbShape.y,
  width: dbShape.width,
  height: dbShape.height,
  rotation: dbShape.rotation,
  color: dbShape.color,
  zIndex: dbShape.z_index,
  textContent: dbShape.text_content,
  fontSize: dbShape.font_size,
  ownerId: dbShape.owner_id,
  ownershipTimestamp: dbShape.ownership_timestamp,
  createdBy: dbShape.created_by,
  createdAt: dbShape.created_at,
  updatedAt: dbShape.updated_at,
})

/**
 * Convert JavaScript shape object to database record
 */
export const shapeToDB = (jsShape) => ({
  id: jsShape.id,
  type: jsShape.type,
  x: jsShape.x,
  y: jsShape.y,
  width: jsShape.width,
  height: jsShape.height,
  rotation: jsShape.rotation,
  color: jsShape.color,
  z_index: jsShape.zIndex,
  text_content: jsShape.textContent,
  font_size: jsShape.fontSize,
  owner_id: jsShape.ownerId,
  ownership_timestamp: jsShape.ownershipTimestamp,
  created_by: jsShape.createdBy,
})

