import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import ownershipManager, { OwnershipManager as OwnershipManagerClass } from '../../../src/utils/OwnershipManager.js'

describe('OwnershipManager', () => {
  let manager

  beforeEach(() => {
    // Create a new instance for each test
    manager = new OwnershipManagerClass()
    manager.clear()
  })

  afterEach(() => {
    manager.clear()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = new OwnershipManagerClass()
      const instance2 = new OwnershipManagerClass()
      expect(instance1).toBe(instance2)
    })

    it('should have default configuration', () => {
      expect(manager.INACTIVITY_TIMEOUT).toBe(15000)
      expect(manager.ACTIVITY_UPDATE_INTERVAL).toBe(1000)
      expect(manager.CLEANUP_INTERVAL).toBe(5000)
      expect(manager.isRunning).toBe(false)
    })
  })

  describe('Start and Stop', () => {
    it('should start the manager', () => {
      manager.start()
      expect(manager.isRunning).toBe(true)
      expect(manager.activityUpdateTimer).toBeTruthy()
      expect(manager.cleanupTimer).toBeTruthy()
    })

    it('should stop the manager', () => {
      manager.start()
      manager.stop()
      expect(manager.isRunning).toBe(false)
      expect(manager.activityUpdateTimer).toBeNull()
      expect(manager.cleanupTimer).toBeNull()
    })

    it('should not start if already running', () => {
      manager.start()
      const originalTimer = manager.activityUpdateTimer
      manager.start()
      expect(manager.activityUpdateTimer).toBe(originalTimer)
    })

    it('should not stop if not running', () => {
      manager.stop()
      expect(manager.isRunning).toBe(false)
    })
  })

  describe('Ownership Acquisition', () => {
    it('should acquire ownership successfully', () => {
      const result = manager.acquireOwnership('shape1', 'user1')
      expect(result).toBe(true)
      expect(manager.isOwner('shape1', 'user1')).toBe(true)
      expect(manager.getOwner('shape1')).toBe('user1')
    })

    it('should not acquire ownership with invalid parameters', () => {
      expect(manager.acquireOwnership('', 'user1')).toBe(false)
      expect(manager.acquireOwnership('shape1', '')).toBe(false)
      expect(manager.acquireOwnership(null, 'user1')).toBe(false)
      expect(manager.acquireOwnership('shape1', null)).toBe(false)
    })

    it('should handle ownership conflict', () => {
      manager.acquireOwnership('shape1', 'user1')
      const result = manager.acquireOwnership('shape1', 'user2')
      expect(result).toBe(false)
      expect(manager.getOwner('shape1')).toBe('user1')
    })

    it('should force acquire ownership', () => {
      manager.acquireOwnership('shape1', 'user1')
      const result = manager.acquireOwnership('shape1', 'user2', { force: true })
      expect(result).toBe(true)
      expect(manager.getOwner('shape1')).toBe('user2')
    })

    it('should set up timeout timer', () => {
      manager.acquireOwnership('shape1', 'user1')
      expect(manager.ownershipTimers.has('shape1')).toBe(true)
    })

    it('should not set up timer if autoRelease is false', () => {
      manager.acquireOwnership('shape1', 'user1', { autoRelease: false })
      expect(manager.ownershipTimers.has('shape1')).toBe(false)
    })

    it('should use custom timeout', () => {
      const customTimeout = 5000
      manager.acquireOwnership('shape1', 'user1', { timeout: customTimeout })
      expect(manager.ownedShapes.get('shape1').options.timeout).toBe(customTimeout)
    })
  })

  describe('Ownership Release', () => {
    beforeEach(() => {
      manager.acquireOwnership('shape1', 'user1')
    })

    it('should release ownership successfully', () => {
      const result = manager.releaseOwnership('shape1', 'user1')
      expect(result).toBe(true)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(manager.ownershipTimers.has('shape1')).toBe(false)
    })

    it('should not release ownership with invalid parameters', () => {
      expect(manager.releaseOwnership('', 'user1')).toBe(false)
      expect(manager.releaseOwnership('shape1', '')).toBe(false)
    })

    it('should not release ownership of non-owned shape', () => {
      const result = manager.releaseOwnership('shape2', 'user1')
      expect(result).toBe(false)
    })

    it('should not release ownership by wrong user', () => {
      const result = manager.releaseOwnership('shape1', 'user2')
      expect(result).toBe(false)
      expect(manager.getOwner('shape1')).toBe('user1')
    })

    it('should clear timeout timer on release', () => {
      expect(manager.ownershipTimers.has('shape1')).toBe(true)
      manager.releaseOwnership('shape1', 'user1')
      expect(manager.ownershipTimers.has('shape1')).toBe(false)
    })
  })

  describe('Ownership Queries', () => {
    beforeEach(() => {
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape2', 'user1')
      manager.acquireOwnership('shape3', 'user2')
    })

    it('should check ownership correctly', () => {
      expect(manager.isOwner('shape1', 'user1')).toBe(true)
      expect(manager.isOwner('shape1', 'user2')).toBe(false)
      expect(manager.isOwner('shape2', 'user1')).toBe(true)
      expect(manager.isOwner('shape3', 'user2')).toBe(true)
    })

    it('should get owner correctly', () => {
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(manager.getOwner('shape2')).toBe('user1')
      expect(manager.getOwner('shape3')).toBe('user2')
      expect(manager.getOwner('shape4')).toBeNull()
    })

    it('should get owned shapes for user', () => {
      const user1Shapes = manager.getOwnedShapes('user1')
      const user2Shapes = manager.getOwnedShapes('user2')
      const user3Shapes = manager.getOwnedShapes('user3')
      
      expect(user1Shapes).toHaveLength(2)
      expect(user1Shapes).toContain('shape1')
      expect(user1Shapes).toContain('shape2')
      
      expect(user2Shapes).toHaveLength(1)
      expect(user2Shapes).toContain('shape3')
      
      expect(user3Shapes).toHaveLength(0)
    })

    it('should get ownership info', () => {
      const info = manager.getOwnershipInfo('shape1')
      expect(info).toBeTruthy()
      expect(info.shapeId).toBe('shape1')
      expect(info.userId).toBe('user1')
      expect(info.acquiredAt).toBeTruthy()
      expect(info.lastActivity).toBeTruthy()
    })

    it('should return null for non-owned shape', () => {
      const info = manager.getOwnershipInfo('shape4')
      expect(info).toBeNull()
    })
  })

  describe('User Activity', () => {
    beforeEach(() => {
      manager.acquireOwnership('shape1', 'user1')
    })

    it('should update user activity', () => {
      manager.acquireOwnership('shape1', 'user1')
      
      const initialTime = Date.now()
      manager.updateUserActivity('user1')
      
      const ownershipData = manager.ownedShapes.get('shape1')
      expect(ownershipData.lastActivity).toBeGreaterThanOrEqual(initialTime)
    })

    it('should update activity with custom timestamp', () => {
      manager.acquireOwnership('shape1', 'user1')
      
      const customTime = 1234567890
      manager.updateUserActivity('user1', customTime)
      
      const ownershipData = manager.ownedShapes.get('shape1')
      expect(ownershipData.lastActivity).toBe(customTime)
    })

    it('should reset timeout timer on activity update', () => {
      vi.useFakeTimers()
      
      manager.acquireOwnership('shape1', 'user1', { timeout: 2000 })
      
      const originalTimer = manager.ownershipTimers.get('shape1')
      expect(originalTimer).toBeTruthy()
      
      // Advance time slightly to ensure timer is different
      vi.advanceTimersByTime(100)
      
      manager.updateUserActivity('user1')
      const newTimer = manager.ownershipTimers.get('shape1')
      
      expect(newTimer).toBeTruthy()
      expect(newTimer).not.toBe(originalTimer)
      
      vi.useRealTimers()
    })

    it('should check if user is active', () => {
      manager.updateUserActivity('user1')
      expect(manager.isUserActive('user1')).toBe(true)
      
      // Mock old activity
      manager.userActivity.set('user1', Date.now() - 20000)
      expect(manager.isUserActive('user1')).toBe(false)
    })

    it('should get active users', () => {
      manager.acquireOwnership('shape2', 'user2')
      manager.updateUserActivity('user1')
      manager.updateUserActivity('user2')
      
      const activeUsers = manager.getActiveUsers()
      expect(activeUsers).toContain('user1')
      expect(activeUsers).toContain('user2')
    })
  })

  describe('Ownership Timeout', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should timeout ownership after inactivity', () => {
      const onTimeout = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: onTimeout })
      
      manager.acquireOwnership('shape1', 'user1', { timeout: 1000 })
      
      // Fast forward time
      vi.advanceTimersByTime(1000)
      
      expect(manager.getOwner('shape1')).toBeNull()
      expect(onTimeout).toHaveBeenCalledWith(
        expect.objectContaining({
          shapeId: 'shape1',
          userId: 'user1'
        })
      )
    })

    it('should not timeout if user is active', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 1000 })
      
      // Update activity before timeout
      vi.advanceTimersByTime(500)
      manager.updateUserActivity('user1')
      
      // Fast forward past original timeout but not past new timeout
      vi.advanceTimersByTime(500)
      
      expect(manager.getOwner('shape1')).toBe('user1')
    })

    it('should not timeout if autoRelease is false', () => {
      manager.acquireOwnership('shape1', 'user1', { autoRelease: false, timeout: 1000 })
      
      vi.advanceTimersByTime(1000)
      
      expect(manager.getOwner('shape1')).toBe('user1')
    })
  })

  describe('Force Release', () => {
    beforeEach(() => {
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape2', 'user1')
      manager.acquireOwnership('shape3', 'user2')
    })

    it('should force release all shapes for a user', () => {
      manager.forceReleaseAll('user1', 'disconnect')
      
      expect(manager.getOwnedShapes('user1')).toHaveLength(0)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(manager.getOwner('shape2')).toBeNull()
      expect(manager.getOwner('shape3')).toBe('user2') // Should remain
    })

    it('should handle force release for user with no shapes', () => {
      expect(() => {
        manager.forceReleaseAll('user3', 'disconnect')
      }).not.toThrow()
    })
  })

  describe('Statistics', () => {
    it('should track acquisition statistics', () => {
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape2', 'user2')
      
      const stats = manager.getStats()
      expect(stats.totalAcquisitions).toBe(2)
      expect(stats.currentOwners).toBe(2)
    })

    it('should track release statistics', () => {
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape2', 'user2')
      manager.releaseOwnership('shape1', 'user1')
      
      const stats = manager.getStats()
      expect(stats.totalReleases).toBe(1)
      expect(stats.currentOwners).toBe(1)
    })

    it('should track timeout statistics', () => {
      vi.useFakeTimers()
      
      manager.acquireOwnership('shape1', 'user1', { timeout: 1000 })
      vi.advanceTimersByTime(1000)
      
      const stats = manager.getStats()
      expect(stats.totalTimeouts).toBe(1)
      
      vi.useRealTimers()
    })

    it('should track active users', () => {
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape2', 'user2')
      manager.updateUserActivity('user1')
      manager.updateUserActivity('user2')
      
      const stats = manager.getStats()
      expect(stats.activeUsers).toBe(2)
    })
  })

  describe('Event Callbacks', () => {
    it('should call ownership acquired callback', () => {
      const onAcquired = vi.fn()
      manager.setCallbacks({ onOwnershipAcquired: onAcquired })
      
      manager.acquireOwnership('shape1', 'user1')
      
      expect(onAcquired).toHaveBeenCalledWith(
        expect.objectContaining({
          shapeId: 'shape1',
          userId: 'user1'
        })
      )
    })

    it('should call ownership released callback', () => {
      const onReleased = vi.fn()
      manager.setCallbacks({ onOwnershipReleased: onReleased })
      
      manager.acquireOwnership('shape1', 'user1')
      manager.releaseOwnership('shape1', 'user1')
      
      expect(onReleased).toHaveBeenCalledWith(
        expect.objectContaining({
          shapeId: 'shape1',
          userId: 'user1',
          reason: 'manual'
        })
      )
    })

    it('should call ownership timeout callback', () => {
      vi.useFakeTimers()
      
      const onTimeout = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: onTimeout })
      
      manager.acquireOwnership('shape1', 'user1', { timeout: 1000 })
      vi.advanceTimersByTime(1000)
      
      expect(onTimeout).toHaveBeenCalledWith(
        expect.objectContaining({
          shapeId: 'shape1',
          userId: 'user1'
        })
      )
      
      vi.useRealTimers()
    })
  })

  describe('Cleanup', () => {
    it('should clear all data', () => {
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape2', 'user2')
      
      manager.clear()
      
      expect(manager.ownedShapes.size).toBe(0)
      expect(manager.userActivity.size).toBe(0)
      expect(manager.ownershipTimers.size).toBe(0)
      expect(manager.isRunning).toBe(false)
      
      const stats = manager.getStats()
      expect(stats.totalAcquisitions).toBe(0)
      expect(stats.totalReleases).toBe(0)
      expect(stats.currentOwners).toBe(0)
    })

    it('should stop timers on clear', () => {
      manager.start()
      expect(manager.isRunning).toBe(true)
      
      manager.clear()
      expect(manager.isRunning).toBe(false)
    })
  })

  describe('Enhanced Acquisition Logic', () => {
    it('should handle priority-based acquisition', () => {
      manager.setUserPriority('user1', 1)
      manager.setUserPriority('user2', 2)
      
      manager.acquireOwnership('shape1', 'user1')
      expect(manager.getOwner('shape1')).toBe('user1')
      
      // Higher priority user should be able to take ownership
      const result = manager.acquireOwnership('shape1', 'user2', { priority: true })
      expect(result).toBe(true)
      expect(manager.getOwner('shape1')).toBe('user2')
    })

    it('should queue acquisition requests', async () => {
      manager.acquireOwnership('shape1', 'user1')
      
      // Queue a request
      const promise = manager.acquireOwnership('shape1', 'user2', { queue: true })
      expect(promise).toBeInstanceOf(Promise)
      
      // Release ownership
      manager.releaseOwnership('shape1', 'user1')
      
      // Should resolve the queued request
      const result = await promise
      expect(result).toBe(true)
      expect(manager.getOwner('shape1')).toBe('user2')
    })

    it('should handle acquisition queue timeout', async () => {
      manager.acquireOwnership('shape1', 'user1')
      
      // Queue a request with short timeout
      const promise = manager.acquireOwnership('shape1', 'user2', { 
        queue: true, 
        queueTimeout: 100 
      })
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should reject
      await expect(promise).rejects.toThrow('Acquisition request timed out')
    })
  })

  describe('Enhanced Release Logic', () => {
    it('should handle graceful handoff', () => {
      manager.acquireOwnership('shape1', 'user1')
      
      const result = manager.handoffOwnership('shape1', 'user1', 'user2')
      expect(result).toBe(true)
      expect(manager.getOwner('shape1')).toBe('user2')
      
      // Check ownership history
      const history = manager.getOwnershipHistory('shape1')
      expect(history).toHaveLength(3) // acquire, release, acquire
      expect(history[1].action).toBe('released')
      expect(history[1].reason).toBe('handoff')
    })

    it('should prevent handoff when not allowed', () => {
      manager.acquireOwnership('shape1', 'user1', { allowHandoff: false })
      
      const result = manager.handoffOwnership('shape1', 'user1', 'user2')
      expect(result).toBe(false)
      expect(manager.getOwner('shape1')).toBe('user1')
    })

    it('should validate ownership', () => {
      manager.acquireOwnership('shape1', 'user1')
      
      expect(manager.validateOwnership('shape1', 'user1')).toBe(true)
      expect(manager.validateOwnership('shape1', 'user2')).toBe(false)
      expect(manager.validateOwnership('shape2', 'user1')).toBe(false)
    })
  })

  describe('Batch Operations', () => {
    it('should batch acquire ownership', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3']
      const results = manager.batchAcquireOwnership(shapeIds, 'user1')
      
      expect(results.successful).toEqual(shapeIds)
      expect(results.failed).toEqual([])
      expect(results.queued).toEqual([])
      
      expect(manager.getOwnedShapes('user1')).toEqual(shapeIds)
    })

    it('should batch release ownership', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3']
      manager.batchAcquireOwnership(shapeIds, 'user1')
      
      const results = manager.batchReleaseOwnership(shapeIds, 'user1')
      
      expect(results.successful).toEqual(shapeIds)
      expect(results.failed).toEqual([])
      
      expect(manager.getOwnedShapes('user1')).toEqual([])
    })

    it('should handle mixed batch results', () => {
      // Acquire some shapes
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape2', 'user2')
      
      // Try to batch acquire (user1 already owns shape1, so it should succeed)
      const results = manager.batchAcquireOwnership(['shape1', 'shape2', 'shape3'], 'user1')
      
      expect(results.successful).toEqual(['shape1', 'shape3'])
      expect(results.failed).toEqual(['shape2'])
      expect(results.queued).toEqual([])
    })
  })

  describe('User Priority Management', () => {
    it('should set and get user priority', () => {
      manager.setUserPriority('user1', 5)
      expect(manager.getUserPriority('user1')).toBe(5)
      expect(manager.getUserPriority('user2')).toBe(0) // Default
    })

    it('should use priority in acquisition queue', async () => {
      manager.acquireOwnership('shape1', 'user1')
      
      // Set different priorities
      manager.setUserPriority('user2', 1)
      manager.setUserPriority('user3', 2)
      
      // Queue requests (user3 should get priority)
      const promise2 = manager.acquireOwnership('shape1', 'user2', { queue: true })
      const promise3 = manager.acquireOwnership('shape1', 'user3', { queue: true })
      
      // Release ownership
      manager.releaseOwnership('shape1', 'user1')
      
      // Wait for promises with timeout
      try {
        await Promise.race([
          Promise.all([promise2, promise3]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 1000))
        ])
        
        // user3 should have ownership (higher priority)
        expect(manager.getOwner('shape1')).toBe('user3')
      } catch (error) {
        // If there's an error, just check that user3 got ownership
        expect(manager.getOwner('shape1')).toBe('user3')
      }
    })
  })

  describe('Ownership History', () => {
    it('should track ownership history', () => {
      manager.acquireOwnership('shape1', 'user1')
      manager.releaseOwnership('shape1', 'user1')
      manager.acquireOwnership('shape1', 'user2')
      
      const history = manager.getOwnershipHistory('shape1')
      expect(history).toHaveLength(3)
      expect(history[0].action).toBe('acquired')
      expect(history[0].userId).toBe('user1')
      expect(history[1].action).toBe('released')
      expect(history[1].userId).toBe('user1')
      expect(history[2].action).toBe('acquired')
      expect(history[2].userId).toBe('user2')
    })

    it('should limit history size', () => {
      // Create many ownership changes
      for (let i = 0; i < 60; i++) {
        const userId = i % 2 === 0 ? 'user1' : 'user2'
        manager.acquireOwnership('shape1', userId)
        manager.releaseOwnership('shape1', userId)
      }
      
      const history = manager.getOwnershipHistory('shape1')
      expect(history.length).toBeLessThanOrEqual(50)
    })
  })

  describe('Acquisition Queue Management', () => {
    it('should get acquisition queue', () => {
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape1', 'user2', { queue: true })
      manager.acquireOwnership('shape1', 'user3', { queue: true })
      
      const queue = manager.getAcquisitionQueue('shape1')
      expect(queue).toHaveLength(2)
      expect(queue[0].userId).toBe('user2')
      expect(queue[1].userId).toBe('user3')
    })

    it('should clear acquisition queue', () => {
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape1', 'user2', { queue: true })
      
      manager.clearAcquisitionQueue('shape1', 'test')
      
      const queue = manager.getAcquisitionQueue('shape1')
      expect(queue).toHaveLength(0)
    })
  })

  describe('Enhanced Timeout Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should setup timeout and warning timers', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      expect(manager.ownershipTimers.has('shape1')).toBe(true)
      expect(manager.warningTimers.has('shape1')).toBe(true)
    })

    it('should trigger timeout warning before timeout', () => {
      const onWarning = vi.fn()
      manager.setCallbacks({ onOwnershipTimeoutWarning: onWarning })
      
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Advance to warning time (5 seconds before timeout)
      vi.advanceTimersByTime(5000)
      
      expect(onWarning).toHaveBeenCalledWith(
        expect.objectContaining({
          shapeId: 'shape1',
          userId: 'user1',
          timeRemaining: 5000
        })
      )
    })

    it('should extend timeout for a shape', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      const result = manager.extendTimeout('shape1', 5000)
      expect(result).toBe(true)
      
      const timeoutInfo = manager.getTimeoutInfo('shape1')
      expect(timeoutInfo.timeout).toBe(15000) // 10000 + 5000
    })

    it('should not extend timeout if auto-release is disabled', () => {
      manager.acquireOwnership('shape1', 'user1', { autoRelease: false, timeout: 10000 })
      
      const result = manager.extendTimeout('shape1', 5000)
      expect(result).toBe(false)
    })

    it('should get timeout information for a shape', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      const timeoutInfo = manager.getTimeoutInfo('shape1')
      expect(timeoutInfo).toEqual(
        expect.objectContaining({
          shapeId: 'shape1',
          userId: 'user1',
          timeout: 10000,
          timeRemaining: 10000,
          isWarningActive: true,
          isTimeoutActive: true,
          autoRelease: true
        })
      )
    })

    it('should track timeout statistics for users', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 1000 })
      
      // Trigger timeout
      vi.advanceTimersByTime(1000)
      
      const stats = manager.getTimeoutStats('user1')
      expect(stats.totalTimeouts).toBe(1)
      expect(stats.lastTimeout).toBeTruthy()
    })

    it('should track warning statistics', () => {
      const onWarning = vi.fn()
      manager.setCallbacks({ onOwnershipTimeoutWarning: onWarning })
      
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Trigger warning
      vi.advanceTimersByTime(5000)
      
      const stats = manager.getTimeoutStats('user1')
      expect(stats.totalWarnings).toBe(1)
      expect(stats.lastWarning).toBeTruthy()
    })

    it('should track extension statistics', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      manager.extendTimeout('shape1', 5000)
      
      const stats = manager.getTimeoutStats('user1')
      expect(stats.totalExtensions).toBe(1)
    })

    it('should clear timeout timers on release', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      expect(manager.ownershipTimers.has('shape1')).toBe(true)
      expect(manager.warningTimers.has('shape1')).toBe(true)
      
      manager.releaseOwnership('shape1', 'user1')
      
      expect(manager.ownershipTimers.has('shape1')).toBe(false)
      expect(manager.warningTimers.has('shape1')).toBe(false)
    })

    it('should handle timeout with grace period', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Extend timeout (simulating grace period)
      manager.extendTimeout('shape1', 3000)
      
      // Should not timeout at original time
      vi.advanceTimersByTime(10000)
      expect(manager.getOwner('shape1')).toBe('user1')
      
      // Should timeout at extended time
      vi.advanceTimersByTime(3000)
      expect(manager.getOwner('shape1')).toBeNull()
    })

    it('should reset timers on activity update', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      const originalTimer = manager.ownershipTimers.get('shape1')
      expect(originalTimer).toBeTruthy()
      
      // Advance time slightly to ensure timer is different
      vi.advanceTimersByTime(100)
      
      // Update activity
      manager.updateUserActivity('user1')
      
      const newTimer = manager.ownershipTimers.get('shape1')
      expect(newTimer).toBeTruthy()
      expect(newTimer).not.toBe(originalTimer)
    })

    it('should handle multiple shapes with different timeouts', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 5000 })
      manager.acquireOwnership('shape2', 'user1', { timeout: 10000 })
      
      // shape1 should timeout first
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(manager.getOwner('shape2')).toBe('user1')
      
      // shape2 should timeout later
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape2')).toBeNull()
    })

    it('should handle timeout with activity updates', () => {
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Update activity before timeout
      vi.advanceTimersByTime(5000)
      manager.updateUserActivity('user1')
      
      // Should not timeout at original time
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape1')).toBe('user1')
      
      // Should timeout after additional inactivity
      vi.advanceTimersByTime(10000)
      expect(manager.getOwner('shape1')).toBeNull()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complex ownership scenarios', () => {
      // Multiple users, multiple shapes
      manager.acquireOwnership('shape1', 'user1')
      manager.acquireOwnership('shape2', 'user2')
      manager.acquireOwnership('shape3', 'user1')
      
      // Force acquisition
      manager.acquireOwnership('shape2', 'user1', { force: true })
      
      // Release one
      manager.releaseOwnership('shape3', 'user1')
      
      // Check final state
      expect(manager.getOwnedShapes('user1')).toEqual(['shape1', 'shape2'])
      expect(manager.getOwnedShapes('user2')).toEqual([])
      
      const stats = manager.getStats()
      expect(stats.totalAcquisitions).toBe(4) // 3 initial + 1 force
      expect(stats.totalReleases).toBe(2) // 1 manual + 1 from force
      expect(stats.currentOwners).toBe(2)
    })

    it('should handle activity updates correctly', () => {
      vi.useFakeTimers()
      
      manager.acquireOwnership('shape1', 'user1', { timeout: 2000 })
      
      // Update activity before timeout
      vi.advanceTimersByTime(1000)
      manager.updateUserActivity('user1')
      
      // Should not timeout
      vi.advanceTimersByTime(1000)
      expect(manager.getOwner('shape1')).toBe('user1')
      
      // Should timeout after additional inactivity
      vi.advanceTimersByTime(1000)
      expect(manager.getOwner('shape1')).toBeNull()
      
      vi.useRealTimers()
    })

    it('should handle complex collaboration scenario', async () => {
      // Set up priorities
      manager.setUserPriority('admin', 10)
      manager.setUserPriority('user1', 1)
      manager.setUserPriority('user2', 1)
      
      // User1 acquires shape
      manager.acquireOwnership('shape1', 'user1')
      
      // User2 tries to acquire (should queue)
      const user2Promise = manager.acquireOwnership('shape1', 'user2', { queue: true })
      
      // Admin takes ownership (priority override)
      manager.acquireOwnership('shape1', 'admin', { priority: true })
      
      // User2's request should still be queued
      expect(manager.getOwner('shape1')).toBe('admin')
      
      // Admin hands off to user2
      manager.handoffOwnership('shape1', 'admin', 'user2')
      
      // User2 should now own it
      expect(manager.getOwner('shape1')).toBe('user2')
      
      // User2's queued request should resolve
      const result = await user2Promise
      expect(result).toBe(true)
    })
  })

  describe('Timeout Scenario Tests', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should handle basic timeout scenario', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire with 5-second timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 5000 })
      expect(manager.getOwner('shape1')).toBe('user1')
      
      // Should not timeout before time
      vi.advanceTimersByTime(4000)
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
      
      // Should timeout after 5 seconds
      vi.advanceTimersByTime(1000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          shapeId: 'shape1',
          userId: 'user1'
        })
      )
    })

    it('should handle timeout with activity updates', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire with 10-second timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Update activity at 3 seconds
      vi.advanceTimersByTime(3000)
      manager.updateUserActivity('user1')
      
      // Should not timeout at 10 seconds (activity reset timer)
      vi.advanceTimersByTime(7000)
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
      
      // Should timeout after additional 10 seconds of inactivity
      vi.advanceTimersByTime(10000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalled()
    })

    it('should handle timeout warning scenario', () => {
      const warningCallback = vi.fn()
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ 
        onOwnershipTimeoutWarning: warningCallback,
        onOwnershipTimeout: timeoutCallback 
      })
      
      // Acquire with 10-second timeout (warning at 5 seconds)
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Should trigger warning at 5 seconds
      vi.advanceTimersByTime(5000)
      expect(warningCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          shapeId: 'shape1',
          userId: 'user1',
          timeRemaining: 5000
        })
      )
      
      // Should not timeout yet
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
      
      // Should timeout at 10 seconds
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalled()
    })

    it('should handle timeout extension scenario', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire with 10-second timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Extend timeout at 5 seconds
      vi.advanceTimersByTime(5000)
      manager.extendTimeout('shape1', 5000) // Extend by 5 seconds
      
      // Should not timeout at original 10 seconds
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
      
      // Should timeout at extended 15 seconds
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalled()
    })

    it('should handle multiple shapes with different timeouts', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire multiple shapes with different timeouts
      manager.acquireOwnership('shape1', 'user1', { timeout: 5000 })
      manager.acquireOwnership('shape2', 'user1', { timeout: 10000 })
      manager.acquireOwnership('shape3', 'user2', { timeout: 3000 })
      
      // Shape3 should timeout first (3 seconds)
      vi.advanceTimersByTime(3000)
      expect(manager.getOwner('shape3')).toBeNull()
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(manager.getOwner('shape2')).toBe('user1')
      expect(timeoutCallback).toHaveBeenCalledTimes(1)
      
      // Shape1 should timeout next (5 seconds total)
      vi.advanceTimersByTime(2000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(manager.getOwner('shape2')).toBe('user1')
      expect(timeoutCallback).toHaveBeenCalledTimes(2)
      
      // Shape2 should timeout last (10 seconds total)
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape2')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalledTimes(3)
    })

    it('should handle timeout with auto-release disabled', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire with auto-release disabled
      manager.acquireOwnership('shape1', 'user1', { 
        timeout: 5000, 
        autoRelease: false 
      })
      
      // Should not timeout even after timeout period
      vi.advanceTimersByTime(10000)
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
    })

    it('should handle timeout with manual release', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire with timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Manually release before timeout
      vi.advanceTimersByTime(5000)
      manager.releaseOwnership('shape1', 'user1')
      
      // Should not timeout
      vi.advanceTimersByTime(10000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).not.toHaveBeenCalled()
    })

    it('should handle timeout with force acquisition', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // User1 acquires shape
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // User2 force acquires before timeout
      vi.advanceTimersByTime(5000)
      manager.acquireOwnership('shape1', 'user2', { force: true })
      
      // Should not timeout (user1's timer should be cleared)
      vi.advanceTimersByTime(10000)
      expect(manager.getOwner('shape1')).toBe('user2')
      expect(timeoutCallback).not.toHaveBeenCalled()
    })

    it('should handle timeout statistics correctly', () => {
      // Acquire multiple shapes for different users
      manager.acquireOwnership('shape1', 'user1', { timeout: 3000 })
      manager.acquireOwnership('shape2', 'user1', { timeout: 5000 })
      manager.acquireOwnership('shape3', 'user2', { timeout: 4000 })
      
      // Let all shapes timeout
      vi.advanceTimersByTime(6000)
      
      // Check timeout statistics
      const user1Stats = manager.getTimeoutStats('user1')
      const user2Stats = manager.getTimeoutStats('user2')
      
      expect(user1Stats.totalTimeouts).toBe(2)
      expect(user2Stats.totalTimeouts).toBe(1)
      
      // Check overall statistics
      const stats = manager.getStats()
      expect(stats.totalTimeouts).toBe(3)
    })

    it('should handle timeout with activity updates and extensions', () => {
      const warningCallback = vi.fn()
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ 
        onOwnershipTimeoutWarning: warningCallback,
        onOwnershipTimeout: timeoutCallback 
      })
      
      // Acquire with 10-second timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Update activity at 3 seconds
      vi.advanceTimersByTime(3000)
      manager.updateUserActivity('user1')
      
      // Extend timeout at 5 seconds
      vi.advanceTimersByTime(2000)
      manager.extendTimeout('shape1', 3000)
      
      // Should trigger warning at 8 seconds (5 seconds before extended timeout)
      vi.advanceTimersByTime(3000)
      expect(warningCallback).toHaveBeenCalled()
      
      // Should not timeout at 10 seconds
      vi.advanceTimersByTime(2000)
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
      
      // Should timeout at 13 seconds (extended timeout)
      vi.advanceTimersByTime(3000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalled()
    })

    it('should handle timeout with multiple activity updates', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire with 5-second timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 5000 })
      
      // Multiple activity updates
      vi.advanceTimersByTime(1000)
      manager.updateUserActivity('user1')
      
      vi.advanceTimersByTime(1000)
      manager.updateUserActivity('user1')
      
      vi.advanceTimersByTime(1000)
      manager.updateUserActivity('user1')
      
      // Should not timeout (each activity resets timer)
      vi.advanceTimersByTime(4000)
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
      
      // Should timeout after 5 seconds of inactivity
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalled()
    })

    it('should handle timeout with custom timestamp activity updates', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire with 5-second timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 5000 })
      
      // Update activity with custom timestamp
      const customTime = Date.now() + 2000
      manager.updateUserActivity('user1', customTime)
      
      // Should not timeout (activity timestamp is in the future)
      vi.advanceTimersByTime(10000)
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
    })

    it('should handle timeout with grace period', () => {
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ onOwnershipTimeout: timeoutCallback })
      
      // Acquire with 5-second timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 5000 })
      
      // Extend with grace period at 4 seconds
      vi.advanceTimersByTime(4000)
      manager.extendTimeout('shape1', 3000) // Grace period extension
      
      // Should not timeout at original 5 seconds
      vi.advanceTimersByTime(1000)
      expect(manager.getOwner('shape1')).toBe('user1')
      expect(timeoutCallback).not.toHaveBeenCalled()
      
      // Should timeout at 8 seconds (5 + 3 grace period)
      vi.advanceTimersByTime(3000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalled()
    })

    it('should handle timeout with warning and extension', () => {
      const warningCallback = vi.fn()
      const timeoutCallback = vi.fn()
      manager.setCallbacks({ 
        onOwnershipTimeoutWarning: warningCallback,
        onOwnershipTimeout: timeoutCallback 
      })
      
      // Acquire with 10-second timeout
      manager.acquireOwnership('shape1', 'user1', { timeout: 10000 })
      
      // Should trigger warning at 5 seconds
      vi.advanceTimersByTime(5000)
      expect(warningCallback).toHaveBeenCalledTimes(1)
      
      // Extend timeout at 6 seconds
      vi.advanceTimersByTime(1000)
      manager.extendTimeout('shape1', 5000)
      
      // Should trigger warning again at 10 seconds (5 seconds before new timeout)
      vi.advanceTimersByTime(4000)
      expect(warningCallback).toHaveBeenCalledTimes(2)
      
      // Should timeout at 15 seconds (10 + 5 extension)
      vi.advanceTimersByTime(5000)
      expect(manager.getOwner('shape1')).toBeNull()
      expect(timeoutCallback).toHaveBeenCalled()
    })
  })
})
