import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './components/Auth/AuthProvider'
import { LoginForm } from './components/Auth/LoginForm'
import { Canvas } from './components/Canvas/Canvas'
import { UsersList } from './components/Presence/UsersList'
import { AICommandBar } from './components/AI/AICommandBar'
import { usePresence } from './hooks/usePresence'
import { supabase } from './lib/supabase'
import { TABLES } from './lib/constants'
import './App.css'

const AppContent = () => {
  const { user, loading, logout, username } = useAuth()
  
  const { onlineUsers } = usePresence({ 
    userId: user?.id, 
    username: user?.user_metadata?.username || 'Anonymous' 
  })

  // Function to insert shape into Supabase database
  const insertShapeIntoDatabase = useCallback(async (shapeData) => {
    try {
      console.log('💾 About to create shape in Supabase:', shapeData)
      
      const { data, error } = await supabase
        .from(TABLES.SHAPES)
        .insert(shapeData)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ Shape created in Supabase, ID:', data.id)
      return data
    } catch (error) {
      console.error('💥 Failed to create shape in database:', error)
      throw error
    }
  }, [])

  // Handle AI command results
  const handleAICommandResult = useCallback(async (result) => {
    console.log('🎯 AI Command executed:', result)
    
    if (result.actions && result.actions.length > 0) {
      console.log('🔧 Processing actions:', result.actions)
      
      // Process actions sequentially to avoid race conditions
      for (let index = 0; index < result.actions.length; index++) {
        const action = result.actions[index]
        console.log(`Action ${index + 1}:`, action)
        
        // Create shape data with BRIGHT colors and LARGE size for debugging
        const shapeData = {
          id: `ai-${Date.now()}-${index}`, // Temporary ID
          type: action.shape || action.type,
          x: action.x || 0, // Use 0,0 for visibility
          y: action.y || 0,
          width: 300, // LARGE size for debugging
          height: 300,
          color: action.color || '#ff0000', // BRIGHT RED for debugging
          rotation: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id,
          text_content: action.text_content || null,
          font_size: 16
        }
        
        console.log('🎨 Created shape data:', shapeData)
        
        // ACTUALLY INSERT INTO SUPABASE DATABASE
        try {
          await insertShapeIntoDatabase(shapeData)
        } catch (error) {
          console.error(`💥 Failed to create shape ${index + 1}:`, error)
        }
      }
    }
  }, [user?.id, insertShapeIntoDatabase])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  // Show login form if no user or if there's an error
  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-content">
          <h3>CollabCanvas</h3>
          <span className="username">Welcome, {username}</span>
          <button 
            onClick={() => {
              // Test button to open AI Command Bar
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                ctrlKey: true,
                bubbles: true
              })
              document.dispatchEvent(event)
            }}
            className="ai-test-button"
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            🤖 AI (Ctrl+K)
          </button>
          <button 
            onClick={logout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="app-main">
        <div className="canvas-wrapper">
          <Canvas user={user} onlineUsers={onlineUsers} />
        </div>
        
        <div className="sidebar">
          <UsersList 
            onlineUsers={onlineUsers}
            currentUser={user}
          />
        </div>
      </div>

      {/* AI Command Bar */}
      <AICommandBar onCommandResult={handleAICommandResult} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
