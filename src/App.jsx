import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './components/Auth/AuthProvider'
import { LoginForm } from './components/Auth/LoginForm'
import { Canvas } from './components/Canvas/Canvas'
import { Toolbar } from './components/Toolbar/Toolbar'
import { UsersList } from './components/Presence/UsersList'
import './App.css'

const AppContent = () => {
  const { user, loading, logout, username } = useAuth()

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
        <Toolbar 
          onAddRectangle={() => {}} // Will be handled by Canvas
          selectedColor="#3B82F6"
          onColorChange={() => {}}
          onLogout={logout}
          username={username}
        />
      </div>
      
      <div className="app-main">
        <div className="canvas-wrapper">
          <Canvas user={user} />
        </div>
        
        <div className="sidebar">
          <UsersList 
            onlineUsers={[]}
            currentUser={user}
          />
        </div>
      </div>
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
