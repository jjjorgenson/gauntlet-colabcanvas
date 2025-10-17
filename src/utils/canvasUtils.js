/**
 * Canvas utility functions for coordinate conversion and canvas operations
 */

/**
 * Convert screen coordinates to canvas coordinates (accounting for zoom/pan)
 * @param {object} screenPos - Screen position {x, y}
 * @param {object} stageScale - Stage scale {x, y}
 * @param {object} stagePosition - Stage position {x, y}
 * @returns {object} - Canvas coordinates {x, y}
 */
export const screenToCanvas = (screenPos, stageScale, stagePosition) => {
  return {
    x: (screenPos.x - stagePosition.x) / stageScale.x,
    y: (screenPos.y - stagePosition.y) / stageScale.y,
  }
}

/**
 * Convert canvas coordinates to screen coordinates
 * @param {object} canvasPos - Canvas position {x, y}
 * @param {object} stageScale - Stage scale {x, y}
 * @param {object} stagePosition - Stage position {x, y}
 * @returns {object} - Screen coordinates {x, y}
 */
export const canvasToScreen = (canvasPos, stageScale, stagePosition) => {
  return {
    x: canvasPos.x * stageScale.x + stagePosition.x,
    y: canvasPos.y * stageScale.y + stagePosition.y,
  }
}

/**
 * Calculate bounding box of multiple shapes
 * @param {Array} shapes - Array of shape objects
 * @returns {object} - Bounding box {x, y, width, height}
 */
export const calculateBoundingBox = (shapes) => {
  if (!shapes || shapes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  shapes.forEach(shape => {
    const shapeMinX = shape.x
    const shapeMinY = shape.y
    const shapeMaxX = shape.x + shape.width
    const shapeMaxY = shape.y + shape.height

    minX = Math.min(minX, shapeMinX)
    minY = Math.min(minY, shapeMinY)
    maxX = Math.max(maxX, shapeMaxX)
    maxY = Math.max(maxY, shapeMaxY)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Check if a point is within shape bounds
 * @param {object} point - Point {x, y}
 * @param {object} shape - Shape object with x, y, width, height
 * @returns {boolean} - True if point is within shape
 */
export const isPointInShape = (point, shape) => {
  return (
    point.x >= shape.x &&
    point.x <= shape.x + shape.width &&
    point.y >= shape.y &&
    point.y <= shape.y + shape.height
  )
}

/**
 * Check if a point is within a circle shape
 * @param {object} point - Point {x, y}
 * @param {object} circle - Circle shape with x, y, width, height
 * @returns {boolean} - True if point is within circle
 */
export const isPointInCircle = (point, circle) => {
  const centerX = circle.x + circle.width / 2
  const centerY = circle.y + circle.height / 2
  const radius = Math.min(circle.width, circle.height) / 2
  
  const distance = Math.sqrt(
    Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
  )
  
  return distance <= radius
}

/**
 * Calculate grid snap position
 * @param {object} position - Position {x, y}
 * @param {number} gridSize - Grid size in pixels
 * @returns {object} - Snapped position {x, y}
 */
export const snapToGrid = (position, gridSize = 20) => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  }
}

/**
 * Constrain position within canvas bounds
 * @param {object} position - Position {x, y}
 * @param {object} bounds - Canvas bounds {x, y, width, height}
 * @returns {object} - Constrained position {x, y}
 */
export const constrainToBounds = (position, bounds) => {
  return {
    x: Math.max(bounds.x, Math.min(bounds.x + bounds.width, position.x)),
    y: Math.max(bounds.y, Math.min(bounds.y + bounds.height, position.y)),
  }
}

/**
 * Calculate distance between two points
 * @param {object} point1 - First point {x, y}
 * @param {object} point2 - Second point {x, y}
 * @returns {number} - Distance between points
 */
export const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  )
}

/**
 * Calculate angle between two points
 * @param {object} point1 - First point {x, y}
 * @param {object} point2 - Second point {x, y}
 * @returns {number} - Angle in degrees
 */
