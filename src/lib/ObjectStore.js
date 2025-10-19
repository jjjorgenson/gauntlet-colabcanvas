/**
 * ObjectStore - External state management for canvas objects
 * Decoupled from React state for better performance and real-time updates
 */
class ObjectStore {
  constructor() {
    this.objects = new Map()
    this.listeners = new Set()
    this.selectedId = null
    this.editingIds = new Set() // Track which shapes are being edited
    this.ownedShapes = new Map() // Track ownership: shapeId -> {ownerId, ownedAt}
    this.positionBuffer = new Map() // Buffer for smooth interpolation: shapeId -> [{x, y, timestamp}, ...]
    this._version = 0
    this._cachedArray = null
    this._arrayVersion = -1
    this._cachedSelected = null
    this._selectedVersion = -1
  }

  /**
   * Subscribe to store changes
   * @param {Function} listener - Callback function to call on changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of changes
   */
  notify() {
    this._version++
    this.listeners.forEach(listener => listener())
  }

  /**
   * Get all objects as an array, sorted by z_index
   * @returns {Array} Array of all objects sorted by z_index (ascending)
   */
  getAll() {
    if (!this.objects) {
      this.objects = new Map()
    }
    // Return the same array reference if nothing changed
    if (!this._cachedArray || this._arrayVersion !== this._version) {
      this._cachedArray = Array.from(this.objects.values())
        .sort((a, b) => (a.z_index || 0) - (b.z_index || 0)) // Sort by z_index ascending
      this._arrayVersion = this._version
    }
    return this._cachedArray
  }

  /**
   * Get a single object by ID
   * @param {string} id - Object ID
   * @returns {Object|null} Object or null if not found
   */
  get(id) {
    if (!this.objects) {
      this.objects = new Map()
    }
    return this.objects.get(id) || null
  }

  /**
   * Add a new object to the store
   * @param {Object} object - Object to add
   */
  add(object) {
    if (!this.objects) {
      this.objects = new Map()
    }
    this.objects.set(object.id, object)
    this.notify()
  }

  /**
   * Update an existing object
   * @param {string} id - Object ID
   * @param {Object} changes - Changes to apply
   */
  update(id, changes) {
    if (!this.objects) {
      this.objects = new Map()
    }
    const existing = this.objects.get(id)
    if (existing) {
      const updated = {
        ...existing,
        ...changes,
        updated_at: new Date().toISOString()
      }
      this.objects.set(id, updated)
      this.notify()
    }
  }

  /**
   * Remove an object from the store
   * @param {string} id - Object ID
   */
  remove(id) {
    if (!this.objects) {
      this.objects = new Map()
    }
    this.objects.delete(id)
    if (this.selectedId === id) {
      this.selectedId = null
    }
    this.notify()
  }

  /**
   * Set the selected object ID
   * @param {string|null} id - Object ID to select, or null to deselect
   */
  setSelected(id) {
    this.selectedId = id
    this.notify()
  }

  /**
   * Get the selected object ID
   * @returns {string|null} Selected object ID
   */
  getSelected() {
    // Return the same reference if nothing changed
    if (!this._cachedSelected || this._selectedVersion !== this._version) {
      this._cachedSelected = this.selectedId
      this._selectedVersion = this._version
    }
    return this._cachedSelected
  }

  /**
   * Get the selected object
   * @returns {Object|null} Selected object or null
   */
  getSelectedObject() {
    return this.selectedId ? this.get(this.selectedId) : null
  }

  /**
   * Clear all objects
   */
  clear() {
    if (!this.objects) {
      this.objects = new Map()
    }
    this.objects.clear()
    this.selectedId = null
    this.notify()
  }

  /**
   * Set all objects (for remote sync)
   * @param {Array} objects - Array of objects to set
   */
  setAll(objects) {
    if (!this.objects) {
      this.objects = new Map()
    }
    this.objects.clear()
    objects.forEach(obj => {
      this.objects.set(obj.id, obj)
    })
    this.notify()
  }

  /**
   * Get object count
   * @returns {number} Number of objects
   */
  size() {
    if (!this.objects) {
      this.objects = new Map()
    }
    return this.objects.size
  }

  /**
   * Check if an object exists
   * @param {string} id - Object ID
   * @returns {boolean} True if object exists
   */
  has(id) {
    if (!this.objects) {
      this.objects = new Map()
    }
    return this.objects.has(id)
  }

  /**
   * Mark an object as being edited
   * @param {string} id - Object ID
   */
  setEditing(id) {
    this.editingIds.add(id)
    // console.log('🔒 ObjectStore: Set editing for', id, 'Current editing:', Array.from(this.editingIds))
    this.notify()
  }

  /**
   * Mark an object as no longer being edited
   * @param {string} id - Object ID
   */
  setNotEditing(id) {
    this.editingIds.delete(id)
    // console.log('🔓 ObjectStore: Set not editing for', id, 'Current editing:', Array.from(this.editingIds))
    this.notify()
  }

  /**
   * Check if an object is being edited
   * @param {string} id - Object ID
   * @returns {boolean} True if object is being edited
   */
  isEditing(id) {
    return this.editingIds.has(id)
  }

