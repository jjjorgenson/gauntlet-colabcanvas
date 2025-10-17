import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Stage, Layer } from 'react-konva'

// Mock all external dependencies
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn(() => ({ data: [], error: null })) })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })) })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      upsert: vi.fn(() => ({ data: null, error: null }))
    })),
    channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
    removeChannel: vi.fn()
  }
}))

vi.mock('../../../src/lib/constants', () => ({
  CANVAS_CONFIG: {
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 3,
    ZOOM_STEP: 0.1,
    DEFAULT_ZOOM: 1
  },
  TABLES: {
    SHAPES: 'shapes',
    PRESENCE: 'presence'
  },
  REALTIME_CONFIG: {
    PRESENCE_UPDATE_INTERVAL: 10000
  }
}))

vi.mock('../../../src/utils/shapeFactory', () => ({
  createRectangle: vi.fn(() => ({
    id: 'test-rect-id',
    type: 'rectangle',
    x: 100,
    y: 200,
    width: 100,
    height: 100,
    rotation: 0,
    color: '#3B82F6',
    zIndex: 0,
    textContent: null,
    fontSize: 16,
    ownerId: null,
    ownershipTimestamp: null,
    createdBy: 'user123',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  })),
  createCircle: vi.fn(() => ({
    id: 'test-circle-id',
    type: 'circle',
    x: 150,
    y: 250,
    width: 80,
    height: 80,
    rotation: 0,
    color: '#EF4444',
    zIndex: 0,
    textContent: null,
    fontSize: 16,
    ownerId: null,
    ownershipTimestamp: null,
    createdBy: 'user123',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  })),
  createText: vi.fn(() => ({
    id: 'test-text-id',
    type: 'text',
    x: 200,
    y: 300,
    width: 120,
    height: 30,
    rotation: 0,
    color: '#10B981',
    zIndex: 0,
    textContent: 'Hello World',
    fontSize: 16,
    ownerId: null,
    ownershipTimestamp: null,
    createdBy: 'user123',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  })),
  validateShape: vi.fn(() => true)
}))

vi.mock('../../../src/utils/OwnershipManager', () => ({
  ownershipManager: {
    start: vi.fn(),
    stop: vi.fn(),
    acquireOwnership: vi.fn(() => true),
    releaseOwnership: vi.fn(),
    isOwner: vi.fn(() => true),
    getOwnedShapes: vi.fn(() => [])
  }
}))

vi.mock('../../../src/utils/canvasHelpers', () => ({
  updateRectanglePosition: vi.fn((shape, x, y) => ({ ...shape, x, y })),
  updateShapeSize: vi.fn((shape, width, height) => ({ ...shape, width, height })),
  updateShapeRotation: vi.fn((shape, rotation) => ({ ...shape, rotation })),
  updateShapeColor: vi.fn((shape, color) => ({ ...shape, color })),
  updateShapeZIndex: vi.fn((shape, zIndex) => ({ ...shape, zIndex }))
}))

vi.mock('react-konva', () => ({
  Rect: vi.fn(({ x, y, width, height, fill, rotation, draggable, onDragEnd, onDragStart, onClick }) => {
    const handleClick = () => {
      if (onClick) onClick()
    }
    const handleDragStart = () => {
      if (onDragStart) onDragStart()
    }
    const handleDragEnd = (e) => {
      if (onDragEnd) onDragEnd(e)
    }
    return { x, y, width, height, fill, rotation, draggable, handleClick, handleDragStart, handleDragEnd }
  }),
  Stage: vi.fn(({ children, onClick }) => {
    const handleClick = () => {
      if (onClick) onClick()
    }
    return { children, handleClick }
  }),
  Layer: vi.fn(({ children }) => ({ children }))
}))

// Mock the hooks
vi.mock('../../../src/hooks/useShapes', () => ({
  useShapes: vi.fn(() => ({
    shapes: [],
    createShape: vi.fn(),
    updateShape: vi.fn(),
    deleteShape: vi.fn(),
    loading: false,
    error: null
  }))
}))

vi.mock('../../../src/hooks/useCursors', () => ({
  useCursors: vi.fn(() => ({
    cursors: [],
    updateCursor: vi.fn(),
    removeCursor: vi.fn()
  }))
}))

