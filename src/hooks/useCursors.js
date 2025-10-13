import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES, REALTIME_CONFIG } from '../lib/constants'
import { throttle } from '../utils/syncHelpers'

export const useCursors = ({ userId, username }) => {
  const [otherCursors, setOtherCursors] = useState([])
  const [myCursor, setMyCursor] = useState({ x: 0, y: 0 })
  const subscriptionRef = useRef(null)
  const lastUpdateRef = useRef(0)

  // Throttled function to update cursor position
  const updateCursorPosition = throttle((x, y) => {
    const now = Date.now()
    if (now - lastUpdateRef.current < REALTIME_CONFIG.CURSOR_UPDATE_INTERVAL) {
      return
    }
    
    lastUpdateRef.current = now
    setMyCursor({ x, y })

    // TODO: Enable when database tables are created
    // Only log occasionally to reduce spam
    if (Math.random() < 0.01) { // Log 1% of the time
      console.log('Cursor position would be updated:', { x, y })
    }
  }, REALTIME_CONFIG.CURSOR_UPDATE_INTERVAL)

  useEffect(() => {
    // TODO: Enable when database tables are created
    // For now, just simulate empty cursors
    setOtherCursors([])

    return () => {
      // Cleanup
    }
  }, [userId, username])

  return {
    otherCursors,
    myCursor,
    updateCursorPosition,
  }
}
