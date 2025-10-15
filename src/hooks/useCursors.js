import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { REALTIME_CONFIG } from '../lib/constants'
import { throttle } from '../utils/syncHelpers'

export const useCursors = ({ userId, username }) => {
  const [otherCursors, setOtherCursors] = useState([])
  const [myCursor, setMyCursor] = useState({ x: 0, y: 0 })
  const subscriptionRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const cursorChannelRef = useRef(null)

  // Throttled function to update cursor position
  const updateCursorPosition = useCallback(
    throttle((x, y) => {
      const now = Date.now()
      if (now - lastUpdateRef.current < REALTIME_CONFIG.CURSOR_UPDATE_INTERVAL) {
        return
      }
      
      lastUpdateRef.current = now
      setMyCursor({ x, y })

      // Broadcast cursor position via ephemeral channel
      if (cursorChannelRef.current && userId && username) {
        cursorChannelRef.current.send({
          type: 'cursor_update',
          payload: {
            user_id: userId,
            username: username,
            cursor_x: x,
            cursor_y: y,
            timestamp: now
          }
        })
      }
    }, REALTIME_CONFIG.CURSOR_UPDATE_INTERVAL),
    [userId, username]
  )

  useEffect(() => {
    if (!userId || !username) return

    // Create ephemeral channel for cursor broadcasting
    const cursorChannel = supabase.channel('cursors', {
      config: {
        broadcast: { self: false }, // Don't receive our own broadcasts
        presence: { key: userId }
      }
    })

    // Listen for cursor updates from other users
    cursorChannel.on('broadcast', { event: 'cursor_update' }, (payload) => {
      const { user_id, username, cursor_x, cursor_y, timestamp } = payload.payload
      
      // Don't process our own cursor updates
      if (user_id === userId) return

      // Update other cursors
      setOtherCursors(prev => {
        const existing = prev.find(cursor => cursor.user_id === user_id)
        if (existing) {
          // Update existing cursor
          return prev.map(cursor => 
            cursor.user_id === user_id 
              ? { ...cursor, cursor_x, cursor_y, timestamp }
              : cursor
          )
        } else {
          // Add new cursor
          return [...prev, {
            user_id,
            username,
            cursor_x,
            cursor_y,
            timestamp,
            color: getCursorColor(user_id) // Assign consistent color
          }]
        }
      })
    })

    // Subscribe to the channel
    cursorChannel.subscribe((status) => {
      // console.log('Cursor channel status:', status)
    })

    cursorChannelRef.current = cursorChannel
    subscriptionRef.current = cursorChannel

    // Clean up old cursors periodically
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setOtherCursors(prev => 
        prev.filter(cursor => now - cursor.timestamp < 5000) // Remove cursors older than 5 seconds
      )
    }, 1000)

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      clearInterval(cleanupInterval)
    }
  }, [userId, username])

  // Generate consistent color for each user
  const getCursorColor = useCallback((userId) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length]
  }, [])

  return {
    otherCursors,
    myCursor,
    updateCursorPosition,
  }
}
