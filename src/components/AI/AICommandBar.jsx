import { useState, useEffect, useRef } from 'react'
import './AICommandBar.css'

export const AICommandBar = ({ onCommandResult, canvasContext, resolveReferences }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [command, setCommand] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  // Component renders (logging removed as requested)

  // Handle Ctrl+K shortcut (Windows)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        e.stopPropagation()
        console.log('⌨️ Ctrl+K pressed, opening AI Command Bar')
        setIsVisible(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setIsVisible(false)
        setCommand('')
        setError(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  // Focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!command.trim() || isLoading) return

    const originalCommand = command.trim()
    const resolvedCommand = resolveReferences ? resolveReferences(originalCommand) : originalCommand
    
    console.log('🚀 Submitting command:', originalCommand)
    if (resolvedCommand !== originalCommand) {
      console.log('🔄 Resolved command:', resolvedCommand)
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('https://gauntlet-colabcanvas.vercel.app/api/ai-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          command: resolvedCommand,
          canvasContext: canvasContext || null
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ AI Command Result:', result)
      
      // Execute the actions on the canvas
      if (result.actions && result.actions.length > 0) {
        console.log('⚡ Executing actions:', result.actions)
        onCommandResult?.(result, originalCommand)
      } else {
        console.log('❌ No actions to execute')
      }
      
      setCommand('')
      setIsVisible(false)

    } catch (error) {
      console.error('AI Command Error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setCommand(e.target.value)
    setError(null)
  }

  if (!isVisible) return null

  return (
    <div 
      className="ai-command-overlay" 
      onClick={() => setIsVisible(false)}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0, 0, 0, 0.5)', 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '100px'
      }}
    >
      <div 
        className="ai-command-bar" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'red',
          padding: '20px',
          borderRadius: '8px',
          width: '500px',
          maxWidth: '90vw'
        }}
      >
        <h3 style={{ color: 'white', margin: '0 0 15px 0' }}>AI Command Bar</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={handleInputChange}
              placeholder="Enter command (e.g., 'create red circle')"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!command.trim() || isLoading}
              style={{
                padding: '10px 20px',
                background: isLoading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
          </div>
          
          {error && (
            <div style={{ color: 'yellow', marginBottom: '10px' }}>
              Error: {error}
            </div>
          )}
          
          <div style={{ color: 'white', fontSize: '12px' }}>
            Press Ctrl+K to open • Esc to close
          </div>
        </form>
      </div>
    </div>
  )
}