  /**
   * Set ownership for a shape
   * @param {string} shapeId - ID of the shape
   * @param {string} ownerId - ID of the user who owns the shape
   * @param {Date} ownedAt - Timestamp when ownership was granted
   */
  setOwnership(shapeId, ownerId, ownedAt = new Date()) {
    this.ownedShapes.set(shapeId, { ownerId, ownedAt })
    this.notify()
  }

  /**
   * Release ownership for a specific shape
   * @param {string} shapeId - ID of the shape
   */
  releaseOwnership(shapeId) {
    this.ownedShapes.delete(shapeId)
    this.notify()
  }

  /**
   * Release all ownership for a specific user
   * @param {string} userId - ID of the user
   * @returns {Array<string>} Array of shape IDs that were released
   */
  releaseAllOwnership(userId) {
    const releasedShapes = []
    for (const [shapeId, ownership] of this.ownedShapes.entries()) {
      if (ownership.ownerId === userId) {
        this.ownedShapes.delete(shapeId)
        releasedShapes.push(shapeId)
      }
    }
    if (releasedShapes.length > 0) {
      this.notify()
    }
    return releasedShapes
  }


  /**
   * Check if a shape is owned by someone other than the specified user
   * @param {string} shapeId - ID of the shape
   * @param {string} userId - ID of the user to check against
   * @returns {boolean} True if owned by someone else
   */
  isOwnedByOther(shapeId, userId) {
    const ownership = this.ownedShapes.get(shapeId)
    return ownership ? ownership.ownerId !== userId : false
  }

  /**
   * Update ownership from remote changes (called by useRealtimeSync)
   * @param {string} shapeId - ID of the shape
   * @param {string|null} ownerId - New owner ID or null to release ownership
   * @param {Date|null} ownedAt - New ownership timestamp or null
   */
  updateOwnershipFromRemote(shapeId, ownerId, ownedAt) {
    if (ownerId && ownedAt) {
      this.ownedShapes.set(shapeId, { ownerId, ownedAt: new Date(ownedAt) })
    } else {
      this.ownedShapes.delete(shapeId)
    }
    this.notify()
  }

  /**
   * Add position to buffer for smooth interpolation (for remote users)
   * @param {string} shapeId - ID of the shape
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} timestamp - Timestamp of the position
   */
  addPositionToBuffer(shapeId, x, y, timestamp = Date.now()) {
    if (!this.positionBuffer.has(shapeId)) {
      this.positionBuffer.set(shapeId, [])
    }
    
    const buffer = this.positionBuffer.get(shapeId)
    buffer.push({ x, y, timestamp })
    
    // Keep only last 10 positions for interpolation
    if (buffer.length > 10) {
      buffer.shift()
    }
    
    this.notify()
  }

  /**
   * Get interpolated position for smooth movement (for remote users)
   * @param {string} shapeId - ID of the shape
   * @param {number} delay - Delay in ms for interpolation
   * @returns {Object|null} Interpolated position or null
   */
  getInterpolatedPosition(shapeId, delay = 100) {
    const buffer = this.positionBuffer.get(shapeId)
    if (!buffer || buffer.length < 2) return null
    
    const now = Date.now()
    const targetTime = now - delay
    
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
   * Clear position buffer for a shape
   * @param {string} shapeId - ID of the shape
   */
  clearPositionBuffer(shapeId) {
    this.positionBuffer.delete(shapeId)
    this.notify()
  }
}

// Create singleton instance
const objectStore = new ObjectStore()

// Create bound methods for useSyncExternalStore
const boundObjectStore = {
  // Core subscription and data methods
  subscribe: objectStore.subscribe.bind(objectStore),
  getAll: objectStore.getAll.bind(objectStore),
  getSelected: objectStore.getSelected.bind(objectStore),
  get: objectStore.get.bind(objectStore),
  
  // CRUD operations
  add: objectStore.add.bind(objectStore),
  update: objectStore.update.bind(objectStore),
  remove: objectStore.remove.bind(objectStore),
  setAll: objectStore.setAll.bind(objectStore),
  
  // Selection management
  setSelected: objectStore.setSelected.bind(objectStore),
  
  // Editing state management
  setEditing: objectStore.setEditing.bind(objectStore),
  setNotEditing: objectStore.setNotEditing.bind(objectStore),
  isEditing: objectStore.isEditing.bind(objectStore),
  
  // Ownership management
  setOwnership: objectStore.setOwnership.bind(objectStore),
  releaseOwnership: objectStore.releaseOwnership.bind(objectStore),
  releaseAllOwnership: objectStore.releaseAllOwnership.bind(objectStore),
  isOwnedByOther: objectStore.isOwnedByOther.bind(objectStore),
  updateOwnershipFromRemote: objectStore.updateOwnershipFromRemote.bind(objectStore),
  
  // Position interpolation for smooth remote movement
  addPositionToBuffer: objectStore.addPositionToBuffer.bind(objectStore),
  getInterpolatedPosition: objectStore.getInterpolatedPosition.bind(objectStore),
  clearPositionBuffer: objectStore.clearPositionBuffer.bind(objectStore),
}

export default boundObjectStore
