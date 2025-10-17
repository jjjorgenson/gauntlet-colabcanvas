import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/constants'
import { mergeRemoteChanges } from '../utils/syncHelpers'

export const useRealtimeSync = ({ shapes, setShapesFromRemote, userId }) => {
  const subscriptionRef = useRef(null)

  useEffect(() => {
    // Subscribe to shapes changes
    const subscription = supabase
      .channel('shapes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.SHAPES,
        },
        (payload) => {
          console.log('Shape change:', payload)
          // For now, just log the changes
          // TODO: Implement proper sync logic
        }
      )
      .subscribe()

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [shapes, setShapesFromRemote, userId])

  const broadcastShapeChange = async (shape, operation) => {
    // TODO: Enable when database tables are created
    console.log('Shape change would be broadcast:', { shape, operation })
  }

  return {
    broadcastShapeChange,
  }
}