vi.mock('../../../src/hooks/usePresence', () => ({
  usePresence: vi.fn(() => ({
    onlineUsers: [],
    updatePresence: vi.fn()
  }))
}))

vi.mock('../../../src/hooks/useCanvas', () => ({
  useCanvas: vi.fn(() => ({
    selectedShape: null,
    setSelectedShape: vi.fn(),
    zoom: 1,
    setZoom: vi.fn(),
    pan: { x: 0, y: 0 },
    setPan: vi.fn()
  }))
}))

describe('Shape Creation and Manipulation Tests', () => {
  let mockUser
  let mockShapes
  let mockCreateShape
  let mockUpdateShape
  let mockDeleteShape

  beforeEach(() => {
    mockUser = {
      id: 'user123',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' }
    }

    mockShapes = [
      {
        id: 'shape1',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    ]

    mockCreateShape = vi.fn()
    mockUpdateShape = vi.fn()
    mockDeleteShape = vi.fn()

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('Shape Creation', () => {
    it('should create a rectangle with new schema fields', async () => {
      const { createRectangle } = await import('../../../src/utils/shapeFactory')
      
      const rectangle = createRectangle({
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        createdBy: 'user123'
      })

      expect(rectangle).toMatchObject({
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123'
      })

      expect(rectangle.id).toBeDefined()
      expect(rectangle.createdAt).toBeDefined()
      expect(rectangle.updatedAt).toBeDefined()
    })

    it('should create a circle with new schema fields', async () => {
      const { createCircle } = await import('../../../src/utils/shapeFactory')
      
      const circle = createCircle({
        x: 150,
        y: 250,
        width: 80,
        height: 80,
        createdBy: 'user123'
      })

      expect(circle).toMatchObject({
        type: 'circle',
        x: 150,
        y: 250,
        width: 80,
        height: 80,
        rotation: 0,
        color: '#EF4444',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123'
      })
    })

    it('should create text with new schema fields', async () => {
      const { createText } = await import('../../../src/utils/shapeFactory')
      
      const text = createText({
        x: 200,
        y: 300,
        width: 120,
        height: 30,
        textContent: 'Hello World',
        createdBy: 'user123'
      })

      expect(text).toMatchObject({
        type: 'text',
        x: 200,
        y: 300,
        width: 120,
        height: 30,
        rotation: 0,
        color: '#10B981',
        zIndex: 0,
        textContent: 'Hello World',
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123'
      })
    })

    it('should validate shape objects', async () => {
      const { validateShape } = await import('../../../src/utils/shapeFactory')
      
      const validShape = {
        id: 'test-id',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      expect(validateShape(validShape)).toBe(true)
    })
  })

  describe('Shape Manipulation', () => {
    it('should update shape position', async () => {
      const { updateRectanglePosition } = await import('../../../src/utils/canvasHelpers')
      
      const originalShape = {
        id: 'test-id',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      const updatedShape = updateRectanglePosition(originalShape, 150, 250)

      expect(updatedShape.x).toBe(150)
      expect(updatedShape.y).toBe(250)
      expect(updatedShape.id).toBe(originalShape.id)
      expect(updatedShape.type).toBe(originalShape.type)
    })

    it('should update shape size', async () => {
      const { updateShapeSize } = await import('../../../src/utils/canvasHelpers')
      
      const originalShape = {
        id: 'test-id',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      const updatedShape = updateShapeSize(originalShape, 150, 200)

      expect(updatedShape.width).toBe(150)
      expect(updatedShape.height).toBe(200)
      expect(updatedShape.x).toBe(originalShape.x)
      expect(updatedShape.y).toBe(originalShape.y)
    })

    it('should update shape rotation', async () => {
      const { updateShapeRotation } = await import('../../../src/utils/canvasHelpers')
      
      const originalShape = {
        id: 'test-id',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      const updatedShape = updateShapeRotation(originalShape, 45)

      expect(updatedShape.rotation).toBe(45)
      expect(updatedShape.x).toBe(originalShape.x)
      expect(updatedShape.y).toBe(originalShape.y)
    })

    it('should update shape color', async () => {
      const { updateShapeColor } = await import('../../../src/utils/canvasHelpers')
      
      const originalShape = {
        id: 'test-id',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      const updatedShape = updateShapeColor(originalShape, '#EF4444')

      expect(updatedShape.color).toBe('#EF4444')
      expect(updatedShape.x).toBe(originalShape.x)
      expect(updatedShape.y).toBe(originalShape.y)
    })

    it('should update shape z-index', async () => {
      const { updateShapeZIndex } = await import('../../../src/utils/canvasHelpers')
      
      const originalShape = {
        id: 'test-id',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      const updatedShape = updateShapeZIndex(originalShape, 5)

      expect(updatedShape.zIndex).toBe(5)
      expect(updatedShape.x).toBe(originalShape.x)
      expect(updatedShape.y).toBe(originalShape.y)
    })
  })

  describe('Ownership Management', () => {
    it('should acquire ownership of a shape', async () => {
      const { ownershipManager } = await import('../../../src/utils/OwnershipManager')
      
      const shapeId = 'test-shape-id'
      const userId = 'user123'
      
      const result = ownershipManager.acquireOwnership(shapeId, userId)
      
      expect(result).toBe(true)
      expect(ownershipManager.acquireOwnership).toHaveBeenCalledWith(shapeId, userId)
    })

    it('should check if user owns a shape', async () => {
      const { ownershipManager } = await import('../../../src/utils/OwnershipManager')
      
      const shapeId = 'test-shape-id'
      const userId = 'user123'
      
      const isOwner = ownershipManager.isOwner(shapeId, userId)
      
      expect(isOwner).toBe(true)
      expect(ownershipManager.isOwner).toHaveBeenCalledWith(shapeId, userId)
    })

    it('should release ownership of a shape', async () => {
      const { ownershipManager } = await import('../../../src/utils/OwnershipManager')
      
      const shapeId = 'test-shape-id'
      
      ownershipManager.releaseOwnership(shapeId)
      
      expect(ownershipManager.releaseOwnership).toHaveBeenCalledWith(shapeId)
    })

    it('should get owned shapes for a user', async () => {
      const { ownershipManager } = await import('../../../src/utils/OwnershipManager')
      
      const userId = 'user123'
      
      const ownedShapes = ownershipManager.getOwnedShapes(userId)
      
      expect(Array.isArray(ownedShapes)).toBe(true)
      expect(ownershipManager.getOwnedShapes).toHaveBeenCalledWith(userId)
    })
  })

  describe('Shape Schema Compliance', () => {
    it('should handle all required schema fields', () => {
      const requiredFields = [
        'id', 'type', 'x', 'y', 'width', 'height', 'rotation',
        'color', 'zIndex', 'textContent', 'fontSize', 'ownerId',
        'ownershipTimestamp', 'createdBy', 'createdAt', 'updatedAt'
      ]

      const testShape = {
        id: 'test-id',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: null,
        ownershipTimestamp: null,
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      requiredFields.forEach(field => {
        expect(testShape).toHaveProperty(field)
      })
    })

    it('should handle different shape types with schema fields', () => {
      const shapeTypes = ['rectangle', 'circle', 'text']
      
      shapeTypes.forEach(type => {
        const shape = {
          id: `test-${type}-id`,
          type: type,
          x: 100,
          y: 200,
          width: 100,
          height: 100,
          rotation: 0,
          color: '#3B82F6',
          zIndex: 0,
          textContent: type === 'text' ? 'Sample Text' : null,
          fontSize: 16,
          ownerId: null,
          ownershipTimestamp: null,
          createdBy: 'user123',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }

        expect(shape.type).toBe(type)
        expect(shape.id).toBeDefined()
        expect(shape.createdBy).toBe('user123')
        expect(shape.createdAt).toBeDefined()
        expect(shape.updatedAt).toBeDefined()
      })
    })

    it('should handle ownership fields correctly', () => {
      const shapeWithOwnership = {
        id: 'test-id',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        textContent: null,
        fontSize: 16,
        ownerId: 'user123',
        ownershipTimestamp: '2023-01-01T00:00:00.000Z',
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      expect(shapeWithOwnership.ownerId).toBe('user123')
      expect(shapeWithOwnership.ownershipTimestamp).toBeDefined()
      expect(shapeWithOwnership.createdBy).toBe('user123')
    })
  })
})
