import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a unique ID for shapes
 */
const generateId = () => uuidv4()

/**
 * Create default shape properties that all shapes share
 */
const createBaseShape = (type, x, y, createdBy = null) => ({
  id: generateId(),
  type,
  x,
  y,
  rotation: 0,
  color: '#3B82F6',
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
 * Create a new rectangle shape
 */
export const createRectangle = (x, y, color = '#3B82F6', createdBy = null) => ({
  ...createBaseShape('rectangle', x, y, createdBy),
  width: 100,
  height: 100,
  color,
})

/**
 * Create a new circle shape
 */
export const createCircle = (x, y, color = '#3B82F6', createdBy = null) => ({
  ...createBaseShape('circle', x, y, createdBy),
  width: 100,
  height: 100,
  color,
})

/**
 * Create a new text shape
 */
export const createText = (x, y, textContent = 'Text', color = '#3B82F6', createdBy = null) => ({
  ...createBaseShape('text', x, y, createdBy),
  width: 200,
  height: 50,
  textContent,
  fontSize: 16,
  color,
})

/**
 * Create a shape by type
 */
export const createShape = (type, x, y, options = {}) => {
  const { color = '#3B82F6', textContent = 'Text', createdBy = null } = options

  switch (type) {
    case 'rectangle':
      return createRectangle(x, y, color, createdBy)
    case 'circle':
      return createCircle(x, y, color, createdBy)
    case 'text':
      return createText(x, y, textContent, color, createdBy)
    default:
      throw new Error(`Unknown shape type: ${type}`)
  }
}

/**
 * Validate shape data before saving
 */
export const validateShape = (shape) => {
  const requiredFields = ['id', 'type', 'x', 'y', 'width', 'height', 'color', 'zIndex']
  const validTypes = ['rectangle', 'circle', 'text']

  // Check required fields
  for (const field of requiredFields) {
    if (shape[field] === undefined || shape[field] === null) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Check valid type
  if (!validTypes.includes(shape.type)) {
    throw new Error(`Invalid shape type: ${shape.type}. Must be one of: ${validTypes.join(', ')}`)
  }

  // Check numeric fields
  const numericFields = ['x', 'y', 'width', 'height', 'rotation', 'zIndex', 'fontSize']
  for (const field of numericFields) {
    if (shape[field] !== undefined && shape[field] !== null && typeof shape[field] !== 'number') {
      throw new Error(`Field ${field} must be a number`)
    }
  }

  // Check color format
  if (shape.color && !/^#[0-9A-F]{6}$/i.test(shape.color)) {
    throw new Error(`Invalid color format: ${shape.color}. Must be hex format (#RRGGBB)`)
  }

  return true
}

/**
 * Get default shape properties for a given type
 */
export const getDefaultShapeProperties = (type) => {
  switch (type) {
    case 'rectangle':
      return {
        width: 100,
        height: 100,
        color: '#3B82F6',
      }
    case 'circle':
      return {
        width: 100,
        height: 100,
        color: '#3B82F6',
      }
    case 'text':
      return {
        width: 200,
        height: 50,
        textContent: 'Text',
        fontSize: 16,
        color: '#3B82F6',
      }
    default:
      throw new Error(`Unknown shape type: ${type}`)
  }
}
