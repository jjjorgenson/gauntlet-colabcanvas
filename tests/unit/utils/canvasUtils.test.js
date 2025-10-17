import { describe, it, expect } from 'vitest'
import {
  screenToCanvas,
  canvasToScreen,
  calculateBoundingBox,
  isPointInShape,
  isPointInCircle,
  snapToGrid,
  constrainToBounds,
  calculateDistance,
  calculateAngle,
  rotatePoint,
  getShapeCenter,
  shapesOverlap,
  getShapeIntersection,
  normalizeCoordinates,
  denormalizeCoordinates,
  calculateViewportBounds,
  isShapeVisible
} from '../../../src/utils/canvasUtils.js'

describe('CanvasUtils', () => {
  describe('screenToCanvas', () => {
    it('should convert screen coordinates to canvas coordinates', () => {
      const screenPos = { x: 100, y: 200 }
      const stageScale = { x: 2, y: 2 }
      const stagePosition = { x: 50, y: 100 }
      
      const result = screenToCanvas(screenPos, stageScale, stagePosition)
      expect(result).toEqual({ x: 25, y: 50 })
    })

    it('should handle zero scale', () => {
      const screenPos = { x: 100, y: 200 }
      const stageScale = { x: 0, y: 0 }
      const stagePosition = { x: 0, y: 0 }
      
      const result = screenToCanvas(screenPos, stageScale, stagePosition)
      expect(result).toEqual({ x: Infinity, y: Infinity })
    })
  })

  describe('canvasToScreen', () => {
    it('should convert canvas coordinates to screen coordinates', () => {
      const canvasPos = { x: 25, y: 50 }
      const stageScale = { x: 2, y: 2 }
      const stagePosition = { x: 50, y: 100 }
      
      const result = canvasToScreen(canvasPos, stageScale, stagePosition)
      expect(result).toEqual({ x: 100, y: 200 })
    })
  })

  describe('calculateBoundingBox', () => {
    it('should calculate bounding box for multiple shapes', () => {
      const shapes = [
        { x: 10, y: 20, width: 100, height: 50 },
        { x: 50, y: 30, width: 80, height: 60 },
        { x: 5, y: 5, width: 20, height: 20 }
      ]
      
      const result = calculateBoundingBox(shapes)
      expect(result).toEqual({ x: 5, y: 5, width: 125, height: 85 })
    })

    it('should handle empty array', () => {
      const result = calculateBoundingBox([])
      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })

    it('should handle single shape', () => {
      const shapes = [{ x: 10, y: 20, width: 100, height: 50 }]
      const result = calculateBoundingBox(shapes)
      expect(result).toEqual({ x: 10, y: 20, width: 100, height: 50 })
    })
  })

  describe('isPointInShape', () => {
    const shape = { x: 50, y: 30, width: 80, height: 60 }

    it('should return true for point inside shape', () => {
      const point = { x: 60, y: 45 }
      expect(isPointInShape(point, shape)).toBe(true)
    })

    it('should return true for point on shape edge', () => {
      const point = { x: 50, y: 30 }
      expect(isPointInShape(point, shape)).toBe(true)
    })

    it('should return false for point outside shape', () => {
      const point = { x: 10, y: 10 }
      expect(isPointInShape(point, shape)).toBe(false)
    })
  })

  describe('isPointInCircle', () => {
    const circle = { x: 50, y: 50, width: 100, height: 100 }

    it('should return true for point inside circle', () => {
      const point = { x: 100, y: 100 }
      expect(isPointInCircle(point, circle)).toBe(true)
    })

    it('should return true for point on circle edge', () => {
      const point = { x: 100, y: 50 }
      expect(isPointInCircle(point, circle)).toBe(true)
    })

    it('should return false for point outside circle', () => {
      const point = { x: 200, y: 200 }
      expect(isPointInCircle(point, circle)).toBe(false)
    })
  })

  describe('snapToGrid', () => {
    it('should snap coordinates to grid', () => {
      const position = { x: 23, y: 47 }
      const result = snapToGrid(position, 20)
      expect(result).toEqual({ x: 20, y: 40 })
    })

    it('should use default grid size', () => {
      const position = { x: 15, y: 25 }
      const result = snapToGrid(position)
      expect(result).toEqual({ x: 20, y: 20 })
    })
  })

  describe('constrainToBounds', () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 }

    it('should constrain position within bounds', () => {
      const position = { x: 50, y: 50 }
      const result = constrainToBounds(position, bounds)
      expect(result).toEqual({ x: 50, y: 50 })
    })

    it('should constrain position outside bounds', () => {
      const position = { x: 150, y: 150 }
      const result = constrainToBounds(position, bounds)
      expect(result).toEqual({ x: 100, y: 100 })
    })

    it('should constrain negative position', () => {
      const position = { x: -10, y: -10 }
      const result = constrainToBounds(position, bounds)
      expect(result).toEqual({ x: 0, y: 0 })
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { x: 0, y: 0 }
      const point2 = { x: 3, y: 4 }
      const result = calculateDistance(point1, point2)
      expect(result).toBe(5)
    })

    it('should return 0 for same points', () => {
      const point = { x: 10, y: 20 }
      const result = calculateDistance(point, point)
      expect(result).toBe(0)
    })
  })

  describe('calculateAngle', () => {
    it('should calculate angle between two points', () => {
      const point1 = { x: 0, y: 0 }
      const point2 = { x: 3, y: 4 }
      const result = calculateAngle(point1, point2)
      expect(result).toBeCloseTo(53.13, 1)
    })

    it('should return 0 for horizontal line', () => {
      const point1 = { x: 0, y: 0 }
      const point2 = { x: 10, y: 0 }
      const result = calculateAngle(point1, point2)
      expect(result).toBe(0)
    })

    it('should return 90 for vertical line', () => {
      const point1 = { x: 0, y: 0 }
      const point2 = { x: 0, y: 10 }
      const result = calculateAngle(point1, point2)
      expect(result).toBe(90)
    })
  })

  describe('rotatePoint', () => {
    it('should rotate point around center', () => {
      const point = { x: 10, y: 0 }
      const center = { x: 0, y: 0 }
      const result = rotatePoint(point, center, 90)
      expect(result.x).toBeCloseTo(0, 1)
      expect(result.y).toBeCloseTo(10, 1)
    })

    it('should return same point for 0 degree rotation', () => {
      const point = { x: 10, y: 5 }
      const center = { x: 0, y: 0 }
      const result = rotatePoint(point, center, 0)
      expect(result).toEqual(point)
    })
  })

  describe('getShapeCenter', () => {
    it('should calculate shape center', () => {
      const shape = { x: 50, y: 30, width: 80, height: 60 }
      const result = getShapeCenter(shape)
      expect(result).toEqual({ x: 90, y: 60 })
    })
  })

  describe('shapesOverlap', () => {
    it('should return true for overlapping shapes', () => {
      const shape1 = { x: 0, y: 0, width: 100, height: 100 }
      const shape2 = { x: 50, y: 50, width: 100, height: 100 }
      expect(shapesOverlap(shape1, shape2)).toBe(true)
    })

    it('should return false for non-overlapping shapes', () => {
      const shape1 = { x: 0, y: 0, width: 50, height: 50 }
      const shape2 = { x: 100, y: 100, width: 50, height: 50 }
      expect(shapesOverlap(shape1, shape2)).toBe(false)
    })

    it('should return true for touching shapes', () => {
      const shape1 = { x: 0, y: 0, width: 50, height: 50 }
      const shape2 = { x: 50, y: 0, width: 50, height: 50 }
      expect(shapesOverlap(shape1, shape2)).toBe(true)
    })
  })

  describe('getShapeIntersection', () => {
    it('should return intersection for overlapping shapes', () => {
      const shape1 = { x: 0, y: 0, width: 100, height: 100 }
      const shape2 = { x: 50, y: 50, width: 100, height: 100 }
      const result = getShapeIntersection(shape1, shape2)
      expect(result).toEqual({ x: 50, y: 50, width: 50, height: 50 })
    })

    it('should return null for non-overlapping shapes', () => {
      const shape1 = { x: 0, y: 0, width: 50, height: 50 }
      const shape2 = { x: 100, y: 100, width: 50, height: 50 }
      const result = getShapeIntersection(shape1, shape2)
      expect(result).toBe(null)
    })
  })

  describe('normalizeCoordinates', () => {
    it('should normalize coordinates to 0-1 range', () => {
      const position = { x: 50, y: 75 }
      const range = { minX: 0, maxX: 100, minY: 0, maxY: 100 }
      const result = normalizeCoordinates(position, range)
      expect(result).toEqual({ x: 0.5, y: 0.75 })
    })

    it('should clamp coordinates to 0-1 range', () => {
      const position = { x: 150, y: -50 }
      const range = { minX: 0, maxX: 100, minY: 0, maxY: 100 }
      const result = normalizeCoordinates(position, range)
      expect(result).toEqual({ x: 1, y: 0 })
    })
  })

  describe('denormalizeCoordinates', () => {
    it('should denormalize coordinates from 0-1 range', () => {
      const normalizedPos = { x: 0.5, y: 0.75 }
      const range = { minX: 0, maxX: 100, minY: 0, maxY: 100 }
      const result = denormalizeCoordinates(normalizedPos, range)
      expect(result).toEqual({ x: 50, y: 75 })
    })
  })

  describe('calculateViewportBounds', () => {
    it('should calculate viewport bounds', () => {
      const viewport = { x: 100, y: 200, scale: 1.5 }
      const canvasSize = { width: 800, height: 600 }
      const result = calculateViewportBounds(viewport, canvasSize)
      
      expect(result.x).toBeCloseTo(-66.67, 1)
      expect(result.y).toBeCloseTo(-133.33, 1)
      expect(result.width).toBeCloseTo(533.33, 1)
      expect(result.height).toBeCloseTo(400, 1)
    })
  })

  describe('isShapeVisible', () => {
    it('should return true for visible shape', () => {
      const shape = { x: 50, y: 50, width: 100, height: 100 }
      const viewportBounds = { x: 0, y: 0, width: 200, height: 200 }
      expect(isShapeVisible(shape, viewportBounds)).toBe(true)
    })

    it('should return false for invisible shape', () => {
      const shape = { x: 300, y: 300, width: 100, height: 100 }
      const viewportBounds = { x: 0, y: 0, width: 200, height: 200 }
      expect(isShapeVisible(shape, viewportBounds)).toBe(false)
    })
  })
})