export const calculateAngle = (point1, point2) => {
  const radians = Math.atan2(point2.y - point1.y, point2.x - point1.x)
  return (radians * 180) / Math.PI
}

/**
 * Rotate a point around a center point
 * @param {object} point - Point to rotate {x, y}
 * @param {object} center - Center point {x, y}
 * @param {number} angle - Angle in degrees
 * @returns {object} - Rotated point {x, y}
 */
export const rotatePoint = (point, center, angle) => {
  const radians = (angle * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  
  const translatedX = point.x - center.x
  const translatedY = point.y - center.y
  
  return {
    x: translatedX * cos - translatedY * sin + center.x,
    y: translatedX * sin + translatedY * cos + center.y,
  }
}

/**
 * Get shape center point
 * @param {object} shape - Shape object with x, y, width, height
 * @returns {object} - Center point {x, y}
 */
export const getShapeCenter = (shape) => {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  }
}

/**
 * Check if two shapes overlap
 * @param {object} shape1 - First shape
 * @param {object} shape2 - Second shape
 * @returns {boolean} - True if shapes overlap
 */
export const shapesOverlap = (shape1, shape2) => {
  return !(
    shape1.x + shape1.width < shape2.x ||
    shape2.x + shape2.width < shape1.x ||
    shape1.y + shape1.height < shape2.y ||
    shape2.y + shape2.height < shape1.y
  )
}

/**
 * Calculate intersection of two shapes
 * @param {object} shape1 - First shape
 * @param {object} shape2 - Second shape
 * @returns {object|null} - Intersection rectangle or null if no intersection
 */
export const getShapeIntersection = (shape1, shape2) => {
  if (!shapesOverlap(shape1, shape2)) {
    return null
  }

  const x = Math.max(shape1.x, shape2.x)
  const y = Math.max(shape1.y, shape2.y)
  const width = Math.min(shape1.x + shape1.width, shape2.x + shape2.width) - x
  const height = Math.min(shape1.y + shape1.height, shape2.y + shape2.height) - y

  return { x, y, width, height }
}

/**
 * Normalize coordinates to a specific range
 * @param {object} position - Position {x, y}
 * @param {object} range - Range {minX, maxX, minY, maxY}
 * @returns {object} - Normalized position {x, y}
 */
export const normalizeCoordinates = (position, range) => {
  const normalizedX = (position.x - range.minX) / (range.maxX - range.minX)
  const normalizedY = (position.y - range.minY) / (range.maxY - range.minY)
  
  return {
    x: Math.max(0, Math.min(1, normalizedX)),
    y: Math.max(0, Math.min(1, normalizedY)),
  }
}

/**
 * Denormalize coordinates from normalized range
 * @param {object} normalizedPos - Normalized position {x, y} (0-1)
 * @param {object} range - Range {minX, maxX, minY, maxY}
 * @returns {object} - Denormalized position {x, y}
 */
export const denormalizeCoordinates = (normalizedPos, range) => {
  return {
    x: range.minX + normalizedPos.x * (range.maxX - range.minX),
    y: range.minY + normalizedPos.y * (range.maxY - range.minY),
  }
}

/**
 * Calculate viewport bounds for a given zoom and pan
 * @param {object} viewport - Viewport {x, y, scale}
 * @param {object} canvasSize - Canvas size {width, height}
 * @returns {object} - Viewport bounds {x, y, width, height}
 */
export const calculateViewportBounds = (viewport, canvasSize) => {
  return {
    x: -viewport.x / viewport.scale,
    y: -viewport.y / viewport.scale,
    width: canvasSize.width / viewport.scale,
    height: canvasSize.height / viewport.scale,
  }
}

/**
 * Check if a shape is visible in the viewport
 * @param {object} shape - Shape object
 * @param {object} viewportBounds - Viewport bounds
 * @returns {boolean} - True if shape is visible
 */
export const isShapeVisible = (shape, viewportBounds) => {
  return shapesOverlap(shape, viewportBounds)
}
