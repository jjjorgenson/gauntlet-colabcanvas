import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES, REALTIME_CONFIG } from '../lib/constants'

export const usePresence = ({ userId, username }) => {
  const [onlineUsers, setOnlineUsers] = useState([])
  const subscriptionRef = useRef(null)
  const presenceIntervalRef = useRef(null)

  useEffect(() => {
    // TODO: Enable when database tables are created
    // For now, just simulate online users
    setOnlineUsers([{
      user_id: userId,
      username: username,
      is_online: true,
      last_seen: new Date().toISOString()
    }])

    return () => {
      // Cleanup
    }
  }, [userId, username])

  // Mark user as offline on unmount
  useEffect(() => {
    return () => {
      // TODO: Enable when database tables are created
      console.log('User would be marked as offline')
    }
  }, [userId])

  return {
    onlineUsers,
  }
}
