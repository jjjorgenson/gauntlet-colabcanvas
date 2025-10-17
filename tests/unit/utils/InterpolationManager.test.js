import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import InterpolationManager, { InterpolationManager as InterpolationManagerClass } from '../../../src/utils/InterpolationManager.js'

describe('InterpolationManager', () => {
  let manager

  beforeEach(() => {
    // Create a new instance for each test
    manager = new InterpolationManagerClass()
    manager.clear()
  })

  afterEach(() => {
    manager.clear()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = new InterpolationManagerClass()
      const instance2 = new InterpolationManagerClass()
      expect(instance1).toBe(instance2)
    })

    it('should have default configuration', () => {
      expect(manager.DEFAULT_CURSOR_DURATION).toBe(50)
      expect(manager.DEFAULT_SHAPE_DURATION).toBe(150)
      expect(manager.easingFunctions).toHaveProperty('easeOut')
      expect(manager.easingFunctions).toHaveProperty('easeInOut')
      expect(manager.easingFunctions).toHaveProperty('linear')
      expect(manager.easingFunctions).toHaveProperty('easeOutQuart')
    })
  })

  describe('addTarget', () => {
    it('should add a cursor target with default duration', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 100, y: 100 }
      
      manager.addTarget('cursor1', 'cursor', currentPos, targetPos)
      
      const target = manager.targets.get('cursor1')
      expect(target).toBeDefined()
      expect(target.type).toBe('cursor')
      expect(target.duration).toBe(50)
      expect(target.easing).toBe(manager.easingFunctions.easeOut)
      expect(target.startPos).toEqual(currentPos)
      expect(target.targetPos).toEqual(targetPos)
      expect(target.isActive).toBe(true)
    })

    it('should add a shape target with default duration', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 200, y: 200 }
      
      manager.addTarget('shape1', 'shape', currentPos, targetPos)
      
      const target = manager.targets.get('shape1')
      expect(target).toBeDefined()
      expect(target.type).toBe('shape')
      expect(target.duration).toBe(150)
      expect(target.easing).toBe(manager.easingFunctions.easeOutQuart)
    })

    it('should use custom duration and easing', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 100, y: 100 }
      
      manager.addTarget('test1', 'cursor', currentPos, targetPos, 200, 'linear')
      
      const target = manager.targets.get('test1')
      expect(target.duration).toBe(200)
      expect(target.easing).toBe(manager.easingFunctions.linear)
    })

    it('should start animation loop when adding first target', () => {
      const startSpy = vi.spyOn(manager, 'start')
      
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 })
      
      expect(startSpy).toHaveBeenCalled()
    })
  })

  describe('removeTarget', () => {
    it('should remove a target', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 })
      expect(manager.targets.has('test1')).toBe(true)
      
      manager.removeTarget('test1')
      expect(manager.targets.has('test1')).toBe(false)
    })

    it('should stop animation loop when removing last target', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 })
      const stopSpy = vi.spyOn(manager, 'stop')
      
      manager.removeTarget('test1')
      expect(stopSpy).toHaveBeenCalled()
    })
  })

  describe('getPosition', () => {
    it('should return null for non-existent target', () => {
      const position = manager.getPosition('nonexistent')
      expect(position).toBe(null)
    })

    it('should return start position at beginning of animation', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 100, y: 100 }
      
      // Mock performance.now before adding target
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', currentPos, targetPos)
      
      // Keep the same time for getPosition
      mockNow.mockReturnValue(0)
      
      const position = manager.getPosition('test1')
      expect(position).toEqual(currentPos)
      
      mockNow.mockRestore()
    })

    it('should return target position at end of animation', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 100, y: 100 }
      
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', currentPos, targetPos, 100)
      
      // Mock performance.now to return time after animation duration
      mockNow.mockReturnValue(100)
      
      const position = manager.getPosition('test1')
      expect(position).toEqual(targetPos)
      
      mockNow.mockRestore()
    })

    it('should interpolate position during animation', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 100, y: 100 }
      
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', currentPos, targetPos, 100, 'linear')
      
      // Mock performance.now to return halfway through animation
      mockNow.mockReturnValue(50)
      
      const position = manager.getPosition('test1')
      expect(position).toEqual({ x: 50, y: 50 })
      
      mockNow.mockRestore()
    })

    it('should mark target as inactive when animation completes', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 100, y: 100 }
      
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', currentPos, targetPos, 100)
      
      // Mock performance.now to return time after animation duration
      mockNow.mockReturnValue(100)
      
      manager.getPosition('test1')
      
      const target = manager.targets.get('test1')
      expect(target.isActive).toBe(false)
      
      mockNow.mockRestore()
    })
  })

  describe('updateTarget', () => {
    it('should update target position for existing interpolation', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 100, y: 100 }
      const newTargetPos = { x: 200, y: 200 }
      
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', currentPos, targetPos, 100)
      
      // Mock performance.now to return halfway through animation
      mockNow.mockReturnValue(50)
      
      manager.updateTarget('test1', newTargetPos)
      
      const target = manager.targets.get('test1')
      expect(target.targetPos).toEqual(newTargetPos)
      expect(target.startTime).toBe(50) // Should reset start time
      
      mockNow.mockRestore()
    })

    it('should update duration if provided', () => {
      const currentPos = { x: 0, y: 0 }
      const targetPos = { x: 100, y: 100 }
      
      manager.addTarget('test1', 'cursor', currentPos, targetPos, 100)
      manager.updateTarget('test1', targetPos, 200)
      
      const target = manager.targets.get('test1')
      expect(target.duration).toBe(200)
    })

    it('should not update non-existent target', () => {
      const newTargetPos = { x: 200, y: 200 }
      
      // Should not throw error
      expect(() => {
        manager.updateTarget('nonexistent', newTargetPos)
      }).not.toThrow()
    })
  })

  describe('isInterpolating', () => {
    it('should return true for active interpolation', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 })
      expect(manager.isInterpolating('test1')).toBe(true)
    })

    it('should return false for non-existent target', () => {
      expect(manager.isInterpolating('nonexistent')).toBe(false)
    })

    it('should return false for completed animation', () => {
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100)
      
      // Mock performance.now to return time after animation duration
      mockNow.mockReturnValue(100)
      
      manager.getPosition('test1') // This marks the target as inactive
      expect(manager.isInterpolating('test1')).toBe(false)
      
      mockNow.mockRestore()
    })
  })

  describe('getActiveTargets', () => {
    it('should return only active targets', () => {
      manager.addTarget('active1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 })
      manager.addTarget('active2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 })
      
      const activeTargets = manager.getActiveTargets()
      expect(activeTargets.size).toBe(2)
      expect(activeTargets.has('active1')).toBe(true)
      expect(activeTargets.has('active2')).toBe(true)
    })

    it('should exclude inactive targets', () => {
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100)
      
      // Mock performance.now to complete animation
      mockNow.mockReturnValue(100)
      manager.getPosition('test1') // Marks as inactive
      
      const activeTargets = manager.getActiveTargets()
      expect(activeTargets.size).toBe(0)
      
      mockNow.mockRestore()
    })
  })

  describe('start and stop', () => {
    it('should start animation loop', () => {
      const animateSpy = vi.spyOn(manager, 'animate')
      
      // Add a target to keep animation running
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 1000)
      manager.start()
      
      expect(manager.isRunning).toBe(true)
      expect(animateSpy).toHaveBeenCalled()
    })

    it('should stop animation loop', () => {
      manager.start()
      manager.stop()
      
      expect(manager.isRunning).toBe(false)
    })

    it('should not start if already running', () => {
      const animateSpy = vi.spyOn(manager, 'animate')
      
      // Add a target to keep animation running
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 1000)
      manager.start()
      manager.start() // Second call
      
      expect(animateSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('clear', () => {
    it('should clear all targets and stop animation', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 })
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 })
      
      manager.clear()
      
      expect(manager.targets.size).toBe(0)
      expect(manager.isRunning).toBe(false)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', () => {
      manager.addTarget('cursor1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 })
      manager.addTarget('cursor2', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 })
      manager.addTarget('shape1', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 })
      
      const stats = manager.getStats()
      
      expect(stats.totalTargets).toBe(3)
      expect(stats.activeTargets).toBe(3)
      expect(stats.cursorTargets).toBe(2)
      expect(stats.shapeTargets).toBe(1)
      expect(stats.isRunning).toBe(true)
    })
  })

  describe('easing functions', () => {
    it('should add custom easing function', () => {
      const customEasing = (t) => t * t
      manager.addEasingFunction('custom', customEasing)
      
      expect(manager.easingFunctions.custom).toBe(customEasing)
    })

    it('should remove custom easing function', () => {
      const customEasing = (t) => t * t
      manager.addEasingFunction('custom', customEasing)
      manager.removeEasingFunction('custom')
      
      expect(manager.easingFunctions.custom).toBeUndefined()
    })

    it('should use custom easing function in interpolation', () => {
      const customEasing = (t) => t * t // Quadratic easing
      manager.addEasingFunction('quadratic', customEasing)
      
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'quadratic')
      
      // Mock performance.now to return halfway through animation
      mockNow.mockReturnValue(50)
      
      const position = manager.getPosition('test1')
      // With quadratic easing at t=0.5, progress = 0.5^2 = 0.25
      expect(position).toEqual({ x: 25, y: 25 })
      
      mockNow.mockRestore()
    })
  })

  describe('easing function behavior', () => {
    it('should have correct easing function outputs', () => {
      const { easingFunctions } = manager
      
      // Test easeOut
      expect(easingFunctions.easeOut(0)).toBe(0)
      expect(easingFunctions.easeOut(1)).toBe(1)
      expect(easingFunctions.easeOut(0.5)).toBeCloseTo(0.875, 2)
      
      // Test linear
      expect(easingFunctions.linear(0)).toBe(0)
      expect(easingFunctions.linear(1)).toBe(1)
      expect(easingFunctions.linear(0.5)).toBe(0.5)
      
      // Test easeInOut
      expect(easingFunctions.easeInOut(0)).toBe(0)
      expect(easingFunctions.easeInOut(1)).toBe(1)
      expect(easingFunctions.easeInOut(0.5)).toBe(0.5)
    })

    it('should have all new easing functions', () => {
      const { easingFunctions } = manager
      
      // Test new easing functions exist
      expect(easingFunctions.easeOutExpo).toBeDefined()
      expect(easingFunctions.easeOutCirc).toBeDefined()
      expect(easingFunctions.easeOutBack).toBeDefined()
      expect(easingFunctions.easeOutElastic).toBeDefined()
      expect(easingFunctions.easeOutBounce).toBeDefined()
      expect(easingFunctions.easeInOutQuart).toBeDefined()
      expect(easingFunctions.easeInOutExpo).toBeDefined()
      expect(easingFunctions.easeInOutCirc).toBeDefined()
    })
  })

  describe('getPositionWithVelocity', () => {
    it('should return position with velocity', () => {
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'linear')
      
      // Mock performance.now to return halfway through animation
      mockNow.mockReturnValue(50)
      
      const result = manager.getPositionWithVelocity('test1')
      expect(result).toHaveProperty('x')
      expect(result).toHaveProperty('y')
      expect(result).toHaveProperty('vx')
      expect(result).toHaveProperty('vy')
      expect(result.x).toBe(50)
      expect(result.y).toBe(50)
      
      mockNow.mockRestore()
    })

    it('should return null for non-existent target', () => {
      const result = manager.getPositionWithVelocity('nonexistent')
      expect(result).toBe(null)
    })
  })

  describe('addTargetSmooth', () => {
    it('should add target with smooth transition', () => {
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      // Add initial target
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 50, y: 50 }, 100)
      
      // Mock halfway through animation
      mockNow.mockReturnValue(50)
      
      // Add smooth target
      manager.addTargetSmooth('test1', 'cursor', { x: 100, y: 100 }, 100)
      
      const target = manager.targets.get('test1')
      // The exact position depends on the easing function, so we just check it's between start and target
      expect(target.startPos.x).toBeGreaterThan(0)
      expect(target.startPos.x).toBeLessThan(50)
      expect(target.startPos.y).toBeGreaterThan(0)
      expect(target.startPos.y).toBeLessThan(50)
      expect(target.targetPos).toEqual({ x: 100, y: 100 })
      
      mockNow.mockRestore()
    })
  })

  describe('getAllActivePositions', () => {
    it('should return all active positions', () => {
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100)
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100)
      
      // Mock halfway through animation
      mockNow.mockReturnValue(50)
      
      const positions = manager.getAllActivePositions()
      expect(positions.size).toBe(2)
      
      // Check that positions are interpolated (exact values depend on easing)
      const pos1 = positions.get('test1')
      const pos2 = positions.get('test2')
      expect(pos1.x).toBeGreaterThan(0)
      expect(pos1.x).toBeLessThan(100)
      expect(pos1.y).toBeGreaterThan(0)
      expect(pos1.y).toBeLessThan(100)
      expect(pos2.x).toBeGreaterThan(0)
      expect(pos2.x).toBeLessThan(200)
      expect(pos2.y).toBeGreaterThan(0)
      expect(pos2.y).toBeLessThan(200)
      
      mockNow.mockRestore()
    })
  })

  describe('getRecommendedEasing', () => {
    it('should return correct easing for animation types', () => {
      expect(manager.getRecommendedEasing('cursor')).toBe('easeOut')
      expect(manager.getRecommendedEasing('shape')).toBe('easeOutQuart')
      expect(manager.getRecommendedEasing('ui')).toBe('easeInOut')
      expect(manager.getRecommendedEasing('bounce')).toBe('easeOutBounce')
      expect(manager.getRecommendedEasing('elastic')).toBe('easeOutElastic')
      expect(manager.getRecommendedEasing('unknown')).toBe('easeOut')
    })
  })

  describe('getRecommendedDuration', () => {
    it('should return correct duration for animation types', () => {
      expect(manager.getRecommendedDuration('cursor')).toBe(50)
      expect(manager.getRecommendedDuration('shape')).toBe(150)
      expect(manager.getRecommendedDuration('ui')).toBe(200)
      expect(manager.getRecommendedDuration('fast')).toBe(100)
      expect(manager.getRecommendedDuration('slow')).toBe(300)
      expect(manager.getRecommendedDuration('unknown')).toBe(150)
    })
  })

  describe('getAnimationPreset', () => {
    it('should return correct preset configurations', () => {
      const cursorPreset = manager.getAnimationPreset('cursor-move')
      expect(cursorPreset).toEqual({ duration: 50, easing: 'easeOut' })
      
      const shapePreset = manager.getAnimationPreset('shape-drag')
      expect(shapePreset).toEqual({ duration: 150, easing: 'easeOutQuart' })
      
      const bouncePreset = manager.getAnimationPreset('bounce-in')
      expect(bouncePreset).toEqual({ duration: 400, easing: 'easeOutBounce' })
      
      const unknownPreset = manager.getAnimationPreset('unknown')
      expect(unknownPreset).toEqual({ duration: 150, easing: 'easeOut' })
    })
  })

  describe('updateTarget with momentum', () => {
    it('should update target with momentum', () => {
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100)
      
      // Mock halfway through animation
      mockNow.mockReturnValue(50)
      
      manager.updateTarget('test1', { x: 200, y: 200 }, null, true)
      
      const target = manager.targets.get('test1')
      expect(target.targetPos.x).toBeGreaterThan(200) // Should be adjusted by momentum
      expect(target.targetPos.y).toBeGreaterThan(200)
      
      mockNow.mockRestore()
    })
  })

  describe('target groups', () => {
    it('should add targets to groups', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'linear', 'group1')
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100, 'linear', 'group1')
      manager.addTarget('test3', 'cursor', { x: 0, y: 0 }, { x: 300, y: 300 }, 100, 'linear', 'group2')
      
      const group1Targets = manager.getGroupTargets('group1')
      const group2Targets = manager.getGroupTargets('group2')
      
      expect(group1Targets).toHaveLength(2)
      expect(group1Targets).toContain('test1')
      expect(group1Targets).toContain('test2')
      expect(group2Targets).toHaveLength(1)
      expect(group2Targets).toContain('test3')
    })

    it('should remove group when all targets are removed', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'linear', 'group1')
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100, 'linear', 'group1')
      
      expect(manager.getGroupTargets('group1')).toHaveLength(2)
      
      manager.removeTarget('test1')
      expect(manager.getGroupTargets('group1')).toHaveLength(1)
      
      manager.removeTarget('test2')
      expect(manager.getGroupTargets('group1')).toHaveLength(0)
    })

    it('should remove all targets in a group', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'linear', 'group1')
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100, 'linear', 'group1')
      manager.addTarget('test3', 'cursor', { x: 0, y: 0 }, { x: 300, y: 300 }, 100, 'linear', 'group2')
      
      const removedCount = manager.removeGroup('group1')
      
      expect(removedCount).toBe(2)
      expect(manager.getGroupTargets('group1')).toHaveLength(0)
      expect(manager.getGroupTargets('group2')).toHaveLength(1)
      expect(manager.targets.has('test1')).toBe(false)
      expect(manager.targets.has('test2')).toBe(false)
      expect(manager.targets.has('test3')).toBe(true)
    })
  })

  describe('target priorities', () => {
    it('should set and get targets by priority', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'linear', null, 1)
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100, 'linear', null, 5)
      manager.addTarget('test3', 'cursor', { x: 0, y: 0 }, { x: 300, y: 300 }, 100, 'linear', null, 3)
      
      const highPriority = manager.getTargetsByPriority(3)
      const lowPriority = manager.getTargetsByPriority(1, 2)
      
      expect(highPriority).toHaveLength(2)
      expect(highPriority).toContain('test2')
      expect(highPriority).toContain('test3')
      expect(lowPriority).toHaveLength(1)
      expect(lowPriority).toContain('test1')
    })
  })

  describe('target filtering', () => {
    it('should get targets by type', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100)
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100)
      manager.addTarget('test3', 'cursor', { x: 0, y: 0 }, { x: 300, y: 300 }, 100)
      
      const cursorTargets = manager.getTargetsByType('cursor')
      const shapeTargets = manager.getTargetsByType('shape')
      
      expect(cursorTargets).toHaveLength(2)
      expect(cursorTargets).toContain('test1')
      expect(cursorTargets).toContain('test3')
      expect(shapeTargets).toHaveLength(1)
      expect(shapeTargets).toContain('test2')
    })

    it('should get targets near completion', () => {
      const mockNow = vi.spyOn(performance, 'now')
      mockNow.mockReturnValue(0)
      
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100)
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100)
      
      // Mock 90% through animation
      mockNow.mockReturnValue(90)
      
      const nearCompletion = manager.getTargetsNearCompletion(0.8)
      
      expect(nearCompletion).toHaveLength(2)
      expect(nearCompletion).toContain('test1')
      expect(nearCompletion).toContain('test2')
      
      mockNow.mockRestore()
    })
  })

  describe('pause and resume', () => {
    it('should pause and resume individual targets', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100)
      
      expect(manager.isInterpolating('test1')).toBe(true)
      
      const paused = manager.pauseTarget('test1')
      expect(paused).toBe(true)
      expect(manager.isInterpolating('test1')).toBe(false)
      
      const resumed = manager.resumeTarget('test1')
      expect(resumed).toBe(true)
      expect(manager.isInterpolating('test1')).toBe(true)
    })

    it('should pause and resume groups', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'linear', 'group1')
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100, 'linear', 'group1')
      manager.addTarget('test3', 'cursor', { x: 0, y: 0 }, { x: 300, y: 300 }, 100, 'linear', 'group2')
      
      const pausedCount = manager.pauseGroup('group1')
      expect(pausedCount).toBe(2)
      expect(manager.isInterpolating('test1')).toBe(false)
      expect(manager.isInterpolating('test2')).toBe(false)
      expect(manager.isInterpolating('test3')).toBe(true)
      
      const resumedCount = manager.resumeGroup('group1')
      expect(resumedCount).toBe(2)
      expect(manager.isInterpolating('test1')).toBe(true)
      expect(manager.isInterpolating('test2')).toBe(true)
      expect(manager.isInterpolating('test3')).toBe(true)
    })
  })

  describe('enhanced statistics', () => {
    it('should provide comprehensive statistics', () => {
      manager.addTarget('test1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'linear', 'group1', 1)
      manager.addTarget('test2', 'shape', { x: 0, y: 0 }, { x: 200, y: 200 }, 100, 'linear', 'group1', 2)
      manager.addTarget('test3', 'cursor', { x: 0, y: 0 }, { x: 300, y: 300 }, 100, 'linear', 'group2', 1)
      
      // Pause one target
      manager.pauseTarget('test3')
      
      const stats = manager.getStats()
      
      expect(stats.totalTargets).toBe(3)
      expect(stats.activeTargets).toBe(2)
      expect(stats.inactiveTargets).toBe(1)
      expect(stats.cursorTargets).toBe(1) // Only active cursors
      expect(stats.shapeTargets).toBe(1)
      expect(stats.groupCount).toBe(2)
      expect(stats.groupStats.group1.total).toBe(2)
      expect(stats.groupStats.group1.active).toBe(2)
      expect(stats.groupStats.group2.total).toBe(1)
      expect(stats.groupStats.group2.active).toBe(0)
      expect(stats.priorityStats[1]).toBe(1) // Only active targets
      expect(stats.priorityStats[2]).toBe(1)
    })
  })
})
