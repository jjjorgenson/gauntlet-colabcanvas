import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES, REALTIME_CONFIG } from '../lib/constants'
import { throttle } from '../utils/syncHelpers'

export const usePresence = ({ userId, username }) => {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [idleUsers, setIdleUsers] = useState(new Set())
  const subscriptionRef = useRef(null)
  const presenceIntervalRef = useRef(null)
  const idleCheckIntervalRef = useRef(null)
  const profileExistsCache = useRef(new Set())
  const lastActivityUpdate = useRef(0)

  // Ensure profile exists before upserting presence (with caching)
  const ensureProfileExists = useCallback(async () => {
    if (!userId || !username) return
    if (profileExistsCache.current.has(userId)) return // Skip if already checked

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
        } else {
          profileExistsCache.current.add(userId) // Cache successful creation
        }
      } else if (!checkError) {
        profileExistsCache.current.add(userId) // Cache existing profile
      } else if (checkError) {
        console.error('Error checking profile:', checkError)
      }
    } catch (error) {
      console.error('Error in ensureProfileExists:', error)
    }
  }, [userId, username])

  // Update user activity (called on any user action) - throttled version
  const updateActivityInternal = useCallback(async (cursorX = null, cursorY = null) => {
    if (!userId) return

    try {
      // Ensure profile exists first (cached, so minimal overhead)
      await ensureProfileExists()

      const now = new Date().toISOString()
      const { error } = await supabase
        .from(TABLES.PRESENCE)
        .upsert({
          user_id: userId,
          cursor_x: cursorX,
          cursor_y: cursorY,
          active: true,
          last_seen: now,
          last_activity: now, // Track activity timestamp
          display_name: username
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error updating activity:', error)
      }
    } catch (error) {
      console.error('Error in updateActivity:', error)
    }
  }, [userId, username, ensureProfileExists])

  // Throttled version of updateActivity to prevent excessive DB calls
  const updateActivity = useCallback(
    throttle((cursorX = null, cursorY = null) => {
      const now = Date.now()
      // Only update activity every 200ms (5 updates per second max)
      if (now - lastActivityUpdate.current < 200) {
        return
      }
      lastActivityUpdate.current = now
      updateActivityInternal(cursorX, cursorY)
    }, 200),
    [updateActivityInternal]
  )

  // Upsert user presence (legacy function for compatibility)
  const upsertPresence = useCallback(async () => {
    await updateActivity()
  }, [updateActivity])

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

  // Check for idle users and clean up inactive ones
  const checkIdleUsers = useCallback(async () => {
    try {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

      // console.log('🔍 IDLE CHECK - Current time:', now.toISOString())
      // console.log('🔍 IDLE CHECK - 5 minutes ago:', fiveMinutesAgo.toISOString())
      // console.log('🔍 IDLE CHECK - 10 minutes ago:', tenMinutesAgo.toISOString())

      // Get all active users
      const { data: activeUsers, error: fetchError } = await supabase
        .from(TABLES.PRESENCE)
        .select('user_id, last_activity, active, last_seen')
        .eq('active', true)

      if (fetchError) {
        console.error('❌ Error fetching users for idle check:', fetchError)
        return
      }

      // console.log('🔍 IDLE CHECK - Found active users:', activeUsers?.length || 0)
      // console.log('🔍 IDLE CHECK - Active users data:', activeUsers)

      const newIdleUsers = new Set()
      const usersToDeactivate = []

      activeUsers?.forEach(user => {
        // Check if last_activity column exists and has data
        if (!user.last_activity) {
          console.warn(`⚠️ USER ${user.user_id} has no last_activity - using last_seen instead`)
          user.last_activity = user.last_seen
        }
        
        const lastActivity = new Date(user.last_activity)
        const timeSinceActivity = now.getTime() - lastActivity.getTime()
        const minutesSinceActivity = Math.floor(timeSinceActivity / (1000 * 60))
        
        // console.log(`🔍 USER ${user.user_id}:`, {
        //   lastActivity: lastActivity.toISOString(),
        //   lastSeen: user.last_seen,
        //   minutesSinceActivity,
        //   isIdle: lastActivity < fiveMinutesAgo,
        //   shouldDeactivate: lastActivity < tenMinutesAgo,
        //   hasLastActivity: !!user.last_activity
        // })
        
        if (lastActivity < tenMinutesAgo) {
          // User has been inactive for 10+ minutes - mark as inactive
          console.log(`🚫 DEACTIVATING USER ${user.user_id} - inactive for ${minutesSinceActivity} minutes`)
          usersToDeactivate.push(user.user_id)
        } else if (lastActivity < fiveMinutesAgo) {
          // User has been inactive for 5+ minutes - mark as idle
          console.log(`⏰ MARKING USER ${user.user_id} AS IDLE - inactive for ${minutesSinceActivity} minutes`)
          newIdleUsers.add(user.user_id)
        }
      })

      // Update idle users set
      setIdleUsers(newIdleUsers)
      // console.log('🔍 IDLE CHECK - New idle users:', Array.from(newIdleUsers))
      // console.log('🔍 IDLE CHECK - Users to deactivate:', usersToDeactivate)

      // Deactivate users who have been inactive for 10+ minutes
      if (usersToDeactivate.length > 0) {
        console.log(`🗑️ DEACTIVATING ${usersToDeactivate.length} users...`)
        console.log(`🗑️ USER IDs TO DEACTIVATE:`, usersToDeactivate)
        
        // Use the database function to clean up idle users (bypasses RLS)
        console.log(`🗑️ Calling cleanup_idle_users() function...`)
        
        const { data: cleanupResult, error: deactivateError } = await supabase
          .rpc('cleanup_idle_users')
        
        console.log(`🗑️ Cleanup function result:`, { data: cleanupResult, error: deactivateError })
        
        // Handle integer response from function
        const successCount = cleanupResult || 0
        const updateData = { deactivated_count: successCount, deactivated_users: [] }

        console.log(`🗑️ UPDATE RESULT:`, { data: updateData, error: deactivateError })

        if (deactivateError) {
          console.error('❌ Error deactivating idle users:', deactivateError)
          console.error('❌ Error details:', {
            message: deactivateError.message,
            details: deactivateError.details,
            hint: deactivateError.hint,
            code: deactivateError.code
          })
        } else {
          console.log(`✅ Successfully deactivated ${updateData?.length || 0} idle users`)
          console.log(`✅ Updated records:`, updateData)
          // Force refresh the user list to reflect the changes
          loadOnlineUsers()
        }
      } else {
        // console.log('🔍 IDLE CHECK - No users to deactivate')
      }
    } catch (error) {
      console.error('❌ Error in checkIdleUsers:', error)
    }
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

      // Add colors, idle status, and format the data
      const usersWithColors = (data || []).map(user => {
        const lastActivity = new Date(user.last_activity)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const isIdle = lastActivity < fiveMinutesAgo

        return {
          ...user,
          username: user.profiles?.username || user.profiles?.display_name || user.profiles?.email || 'Anonymous',
          color: getUserColor(user.user_id),
          isIdle: isIdle
        }
      })

      // console.log('👥 LOADED ONLINE USERS:', {
      //   count: usersWithColors.length,
      //   users: usersWithColors.map(u => ({
      //     id: u.user_id,
      //     username: u.username,
      //     active: u.active,
      //     isIdle: u.isIdle,
      //     lastActivity: u.last_activity
      //   }))
      // })

      setOnlineUsers(usersWithColors)
    } catch (error) {
      console.error('Error in loadOnlineUsers:', error)
    }
  }, [getUserColor])

  // Throttled version of loadOnlineUsers to prevent spam
  const throttledLoadOnlineUsers = useCallback(
    throttle(() => {
      loadOnlineUsers()
    }, 2000), // Throttle to 2 seconds max (was 1 second)
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
          // console.log('🔄 PRESENCE CHANGE DETECTED:', {
          //   event: payload.eventType,
          //   table: payload.table,
          //   new: payload.new,
          //   old: payload.old
          // })
          
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

    // Check for idle users every minute
    idleCheckIntervalRef.current = setInterval(() => {
      checkIdleUsers()
    }, 60000) // Check every minute

    // Also run an immediate check for testing
    checkIdleUsers()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current)
      }
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current)
      }
    }
  }, [userId, upsertPresence, loadOnlineUsers, checkIdleUsers])

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
    idleUsers,
    updateActivity,
    checkIdleUsers
  }
}
