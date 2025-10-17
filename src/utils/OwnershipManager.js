/**
 * OwnershipManager - Singleton for managing shape ownership and timeouts
 * 
 * Handles:
 * - Shape ownership acquisition and release
 * - 15-second inactivity timeout
 * - Timer management for multiple shapes
 * - Ownership conflict resolution
 * - User activity tracking
 */

class OwnershipManager {
  constructor() {
    if (OwnershipManager.instance) {
      return OwnershipManager.instance
    }

    // Core ownership tracking
    this.ownedShapes = new Map() // Map of shapeId to ownership data
    this.userActivity = new Map() // Map of userId to last activity timestamp
    this.ownershipTimers = new Map() // Map of shapeId to timeout timer ID
    this.warningTimers = new Map() // Map of shapeId to warning timer ID
    this.acquisitionQueue = new Map() // Map of shapeId to queue of pending requests
    this.userPriorities = new Map() // Map of userId to priority level
    this.ownershipHistory = new Map() // Map of shapeId to ownership history
    this.timeoutStats = new Map() // Map of userId to timeout statistics
    
    // Configuration
    this.INACTIVITY_TIMEOUT = 15000 // 15 seconds in milliseconds
    this.ACTIVITY_UPDATE_INTERVAL = 1000 // Update activity every 1 second
    this.CLEANUP_INTERVAL = 5000 // Cleanup inactive users every 5 seconds
    this.TIMEOUT_WARNING_INTERVAL = 5000 // Warn 5 seconds before timeout
    this.GRACE_PERIOD = 3000 // 3 second grace period for network issues
    
    // Timer management
    this.activityUpdateTimer = null
    this.cleanupTimer = null
    this.isRunning = false
    
    // Event callbacks
    this.onOwnershipAcquired = null
    this.onOwnershipReleased = null
    this.onOwnershipTimeout = null
    this.onOwnershipTimeoutWarning = null
    this.onUserInactive = null
    
    // Statistics
    this.stats = {
      totalAcquisitions: 0,
      totalReleases: 0,
      totalTimeouts: 0,
      currentOwners: 0,
      activeUsers: 0
    }

    OwnershipManager.instance = this
  }

