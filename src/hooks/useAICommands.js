import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/constants'

export const useAICommands = ({ userId, onShapesCreated }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastError, setLastError] = useState(null)
  const [commandHistory, setCommandHistory] = useState([])

  const executeCommand = useCallback(async (command, canvasContext = {}) => {
    if (!command.trim()) return

    setIsProcessing(true)
    setLastError(null)

    try {
      // Call the Vercel API function
      const response = await fetch('/api/ai-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command.trim(),
          canvasContext: {
            width: canvasContext.width || 5000,
            height: canvasContext.height || 5000,
            centerX: canvasContext.centerX || 2500,
            centerY: canvasContext.centerY || 2500,
            shapeCount: canvasContext.shapeCount || 0,
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process command')
      }

      const result = await response.json()

      if (result.action === 'error') {
        throw new Error(result.message || 'Command not understood')
      }

      // Add to command history
      setCommandHistory(prev => [
        { command, result, timestamp: Date.now() },
        ...prev.slice(0, 9) // Keep last 10 commands
      ])

      // If shapes were created, broadcast them to Supabase
      if (result.shapes && result.shapes.length > 0) {
        for (const shape of result.shapes) {
          // Add created_by field
          const shapeData = {
            ...shape,
            created_by: userId
          }

          // Insert to database
          const { error } = await supabase
            .from(TABLES.SHAPES)
            .insert(shapeData)

          if (error) {
            console.error('Error inserting AI-created shape:', error)
            throw new Error('Failed to create shape in database')
          }

          // Notify parent component
          onShapesCreated?.(shapeData)
        }
      }

      return result

    } catch (error) {
      console.error('AI command execution error:', error)
      setLastError(error.message)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [userId, onShapesCreated])

  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  const clearHistory = useCallback(() => {
    setCommandHistory([])
  }, [])

  return {
    executeCommand,
    isProcessing,
    lastError,
    commandHistory,
    clearError,
    clearHistory
  }
}
