import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './components/Auth/AuthProvider'
import { LoginForm } from './components/Auth/LoginForm'
import { Canvas } from './components/Canvas/Canvas'
import { UsersList } from './components/Presence/UsersList'
import { AICommandBar } from './components/AI/AICommandBar'
import { usePresence } from './hooks/usePresence'
import { supabase } from './lib/supabase'
import { TABLES } from './lib/constants'
import { generateId } from './utils/canvasHelpers'
import objectStore from './lib/ObjectStore'
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
      
      // Add the shape to ObjectStore so it appears on canvas immediately
      console.log('🎨 Adding shape to ObjectStore for immediate display')
      objectStore.add(data)
      
      return data
    } catch (error) {
      console.error('💥 Failed to create shape in database:', error)
      throw error
    }
  }, [])

  // Function to move shape in database
  const moveShapeInDatabase = useCallback(async (shapeId, x, y) => {
    try {
      console.log('💾 Moving shape in Supabase:', { shapeId, x, y })
      
      const { data, error } = await supabase
        .from(TABLES.SHAPES)
        .update({ x, y, updated_at: new Date().toISOString() })
        .eq('id', shapeId)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase move error:', error)
        throw error
      }

      console.log('✅ Shape moved in Supabase:', data.id)
      
      // Update ObjectStore
      objectStore.update(shapeId, { x, y })
      
      return data
    } catch (error) {
      console.error('💥 Failed to move shape in database:', error)
      throw error
    }
  }, [])

  // Function to resize shape in database
  const resizeShapeInDatabase = useCallback(async (shapeId, width, height) => {
    try {
      console.log('💾 Resizing shape in Supabase:', { shapeId, width, height })
      
      const { data, error } = await supabase
        .from(TABLES.SHAPES)
        .update({ width, height, updated_at: new Date().toISOString() })
        .eq('id', shapeId)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase resize error:', error)
        throw error
      }

      console.log('✅ Shape resized in Supabase:', data.id)
      
      // Update ObjectStore
      objectStore.update(shapeId, { width, height })
      
      return data
    } catch (error) {
      console.error('💥 Failed to resize shape in database:', error)
      throw error
    }
  }, [])

  // Function to arrange shapes in database
  const arrangeShapesInDatabase = useCallback(async (shapeIds, pattern, spacing = 50) => {
    try {
      console.log('💾 Arranging shapes in Supabase:', { shapeIds, pattern, spacing })
      
      const shapes = objectStore.getAll().filter(shape => shapeIds.includes(shape.id))
      const positions = calculateArrangementPositions(shapes, pattern, spacing)
      
      for (let i = 0; i < shapeIds.length; i++) {
        const shapeId = shapeIds[i]
        const position = positions[i]
        
        if (position) {
          const { error } = await supabase
            .from(TABLES.SHAPES)
            .update({ 
              x: position.x, 
              y: position.y, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', shapeId)
          
          if (error) {
            console.error('❌ Supabase arrange error for shape:', shapeId, error)
            continue
          }
          
          // Update ObjectStore
          objectStore.update(shapeId, { x: position.x, y: position.y })
        }
      }

      console.log('✅ Shapes arranged in Supabase')
      
    } catch (error) {
      console.error('💥 Failed to arrange shapes in database:', error)
      throw error
    }
  }, [])

  // Helper function to calculate arrangement positions
  const calculateArrangementPositions = useCallback((shapes, pattern, spacing) => {
    const positions = []
    let currentX = 0
    let currentY = 0
    
    switch (pattern) {
      case 'horizontal_row':
        shapes.forEach((shape, index) => {
          positions.push({
            x: currentX,
            y: currentY
          })
          currentX += shape.width + spacing
        })
        break
        
      case 'vertical_column':
        shapes.forEach((shape, index) => {
          positions.push({
            x: currentX,
            y: currentY
          })
          currentY += shape.height + spacing
        })
        break
        
      case 'grid':
        const cols = Math.ceil(Math.sqrt(shapes.length))
        shapes.forEach((shape, index) => {
          const col = index % cols
          const row = Math.floor(index / cols)
          positions.push({
            x: col * (shape.width + spacing),
            y: row * (shape.height + spacing)
          })
        })
        break
        
      default:
        // Default to horizontal row
        shapes.forEach((shape, index) => {
          positions.push({
            x: index * (shape.width + spacing),
            y: 0
          })
        })
    }
    
    return positions
  }, [])

  // Get current shapes for canvas context
  const getCanvasContext = useCallback(() => {
    const currentShapes = objectStore.getAll()
    return {
      shapes: currentShapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        color: shape.color,
        text_content: shape.text_content
      })),
      canvasWidth: 5000,
      canvasHeight: 5000
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
        
        // Map AI action types to database types
        const mapActionTypeToDbType = (actionType) => {
          switch (actionType) {
            case 'create_shape':
              return action.shape || 'rectangle' // Use the shape field (circle, rectangle, text)
            case 'create_text':
              return 'text'
            default:
              return actionType
          }
        }

        // Handle different action types
        if (action.type === 'move_shape') {
          console.log('🔄 Moving shape:', action.shapeId, 'to', action.x, action.y)
          await moveShapeInDatabase(action.shapeId, action.x, action.y)
          return
        }

        if (action.type === 'resize_shape') {
          console.log('📏 Resizing shape:', action.shapeId, 'to', action.width, 'x', action.height)
          await resizeShapeInDatabase(action.shapeId, action.width, action.height)
          return
        }

        if (action.type === 'arrange_shapes') {
          console.log('📐 Arranging shapes:', action.shapeIds, 'in pattern:', action.pattern)
          await arrangeShapesInDatabase(action.shapeIds, action.pattern, action.spacing)
          return
        }

        // Create shape data with BRIGHT colors and LARGE size for debugging
        const shapeData = {
          id: generateId(), // Generate proper UUID
          type: mapActionTypeToDbType(action.type), // Map to correct database type
          x: action.x || 0, // Use 0,0 for visibility
          y: action.y || 0,
          width: 300, // LARGE size for debugging
          height: 300,
          color: action.color || '#ff0000', // BRIGHT RED for debugging
          rotation: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id,
          text_content: action.content || action.text_content || null, // Handle both content and text_content
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
      <AICommandBar 
        onCommandResult={handleAICommandResult}
        canvasContext={getCanvasContext()}
      />
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