  /**
   * Start the ownership manager
   */
  start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    
    // Start activity update timer
    this.activityUpdateTimer = setInterval(() => {
      this.updateUserActivity()
    }, this.ACTIVITY_UPDATE_INTERVAL)
    
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveUsers()
    }, this.CLEANUP_INTERVAL)
    
    console.log('OwnershipManager started')
  }

  /**
   * Stop the ownership manager
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    
    // Clear all timers
    if (this.activityUpdateTimer) {
      clearInterval(this.activityUpdateTimer)
      this.activityUpdateTimer = null
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    
    // Clear all ownership timers
    for (const timerId of this.ownershipTimers.values()) {
      clearTimeout(timerId)
    }
    this.ownershipTimers.clear()
    
    // Clear all warning timers
    for (const timerId of this.warningTimers.values()) {
      clearTimeout(timerId)
    }
    this.warningTimers.clear()
    
    console.log('OwnershipManager stopped')
  }

  /**
   * Setup timeout timers for a shape
   * @param {string} shapeId - ID of the shape
   * @param {number} timeout - Timeout duration in milliseconds
   * @private
   */
  setupTimeoutTimers(shapeId, timeout) {
    // Clear existing timers
    this.clearTimeoutTimers(shapeId)
    
    // Set up warning timer (warn before timeout)
    const warningTime = Math.max(0, timeout - this.TIMEOUT_WARNING_INTERVAL)
    if (warningTime > 0) {
      const warningTimerId = setTimeout(() => {
        this.handleOwnershipTimeoutWarning(shapeId)
      }, warningTime)
      
      this.warningTimers.set(shapeId, warningTimerId)
    }
    
    // Set up main timeout timer
    const timerId = setTimeout(() => {
      this.handleOwnershipTimeout(shapeId)
    }, timeout)
    
    this.ownershipTimers.set(shapeId, timerId)
  }

  /**
   * Clear timeout timers for a shape
   * @param {string} shapeId - ID of the shape
   * @private
   */
  clearTimeoutTimers(shapeId) {
    if (this.ownershipTimers.has(shapeId)) {
      clearTimeout(this.ownershipTimers.get(shapeId))
      this.ownershipTimers.delete(shapeId)
    }
    
    if (this.warningTimers.has(shapeId)) {
      clearTimeout(this.warningTimers.get(shapeId))
      this.warningTimers.delete(shapeId)
    }
  }

  /**
   * Handle ownership timeout warning
   * @param {string} shapeId - ID of the shape
   * @private
   */
  handleOwnershipTimeoutWarning(shapeId) {
    const ownershipData = this.ownedShapes.get(shapeId)
    
    if (!ownershipData) {
      return
    }
    
    // Check if user is still active
    const userLastActivity = this.userActivity.get(ownershipData.userId)
    const timeSinceActivity = Date.now() - (userLastActivity || 0)
    
    // Use the more recent of user activity or ownership activity
    const ownershipTimeSinceActivity = Date.now() - ownershipData.lastActivity
    const actualTimeSinceActivity = Math.min(timeSinceActivity, ownershipTimeSinceActivity)
    
    if (actualTimeSinceActivity < ownershipData.options.timeout - this.TIMEOUT_WARNING_INTERVAL) {
      // User is still active, don't show warning
      return
    }
    
    // Update statistics
    this.updateTimeoutStats(ownershipData.userId, 'warning')
    
    // Trigger warning callback
    if (this.onOwnershipTimeoutWarning) {
      this.onOwnershipTimeoutWarning({
        ...ownershipData,
        warningAt: Date.now(),
        timeRemaining: this.TIMEOUT_WARNING_INTERVAL
      })
    }
    
    console.log(`OwnershipManager: Warning - Shape ${shapeId} will timeout in ${this.TIMEOUT_WARNING_INTERVAL}ms for user ${ownershipData.userId}`)
  }

  /**
   * Extend timeout for a shape
   * @param {string} shapeId - ID of the shape
   * @param {number} extensionMs - Extension time in milliseconds
   * @returns {boolean} True if extension was successful
   */
  extendTimeout(shapeId, extensionMs = this.GRACE_PERIOD) {
    const ownershipData = this.ownedShapes.get(shapeId)
    
    if (!ownershipData) {
      console.warn(`OwnershipManager: Shape ${shapeId} is not owned`)
      return false
    }
    
    if (!ownershipData.options.autoRelease) {
      console.warn(`OwnershipManager: Cannot extend timeout for shape ${shapeId} - auto-release disabled`)
      return false
    }
    
    // Clear existing timers
    this.clearTimeoutTimers(shapeId)
    
    // Set up new timers with extended timeout
    const newTimeout = ownershipData.options.timeout + extensionMs
    this.setupTimeoutTimers(shapeId, newTimeout)
    
    // Update ownership data
    ownershipData.options.timeout = newTimeout
    ownershipData.lastActivity = Date.now()
    
    // Update statistics
    this.updateTimeoutStats(ownershipData.userId, 'extension')
    
    console.log(`OwnershipManager: Extended timeout for shape ${shapeId} by ${extensionMs}ms`)
    return true
  }

  /**
   * Get timeout information for a shape
   * @param {string} shapeId - ID of the shape
   * @returns {object|null} Timeout information or null if not owned
   */
  getTimeoutInfo(shapeId) {
    const ownershipData = this.ownedShapes.get(shapeId)
    
    if (!ownershipData) {
      return null
    }
    
    const userLastActivity = this.userActivity.get(ownershipData.userId)
    const timeSinceActivity = Date.now() - (userLastActivity || 0)
    const timeRemaining = Math.max(0, ownershipData.options.timeout - timeSinceActivity)
    
    return {
      shapeId,
      userId: ownershipData.userId,
      timeout: ownershipData.options.timeout,
      timeSinceActivity,
      timeRemaining,
      isWarningActive: this.warningTimers.has(shapeId),
      isTimeoutActive: this.ownershipTimers.has(shapeId),
      autoRelease: ownershipData.options.autoRelease
    }
  }

  /**
   * Get timeout statistics for a user
   * @param {string} userId - ID of the user
   * @returns {object} Timeout statistics
   */
  getTimeoutStats(userId) {
    if (!this.timeoutStats.has(userId)) {
      this.timeoutStats.set(userId, {
        totalTimeouts: 0,
        totalWarnings: 0,
        totalExtensions: 0,
        averageTimeoutDuration: 0,
        lastTimeout: null,
        lastWarning: null
      })
    }
    
    return this.timeoutStats.get(userId)
  }

  /**
   * Update timeout statistics for a user
   * @param {string} userId - ID of the user
   * @param {string} event - Event type ('timeout', 'warning', 'extension')
   * @param {object} data - Event data
   * @private
   */
  updateTimeoutStats(userId, event, data = {}) {
    const stats = this.getTimeoutStats(userId)
    
    switch (event) {
      case 'timeout':
        stats.totalTimeouts++
        stats.lastTimeout = Date.now()
        if (data.timeout) {
          stats.averageTimeoutDuration = (stats.averageTimeoutDuration + data.timeout) / 2
        }
        break
      case 'warning':
        stats.totalWarnings++
        stats.lastWarning = Date.now()
        break
      case 'extension':
        stats.totalExtensions++
        break
    }
  }

  /**
   * Set user priority level
   * @param {string} userId - ID of the user
   * @param {number} priority - Priority level (higher = more important)
   */
  setUserPriority(userId, priority) {
    this.userPriorities.set(userId, priority)
  }

  /**
   * Get user priority level
   * @param {string} userId - ID of the user
   * @returns {number} Priority level
   */
  getUserPriority(userId) {
    return this.userPriorities.get(userId) || 0
  }

  /**
   * Queue an acquisition request
   * @param {string} shapeId - ID of the shape
   * @param {string} userId - ID of the user
   * @param {object} options - Request options
   * @returns {Promise} Promise that resolves when ownership is acquired
   * @private
   */
  queueAcquisitionRequest(shapeId, userId, options) {
    return new Promise((resolve, reject) => {
      if (!this.acquisitionQueue.has(shapeId)) {
        this.acquisitionQueue.set(shapeId, [])
      }
      
      const request = {
        userId,
        options,
        timestamp: Date.now(),
        resolve,
        reject
      }
      
      this.acquisitionQueue.get(shapeId).push(request)
      
      // Set timeout for queued request
      if (options.queueTimeout) {
        setTimeout(() => {
          this.removeFromQueue(shapeId, request)
          reject(new Error('Acquisition request timed out'))
        }, options.queueTimeout)
      }
    })
  }

  /**
   * Remove request from acquisition queue
   * @param {string} shapeId - ID of the shape
   * @param {object} request - Request object to remove
   * @private
   */
  removeFromQueue(shapeId, request) {
    const queue = this.acquisitionQueue.get(shapeId)
    if (queue) {
      const index = queue.indexOf(request)
      if (index > -1) {
        queue.splice(index, 1)
      }
      if (queue.length === 0) {
        this.acquisitionQueue.delete(shapeId)
      }
    }
  }

  /**
   * Process acquisition queue for a shape
   * @param {string} shapeId - ID of the shape
   * @private
   */
  processAcquisitionQueue(shapeId) {
    const queue = this.acquisitionQueue.get(shapeId)
    if (!queue || queue.length === 0) {
      return
    }
    
    // Sort by priority and timestamp
    queue.sort((a, b) => {
      const priorityA = this.getUserPriority(a.userId)
      const priorityB = this.getUserPriority(b.userId)
      if (priorityA !== priorityB) {
        return priorityB - priorityA // Higher priority first
      }
      return a.timestamp - b.timestamp // Earlier request first
    })
    
    // Try to fulfill the first request (without queue option to avoid recursion)
    const request = queue[0]
    const requestOptions = { ...request.options }
    delete requestOptions.queue // Remove queue option to prevent recursion
    
    const success = this.acquireOwnership(shapeId, request.userId, requestOptions)
    
    if (success) {
      this.removeFromQueue(shapeId, request)
      request.resolve(true)
      
      // Process remaining queue
      this.processAcquisitionQueue(shapeId)
    }
  }

  /**
   * Add entry to ownership history
   * @param {string} shapeId - ID of the shape
   * @param {object} entry - History entry
   * @private
   */
  addToOwnershipHistory(shapeId, entry) {
    if (!this.ownershipHistory.has(shapeId)) {
      this.ownershipHistory.set(shapeId, [])
    }
    
    const history = this.ownershipHistory.get(shapeId)
    history.push(entry)
    
    // Keep only last 50 entries per shape
    if (history.length > 50) {
      history.splice(0, history.length - 50)
    }
  }

  /**
   * Get ownership history for a shape
   * @param {string} shapeId - ID of the shape
   * @returns {Array} Array of ownership history entries
   */
  getOwnershipHistory(shapeId) {
    return this.ownershipHistory.get(shapeId) || []
  }

  /**
   * Acquire ownership of a shape
   * @param {string} shapeId - ID of the shape to acquire
   * @param {string} userId - ID of the user acquiring ownership
   * @param {object} options - Additional options
   * @returns {boolean|Promise} True if acquisition was successful, or Promise if queued
   */
  acquireOwnership(shapeId, userId, options = {}) {
    if (!shapeId || !userId) {
      console.warn('OwnershipManager: Invalid shapeId or userId')
      return false
    }

    const currentOwner = this.ownedShapes.get(shapeId)
    const currentTime = Date.now()
    const userPriority = this.userPriorities.get(userId) || 0
    
    // Check if shape is already owned by someone else
    if (currentOwner && currentOwner.userId !== userId) {
      const currentOwnerPriority = this.userPriorities.get(currentOwner.userId) || 0
      
      // Handle ownership conflict based on priority and options
      if (options.force) {
        this.releaseOwnership(shapeId, currentOwner.userId, { reason: 'forced' })
      } else if (options.priority && userPriority > currentOwnerPriority) {
        // Higher priority user can take ownership
        this.releaseOwnership(shapeId, currentOwner.userId, { reason: 'priority_override' })
      } else if (options.queue) {
        // Queue the request for later
        return this.queueAcquisitionRequest(shapeId, userId, options)
      } else {
        console.warn(`OwnershipManager: Shape ${shapeId} already owned by ${currentOwner.userId}`)
        return false
      }
    }
    
    // Clear existing timer if any
    if (this.ownershipTimers.has(shapeId)) {
      clearTimeout(this.ownershipTimers.get(shapeId))
    }
    
    // Set up ownership data
    const ownershipData = {
      shapeId,
      userId,
      acquiredAt: currentTime,
      lastActivity: currentTime,
      acquisitionMethod: options.force ? 'forced' : (options.priority ? 'priority' : 'normal'),
      priority: userPriority,
      options: {
        autoRelease: options.autoRelease !== false, // Default to true
        timeout: options.timeout || this.INACTIVITY_TIMEOUT,
        allowHandoff: options.allowHandoff !== false, // Default to true
        ...options
      }
    }
    
    this.ownedShapes.set(shapeId, ownershipData)
    this.userActivity.set(userId, currentTime)
    
    // Track ownership history
    this.addToOwnershipHistory(shapeId, {
      userId,
      action: 'acquired',
      timestamp: currentTime,
      method: ownershipData.acquisitionMethod,
      priority: userPriority
    })
    
    // Set up timeout timer and warning timer
    if (ownershipData.options.autoRelease) {
      this.setupTimeoutTimers(shapeId, ownershipData.options.timeout)
    }
    
    // Update statistics
    this.stats.totalAcquisitions++
    this.stats.currentOwners = this.ownedShapes.size
    
    // Trigger callback
    if (this.onOwnershipAcquired) {
      this.onOwnershipAcquired(ownershipData)
    }
    
    console.log(`OwnershipManager: User ${userId} acquired shape ${shapeId}`)
    return true
  }

  /**
   * Release ownership of a shape
   * @param {string} shapeId - ID of the shape to release
   * @param {string} userId - ID of the user releasing ownership
   * @param {object} options - Additional options
   * @returns {boolean} True if release was successful
   */
  releaseOwnership(shapeId, userId, options = {}) {
    if (!shapeId || !userId) {
      console.warn('OwnershipManager: Invalid shapeId or userId')
      return false
    }

    const ownershipData = this.ownedShapes.get(shapeId)
    
    if (!ownershipData) {
      console.warn(`OwnershipManager: Shape ${shapeId} is not owned`)
      return false
    }
    
    // Check if user can release (owner or has permission)
    if (ownershipData.userId !== userId && !options.force) {
      console.warn(`OwnershipManager: User ${userId} does not own shape ${shapeId}`)
      return false
    }
    
    // Clear timeout timers
    this.clearTimeoutTimers(shapeId)
    
    // Track ownership history
    this.addToOwnershipHistory(shapeId, {
      userId: ownershipData.userId,
      action: 'released',
      timestamp: Date.now(),
      reason: options.reason || 'manual',
      releasedBy: userId !== ownershipData.userId ? userId : null
    })
    
    // Remove ownership
    this.ownedShapes.delete(shapeId)
    
    // Process acquisition queue for this shape
    this.processAcquisitionQueue(shapeId)
    
    // Update statistics
    this.stats.totalReleases++
    this.stats.currentOwners = this.ownedShapes.size
    
    // Trigger callback
    if (this.onOwnershipReleased) {
      this.onOwnershipReleased({
        ...ownershipData,
        releasedAt: Date.now(),
        reason: options.reason || 'manual'
      })
    }
    
    console.log(`OwnershipManager: User ${userId} released shape ${shapeId}`)
    return true
  }

  /**
   * Gracefully handoff ownership to another user
   * @param {string} shapeId - ID of the shape
   * @param {string} fromUserId - ID of the current owner
   * @param {string} toUserId - ID of the new owner
   * @param {object} options - Handoff options
   * @returns {boolean} True if handoff was successful
   */
  handoffOwnership(shapeId, fromUserId, toUserId, options = {}) {
    if (!shapeId || !fromUserId || !toUserId) {
      console.warn('OwnershipManager: Invalid parameters for handoff')
      return false
    }

    const ownershipData = this.ownedShapes.get(shapeId)
    
    if (!ownershipData) {
      console.warn(`OwnershipManager: Shape ${shapeId} is not owned`)
      return false
    }
    
    if (ownershipData.userId !== fromUserId) {
      console.warn(`OwnershipManager: User ${fromUserId} does not own shape ${shapeId}`)
      return false
    }
    
    if (!ownershipData.options.allowHandoff) {
      console.warn(`OwnershipManager: Handoff not allowed for shape ${shapeId}`)
      return false
    }
    
    // Release current ownership
    this.releaseOwnership(shapeId, fromUserId, { reason: 'handoff' })
    
    // Acquire for new user
    const handoffOptions = {
      ...options,
      acquisitionMethod: 'handoff',
      allowHandoff: false // Prevent immediate re-handoff
    }
    
    return this.acquireOwnership(shapeId, toUserId, handoffOptions)
  }

  /**
   * Batch acquire ownership of multiple shapes
   * @param {Array} shapeIds - Array of shape IDs
   * @param {string} userId - ID of the user
   * @param {object} options - Acquisition options
   * @returns {object} Results object with success/failure for each shape
   */
  batchAcquireOwnership(shapeIds, userId, options = {}) {
    const results = {
      successful: [],
      failed: [],
      queued: []
    }
    
    for (const shapeId of shapeIds) {
      try {
        const result = this.acquireOwnership(shapeId, userId, options)
        
        if (result === true) {
          results.successful.push(shapeId)
        } else if (result instanceof Promise) {
          results.queued.push(shapeId)
        } else {
          results.failed.push(shapeId)
        }
      } catch (error) {
        results.failed.push(shapeId)
        console.error(`OwnershipManager: Failed to acquire ${shapeId}:`, error)
      }
    }
    
    return results
  }

  /**
   * Batch release ownership of multiple shapes
   * @param {Array} shapeIds - Array of shape IDs
   * @param {string} userId - ID of the user
   * @param {object} options - Release options
   * @returns {object} Results object with success/failure for each shape
   */
  batchReleaseOwnership(shapeIds, userId, options = {}) {
    const results = {
      successful: [],
      failed: []
    }
    
    for (const shapeId of shapeIds) {
      try {
        const success = this.releaseOwnership(shapeId, userId, options)
        
        if (success) {
          results.successful.push(shapeId)
        } else {
          results.failed.push(shapeId)
        }
      } catch (error) {
        results.failed.push(shapeId)
        console.error(`OwnershipManager: Failed to release ${shapeId}:`, error)
      }
    }
    
    return results
  }

  /**
   * Validate ownership is still valid
   * @param {string} shapeId - ID of the shape
   * @param {string} userId - ID of the user
   * @returns {boolean} True if ownership is valid
   */
  validateOwnership(shapeId, userId) {
    const ownershipData = this.ownedShapes.get(shapeId)
    
    if (!ownershipData) {
      return false
    }
    
    if (ownershipData.userId !== userId) {
      return false
    }
    
    // Check if user is still active
    const userLastActivity = this.userActivity.get(userId)
    if (!userLastActivity) {
      return false
    }
    
    const timeSinceActivity = Date.now() - userLastActivity
    return timeSinceActivity < this.INACTIVITY_TIMEOUT
  }

  /**
   * Get acquisition queue for a shape
   * @param {string} shapeId - ID of the shape
   * @returns {Array} Array of queued requests
   */
  getAcquisitionQueue(shapeId) {
    return this.acquisitionQueue.get(shapeId) || []
  }

  /**
   * Clear acquisition queue for a shape
   * @param {string} shapeId - ID of the shape
   * @param {string} reason - Reason for clearing queue
   */
  clearAcquisitionQueue(shapeId, reason = 'cleared') {
    const queue = this.acquisitionQueue.get(shapeId)
    if (queue) {
      // Reject all pending requests
      for (const request of queue) {
        request.reject(new Error(`Acquisition queue cleared: ${reason}`))
      }
      this.acquisitionQueue.delete(shapeId)
    }
  }

  /**
   * Check if a user owns a shape
   * @param {string} shapeId - ID of the shape
   * @param {string} userId - ID of the user
   * @returns {boolean} True if user owns the shape
   */
  isOwner(shapeId, userId) {
    const ownershipData = this.ownedShapes.get(shapeId)
    return ownershipData && ownershipData.userId === userId
  }

  /**
   * Get the current owner of a shape
   * @param {string} shapeId - ID of the shape
   * @returns {string|null} User ID of the owner, or null if not owned
   */
  getOwner(shapeId) {
    const ownershipData = this.ownedShapes.get(shapeId)
    return ownershipData ? ownershipData.userId : null
  }

  /**
   * Get all shapes owned by a user
   * @param {string} userId - ID of the user
   * @returns {Array} Array of shape IDs owned by the user
   */
  getOwnedShapes(userId) {
    const ownedShapes = []
    for (const [shapeId, ownershipData] of this.ownedShapes.entries()) {
      if (ownershipData.userId === userId) {
        ownedShapes.push(shapeId)
      }
    }
    return ownedShapes
  }

  /**
   * Update user activity timestamp
   * @param {string} userId - ID of the user
   * @param {number} timestamp - Activity timestamp (optional, defaults to now)
   */
  updateUserActivity(userId, timestamp = null) {
    const currentTime = timestamp !== null ? timestamp : Date.now()
    this.userActivity.set(userId, currentTime)
    
    // Update last activity for all shapes owned by this user
    for (const [shapeId, ownershipData] of this.ownedShapes.entries()) {
      if (ownershipData.userId === userId) {
        ownershipData.lastActivity = currentTime
        
        // Reset timeout timers if auto-release is enabled
        if (ownershipData.options.autoRelease) {
          // Clear existing timers first
          this.clearTimeoutTimers(shapeId)
          // Set up new timers with the same timeout duration
          this.setupTimeoutTimers(shapeId, ownershipData.options.timeout)
        }
      }
    }
  }

  /**
   * Handle ownership timeout
   * @param {string} shapeId - ID of the shape that timed out
   * @private
   */
  handleOwnershipTimeout(shapeId) {
    const ownershipData = this.ownedShapes.get(shapeId)
    
    if (!ownershipData) {
      return
    }
    
    // Check if user is still active
    const userLastActivity = this.userActivity.get(ownershipData.userId)
    const timeSinceActivity = Date.now() - (userLastActivity || 0)
    
    // Use the more recent of user activity or ownership activity
    const ownershipTimeSinceActivity = Date.now() - ownershipData.lastActivity
    const actualTimeSinceActivity = Math.min(timeSinceActivity, ownershipTimeSinceActivity)
    
    if (actualTimeSinceActivity < ownershipData.options.timeout) {
      // User is still active, don't timeout
      return
    }
    
    // Release ownership due to timeout
    this.releaseOwnership(shapeId, ownershipData.userId, { reason: 'timeout' })
    
    // Update statistics
    this.stats.totalTimeouts++
    this.updateTimeoutStats(ownershipData.userId, 'timeout', { timeout: ownershipData.options.timeout })
    
    // Trigger callback
    if (this.onOwnershipTimeout) {
      this.onOwnershipTimeout({
        ...ownershipData,
        timedOutAt: Date.now()
      })
    }
    
    console.log(`OwnershipManager: Shape ${shapeId} timed out for user ${ownershipData.userId}`)
  }

  /**
   * Update user activity for all active users
   * @private
   */
  updateUserActivity() {
    const currentTime = Date.now()
    
    // Update activity for all users who have owned shapes recently
    for (const [userId, lastActivity] of this.userActivity.entries()) {
      const timeSinceActivity = currentTime - lastActivity
      
      // Mark user as inactive if they haven't been active for a while
      if (timeSinceActivity > this.INACTIVITY_TIMEOUT * 2) {
        if (this.onUserInactive) {
          this.onUserInactive(userId, lastActivity)
        }
      }
    }
  }

  /**
   * Clean up inactive users
   * @private
   */
  cleanupInactiveUsers() {
    const currentTime = Date.now()
    const inactiveThreshold = this.INACTIVITY_TIMEOUT * 3 // 45 seconds
    
    for (const [userId, lastActivity] of this.userActivity.entries()) {
      const timeSinceActivity = currentTime - lastActivity
      
      if (timeSinceActivity > inactiveThreshold) {
        // Release all shapes owned by inactive user
        const ownedShapes = this.getOwnedShapes(userId)
        for (const shapeId of ownedShapes) {
          this.releaseOwnership(shapeId, userId, { reason: 'user_inactive' })
        }
        
        // Remove user from activity tracking
        this.userActivity.delete(userId)
        
        console.log(`OwnershipManager: Cleaned up inactive user ${userId}`)
      }
    }
  }

  /**
   * Get ownership information for a shape
   * @param {string} shapeId - ID of the shape
   * @returns {object|null} Ownership data or null if not owned
   */
  getOwnershipInfo(shapeId) {
    return this.ownedShapes.get(shapeId) || null
  }

  /**
   * Get all current ownership data
   * @returns {Map} Map of shapeId to ownership data
   */
  getAllOwnerships() {
    return new Map(this.ownedShapes)
  }

  /**
   * Get statistics about ownership management
   * @returns {object} Statistics object
   */
  getStats() {
    const activeUsers = new Set()
    for (const ownershipData of this.ownedShapes.values()) {
      activeUsers.add(ownershipData.userId)
    }
    
    return {
      ...this.stats,
      activeUsers: activeUsers.size,
      ownedShapes: this.ownedShapes.size,
      activeTimers: this.ownershipTimers.size,
      isRunning: this.isRunning
    }
  }

  /**
   * Set event callbacks
   * @param {object} callbacks - Object containing callback functions
   */
  setCallbacks(callbacks) {
    if (callbacks.onOwnershipAcquired) {
      this.onOwnershipAcquired = callbacks.onOwnershipAcquired
    }
    if (callbacks.onOwnershipReleased) {
      this.onOwnershipReleased = callbacks.onOwnershipReleased
    }
    if (callbacks.onOwnershipTimeout) {
      this.onOwnershipTimeout = callbacks.onOwnershipTimeout
    }
    if (callbacks.onOwnershipTimeoutWarning) {
      this.onOwnershipTimeoutWarning = callbacks.onOwnershipTimeoutWarning
    }
    if (callbacks.onUserInactive) {
      this.onUserInactive = callbacks.onUserInactive
    }
  }

  /**
   * Clear all ownership data and stop timers
   */
  clear() {
    this.stop()
    
    this.ownedShapes.clear()
    this.userActivity.clear()
    this.ownershipTimers.clear()
    this.warningTimers.clear()
    this.acquisitionQueue.clear()
    this.userPriorities.clear()
    this.ownershipHistory.clear()
    this.timeoutStats.clear()
    
    // Reset statistics
    this.stats = {
      totalAcquisitions: 0,
      totalReleases: 0,
      totalTimeouts: 0,
      currentOwners: 0,
      activeUsers: 0
    }
    
    console.log('OwnershipManager: Cleared all data')
  }

  /**
   * Force release all ownerships for a user
   * @param {string} userId - ID of the user
   * @param {string} reason - Reason for force release
   */
  forceReleaseAll(userId, reason = 'force_release') {
    const ownedShapes = this.getOwnedShapes(userId)
    
    for (const shapeId of ownedShapes) {
      this.releaseOwnership(shapeId, userId, { reason })
    }
    
    console.log(`OwnershipManager: Force released ${ownedShapes.length} shapes for user ${userId}`)
  }

  /**
   * Check if a user is active
   * @param {string} userId - ID of the user
   * @param {number} threshold - Inactivity threshold in milliseconds
   * @returns {boolean} True if user is active
   */
  isUserActive(userId, threshold = null) {
    const lastActivity = this.userActivity.get(userId)
    if (!lastActivity) {
      return false
    }
    
    const inactivityThreshold = threshold || this.INACTIVITY_TIMEOUT
    const timeSinceActivity = Date.now() - lastActivity
    
    return timeSinceActivity < inactivityThreshold
  }

  /**
   * Get all active users
   * @param {number} threshold - Inactivity threshold in milliseconds
   * @returns {Array} Array of active user IDs
   */
  getActiveUsers(threshold = null) {
    const activeUsers = []
    const inactivityThreshold = threshold || this.INACTIVITY_TIMEOUT
    
    for (const [userId, lastActivity] of this.userActivity.entries()) {
      const timeSinceActivity = Date.now() - lastActivity
      if (timeSinceActivity < inactivityThreshold) {
        activeUsers.push(userId)
      }
    }
    
    return activeUsers
  }
}

// Create and export singleton instance
const ownershipManager = new OwnershipManager()

// Export both the class and the singleton instance
export { OwnershipManager }
export default ownershipManager
