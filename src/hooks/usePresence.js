import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES, REALTIME_CONFIG } from '../lib/constants'
import { throttle } from '../utils/syncHelpers'

export const usePresence = ({ userId, username }) => {
  const [onlineUsers, setOnlineUsers] = useState([])
  const subscriptionRef = useRef(null)
  const presenceIntervalRef = useRef(null)

  // Ensure profile exists before upserting presence
  const ensureProfileExists = useCallback(async () => {
    if (!userId || !username) return

    try {
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from(TABLES.PROFILES)
        .select('id')
        .eq('id', userId)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from(TABLES.PROFILES)
          .insert({
            id: userId,
            email: username, // username is actually the email from auth
            username: username,
            display_name: username
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
        }
      } else if (checkError) {
        console.error('Error checking profile:', checkError)
      }
    } catch (error) {
      console.error('Error in ensureProfileExists:', error)
    }
  }, [userId, username])

  // Upsert user presence
  const upsertPresence = useCallback(async () => {
    if (!userId) return

    try {
      // Ensure profile exists first
      await ensureProfileExists()

      const { error } = await supabase
        .from(TABLES.PRESENCE)
        .upsert({
          user_id: userId,
          active: true,
          last_seen: new Date().toISOString(),
          display_name: username
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error upserting presence:', error)
      }
    } catch (error) {
      console.error('Error in upsertPresence:', error)
    }
  }, [userId, ensureProfileExists])

  // Generate a consistent color for a user ID
  const getUserColor = useCallback((userId) => {
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
  }, [])

  // Load all online users with profile information
  const loadOnlineUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRESENCE)
        .select(`
          *,
          profiles:user_id (
            email,
            username,
            display_name
          )
        `)
        .eq('active', true)
        .order('last_seen', { ascending: false })

      if (error) {
        console.error('Error loading online users:', error)
        return
      }

      // Add colors and format the data
      const usersWithColors = (data || []).map(user => ({
        ...user,
        username: user.profiles?.username || user.profiles?.display_name || user.profiles?.email || 'Anonymous',
        color: getUserColor(user.user_id)
      }))

      setOnlineUsers(usersWithColors)
    } catch (error) {
      console.error('Error in loadOnlineUsers:', error)
    }
  }, [getUserColor])

  // Throttled version of loadOnlineUsers to prevent spam
  const throttledLoadOnlineUsers = useCallback(
    throttle(() => {
      loadOnlineUsers()
    }, 1000), // Throttle to 1 second max
    [loadOnlineUsers]
  )

  // Mark user as offline
  const markOffline = useCallback(async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from(TABLES.PRESENCE)
        .update({
          active: false,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error marking user offline:', error)
      }
    } catch (error) {
      console.error('Error in markOffline:', error)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    // Initial setup
    upsertPresence()
    loadOnlineUsers()

    // Subscribe to presence changes
    const subscription = supabase
      .channel('presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.PRESENCE,
        },
        (payload) => {
          // console.log('Presence change:', payload)
          
          // Reload online users when presence changes (throttled to prevent spam)
          throttledLoadOnlineUsers()
        }
      )
      .subscribe()

    subscriptionRef.current = subscription

    // Update last_seen periodically
    presenceIntervalRef.current = setInterval(() => {
      upsertPresence()
    }, REALTIME_CONFIG.PRESENCE_UPDATE_INTERVAL)

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current)
      }
    }
  }, [userId, upsertPresence, loadOnlineUsers])

  // Mark user as offline on unmount
  useEffect(() => {
    return () => {
      markOffline()
    }
  }, [markOffline])

  // Clean up stale users periodically
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        const staleTime = new Date(Date.now() - REALTIME_CONFIG.PRESENCE_TIMEOUT)
        
        const { error } = await supabase
          .from(TABLES.PRESENCE)
          .update({ active: false })
          .lt('last_seen', staleTime.toISOString())
          .eq('active', true)

        if (error) {
          console.error('Error cleaning up stale users:', error)
        } else {
          // Reload users after cleanup (throttled)
          throttledLoadOnlineUsers()
        }
      } catch (error) {
        console.error('Error in cleanup interval:', error)
      }
    }, 30000) // Run every 30 seconds

    return () => clearInterval(cleanupInterval)
  }, [throttledLoadOnlineUsers])

  return {
    onlineUsers,
  }
}
