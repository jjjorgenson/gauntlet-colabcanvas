import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES, REALTIME_CONFIG } from '../lib/constants'

export const usePresence = ({ userId, username, displayName }) => {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState(null)
  const subscriptionRef = useRef(null)
  const presenceIntervalRef = useRef(null)
  const cleanupTimeoutRef = useRef(null)

  // Function to update user presence
  const updatePresence = useCallback(async (active = true, cursorData = {}) => {
    if (!userId) return

    try {
      const presenceData = {
        user_id: userId,
        active,
        last_seen: new Date().toISOString(),
        display_name: displayName || username,
        ...cursorData
      }

      const { error } = await supabase
        .from(TABLES.PRESENCE)
        .upsert(presenceData)

      if (error) {
        console.error('Error updating presence:', error)
      } else {
        setIsOnline(active)
        setLastSeen(new Date().toISOString())
      }
    } catch (err) {
      console.error('Error updating presence:', err)
    }
  }, [userId, username, displayName])

  // Function to mark user as online
  const setOnline = useCallback(async (cursorData = {}) => {
    await updatePresence(true, cursorData)
  }, [updatePresence])

  // Function to mark user as offline
  const setOffline = useCallback(async () => {
    await updatePresence(false)
  }, [updatePresence])

  // Function to fetch all online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRESENCE)
        .select('*')
        .eq('active', true)
        .order('last_seen', { ascending: false })

      if (error) {
        console.error('Error fetching online users:', error)
        return []
      }

      const users = data.map(user => ({
        userId: user.user_id,
        username: user.display_name || 'Unknown User',
        displayName: user.display_name,
        isOnline: user.active,
        lastSeen: user.last_seen,
        cursorX: user.cursor_x,
        cursorY: user.cursor_y,
        cursorColor: user.cursor_color
      }))

      setOnlineUsers(users)
      return users
    } catch (err) {
      console.error('Error fetching online users:', err)
      return []
    }
  }, [])

  // Function to get user presence info
  const getUserPresence = useCallback(async (targetUserId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRESENCE)
        .select('*')
        .eq('user_id', targetUserId)
        .single()

      if (error) {
        console.error('Error fetching user presence:', error)
        return null
      }

      return {
        userId: data.user_id,
        username: data.display_name || 'Unknown User',
        displayName: data.display_name,
        isOnline: data.active,
        lastSeen: data.last_seen,
        cursorX: data.cursor_x,
        cursorY: data.cursor_y,
        cursorColor: data.cursor_color
      }
    } catch (err) {
      console.error('Error fetching user presence:', err)
      return null
    }
  }, [])

  // Function to get users who were recently active
  const getRecentlyActiveUsers = useCallback(async (minutesAgo = 5) => {
    try {
      const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from(TABLES.PRESENCE)
        .select('*')
        .gte('last_seen', cutoffTime)
        .order('last_seen', { ascending: false })

      if (error) {
        console.error('Error fetching recently active users:', error)
        return []
      }

      return data.map(user => ({
        userId: user.user_id,
        username: user.display_name || 'Unknown User',
        displayName: user.display_name,
        isOnline: user.active,
        lastSeen: user.last_seen,
        cursorX: user.cursor_x,
        cursorY: user.cursor_y,
        cursorColor: user.cursor_color
      }))
    } catch (err) {
      console.error('Error fetching recently active users:', err)
      return []
    }
  }, [])

  // Set up real-time subscription for presence changes
  useEffect(() => {
    if (!userId) return

    // Set up real-time subscription
    const channel = supabase
      .channel('presence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.PRESENCE,
        },
        (payload) => {
          // Update online users list based on presence changes
          setOnlineUsers(prev => {
            const usersMap = new Map(prev.map(user => [user.userId, user]))
            
            if (payload.eventType === 'DELETE') {
              usersMap.delete(payload.old.user_id)
            } else if (payload.new) {
              const { user_id, active, last_seen, display_name, cursor_x, cursor_y, cursor_color } = payload.new
              
              if (active) {
                usersMap.set(user_id, {
                  userId: user_id,
                  username: display_name || 'Unknown User',
                  displayName: display_name,
                  isOnline: active,
                  lastSeen: last_seen,
                  cursorX: cursor_x,
                  cursorY: cursor_y,
                  cursorColor: cursor_color
                })
              } else {
                usersMap.delete(user_id)
              }
            }
            
            return Array.from(usersMap.values())
          })
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    // Set up periodic presence updates
    presenceIntervalRef.current = setInterval(() => {
      if (isOnline) {
        updatePresence(true)
      }
    }, REALTIME_CONFIG.PRESENCE_UPDATE_INTERVAL)

    // Initial presence setup
    setOnline()

    // Fetch initial online users
    fetchOnlineUsers()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current)
      }
      // Mark as offline on cleanup
      setOffline()
    }
  }, [userId, isOnline, updatePresence, setOnline, setOffline, fetchOnlineUsers])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline()
      } else {
        setOnline()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [setOnline, setOffline])

  // Handle window focus/blur
  useEffect(() => {
    const handleFocus = () => setOnline()
    const handleBlur = () => {
      // Delay offline status to handle quick tab switches
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }
      cleanupTimeoutRef.current = setTimeout(() => {
        setOffline()
      }, 5000) // 5 second delay
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }
    }
  }, [setOnline, setOffline])

  // Handle beforeunload to mark as offline
  useEffect(() => {
    const handleBeforeUnload = () => {
      setOffline()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [setOffline])

  return {
    onlineUsers,
    isOnline,
    lastSeen,
    setOnline,
    setOffline,
    updatePresence,
    fetchOnlineUsers,
    getUserPresence,
    getRecentlyActiveUsers,
  }
}
