/**
 * InterpolationManager - Singleton class for smooth remote shape movement
 * Handles position buffering and interpolation at 60 FPS
 */
class InterpolationManager {
  constructor() {
    this.isRunning = false
    this.animationFrameId = null
    this.positionBuffer = new Map() // shapeId -> [{x, y, timestamp}, ...]
    this.activelyMovingShapes = new Set() // shapes currently being interpolated
    this.lastUpdateTimes = new Map() // shapeId -> last update timestamp
    this.interpolationDelay = 100 // ms delay for smooth interpolation
    this.maxBufferSize = 10 // max positions to keep per shape
    this.cleanupThreshold = 5000 // ms - remove shapes not updated for this long
  }

  /**
   * Start the interpolation loop
   */
  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.animationFrameId = requestAnimationFrame(() => this.interpolationLoop())
  }

  /**
   * Stop the interpolation loop
   */
  stop() {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Add position to buffer for interpolation
   * @param {string} shapeId - ID of the shape
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} timestamp - Timestamp of the position
   */
  addPosition(shapeId, x, y, timestamp = Date.now()) {
    if (!this.positionBuffer.has(shapeId)) {
      this.positionBuffer.set(shapeId, [])
    }
    
    const buffer = this.positionBuffer.get(shapeId)
    buffer.push({ x, y, timestamp })
    
    // Keep only last N positions for interpolation
    if (buffer.length > this.maxBufferSize) {
      buffer.shift()
    }
    
    // Mark as actively moving
    this.activelyMovingShapes.add(shapeId)
    this.lastUpdateTimes.set(shapeId, timestamp)
  }

  /**
   * Get interpolated position for a shape
   * @param {string} shapeId - ID of the shape
   * @returns {Object|null} Interpolated position or null
   */
  getInterpolatedPosition(shapeId) {
    const buffer = this.positionBuffer.get(shapeId)
    if (!buffer || buffer.length < 2) return null
    
    const now = Date.now()
    const targetTime = now - this.interpolationDelay
    
    // Find the two points to interpolate between
    let before = null
    let after = null
    
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i].timestamp <= targetTime && buffer[i + 1].timestamp >= targetTime) {
        before = buffer[i]
        after = buffer[i + 1]
        break
      }
    }
    
    if (!before || !after) {
      // Return the most recent position if no interpolation possible
      return buffer[buffer.length - 1]
    }
    
    // Linear interpolation
    const ratio = (targetTime - before.timestamp) / (after.timestamp - before.timestamp)
    return {
      x: before.x + (after.x - before.x) * ratio,
      y: before.y + (after.y - before.y) * ratio
    }
  }

  /**
   * Check if a shape is actively moving
   * @param {string} shapeId - ID of the shape
   * @returns {boolean} True if actively moving
   */
  isActivelyMoving(shapeId) {
    return this.activelyMovingShapes.has(shapeId)
  }

  /**
   * Clear position buffer for a shape
   * @param {string} shapeId - ID of the shape
   */
  clearPositionBuffer(shapeId) {
    this.positionBuffer.delete(shapeId)
    this.activelyMovingShapes.delete(shapeId)
    this.lastUpdateTimes.delete(shapeId)
  }

  /**
   * Main interpolation loop (60 FPS)
   */
  interpolationLoop() {
    if (!this.isRunning) return
    
    // Clean up old buffers
    this.cleanupOldBuffers()
    
    // Continue the loop
    this.animationFrameId = requestAnimationFrame(() => this.interpolationLoop())
  }

  /**
   * Clean up old position buffers
   */
  cleanupOldBuffers() {
    const now = Date.now()
    const shapesToRemove = []
    
    for (const [shapeId, lastUpdate] of this.lastUpdateTimes.entries()) {
      if (now - lastUpdate > this.cleanupThreshold) {
        shapesToRemove.push(shapeId)
      }
    }
    
    shapesToRemove.forEach(shapeId => {
      this.clearPositionBuffer(shapeId)
    })
  }

  /**
   * Get all actively moving shapes
   * @returns {Array<string>} Array of shape IDs
   */
  getActivelyMovingShapes() {
    return Array.from(this.activelyMovingShapes)
  }

  /**
   * Set interpolation delay
   * @param {number} delay - Delay in milliseconds
   */
  setInterpolationDelay(delay) {
    this.interpolationDelay = delay
  }

  /**
   * Get current status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activelyMovingCount: this.activelyMovingShapes.size,
      totalBuffers: this.positionBuffer.size,
      interpolationDelay: this.interpolationDelay
    }
  }
}

// Create singleton instance
const interpolationManager = new InterpolationManager()

export default interpolationManager
