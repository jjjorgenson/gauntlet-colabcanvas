import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './components/Auth/AuthProvider'
import { LoginForm } from './components/Auth/LoginForm'
import { Canvas } from './components/Canvas/Canvas'
import { UsersList } from './components/Presence/UsersList'
import { AICommandBar } from './components/AI/AICommandBar'
import { usePresence } from './hooks/usePresence'
import './App.css'

const AppContent = () => {
  const { user, loading, logout, username } = useAuth()
  
  const { onlineUsers } = usePresence({ 
    userId: user?.id, 
    username: user?.user_metadata?.username || 'Anonymous' 
  })

  // Handle AI command results
  const handleAICommandResult = useCallback((result) => {
    console.log('AI Command executed:', result)
    // TODO: Execute actions on canvas
  }, [])

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
