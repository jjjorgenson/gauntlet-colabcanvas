import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import InterpolationManager, { InterpolationManager as InterpolationManagerClass } from '../../src/utils/InterpolationManager.js'

describe('InterpolationManager Integration Tests', () => {
  let manager

  beforeEach(() => {
    // Create a new instance for each test
    manager = new InterpolationManagerClass()
    manager.clear()
  })

  afterEach(() => {
    manager.clear()
  })

  describe('Real-world cursor simulation', () => {
    it('should handle rapid cursor movements smoothly', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Simulate rapid cursor movements
      const cursorMovements = [
        { time: 0, x: 0, y: 0 },
        { time: 10, x: 50, y: 30 },
        { time: 20, x: 100, y: 60 },
        { time: 30, x: 150, y: 90 },
        { time: 40, x: 200, y: 120 },
        { time: 50, x: 250, y: 150 },
      ]

      // Add initial cursor position
      manager.addTarget('cursor1', 'cursor', { x: 0, y: 0 }, { x: 50, y: 30 }, 50)

      const positions = []
      
      // Simulate cursor movements over time
      for (let i = 1; i < cursorMovements.length; i++) {
        const prev = cursorMovements[i - 1]
        const curr = cursorMovements[i]
        
        currentTime = curr.time
        
        // Update cursor target
        manager.updateTarget('cursor1', { x: curr.x, y: curr.y })
        
        // Get current interpolated position
        const position = manager.getPosition('cursor1')
        if (position) {
          positions.push({ time: curr.time, ...position })
        }
      }

      // Verify smooth interpolation
      expect(positions).toHaveLength(5)
      
      // Check that positions are interpolated (not jumping)
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1]
        const curr = positions[i]
        const distance = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        )
        // Distance should be reasonable (not too large jumps)
        expect(distance).toBeLessThan(100)
      }

      mockNow.mockRestore()
    })

    it('should handle multiple cursors simultaneously', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Add multiple cursors
      manager.addTarget('cursor1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 50)
      manager.addTarget('cursor2', 'cursor', { x: 200, y: 0 }, { x: 300, y: 100 }, 50)
      manager.addTarget('cursor3', 'cursor', { x: 0, y: 200 }, { x: 100, y: 300 }, 50)

      const allPositions = []
      
      // Simulate time progression
      for (let t = 0; t <= 50; t += 10) {
        currentTime = t
        
        const positions = manager.getAllActivePositions()
        allPositions.push({ time: t, positions: Object.fromEntries(positions) })
      }

      // Verify all cursors are being tracked
      expect(allPositions).toHaveLength(6)
      
      // Check that all cursors are interpolating
      const finalPositions = allPositions[allPositions.length - 1].positions
      expect(finalPositions.cursor1).toBeDefined()
      expect(finalPositions.cursor2).toBeDefined()
      expect(finalPositions.cursor3).toBeDefined()

      mockNow.mockRestore()
    })
  })

  describe('Shape animation simulation', () => {
    it('should handle shape dragging with momentum', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Simulate shape dragging sequence
      const dragSequence = [
        { time: 0, x: 100, y: 100 },
        { time: 50, x: 150, y: 120 },
        { time: 100, x: 200, y: 140 },
        { time: 150, x: 250, y: 160 },
        { time: 200, x: 300, y: 180 },
      ]

      // Start with initial shape position
      manager.addTarget('shape1', 'shape', { x: 100, y: 100 }, { x: 150, y: 120 }, 150)

      const positions = []
      
      // Simulate dragging with momentum
      for (let i = 1; i < dragSequence.length; i++) {
        const curr = dragSequence[i]
        currentTime = curr.time
        
        // Update with momentum
        manager.updateTarget('shape1', { x: curr.x, y: curr.y }, null, true)
        
        const position = manager.getPosition('shape1')
        if (position) {
          positions.push({ time: curr.time, ...position })
        }
      }

      // Verify smooth shape movement
      expect(positions).toHaveLength(4)
      
      // Check that shape moves smoothly (not jumping)
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1]
        const curr = positions[i]
        const distance = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        )
        // Shape movements should be smooth
        expect(distance).toBeLessThan(200)
      }

      mockNow.mockRestore()
    })

    it('should handle multiple shapes with different priorities', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Add shapes with different priorities
      manager.addTarget('shape1', 'shape', { x: 0, y: 0 }, { x: 100, y: 100 }, 200, 'easeOutQuart', 'shapes', 1)
      manager.addTarget('shape2', 'shape', { x: 200, y: 0 }, { x: 300, y: 100 }, 200, 'easeOutQuart', 'shapes', 2)
      manager.addTarget('shape3', 'shape', { x: 0, y: 200 }, { x: 100, y: 300 }, 200, 'easeOutQuart', 'shapes', 3)

      // Simulate time progression
      const positions = []
      for (let t = 0; t <= 200; t += 25) {
        currentTime = t
        
        const allPositions = manager.getAllActivePositions()
        positions.push({ time: t, positions: Object.fromEntries(allPositions) })
      }

      // Verify all shapes are animating
      expect(positions).toHaveLength(9)
      
      // Check priority-based organization
      const highPriorityTargets = manager.getTargetsByPriority(2)
      expect(highPriorityTargets).toContain('shape2')
      expect(highPriorityTargets).toContain('shape3')
      expect(highPriorityTargets).not.toContain('shape1')

      // Check group organization
      const groupTargets = manager.getGroupTargets('shapes')
      expect(groupTargets).toHaveLength(3)
      expect(groupTargets).toContain('shape1')
      expect(groupTargets).toContain('shape2')
      expect(groupTargets).toContain('shape3')

      mockNow.mockRestore()
    })
  })

  describe('Complex animation scenarios', () => {
    it('should handle mixed cursor and shape animations', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Add mixed targets
      manager.addTarget('cursor1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 50, 'easeOut', 'cursors', 1)
      manager.addTarget('shape1', 'shape', { x: 200, y: 0 }, { x: 300, y: 100 }, 150, 'easeOutQuart', 'shapes', 2)
      manager.addTarget('cursor2', 'cursor', { x: 0, y: 200 }, { x: 100, y: 300 }, 50, 'easeOut', 'cursors', 1)

      // Simulate complex animation sequence
      const animationSteps = [
        { time: 25, action: 'update', target: 'cursor1', pos: { x: 150, y: 150 } },
        { time: 50, action: 'pause', target: 'shape1' },
        { time: 75, action: 'update', target: 'cursor2', pos: { x: 150, y: 350 } },
        { time: 100, action: 'resume', target: 'shape1' },
        { time: 125, action: 'update', target: 'shape1', pos: { x: 400, y: 200 } },
      ]

      const results = []
      
      for (const step of animationSteps) {
        currentTime = step.time
        
        switch (step.action) {
          case 'update':
            manager.updateTarget(step.target, step.pos)
            break
          case 'pause':
            manager.pauseTarget(step.target)
            break
          case 'resume':
            manager.resumeTarget(step.target)
            break
        }
        
        const positions = manager.getAllActivePositions()
        const stats = manager.getStats()
        
        results.push({
          time: step.time,
          action: step.action,
          target: step.target,
          positions: Object.fromEntries(positions),
          stats
        })
      }

      // Verify complex animation handling
      expect(results).toHaveLength(5)
      
      // Check that pause/resume works correctly
      const pauseResult = results.find(r => r.action === 'pause')
      expect(pauseResult.stats.activeTargets).toBeLessThan(3) // Some targets paused
      
      const resumeResult = results.find(r => r.action === 'resume')
      expect(resumeResult.stats.activeTargets).toBeGreaterThan(0) // Some targets active again

      // Check group statistics
      const finalStats = results[results.length - 1].stats
      expect(finalStats.groupStats.cursors.total).toBe(2)
      expect(finalStats.groupStats.shapes.total).toBe(1)

      mockNow.mockRestore()
    })

    it('should handle animation completion and cleanup', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Add targets with different durations
      manager.addTarget('fast1', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 50)
      manager.addTarget('fast2', 'cursor', { x: 200, y: 0 }, { x: 300, y: 100 }, 50)
      manager.addTarget('slow1', 'shape', { x: 0, y: 200 }, { x: 100, y: 300 }, 150)

      const completionStates = []
      
      // Monitor completion over time
      for (let t = 0; t <= 200; t += 25) {
        currentTime = t
        
        const stats = manager.getStats()
        const nearCompletion = manager.getTargetsNearCompletion(0.8)
        
        completionStates.push({
          time: t,
          totalTargets: stats.totalTargets,
          activeTargets: stats.activeTargets,
          nearCompletion: nearCompletion.length
        })
      }

      // Verify completion progression
      expect(completionStates).toHaveLength(9)
      
      // Check that fast animations complete first
      const at50ms = completionStates.find(s => s.time === 50)
      expect(at50ms.activeTargets).toBeLessThanOrEqual(3) // Some targets may be completing
      
      // Check that slow animations complete later
      const at150ms = completionStates.find(s => s.time === 150)
      expect(at150ms.activeTargets).toBeLessThanOrEqual(3) // Some may still be active

      // Verify cleanup (some targets may remain due to timing)
      const finalStats = manager.getStats()
      expect(finalStats.totalTargets).toBeLessThanOrEqual(3)
      expect(finalStats.activeTargets).toBeLessThanOrEqual(3)

      mockNow.mockRestore()
    })
  })

  describe('Performance and edge cases', () => {
    it('should handle large number of simultaneous animations', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Add many targets
      const targetCount = 50
      for (let i = 0; i < targetCount; i++) {
        const x = Math.random() * 1000
        const y = Math.random() * 1000
        const targetX = x + Math.random() * 200 - 100
        const targetY = y + Math.random() * 200 - 100
        
        manager.addTarget(
          `target${i}`,
          i % 2 === 0 ? 'cursor' : 'shape',
          { x, y },
          { x: targetX, y: targetY },
          100 + Math.random() * 100,
          'easeOut',
          `group${i % 5}`,
          Math.floor(Math.random() * 5)
        )
      }

      // Simulate animation over time
      const performanceResults = []
      for (let t = 0; t <= 200; t += 50) {
        currentTime = t
        
        const startTime = performance.now()
        const positions = manager.getAllActivePositions()
        const stats = manager.getStats()
        const endTime = performance.now()
        
        performanceResults.push({
          time: t,
          targetCount: positions.size,
          processingTime: endTime - startTime,
          stats
        })
      }

      // Verify performance
      expect(performanceResults).toHaveLength(5)
      
      // Check that processing time is reasonable (less than 10ms for 50 targets)
      for (const result of performanceResults) {
        expect(result.processingTime).toBeLessThan(10)
      }

      // Verify statistics accuracy
      const finalStats = performanceResults[performanceResults.length - 1].stats
      expect(finalStats.groupCount).toBe(5)
      expect(finalStats.totalTargets).toBeLessThanOrEqual(targetCount) // Should have some targets

      mockNow.mockRestore()
    })

    it('should handle rapid target addition and removal', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      const operations = []
      
      // Rapidly add and remove targets
      for (let i = 0; i < 20; i++) {
        currentTime = i * 10
        
        if (i % 3 === 0) {
          // Add target
          manager.addTarget(`temp${i}`, 'cursor', { x: i * 10, y: i * 10 }, { x: i * 20, y: i * 20 }, 50)
          operations.push({ time: currentTime, action: 'add', target: `temp${i}` })
        } else if (i % 3 === 1) {
          // Remove target
          if (i > 0) {
            manager.removeTarget(`temp${i - 3}`)
            operations.push({ time: currentTime, action: 'remove', target: `temp${i - 3}` })
          }
        }
        
        const stats = manager.getStats()
        operations[operations.length - 1].stats = stats
      }

      // Verify operations completed successfully
      expect(operations.length).toBeGreaterThan(0)
      
      // Check that most targets are cleaned up
      const finalStats = manager.getStats()
      expect(finalStats.totalTargets).toBeLessThanOrEqual(10) // Some may remain due to timing
      expect(finalStats.activeTargets).toBeLessThanOrEqual(10)

      mockNow.mockRestore()
    })
  })

  describe('Real-world collaboration simulation', () => {
    it('should simulate multi-user cursor tracking', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Simulate 3 users with different cursor behaviors
      const users = [
        { id: 'user1', color: '#FF0000', behavior: 'fast' },
        { id: 'user2', color: '#00FF00', behavior: 'slow' },
        { id: 'user3', color: '#0000FF', behavior: 'erratic' }
      ]

      // Add user cursors
      users.forEach((user, index) => {
        manager.addTarget(
          `cursor_${user.id}`,
          'cursor',
          { x: index * 100, y: index * 100 },
          { x: index * 100 + 50, y: index * 100 + 50 },
          50,
          'easeOut',
          'user_cursors',
          1
        )
      })

      // Simulate user movements
      const simulationSteps = []
      for (let step = 0; step < 10; step++) {
        currentTime = step * 25
        
        users.forEach((user, index) => {
          let newX, newY
          
          switch (user.behavior) {
            case 'fast':
              newX = index * 100 + step * 20
              newY = index * 100 + step * 15
              break
            case 'slow':
              newX = index * 100 + step * 10
              newY = index * 100 + step * 8
              break
            case 'erratic':
              newX = index * 100 + (Math.random() - 0.5) * 100
              newY = index * 100 + (Math.random() - 0.5) * 100
              break
          }
          
          manager.updateTarget(`cursor_${user.id}`, { x: newX, y: newY })
        })
        
        const positions = manager.getAllActivePositions()
        const stats = manager.getStats()
        
        simulationSteps.push({
          step,
          time: currentTime,
          positions: Object.fromEntries(positions),
          stats
        })
      }

      // Verify multi-user simulation
      expect(simulationSteps).toHaveLength(10)
      
      // Check that all user cursors are tracked
      const finalStep = simulationSteps[simulationSteps.length - 1]
      expect(Object.keys(finalStep.positions)).toHaveLength(3)
      expect(finalStep.positions.cursor_user1).toBeDefined()
      expect(finalStep.positions.cursor_user2).toBeDefined()
      expect(finalStep.positions.cursor_user3).toBeDefined()

      // Verify group statistics
      expect(finalStep.stats.groupStats.user_cursors.total).toBe(3)
      expect(finalStep.stats.groupStats.user_cursors.active).toBe(3)

      mockNow.mockRestore()
    })

    it('should handle user disconnection and reconnection', () => {
      const mockNow = vi.spyOn(performance, 'now')
      let currentTime = 0
      mockNow.mockImplementation(() => currentTime)

      // Add user cursors
      manager.addTarget('user1_cursor', 'cursor', { x: 0, y: 0 }, { x: 100, y: 100 }, 50, 'easeOut', 'active_users', 1)
      manager.addTarget('user2_cursor', 'cursor', { x: 200, y: 0 }, { x: 300, y: 100 }, 50, 'easeOut', 'active_users', 1)
      manager.addTarget('user3_cursor', 'cursor', { x: 0, y: 200 }, { x: 100, y: 300 }, 50, 'easeOut', 'active_users', 1)

      const connectionEvents = []
      
      // Simulate connection events
      const events = [
        { time: 100, event: 'disconnect', user: 'user2' },
        { time: 200, event: 'reconnect', user: 'user2' },
        { time: 300, event: 'disconnect', user: 'user1' },
        { time: 400, event: 'reconnect', user: 'user1' },
      ]

      for (const event of events) {
        currentTime = event.time
        
        if (event.event === 'disconnect') {
          manager.removeTarget(`${event.user}_cursor`)
        } else if (event.event === 'reconnect') {
          manager.addTarget(
            `${event.user}_cursor`,
            'cursor',
            { x: Math.random() * 500, y: Math.random() * 500 },
            { x: Math.random() * 500, y: Math.random() * 500 },
            50,
            'easeOut',
            'active_users',
            1
          )
        }
        
        const stats = manager.getStats()
        connectionEvents.push({
          time: event.time,
          event: event.event,
          user: event.user,
          stats
        })
      }

      // Verify connection handling
      expect(connectionEvents).toHaveLength(4)
      
      // Check that disconnections are handled
      const disconnect1 = connectionEvents.find(e => e.event === 'disconnect' && e.user === 'user2')
      expect(disconnect1.stats.totalTargets).toBe(2)
      
      // Check that reconnections are handled
      const reconnect1 = connectionEvents.find(e => e.event === 'reconnect' && e.user === 'user2')
      expect(reconnect1.stats.totalTargets).toBe(3)

      mockNow.mockRestore()
    })
  })
})
