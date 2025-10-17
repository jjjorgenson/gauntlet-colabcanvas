/**
 * InterpolationManager - Singleton for smooth animations
 * 
 * Manages smooth interpolation of cursors and shapes to prevent jitter
 * during real-time collaboration. Uses requestAnimationFrame for optimal performance.
 * 
 * Key Features:
 * - 50ms interpolation for cursors
 * - 150ms interpolation for shapes
 * - Easing functions for natural movement
 * - Automatic cleanup of completed animations
 */

class InterpolationManager {
  constructor() {
    if (InterpolationManager.instance) {
      return InterpolationManager.instance
    }

    this.targets = new Map() // Map of entity ID to interpolation state
    this.targetGroups = new Map() // Map of group name to Set of target IDs
    this.targetPriorities = new Map() // Map of target ID to priority level
    this.animationId = null
    this.isRunning = false
    
    // Default interpolation durations
    this.DEFAULT_CURSOR_DURATION = 50 // ms
    this.DEFAULT_SHAPE_DURATION = 150 // ms
    
    // Easing functions - comprehensive collection for smooth animations
    this.easingFunctions = {
      // Linear
      linear: (t) => t,
      
      // Ease Out (most natural for UI animations)
      easeOut: (t) => 1 - Math.pow(1 - t, 3), // Cubic ease-out
      easeOutQuart: (t) => 1 - Math.pow(1 - t, 4), // Stronger ease-out for shapes
      easeOutQuint: (t) => 1 - Math.pow(1 - t, 5), // Even stronger ease-out
      easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t), // Exponential ease-out
      easeOutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)), // Circular ease-out
      easeOutBack: (t) => {
        const c1 = 1.70158
        const c3 = c1 + 1
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
      }, // Back ease-out with overshoot
      
      // Ease In
      easeIn: (t) => Math.pow(t, 3), // Cubic ease-in
      easeInQuart: (t) => Math.pow(t, 4), // Quartic ease-in
      easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)), // Exponential ease-in
      easeInCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)), // Circular ease-in
      
      // Ease In-Out (smooth start and end)
      easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
      easeInOutExpo: (t) => {
        if (t === 0) return 0
        if (t === 1) return 1
        return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2
      },
      easeInOutCirc: (t) => {
        return t < 0.5
          ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
          : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2
      },
      
      // Specialized easing for different animation types
      easeOutElastic: (t) => {
        const c4 = (2 * Math.PI) / 3
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
      }, // Elastic ease-out for bouncy effects
      easeOutBounce: (t) => {
        const n1 = 7.5625
        const d1 = 2.75
        if (t < 1 / d1) {
          return n1 * t * t
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375
        }
      }, // Bounce ease-out for playful effects
    }

    InterpolationManager.instance = this
  }

  /**
   * Add a new interpolation target
   * @param {string} id - Unique identifier for the entity
   * @param {string} type - Type of entity ('cursor' or 'shape')
   * @param {object} currentPos - Current position {x, y}
   * @param {object} targetPos - Target position {x, y}
   * @param {number} duration - Animation duration in ms (optional)
   * @param {string} easing - Easing function name (optional)
   * @param {string} group - Group name for batch operations (optional)
   * @param {number} priority - Priority level (higher = more important) (optional)
   */
  addTarget(id, type, currentPos, targetPos, duration = null, easing = null, group = null, priority = 0) {
    // Set default duration based on type
    if (!duration) {
      duration = type === 'cursor' ? this.DEFAULT_CURSOR_DURATION : this.DEFAULT_SHAPE_DURATION
    }

    // Set default easing based on type
    if (!easing) {
      easing = type === 'cursor' ? 'easeOut' : 'easeOutQuart'
    }

    const startTime = performance.now()
    const easingFunction = this.easingFunctions[easing] || this.easingFunctions.easeOut

    this.targets.set(id, {
      type,
      startPos: { ...currentPos },
      targetPos: { ...targetPos },
      startTime,
      duration,
      easing: easingFunction,
      isActive: true,
      group,
      priority,
    })

    // Add to group if specified
    if (group) {
      if (!this.targetGroups.has(group)) {
        this.targetGroups.set(group, new Set())
      }
      this.targetGroups.get(group).add(id)
    }

    // Set priority
    this.targetPriorities.set(id, priority)

    // Start animation loop if not already running
    if (!this.isRunning) {
      this.start()
    }
  }

  /**
   * Remove an interpolation target
   * @param {string} id - Entity identifier
   */
  removeTarget(id) {
    const target = this.targets.get(id)
    if (target) {
      // Remove from group if it was in one
      if (target.group && this.targetGroups.has(target.group)) {
        this.targetGroups.get(target.group).delete(id)
        // Clean up empty groups
        if (this.targetGroups.get(target.group).size === 0) {
          this.targetGroups.delete(target.group)
        }
      }
    }

    this.targets.delete(id)
    this.targetPriorities.delete(id)
    
    // Stop animation loop if no more targets
    if (this.targets.size === 0) {
      this.stop()
    }
  }

  /**
   * Get current interpolated position for an entity
   * @param {string} id - Entity identifier
   * @returns {object|null} Current position {x, y} or null if not found
   */
  getPosition(id) {
    const target = this.targets.get(id)
    if (!target || !target.isActive) {
      return null
    }

    const currentTime = performance.now()
    const elapsed = currentTime - target.startTime
    const progress = Math.min(elapsed / target.duration, 1)

    // Calculate interpolated position with smooth easing
    const easedProgress = target.easing(progress)
    const x = target.startPos.x + (target.targetPos.x - target.startPos.x) * easedProgress
    const y = target.startPos.y + (target.targetPos.y - target.startPos.y) * easedProgress

    // Mark as completed if animation is done
    if (progress >= 1) {
      target.isActive = false
      // Remove completed targets after a short delay to allow final position access
      setTimeout(() => this.removeTarget(id), 16) // ~1 frame delay
    }

    return { x, y }
  }

  /**
   * Get interpolated position with velocity for smooth motion
   * @param {string} id - Entity identifier
   * @returns {object|null} Current position with velocity {x, y, vx, vy} or null if not found
   */
  getPositionWithVelocity(id) {
    const target = this.targets.get(id)
    if (!target || !target.isActive) {
      return null
    }

    const currentTime = performance.now()
    const elapsed = currentTime - target.startTime
    const progress = Math.min(elapsed / target.duration, 1)

    // Calculate interpolated position
    const easedProgress = target.easing(progress)
    const x = target.startPos.x + (target.targetPos.x - target.startPos.x) * easedProgress
    const y = target.startPos.y + (target.targetPos.y - target.startPos.y) * easedProgress

    // Calculate velocity for smooth motion prediction
    const deltaTime = 16 // Assume 60fps for velocity calculation
    const prevProgress = Math.max(0, progress - (deltaTime / target.duration))
    const prevEasedProgress = target.easing(prevProgress)
    const prevX = target.startPos.x + (target.targetPos.x - target.startPos.x) * prevEasedProgress
    const prevY = target.startPos.y + (target.targetPos.y - target.startPos.y) * prevEasedProgress

    const vx = (x - prevX) / (deltaTime / 1000) // pixels per second
    const vy = (y - prevY) / (deltaTime / 1000) // pixels per second

    // Mark as completed if animation is done
    if (progress >= 1) {
      target.isActive = false
      setTimeout(() => this.removeTarget(id), 16)
    }

    return { x, y, vx, vy }
  }

  /**
   * Update target position for an existing interpolation
   * @param {string} id - Entity identifier
   * @param {object} newTargetPos - New target position {x, y}
   * @param {number} duration - New duration (optional)
   * @param {boolean} maintainMomentum - Whether to maintain velocity from current motion (optional)
   */
  updateTarget(id, newTargetPos, duration = null, maintainMomentum = false) {
    const target = this.targets.get(id)
    if (!target) {
      return
    }

    // Get current interpolated position as new start position
    const currentPos = this.getPosition(id) || target.startPos
    
    // If maintaining momentum, adjust the target based on current velocity
    if (maintainMomentum) {
      const velocityData = this.getPositionWithVelocity(id)
      if (velocityData && (velocityData.vx !== 0 || velocityData.vy !== 0)) {
        // Extend target position in the direction of current velocity
        const momentumFactor = 0.1 // Adjust this to control momentum influence
        newTargetPos = {
          x: newTargetPos.x + velocityData.vx * momentumFactor,
          y: newTargetPos.y + velocityData.vy * momentumFactor
        }
      }
    }
    
    // Update target with new values
    target.startPos = currentPos
    target.targetPos = { ...newTargetPos }
    target.startTime = performance.now()
    
    if (duration) {
      target.duration = duration
    }
    
    target.isActive = true
  }

  /**
   * Add target with smooth transition from current position
   * @param {string} id - Unique identifier for the entity
   * @param {string} type - Type of entity ('cursor' or 'shape')
   * @param {object} targetPos - Target position {x, y}
   * @param {number} duration - Animation duration in ms (optional)
   * @param {string} easing - Easing function name (optional)
   * @param {boolean} smoothTransition - Whether to smoothly transition from current position (optional)
   */
  addTargetSmooth(id, type, targetPos, duration = null, easing = null, smoothTransition = true) {
    // Get current position if target already exists
    let currentPos = { x: 0, y: 0 }
    if (smoothTransition) {
      const existingTarget = this.targets.get(id)
      if (existingTarget) {
        const currentPosition = this.getPosition(id)
        if (currentPosition) {
          currentPos = currentPosition
        } else {
          currentPos = existingTarget.startPos
        }
      }
    }

    this.addTarget(id, type, currentPos, targetPos, duration, easing)
  }

  /**
   * Check if an entity is currently being interpolated
   * @param {string} id - Entity identifier
   * @returns {boolean} True if interpolating
   */
  isInterpolating(id) {
    const target = this.targets.get(id)
    return target ? target.isActive : false
  }

  /**
   * Get all active interpolation targets
   * @returns {Map} Map of active targets
   */
  getActiveTargets() {
    return new Map([...this.targets.entries()].filter(([_, target]) => target.isActive))
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.animate()
  }

  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Animation loop using requestAnimationFrame with performance optimization
   */
  animate() {
    if (!this.isRunning) {
      return
    }

    const currentTime = performance.now()
    let hasActiveTargets = false

    // Batch process all targets for better performance
    for (const [id, target] of this.targets.entries()) {
      if (target.isActive) {
        hasActiveTargets = true
        const elapsed = currentTime - target.startTime
        
        // Mark as completed if animation is done
        if (elapsed >= target.duration) {
          target.isActive = false
        }
      }
    }

    // Stop animation loop if no active targets
    if (!hasActiveTargets) {
      this.stop()
      return
    }

    // Continue animation loop
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  /**
   * Get all active positions in a single call for batch processing
   * @returns {Map} Map of id to position {x, y}
   */
  getAllActivePositions() {
    const positions = new Map()
    const currentTime = performance.now()

    for (const [id, target] of this.targets.entries()) {
      if (target.isActive) {
        const elapsed = currentTime - target.startTime
        const progress = Math.min(elapsed / target.duration, 1)

        const easedProgress = target.easing(progress)
        const x = target.startPos.x + (target.targetPos.x - target.startPos.x) * easedProgress
        const y = target.startPos.y + (target.targetPos.y - target.startPos.y) * easedProgress

        positions.set(id, { x, y })

        // Mark as completed if animation is done
        if (progress >= 1) {
          target.isActive = false
          setTimeout(() => this.removeTarget(id), 16)
        }
      }
    }

    return positions
  }

  /**
   * Clear all interpolation targets
   */
  clear() {
    this.targets.clear()
    this.targetGroups.clear()
    this.targetPriorities.clear()
    this.stop()
  }

  /**
   * Remove all targets in a specific group
   * @param {string} groupName - Name of the group to clear
   * @returns {number} Number of targets removed
   */
  removeGroup(groupName) {
    const group = this.targetGroups.get(groupName)
    if (!group) {
      return 0
    }

    let removedCount = 0
    for (const id of group) {
      this.removeTarget(id)
      removedCount++
    }

    return removedCount
  }

  /**
   * Get all targets in a specific group
   * @param {string} groupName - Name of the group
   * @returns {Array} Array of target IDs in the group
   */
  getGroupTargets(groupName) {
    const group = this.targetGroups.get(groupName)
    return group ? Array.from(group) : []
  }

  /**
   * Get targets by priority level
   * @param {number} minPriority - Minimum priority level (inclusive)
   * @param {number} maxPriority - Maximum priority level (inclusive, optional)
   * @returns {Array} Array of target IDs matching priority criteria
   */
  getTargetsByPriority(minPriority, maxPriority = null) {
    const matchingTargets = []
    
    for (const [id, priority] of this.targetPriorities.entries()) {
      if (priority >= minPriority && (maxPriority === null || priority <= maxPriority)) {
        matchingTargets.push(id)
      }
    }
    
    return matchingTargets
  }

  /**
   * Get targets by type
   * @param {string} type - Target type ('cursor', 'shape', etc.)
   * @returns {Array} Array of target IDs of the specified type
   */
  getTargetsByType(type) {
    const matchingTargets = []
    
    for (const [id, target] of this.targets.entries()) {
      if (target.type === type) {
        matchingTargets.push(id)
      }
    }
    
    return matchingTargets
  }

  /**
   * Get targets that are near completion
   * @param {number} threshold - Percentage threshold (0-1) for near completion
   * @returns {Array} Array of target IDs that are near completion
   */
  getTargetsNearCompletion(threshold = 0.8) {
    const nearCompletionTargets = []
    const currentTime = performance.now()
    
    for (const [id, target] of this.targets.entries()) {
      if (target.isActive) {
        const elapsed = currentTime - target.startTime
        const progress = elapsed / target.duration
        
        if (progress >= threshold) {
          nearCompletionTargets.push(id)
        }
      }
    }
    
    return nearCompletionTargets
  }

  /**
   * Pause a target (mark as inactive but keep in memory)
   * @param {string} id - Target identifier
   * @returns {boolean} True if target was paused, false if not found
   */
  pauseTarget(id) {
    const target = this.targets.get(id)
    if (target) {
      target.isActive = false
      return true
    }
    return false
  }

  /**
   * Resume a paused target
   * @param {string} id - Target identifier
   * @returns {boolean} True if target was resumed, false if not found
   */
  resumeTarget(id) {
    const target = this.targets.get(id)
    if (target) {
      target.isActive = true
      // Restart animation loop if needed
      if (!this.isRunning) {
        this.start()
      }
      return true
    }
    return false
  }

  /**
   * Pause all targets in a group
   * @param {string} groupName - Name of the group to pause
   * @returns {number} Number of targets paused
   */
  pauseGroup(groupName) {
    const group = this.targetGroups.get(groupName)
    if (!group) {
      return 0
    }

    let pausedCount = 0
    for (const id of group) {
      if (this.pauseTarget(id)) {
        pausedCount++
      }
    }

    return pausedCount
  }

  /**
   * Resume all targets in a group
   * @param {string} groupName - Name of the group to resume
   * @returns {number} Number of targets resumed
   */
  resumeGroup(groupName) {
    const group = this.targetGroups.get(groupName)
    if (!group) {
      return 0
    }

    let resumedCount = 0
    for (const id of group) {
      if (this.resumeTarget(id)) {
        resumedCount++
      }
    }

    return resumedCount
  }

  /**
   * Get statistics about current interpolation state
   * @returns {object} Statistics object
   */
  getStats() {
    const activeTargets = this.getActiveTargets()
    const cursorTargets = [...activeTargets.values()].filter(t => t.type === 'cursor').length
    const shapeTargets = [...activeTargets.values()].filter(t => t.type === 'shape').length
    
    // Group statistics
    const groupStats = {}
    for (const [groupName, group] of this.targetGroups.entries()) {
      const activeInGroup = Array.from(group).filter(id => {
        const target = this.targets.get(id)
        return target && target.isActive
      }).length
      
      groupStats[groupName] = {
        total: group.size,
        active: activeInGroup,
        inactive: group.size - activeInGroup
      }
    }
    
    // Priority statistics
    const priorityStats = {}
    for (const [id, priority] of this.targetPriorities.entries()) {
      const target = this.targets.get(id)
      if (target && target.isActive) {
        if (!priorityStats[priority]) {
          priorityStats[priority] = 0
        }
        priorityStats[priority]++
      }
    }

    return {
      totalTargets: this.targets.size,
      activeTargets: activeTargets.size,
      inactiveTargets: this.targets.size - activeTargets.size,
      cursorTargets,
      shapeTargets,
      groupCount: this.targetGroups.size,
      groupStats,
      priorityStats,
      isRunning: this.isRunning,
    }
  }

  /**
   * Add custom easing function
   * @param {string} name - Function name
   * @param {function} easingFunction - Easing function (t) => value
   */
  addEasingFunction(name, easingFunction) {
    this.easingFunctions[name] = easingFunction
  }

  /**
   * Remove custom easing function
   * @param {string} name - Function name
   */
  removeEasingFunction(name) {
    delete this.easingFunctions[name]
  }

  /**
   * Get recommended easing function for animation type
   * @param {string} type - Animation type ('cursor', 'shape', 'ui', 'bounce', 'elastic')
   * @returns {string} Recommended easing function name
   */
  getRecommendedEasing(type) {
    const recommendations = {
      cursor: 'easeOut',
      shape: 'easeOutQuart',
      ui: 'easeInOut',
      bounce: 'easeOutBounce',
      elastic: 'easeOutElastic',
      smooth: 'easeOutCirc',
      snappy: 'easeOutExpo',
      gentle: 'easeInOutQuart'
    }
    return recommendations[type] || 'easeOut'
  }

  /**
   * Get recommended duration for animation type
   * @param {string} type - Animation type ('cursor', 'shape', 'ui', 'fast', 'slow')
   * @returns {number} Recommended duration in milliseconds
   */
  getRecommendedDuration(type) {
    const recommendations = {
      cursor: 50,
      shape: 150,
      ui: 200,
      fast: 100,
      slow: 300,
      instant: 0,
      quick: 75,
      smooth: 250
    }
    return recommendations[type] || 150
  }

  /**
   * Create animation preset for common use cases
   * @param {string} preset - Preset name ('cursor-move', 'shape-drag', 'ui-transition', 'bounce-in', 'fade-out')
   * @returns {object} Preset configuration {duration, easing}
   */
  getAnimationPreset(preset) {
    const presets = {
      'cursor-move': { duration: 50, easing: 'easeOut' },
      'shape-drag': { duration: 150, easing: 'easeOutQuart' },
      'ui-transition': { duration: 200, easing: 'easeInOut' },
      'bounce-in': { duration: 400, easing: 'easeOutBounce' },
      'fade-out': { duration: 300, easing: 'easeOutExpo' },
      'smooth-move': { duration: 250, easing: 'easeOutCirc' },
      'snappy-move': { duration: 100, easing: 'easeOutExpo' },
      'gentle-move': { duration: 300, easing: 'easeInOutQuart' }
    }
    return presets[preset] || { duration: 150, easing: 'easeOut' }
  }
}

// Create and export singleton instance
const interpolationManager = new InterpolationManager()

export default interpolationManager

// Export class for testing purposes
export { InterpolationManager }
