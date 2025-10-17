import { describe, it, expect } from 'vitest'
import {
  createRectangle,
  createCircle,
  createText,
  createShape,
  validateShape,
  getDefaultShapeProperties
} from '../../../src/utils/shapeFactory.js'

describe('ShapeFactory', () => {
  describe('createRectangle', () => {
    it('should create rectangle with all required fields', () => {
      const rectangle = createRectangle(100, 200, '#FF0000', 'user-123')
      
      expect(rectangle).toMatchObject({
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        color: '#FF0000',
        createdBy: 'user-123'
      })
      
      // Check all schema fields are present
      expect(rectangle.id).toBeDefined()
      expect(rectangle.rotation).toBe(0)
      expect(rectangle.zIndex).toBe(0)
      expect(rectangle.textContent).toBe(null)
      expect(rectangle.fontSize).toBe(16)
      expect(rectangle.ownerId).toBe(null)
      expect(rectangle.ownershipTimestamp).toBe(null)
      expect(rectangle.createdAt).toBeDefined()
      expect(rectangle.updatedAt).toBeDefined()
    })

    it('should use default values when not provided', () => {
      const rectangle = createRectangle(50, 75)
      
      expect(rectangle.color).toBe('#3B82F6')
      expect(rectangle.createdBy).toBe(null)
    })
  })

  describe('createCircle', () => {
    it('should create circle with all required fields', () => {
      const circle = createCircle(300, 400, '#00FF00', 'user-456')
      
      expect(circle).toMatchObject({
        type: 'circle',
        x: 300,
        y: 400,
        width: 100,
        height: 100,
        color: '#00FF00',
        createdBy: 'user-456'
      })
      
      // Check all schema fields are present
      expect(circle.id).toBeDefined()
      expect(circle.rotation).toBe(0)
      expect(circle.zIndex).toBe(0)
      expect(circle.textContent).toBe(null)
      expect(circle.fontSize).toBe(16)
      expect(circle.ownerId).toBe(null)
      expect(circle.ownershipTimestamp).toBe(null)
      expect(circle.createdAt).toBeDefined()
      expect(circle.updatedAt).toBeDefined()
    })
  })

  describe('createText', () => {
    it('should create text with all required fields', () => {
      const text = createText(500, 600, 'Hello World', '#0000FF', 'user-789')
      
      expect(text).toMatchObject({
        type: 'text',
        x: 500,
        y: 600,
        width: 200,
        height: 50,
        textContent: 'Hello World',
        fontSize: 16,
        color: '#0000FF',
        createdBy: 'user-789'
      })
      
      // Check all schema fields are present
      expect(text.id).toBeDefined()
      expect(text.rotation).toBe(0)
      expect(text.zIndex).toBe(0)
      expect(text.ownerId).toBe(null)
      expect(text.ownershipTimestamp).toBe(null)
      expect(text.createdAt).toBeDefined()
      expect(text.updatedAt).toBeDefined()
    })

    it('should use default text content when not provided', () => {
      const text = createText(100, 200)
      expect(text.textContent).toBe('Text')
    })
  })

  describe('createShape', () => {
    it('should create rectangle using generic function', () => {
      const shape = createShape('rectangle', 100, 200, { color: '#FF0000', createdBy: 'user-123' })
      
      expect(shape.type).toBe('rectangle')
      expect(shape.x).toBe(100)
      expect(shape.y).toBe(200)
      expect(shape.color).toBe('#FF0000')
      expect(shape.createdBy).toBe('user-123')
    })

    it('should create circle using generic function', () => {
      const shape = createShape('circle', 300, 400, { color: '#00FF00' })
      
      expect(shape.type).toBe('circle')
      expect(shape.x).toBe(300)
      expect(shape.y).toBe(400)
      expect(shape.color).toBe('#00FF00')
    })

    it('should create text using generic function', () => {
      const shape = createShape('text', 500, 600, { textContent: 'Test Text', color: '#0000FF' })
      
      expect(shape.type).toBe('text')
      expect(shape.x).toBe(500)
      expect(shape.y).toBe(600)
      expect(shape.textContent).toBe('Test Text')
      expect(shape.color).toBe('#0000FF')
    })

    it('should throw error for unknown shape type', () => {
      expect(() => createShape('unknown', 100, 200)).toThrow('Unknown shape type: unknown')
    })
  })

  describe('validateShape', () => {
    it('should validate correct rectangle shape', () => {
      const rectangle = createRectangle(100, 200)
      expect(() => validateShape(rectangle)).not.toThrow()
    })

    it('should validate correct circle shape', () => {
      const circle = createCircle(100, 200)
      expect(() => validateShape(circle)).not.toThrow()
    })

    it('should validate correct text shape', () => {
      const text = createText(100, 200, 'Test')
      expect(() => validateShape(text)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidShape = { type: 'rectangle' }
      expect(() => validateShape(invalidShape)).toThrow('Missing required field: id')
    })

    it('should throw error for invalid shape type', () => {
      const invalidShape = createRectangle(100, 200)
      invalidShape.type = 'invalid'
      expect(() => validateShape(invalidShape)).toThrow('Invalid shape type: invalid')
    })

    it('should throw error for non-numeric fields', () => {
      const invalidShape = createRectangle(100, 200)
      invalidShape.x = 'not a number'
      expect(() => validateShape(invalidShape)).toThrow('Field x must be a number')
    })

    it('should throw error for invalid color format', () => {
      const invalidShape = createRectangle(100, 200)
      invalidShape.color = 'invalid color'
      expect(() => validateShape(invalidShape)).toThrow('Invalid color format: invalid color')
    })
  })

  describe('getDefaultShapeProperties', () => {
    it('should return default properties for rectangle', () => {
      const props = getDefaultShapeProperties('rectangle')
      expect(props).toEqual({
        width: 100,
        height: 100,
        color: '#3B82F6'
      })
    })

    it('should return default properties for circle', () => {
      const props = getDefaultShapeProperties('circle')
      expect(props).toEqual({
        width: 100,
        height: 100,
        color: '#3B82F6'
      })
    })

    it('should return default properties for text', () => {
      const props = getDefaultShapeProperties('text')
      expect(props).toEqual({
        width: 200,
        height: 50,
        textContent: 'Text',
        fontSize: 16,
        color: '#3B82F6'
      })
    })

    it('should throw error for unknown shape type', () => {
      expect(() => getDefaultShapeProperties('unknown')).toThrow('Unknown shape type: unknown')
    })
  })

  describe('shape uniqueness', () => {
    it('should generate unique IDs for different shapes', () => {
      const shape1 = createRectangle(100, 200)
      const shape2 = createRectangle(100, 200)
      expect(shape1.id).not.toBe(shape2.id)
    })

    it('should generate valid timestamps for shapes', () => {
      const shape1 = createRectangle(100, 200)
      const shape2 = createRectangle(100, 200)
      
      // Test that timestamps are valid ISO strings
      expect(shape1.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(shape1.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(shape2.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(shape2.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      
      // Test that created and updated timestamps are the same for new shapes
      expect(shape1.createdAt).toBe(shape1.updatedAt)
      expect(shape2.createdAt).toBe(shape2.updatedAt)
    })
  })
})
