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
              // console.log('⌨️ Ctrl+K pressed, opening AI Command Bar')
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
    
          // console.log('🚀 Submitting command:', originalCommand)
          if (resolvedCommand !== originalCommand) {
            // console.log('🔄 Resolved command:', resolvedCommand)
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
            // console.log('✅ AI Command Result:', result)
            
            // DEBUG: Log each action with dimensions
            if (result.actions && result.actions.length > 0) {
              // console.log('🔍 API ACTIONS WITH DIMENSIONS:')
              result.actions.forEach((action, index) => {
                // console.log(`Action ${index + 1}:`, {
                //   type: action.type,
                //   x: action.x,
                //   y: action.y,
                //   width: action.width,
                //   height: action.height,
                //   color: action.color,
                //   content: action.content,
                //   text_content: action.text_content,
                //   font_size: action.font_size
                // })
              })
            }
      
      // Execute the actions on the canvas
      if (result.actions && result.actions.length > 0) {
        // console.log('⚡ Executing actions:', result.actions)
        onCommandResult?.(result, originalCommand)
      } else {
        // console.log('❌ No actions to execute')
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
        background: 'rgba(0, 0, 0, 0.3)', 
        backdropFilter: 'blur(2px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '120px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="ai-command-bar" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '24px',
          borderRadius: '12px',
          width: '500px',
          maxWidth: '90vw',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <h3 style={{ color: '#1f2937', margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '600' }}>AI Command Bar</h3>
        
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
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.boxShadow = 'none'
              }}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!command.trim() || isLoading}
              style={{
                padding: '12px 24px',
                background: isLoading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background-color 0.2s, transform 0.1s',
                boxShadow: isLoading ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && command.trim()) {
                  e.target.style.background = '#2563eb'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && command.trim()) {
                  e.target.style.background = '#3b82f6'
                }
              }}
              onMouseDown={(e) => {
                if (!isLoading && command.trim()) {
                  e.target.style.transform = 'translateY(1px)'
                }
              }}
              onMouseUp={(e) => {
                if (!isLoading && command.trim()) {
                  e.target.style.transform = 'translateY(0)'
                }
              }}
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </button>
          </div>
          
          {error && (
            <div style={{ 
              color: '#dc2626', 
              marginBottom: '12px',
              padding: '8px 12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              Error: {error}
            </div>
          )}
          
          <div style={{ 
            color: '#6b7280', 
            fontSize: '13px',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Press <kbd style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontSize: '12px',
              border: '1px solid #d1d5db'
            }}>Ctrl+K</kbd> to open • <kbd style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontSize: '12px',
              border: '1px solid #d1d5db'
            }}>Esc</kbd> to close
          </div>
        </form>
      </div>
    </div>
  )
}