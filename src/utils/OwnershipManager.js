/**
 * OwnershipManager - Manages shape ownership with 15-second timeout
 * Singleton pattern for consistent ownership state across the application
 */
class OwnershipManager {
  constructor() {
    this.timers = new Map() // shapeId -> timerId
    this.ownershipTimeout = 15000 // 15 seconds
  }

  /**
   * Acquire ownership for a shape with automatic timeout
   * @param {string} shapeId - ID of the shape
   * @param {string} userId - ID of the user acquiring ownership
   * @param {Function} onTimeout - Callback when ownership times out
   */
  acquire(shapeId, userId, onTimeout) {
    // Clear existing timer if any
    this.clearTimer(shapeId)
    
    // Set new timer for 15-second timeout
    const timerId = setTimeout(() => {
      this.release(shapeId)
      onTimeout?.(shapeId, userId)
    }, this.ownershipTimeout)
    
    this.timers.set(shapeId, timerId)
  }

  /**
   * Release ownership for a specific shape
   * @param {string} shapeId - ID of the shape
   */
  release(shapeId) {
    this.clearTimer(shapeId)
  }

  /**
   * Release all ownership for a specific user
   * @param {string} userId - ID of the user
   * @param {Function} onRelease - Callback for each released shape
   */
  releaseAllForUser(userId, onRelease) {
    // Note: This would need to be called with the actual owned shapes
    // from the database or ObjectStore since we only track timers here
    for (const [shapeId, timerId] of this.timers.entries()) {
      this.clearTimer(shapeId)
      onRelease?.(shapeId, userId)
    }
  }

  /**
   * Reset the timeout for a shape (called when user interacts with owned shape)
   * @param {string} shapeId - ID of the shape
   * @param {string} userId - ID of the user
   * @param {Function} onTimeout - Callback when ownership times out
   */
  resetTimeout(shapeId, userId, onTimeout) {
    this.acquire(shapeId, userId, onTimeout)
  }

  /**
   * Clear timer for a specific shape
   * @param {string} shapeId - ID of the shape
   */
  clearTimer(shapeId) {
    const timerId = this.timers.get(shapeId)
    if (timerId) {
      clearTimeout(timerId)
      this.timers.delete(shapeId)
    }
  }

  /**
   * Check if a shape has an active ownership timer
   * @param {string} shapeId - ID of the shape
   * @returns {boolean} True if shape has active timer
   */
  hasActiveTimer(shapeId) {
    return this.timers.has(shapeId)
  }

  /**
   * Get all shapes with active timers
   * @returns {Array<string>} Array of shape IDs with active timers
   */
  getActiveTimers() {
    return Array.from(this.timers.keys())
  }

  /**
   * Clear all timers (cleanup on app shutdown)
   */
  clearAllTimers() {
    for (const timerId of this.timers.values()) {
      clearTimeout(timerId)
    }
    this.timers.clear()
  }
}

// Create singleton instance
const ownershipManager = new OwnershipManager()

export default ownershipManager
