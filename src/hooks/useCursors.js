import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES, REALTIME_CONFIG } from '../lib/constants'
import { throttle } from '../utils/syncHelpers'

export const useCursors = ({ userId, username, displayName, cursorColor = '#3b82f6' }) => {
  const [otherCursors, setOtherCursors] = useState([])
  const [myCursor, setMyCursor] = useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = useState(true)
  const subscriptionRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const lastCursorRef = useRef({ x: 0, y: 0 })
  const presenceIntervalRef = useRef(null)

  // Throttled function to update cursor position
  const updateCursorPosition = useCallback(throttle(async (x, y) => {
    if (!userId) return

    const now = Date.now()
    if (now - lastUpdateRef.current < REALTIME_CONFIG.CURSOR_UPDATE_INTERVAL) {
      return
    }
    
      // Only update if cursor moved significantly (more than 10 pixels)
      const lastCursor = lastCursorRef.current
      const distance = Math.sqrt(Math.pow(x - lastCursor.x, 2) + Math.pow(y - lastCursor.y, 2))
      if (distance < 10) {
        return
      }
      
      lastUpdateRef.current = now
      lastCursorRef.current = { x, y }
    setMyCursor({ x, y })

    try {
      // Update presence in database
      const { error } = await supabase
        .from(TABLES.PRESENCE)
        .upsert({
          user_id: userId,
          cursor_x: x,
          cursor_y: y,
          cursor_color: cursorColor,
          active: true,
          last_seen: new Date().toISOString(),
          display_name: displayName || username
        })

      if (error) {
        console.error('Error updating cursor position:', error)
      }
    } catch (err) {
      console.error('Error updating cursor position:', err)
    }
  }, REALTIME_CONFIG.CURSOR_UPDATE_INTERVAL), [userId, username, displayName, cursorColor])

  // Function to set user as active
  const setUserActive = useCallback(async (active = true) => {
    if (!userId) return

    setIsActive(active)

    try {
      const { error } = await supabase
        .from(TABLES.PRESENCE)
        .upsert({
          user_id: userId,
          active,
          last_seen: new Date().toISOString(),
          display_name: displayName || username
        })

      if (error) {
        console.error('Error updating user activity:', error)
      }
    } catch (err) {
      console.error('Error updating user activity:', err)
    }
  }, [userId, username, displayName])

  // Function to set user as inactive
  const setUserInactive = useCallback(async () => {
    await setUserActive(false)
  }, [setUserActive])

  // Function to update cursor color
  const updateCursorColor = useCallback(async (color) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from(TABLES.PRESENCE)
        .upsert({
          user_id: userId,
          cursor_color: color,
          last_seen: new Date().toISOString(),
          display_name: displayName || username
        })

      if (error) {
        console.error('Error updating cursor color:', error)
      }
    } catch (err) {
      console.error('Error updating cursor color:', err)
    }
  }, [userId, username, displayName])

  // Subscribe to presence changes
  useEffect(() => {
    if (!userId) return

    // Set up real-time subscription for presence changes
    const channel = supabase
      .channel('presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.PRESENCE,
        },
        (payload) => {
          // Don't process our own updates
          if (payload.new?.user_id === userId) return

          // Update other cursors based on presence changes
          setOtherCursors(prev => {
            const otherCursorsMap = new Map(prev.map(cursor => [cursor.userId, cursor]))
            
            if (payload.eventType === 'DELETE') {
              otherCursorsMap.delete(payload.old.user_id)
            } else if (payload.new) {
              const { user_id, cursor_x, cursor_y, cursor_color, active, display_name } = payload.new
              
              if (active) {
                otherCursorsMap.set(user_id, {
                  userId: user_id,
                  x: cursor_x || 0,
                  y: cursor_y || 0,
                  color: cursor_color || '#3b82f6',
                  displayName: display_name,
                  lastSeen: new Date().toISOString()
                })
              } else {
                otherCursorsMap.delete(user_id)
              }
            }
            
            return Array.from(otherCursorsMap.values())
          })
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    // Set up periodic presence updates to maintain active status
    presenceIntervalRef.current = setInterval(() => {
      if (isActive) {
        setUserActive(true)
      }
    }, REALTIME_CONFIG.PRESENCE_UPDATE_INTERVAL)

    // Initial presence setup
    setUserActive(true)

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current)
      }
      // Set user as inactive on cleanup
      setUserInactive()
    }
  }, [userId, username, displayName, isActive, setUserActive, setUserInactive])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setUserInactive()
      } else {
        setUserActive(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [setUserActive, setUserInactive])

  // Handle window focus/blur
  useEffect(() => {
    const handleFocus = () => setUserActive(true)
    const handleBlur = () => setUserInactive()

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [setUserActive, setUserInactive])

  return {
    otherCursors,
    myCursor,
    isActive,
    updateCursorPosition,
    setUserActive,
    setUserInactive,
    updateCursorColor,
  }
}
