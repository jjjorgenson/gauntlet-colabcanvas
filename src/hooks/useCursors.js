import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { REALTIME_CONFIG } from '../lib/constants'
import { throttle } from '../utils/syncHelpers'

// Import getUserColor function from usePresence to ensure consistent colors
const getUserColor = (userId) => {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ]
  
  // Use the user ID to consistently assign a color
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

export const useCursors = ({ userId, username, isDragging = false }) => {
  const [otherCursors, setOtherCursors] = useState([])
  const [myCursor, setMyCursor] = useState({ x: 0, y: 0 })
  const subscriptionRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const cursorChannelRef = useRef(null)
  const lastPresenceUpdateRef = useRef(0)

  // Update presence table with cursor position (lower frequency for DB writes)
  const updatePresenceWithCursor = useCallback(async (x, y) => {
    if (!userId) return
    
    const now = Date.now()
    // Only update presence every 300ms to avoid aggressive DB writes
    if (now - lastPresenceUpdateRef.current < 300) {
      return
    }
    
    lastPresenceUpdateRef.current = now
    
    try {
      await supabase
        .from('presence')
        .upsert({
          user_id: userId,
          cursor_x: x,
          cursor_y: y,
          active: true,
          last_seen: new Date().toISOString(),
          display_name: username
        }, {
          onConflict: 'user_id'
        })
    } catch (error) {
      console.error('Error updating presence with cursor:', error)
    }
  }, [userId, username])

  // Throttled function to update cursor position
  const updateCursorPosition = useCallback(
    throttle((x, y) => {
      const now = Date.now()
      // During drag, use much faster updates for near-real-time sync
      const throttleInterval = isDragging ? 16 : 100 // 16ms = ~60fps during drag
      if (now - lastUpdateRef.current < throttleInterval) {
        return
      }
      
      lastUpdateRef.current = now
      setMyCursor({ x, y })


      // Update presence table (lower frequency for DB writes)
      updatePresenceWithCursor(x, y)

      // Broadcast cursor position via ephemeral channel (fast real-time updates)
      if (cursorChannelRef.current && userId && username) {
        const cursorData = {
          type: 'cursor_update',
          payload: {
            user_id: userId,
            username: username,
            cursor_x: x,
            cursor_y: y,
            color: getUserColor(userId), // Add user color to match sidebar
            timestamp: now,
            isDragging: isDragging // Include drag state in broadcast
          }
        }
        cursorChannelRef.current.send(cursorData)
      }
    }, 16), // Use 16ms base throttle for faster updates
    [userId, username, updatePresenceWithCursor, isDragging]
  )

  useEffect(() => {
    if (!userId || !username) return

    // Create ephemeral channel for cursor broadcasting
    const cursorChannel = supabase.channel('cursors', {
      config: {
        broadcast: { self: false } // Don't receive our own broadcasts
      }
    })

    // Listen for cursor updates from other users
    cursorChannel.on('broadcast', { event: 'cursor_update' }, (payload) => {
      const { user_id, username, cursor_x, cursor_y, color, timestamp, isDragging } = payload.payload
      
      // Don't process our own cursor updates
      if (user_id === userId) {
        return
      }

      // Update other cursors
      setOtherCursors(prev => {
        const existing = prev.find(cursor => cursor.user_id === user_id)
        if (existing) {
          // Update existing cursor
          return prev.map(cursor => 
            cursor.user_id === user_id 
              ? { ...cursor, cursor_x, cursor_y, color: color || getUserColor(user_id), timestamp, isDragging: isDragging || false }
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
            color: color || getUserColor(user_id), // Use color from broadcast or fallback to consistent color
            isDragging: isDragging || false
          }]
        }
      })
    })

    // Subscribe to the channel
    cursorChannel.subscribe((status) => {
      // Only log errors or important status changes
      if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        console.log('Cursor channel status:', status)
      }
    })

    cursorChannelRef.current = cursorChannel
    subscriptionRef.current = cursorChannel

    // Load initial cursor positions from presence table
    const loadInitialCursors = async () => {
      try {
        const { data, error } = await supabase
          .from('presence')
          .select('user_id, cursor_x, cursor_y, display_name, last_seen')
          .eq('active', true)
          .neq('user_id', userId) // Don't include our own cursor
          .gt('last_seen', new Date(Date.now() - 30000).toISOString()) // Only recent activity

        if (error) {
          console.error('Error loading initial cursors:', error)
          return
        }

        if (data && data.length > 0) {
          const initialCursors = data.map(user => ({
            user_id: user.user_id,
            username: user.display_name || 'Anonymous',
            cursor_x: user.cursor_x || 0,
            cursor_y: user.cursor_y || 0,
            timestamp: new Date(user.last_seen).getTime(),
            color: getUserColor(user.user_id),
            isDragging: false // Default to not dragging for initial cursors
          }))
          
          setOtherCursors(initialCursors)
        }
      } catch (error) {
        console.error('Error in loadInitialCursors:', error)
      }
    }

    // Load initial cursors
    loadInitialCursors()

    // Subscribe to presence changes for cursor updates
    const presenceSubscription = supabase
      .channel('presence-cursors')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'presence'
      }, (payload) => {
        const { user_id, cursor_x, cursor_y, display_name, last_seen, active } = payload.new
        
        // Don't process our own updates
        if (user_id === userId) return

        // If user went inactive, remove their cursor
        if (!active) {
          setOtherCursors(prev => prev.filter(cursor => cursor.user_id !== user_id))
          return
        }

        // Update cursor position from presence
        setOtherCursors(prev => {
          const existing = prev.find(cursor => cursor.user_id === user_id)
          if (existing) {
            // Update existing cursor, preserve drag state
            return prev.map(cursor => 
              cursor.user_id === user_id 
                ? { 
                    ...cursor, 
                    cursor_x: cursor_x || cursor.cursor_x, 
                    cursor_y: cursor_y || cursor.cursor_y,
                    username: display_name || cursor.username,
                    timestamp: new Date(last_seen).getTime()
                    // Keep existing isDragging state
                  }
                : cursor
            )
          } else {
            // Add new cursor from presence
            return [...prev, {
              user_id,
              username: display_name || 'Anonymous',
              cursor_x: cursor_x || 0,
              cursor_y: cursor_y || 0,
              timestamp: new Date(last_seen).getTime(),
              color: getUserColor(user_id),
              isDragging: false // Default to not dragging for presence-loaded cursors
            }]
          }
        })
      })
      .subscribe()

    // Clean up old cursors periodically (tied to presence cleanup)
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
      if (presenceSubscription) {
        supabase.removeChannel(presenceSubscription)
      }
      clearInterval(cleanupInterval)
    }
  }, [userId, username])


  return {
    otherCursors,
    myCursor,
    updateCursorPosition,
  }
}
