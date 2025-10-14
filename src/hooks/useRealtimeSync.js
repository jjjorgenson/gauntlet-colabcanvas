import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/constants'
import objectStore from '../lib/ObjectStore'

export const useRealtimeSync = ({ shapes, setShapesFromRemote, userId }) => {
  const subscriptionRef = useRef(null)
  const [isConnected, setIsConnected] = useState(true)
  const [pendingChanges, setPendingChanges] = useState([])
  const changeQueueRef = useRef([])

  // Load existing shapes from database
  const loadExistingShapes = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from(TABLES.CANVAS_OBJECTS)
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading existing shapes:', error)
        return
      }

      if (data && data.length > 0) {
        console.log('Loaded existing shapes:', data.length)
        setShapesFromRemote(data)
      }
    } catch (error) {
      console.error('Error in loadExistingShapes:', error)
    }
  }, [userId, setShapesFromRemote])

  // Load existing shapes and subscribe to real-time changes
  useEffect(() => {
    if (!userId) return

    // Load existing shapes first
    loadExistingShapes()

    const subscription = supabase
      .channel('canvas_objects')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.CANVAS_OBJECTS,
        },
        (payload) => {
          handleRemoteChange('INSERT', payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.CANVAS_OBJECTS,
        },
        (payload) => {
          handleRemoteChange('UPDATE', payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: TABLES.CANVAS_OBJECTS,
        },
        (payload) => {
          handleRemoteChange('DELETE', payload)
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [userId, loadExistingShapes])

  const handleRemoteChange = useCallback((eventType, payload) => {
    // Filter out own changes to avoid duplicates
    if (payload.new?.created_by === userId || payload.old?.created_by === userId) {
      return
    }

    console.log('Remote shape change:', { eventType, payload })

    // Apply remote changes directly to ObjectStore instead of replacing all shapes
    switch (eventType) {
      case 'INSERT':
        if (payload.new) {
          // Add the new shape to the store
          objectStore.add(payload.new)
        }
        break
      case 'UPDATE':
        if (payload.new) {
          // Update the existing shape in the store
          objectStore.update(payload.new.id, payload.new)
        }
        break
      case 'DELETE':
        if (payload.old) {
          // Remove the shape from the store
          objectStore.remove(payload.old.id)
        }
        break
    }
  }, [userId])

  const broadcastShapeChange = useCallback(async (shape, operation) => {
    if (!userId) return

    try {
      const shapeData = {
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        color: shape.color,
        text_content: shape.text_content,
        font_size: shape.font_size,
        created_by: userId,
        updated_at: new Date().toISOString()
      }

      switch (operation) {
        case 'create':
          const { error: insertError } = await supabase
            .from(TABLES.CANVAS_OBJECTS)
            .insert(shapeData)
          
          if (insertError) {
            console.error('Error creating shape:', insertError)
            queueChange(shape, operation)
          }
          break

        case 'update':
          const { error: updateError } = await supabase
            .from(TABLES.CANVAS_OBJECTS)
            .update(shapeData)
            .eq('id', shape.id)
          
          if (updateError) {
            console.error('Error updating shape:', updateError)
            queueChange(shape, operation)
          }
          break

        case 'delete':
          const { error: deleteError } = await supabase
            .from(TABLES.CANVAS_OBJECTS)
            .delete()
            .eq('id', shape.id)
          
          if (deleteError) {
            console.error('Error deleting shape:', deleteError)
            queueChange(shape, operation)
          }
          break
      }
    } catch (error) {
      console.error('Error broadcasting shape change:', error)
      queueChange(shape, operation)
    }
  }, [userId])

  const queueChange = useCallback((shape, operation) => {
    const change = { shape, operation, timestamp: Date.now() }
    changeQueueRef.current.push(change)
    setPendingChanges(changeQueueRef.current)
  }, [])

  const retryPendingChanges = useCallback(async () => {
    if (changeQueueRef.current.length === 0) return

    const changes = [...changeQueueRef.current]
    changeQueueRef.current = []
    setPendingChanges([])

    for (const change of changes) {
      await broadcastShapeChange(change.shape, change.operation)
    }
  }, [broadcastShapeChange])

  // Retry pending changes when connection is restored
  useEffect(() => {
    if (isConnected && pendingChanges.length > 0) {
      retryPendingChanges()
    }
  }, [isConnected, pendingChanges.length, retryPendingChanges])

  return {
    broadcastShapeChange,
    isConnected,
    pendingChangesCount: pendingChanges.length,
  }
}
