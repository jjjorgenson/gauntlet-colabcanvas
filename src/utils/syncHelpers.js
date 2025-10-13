/**
 * Merge remote changes into local state
 * Uses last-write-wins strategy for conflict resolution
 */
export const mergeRemoteChanges = (localObjects, remoteChanges) => {
  const objectsMap = new Map()
  
  // Add all local objects to map
  localObjects.forEach(obj => {
    objectsMap.set(obj.id, obj)
  })
  
  // Apply remote changes
  remoteChanges.forEach(change => {
    const { eventType, new: newRecord, old: oldRecord } = change
    
    switch (eventType) {
      case 'INSERT':
        // Only add if we don't have it locally or remote is newer
        const existing = objectsMap.get(newRecord.id)
        if (!existing || new Date(newRecord.updated_at) > new Date(existing.updated_at)) {
          objectsMap.set(newRecord.id, newRecord)
        }
        break
        
      case 'UPDATE':
        // Update if remote is newer
        const current = objectsMap.get(newRecord.id)
        if (current && new Date(newRecord.updated_at) > new Date(current.updated_at)) {
          objectsMap.set(newRecord.id, newRecord)
        }
        break
        
      case 'DELETE':
        objectsMap.delete(oldRecord.id)
        break
        
      default:
        console.warn('Unknown event type:', eventType)
    }
  })
  
  return Array.from(objectsMap.values())
}

/**
 * Check if an object has been updated recently
 */
export const isRecentlyUpdated = (object, thresholdMs = 1000) => {
  const now = new Date()
  const updatedAt = new Date(object.updated_at)
  return (now - updatedAt) < thresholdMs
}

/**
 * Filter out objects that are currently being edited locally
 */
export const filterLocalEdits = (objects, localEditIds) => {
  return objects.filter(obj => !localEditIds.has(obj.id))
}

/**
 * Debounce function for high-frequency updates
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for cursor updates
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

