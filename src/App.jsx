import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './components/Auth/AuthProvider'
import { LoginForm } from './components/Auth/LoginForm'
import { Canvas } from './components/Canvas/Canvas'
import { UsersList } from './components/Presence/UsersList'
import { AICommandBar } from './components/AI/AICommandBar'
import { SettingsDropdown } from './components/Settings/SettingsDropdown'
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

  // Command history and context tracking
  const [commandHistory, setCommandHistory] = useState([])
  const [lastCreatedShapeId, setLastCreatedShapeId] = useState(null)

  // Function to insert shape into Supabase database
  const insertShapeIntoDatabase = useCallback(async (shapeData) => {
    try {
      // console.log('💾 SUPABASE INSERT - Input shapeData:', {
      //   id: shapeData.id,
      //   type: shapeData.type,
      //   x: shapeData.x,
      //   y: shapeData.y,
      //   width: shapeData.width,
      //   height: shapeData.height,
      //   color: shapeData.color,
      //   text_content: shapeData.text_content,
      //   font_size: shapeData.font_size
      // })
      
      const { data, error } = await supabase
        .from(TABLES.SHAPES)
        .insert(shapeData)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      // console.log('✅ SUPABASE INSERT - Returned data:', {
      //   id: data.id,
      //   type: data.type,
      //   x: data.x,
      //   y: data.y,
      //   width: data.width,
      //   height: data.height,
      //   color: data.color,
      //   text_content: data.text_content,
      //   font_size: data.font_size
      // })
      
      // Add the shape to ObjectStore so it appears on canvas immediately
      // console.log('🎨 Adding shape to ObjectStore for immediate display')
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
      // console.log('💾 Moving shape in Supabase:', { shapeId, x, y })
      
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

      // console.log('✅ Shape moved in Supabase:', data.id)
      
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
      // console.log('💾 Resizing shape in Supabase:', { shapeId, width, height })
      
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

      // console.log('✅ Shape resized in Supabase:', data.id)
      
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
      // console.log('💾 Arranging shapes in Supabase:', { shapeIds, pattern, spacing })
      
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

      // console.log('✅ Shapes arranged in Supabase')
      
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

  // Resolve references in commands (it, that, the one I just made, etc.)
  const resolveCommandReferences = useCallback((command) => {
    let resolvedCommand = command
    
    // Replace common references
    if (lastCreatedShapeId) {
      const lastShape = objectStore.get(lastCreatedShapeId)
      if (lastShape) {
        const shapeDescription = `${lastShape.color} ${lastShape.type}`
        
        // Replace references with specific descriptions
        resolvedCommand = resolvedCommand
          .replace(/\bit\b/g, `the ${shapeDescription}`)
          .replace(/\bthat\b/g, `the ${shapeDescription}`)
          .replace(/\bthe one I just made\b/g, `the ${shapeDescription}`)
          .replace(/\bthe last one\b/g, `the ${shapeDescription}`)
      }
    }
    
    // console.log('🔄 Command reference resolution:', { original: command, resolved: resolvedCommand })
    return resolvedCommand
  }, [lastCreatedShapeId])

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
      canvasHeight: 5000,
      commandHistory: commandHistory.slice(-3), // Last 3 commands for context
      lastCreatedShapeId
    }
  }, [commandHistory, lastCreatedShapeId])

  // Handle AI command results
  const handleAICommandResult = useCallback(async (result, originalCommand) => {
    // console.log('🎯 AI Command executed:', result)
    
    // Add command to history
    setCommandHistory(prev => [...prev.slice(-4), {
      command: originalCommand,
      timestamp: new Date().toISOString(),
      actions: result.actions?.length || 0
    }])
    
    if (result.actions && result.actions.length > 0) {
      // console.log('🔧 Processing actions:', result.actions)
      
      // Process actions sequentially to avoid race conditions
      for (let index = 0; index < result.actions.length; index++) {
        const action = result.actions[index]
        // console.log(`Action ${index + 1}:`, action)
        
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
          // console.log('🔄 Moving shape:', action.shapeId, 'to', action.x, action.y)
          await moveShapeInDatabase(action.shapeId, action.x, action.y)
          return
        }

        if (action.type === 'resize_shape') {
          // console.log('📏 Resizing shape:', action.shapeId, 'to', action.width, 'x', action.height)
          await resizeShapeInDatabase(action.shapeId, action.width, action.height)
          return
        }

        if (action.type === 'arrange_shapes') {
          // console.log('📐 Arranging shapes:', action.shapeIds, 'in pattern:', action.pattern)
          await arrangeShapesInDatabase(action.shapeIds, action.pattern, action.spacing)
          return
        }

        // DEBUG: Log the raw action from API
        // console.log('🔍 RAW ACTION FROM API:', {
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

        // Create shape data using API values (not hardcoded defaults)
        const shapeData = {
          id: generateId(), // Generate proper UUID
          type: mapActionTypeToDbType(action.type), // Map to correct database type
          x: action.x || 0, // Use API x value
          y: action.y || 0, // Use API y value
          width: action.width || 300, // Use API width value (fallback to 300)
          height: action.height || 300, // Use API height value (fallback to 300)
          color: action.color || '#ff0000', // Use API color value
          rotation: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user?.id,
          text_content: action.content || action.text_content || null, // Handle both content and text_content
          font_size: action.font_size || 16 // Use API font_size value
        }
        
        // console.log('🎨 SHAPE DATA TO INSERT:', {
        //   id: shapeData.id,
        //   type: shapeData.type,
        //   x: shapeData.x,
        //   y: shapeData.y,
        //   width: shapeData.width,
        //   height: shapeData.height,
        //   color: shapeData.color,
        //   text_content: shapeData.text_content,
        //   font_size: shapeData.font_size
        // })
        
        // ACTUALLY INSERT INTO SUPABASE DATABASE
        try {
          const createdShape = await insertShapeIntoDatabase(shapeData)
          
          // Track the last created shape for reference resolution
          if (action.type === 'create_shape' || action.type === 'create_text') {
            setLastCreatedShapeId(createdShape.id)
            // console.log('📌 Last created shape ID set:', createdShape.id)
          }
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
          <SettingsDropdown 
            user={user}
            username={username}
            email={user?.email}
            onClose={() => {}} // Don't auto-logout when closing settings
          />
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
        resolveReferences={resolveCommandReferences}
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
