/**
 * ObjectStore - External state management for canvas objects
 * Decoupled from React state for better performance and real-time updates
 */
class ObjectStore {
  constructor() {
    this.objects = new Map()
    this.listeners = new Set()
    this.selectedId = null
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
   * Get all objects as an array
   * @returns {Array} Array of all objects
   */
  getAll() {
    if (!this.objects) {
      this.objects = new Map()
    }
    // Return the same array reference if nothing changed
    if (!this._cachedArray || this._arrayVersion !== this._version) {
      this._cachedArray = Array.from(this.objects.values())
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
}

// Create singleton instance
const objectStore = new ObjectStore()

// Create bound methods for useSyncExternalStore
const boundObjectStore = {
  subscribe: objectStore.subscribe.bind(objectStore),
  getAll: objectStore.getAll.bind(objectStore),
  getSelected: objectStore.getSelected.bind(objectStore),
  add: objectStore.add.bind(objectStore),
  update: objectStore.update.bind(objectStore),
  remove: objectStore.remove.bind(objectStore),
  setSelected: objectStore.setSelected.bind(objectStore),
  clear: objectStore.clear.bind(objectStore),
  setAll: objectStore.setAll.bind(objectStore),
  get: objectStore.get.bind(objectStore),
  has: objectStore.has.bind(objectStore),
  size: objectStore.size.bind(objectStore),
  getSelectedObject: objectStore.getSelectedObject.bind(objectStore),
}

export default boundObjectStore
