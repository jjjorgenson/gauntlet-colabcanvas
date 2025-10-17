import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/constants'
import { createRectangle, createCircle, createText, validateShape } from '../utils/shapeFactory'
import { shapeToDB, shapeFromDB } from '../utils/canvasHelpers'
import ownershipManager from '../utils/OwnershipManager'

/**
 * Custom hook for managing shapes with full CRUD operations
 * Integrates with Supabase database and ownership management
 */
export const useShapes = () => {
  const [shapes, setShapes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Initialize current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getCurrentUser()
  }, [])

  /**
   * CREATE - Add a new shape to the database
   */
  const createShape = useCallback(async (type, x, y, options = {}) => {
    if (!currentUser) {
      setError('User must be authenticated to create shapes')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      let newShape

      // Create shape based on type
      switch (type) {
        case 'rectangle':
          newShape = createRectangle(x, y, options.color, currentUser.id)
          break
        case 'circle':
          newShape = createCircle(x, y, options.color, currentUser.id)
          break
        case 'text':
          newShape = createText(x, y, options.text || 'Text', options.color, currentUser.id)
          break
        default:
          throw new Error(`Unsupported shape type: ${type}`)
      }

      // Validate shape before saving
      if (!validateShape(newShape)) {
        throw new Error('Invalid shape data')
      }

      // Convert to database format and insert
      const dbShape = shapeToDB(newShape)
      const { data, error: dbError } = await supabase
        .from(TABLES.SHAPES)
        .insert([dbShape])
        .select()
        .single()

      if (dbError) {
        throw dbError
      }

      // Convert back to JavaScript format and add to local state
      const jsShape = shapeFromDB(data)
      setShapes(prev => [...prev, jsShape])

      // Acquire ownership
      ownershipManager.acquireOwnership(data.id, currentUser.id, {
        timeout: 15000, // 15 seconds
        autoRelease: true
      })

      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  /**
   * READ - Fetch all shapes from database
   */
  const fetchShapes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .from(TABLES.SHAPES)
        .select('*')
        .order('created_at', { ascending: true })

      if (dbError) {
        throw dbError
      }

      // Convert database records to JavaScript format
      const jsShapes = (data || []).map(shapeFromDB)
      setShapes(jsShapes)
      return jsShapes
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * UPDATE - Update an existing shape
   */
  const updateShape = useCallback(async (shapeId, updates) => {
    if (!currentUser) {
      setError('User must be authenticated to update shapes')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Check ownership before updating
      const isOwner = ownershipManager.getOwner(shapeId) === currentUser.id
      if (!isOwner) {
        // Try to acquire ownership
        const acquired = ownershipManager.acquireOwnership(shapeId, currentUser.id, {
          timeout: 15000,
          autoRelease: true
        })
        if (!acquired) {
          throw new Error('Cannot acquire ownership of this shape')
        }
      }

      // Prepare update data and convert to database format
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }
      const dbUpdateData = shapeToDB(updateData)

      // Update in database
      const { data, error: dbError } = await supabase
        .from(TABLES.SHAPES)
        .update(dbUpdateData)
        .eq('id', shapeId)
        .select()
        .single()

      if (dbError) {
        throw dbError
      }

      // Convert back to JavaScript format and update local state
      const jsShape = shapeFromDB(data)
      setShapes(prev => 
        prev.map(shape => 
          shape.id === shapeId ? jsShape : shape
        )
      )

      return jsShape
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  /**
   * DELETE - Remove a shape from database
   */
  const deleteShape = useCallback(async (shapeId) => {
    if (!currentUser) {
      setError('User must be authenticated to delete shapes')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Check ownership before deleting
      const isOwner = ownershipManager.getOwner(shapeId) === currentUser.id
      if (!isOwner) {
        throw new Error('You do not have permission to delete this shape')
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from(TABLES.SHAPES)
        .delete()
        .eq('id', shapeId)

      if (dbError) {
        throw dbError
      }

      // Remove from local state
      setShapes(prev => prev.filter(shape => shape.id !== shapeId))

      // Release ownership
      ownershipManager.releaseOwnership(shapeId, currentUser.id)

      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  /**
   * Batch operations for multiple shapes
   */
  const batchUpdateShapes = useCallback(async (updates) => {
    if (!currentUser) {
      setError('User must be authenticated to update shapes')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const results = []
      
      for (const { shapeId, updates: shapeUpdates } of updates) {
        const result = await updateShape(shapeId, shapeUpdates)
        results.push({ shapeId, success: !!result, data: result })
      }

      return results
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [currentUser, updateShape])

  const batchDeleteShapes = useCallback(async (shapeIds) => {
    if (!currentUser) {
      setError('User must be authenticated to delete shapes')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const results = []
      
      for (const shapeId of shapeIds) {
        const success = await deleteShape(shapeId)
        results.push({ shapeId, success })
      }

      return results
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [currentUser, deleteShape])

  /**
   * Utility functions
   */
  const getShapeById = useCallback((shapeId) => {
    return shapes.find(shape => shape.id === shapeId)
  }, [shapes])

  const getShapesByUser = useCallback((userId) => {
    return shapes.filter(shape => shape.createdBy === userId)
  }, [shapes])

  const getShapesByType = useCallback((type) => {
    return shapes.filter(shape => shape.type === type)
  }, [shapes])

  const getOwnedShapes = useCallback(() => {
    if (!currentUser) return []
    return shapes.filter(shape => ownershipManager.getOwner(shape.id) === currentUser.id)
  }, [shapes, currentUser])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const refreshShapes = useCallback(() => {
    return fetchShapes()
  }, [fetchShapes])

  return {
    // State
    shapes,
    loading,
    error,
    currentUser,
    
    // CRUD Operations
    createShape,
    fetchShapes,
    updateShape,
    deleteShape,
    
    // Batch Operations
    batchUpdateShapes,
    batchDeleteShapes,
    
    // Utility Functions
    getShapeById,
    getShapesByUser,
    getShapesByType,
    getOwnedShapes,
    clearError,
    refreshShapes,
  }
}
