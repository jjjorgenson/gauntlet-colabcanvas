import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Canvas } from '../../../src/components/Canvas/Canvas'

// Mock all the hooks
vi.mock('../../../src/hooks/useShapes', () => ({
  useShapes: vi.fn(() => ({
    shapes: [
      {
        id: 'shape-1',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        rotation: 0,
        color: '#3B82F6',
        zIndex: 0,
        ownerId: 'user123',
        createdBy: 'user123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    ],
    loading: false,
    error: null,
    createShape: vi.fn(),
    updateShape: vi.fn(),
    deleteShape: vi.fn(),
    getOwnedShapes: vi.fn(() => ['shape-1'])
  }))
}))

vi.mock('../../../src/hooks/useCanvas', () => ({
  useCanvas: vi.fn(() => ({
    selectedShapeId: null,
    selectedColor: '#3B82F6',
    updateShapePosition: vi.fn(),
    updateShapeRotation: vi.fn(),
    updateShapeZIndex: vi.fn(),
    updateShapeColor: vi.fn(),
    updateShapeOwnership: vi.fn(),
    selectShape: vi.fn(),
    deselectAll: vi.fn(),
    setSelectedColor: vi.fn()
  }))
}))

vi.mock('../../../src/hooks/useCursors', () => ({
  useCursors: vi.fn(() => ({
    otherCursors: [
      {
        userId: 'user456',
        cursorX: 300,
        cursorY: 400,
        username: 'Jane Doe',
        cursorColor: '#EF4444'
      }
    ],
    isActive: true,
    updateCursorPosition: vi.fn(),
    setUserActive: vi.fn(),
    setUserInactive: vi.fn()
  }))
}))

vi.mock('../../../src/hooks/usePresence', () => ({
  usePresence: vi.fn(() => ({
    onlineUsers: [
      { userId: 'user123', username: 'John Doe', isOnline: true },
      { userId: 'user456', username: 'Jane Doe', isOnline: true }
    ],
    isOnline: true,
    setOnline: vi.fn(),
    setOffline: vi.fn()
  }))
}))

vi.mock('../../../src/hooks/useRealtimeSync', () => ({
  useRealtimeSync: vi.fn(() => ({
    broadcastShapeChange: vi.fn()
  }))
}))

vi.mock('../../../src/utils/OwnershipManager', () => ({
  ownershipManager: {
    start: vi.fn(),
    stop: vi.fn(),
    acquireOwnership: vi.fn(() => true),
    isOwner: vi.fn(() => true)
  }
}))

// Mock react-konva components
vi.mock('../../../src/components/Canvas/CanvasStage', () => ({
  CanvasStage: ({ children, ...props }) => (
    <div data-testid="canvas-stage" {...props}>
      {children}
    </div>
  )
}))

vi.mock('../../../src/components/Canvas/Rectangle', () => ({
  Rectangle: ({ rectangle, ...props }) => (
    <div data-testid={`rectangle-${rectangle.id}`} {...props}>
      Rectangle {rectangle.id}
    </div>
  )
}))

vi.mock('../../../src/components/Canvas/Cursor', () => ({
  Cursor: ({ x, y, username, color }) => (
    <div data-testid={`cursor-${username}`} style={{ left: x, top: y, color }}>
      {username}'s cursor
    </div>
  )
}))

// Mock constants
vi.mock('../../../src/lib/constants', () => ({
  CANVAS_CONFIG: {
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 3,
    ZOOM_STEP: 0.1,
    DEFAULT_ZOOM: 1
  }
}))

describe('Canvas Component', () => {
  const mockUser = {
    id: 'user123',
    user_metadata: {
      username: 'John Doe',
      display_name: 'John Doe'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render canvas with toolbar and stage', () => {
    render(<Canvas user={mockUser} />)
    
    expect(screen.getByText('Shapes')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('Colors')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-stage')).toBeInTheDocument()
  })

  it('should render shape creation buttons', () => {
    render(<Canvas user={mockUser} />)
    
    expect(screen.getByText('+ Rectangle')).toBeInTheDocument()
    expect(screen.getByText('+ Circle')).toBeInTheDocument()
    expect(screen.getByText('+ Text')).toBeInTheDocument()
  })

  it('should render color palette', () => {
    render(<Canvas user={mockUser} />)
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#000000', '#FFFFFF']
    colors.forEach(color => {
      const colorButton = screen.getByTitle(color)
      expect(colorButton).toBeInTheDocument()
      expect(colorButton).toHaveStyle({ backgroundColor: color })
    })
  })

  it('should render status indicators', () => {
    render(<Canvas user={mockUser} />)
    
    expect(screen.getByText('🟢 Online')).toBeInTheDocument()
    expect(screen.getByText('👥 2 users')).toBeInTheDocument()
  })

  it('should render shapes from useShapes hook', () => {
    render(<Canvas user={mockUser} />)
    
    expect(screen.getByTestId('rectangle-shape-1')).toBeInTheDocument()
    expect(screen.getByText('Rectangle shape-1')).toBeInTheDocument()
  })

  it('should render other users cursors', () => {
    render(<Canvas user={mockUser} />)
    
    expect(screen.getByTestId('cursor-Jane Doe')).toBeInTheDocument()
    expect(screen.getByText("Jane Doe's cursor")).toBeInTheDocument()
  })

  it('should handle shape creation', async () => {
    const mockCreateShape = vi.fn(() => Promise.resolve({ id: 'new-shape' }))
    const { useShapes } = await import('../../../src/hooks/useShapes')
    useShapes.mockReturnValue({
      shapes: [],
      loading: false,
      error: null,
      createShape: mockCreateShape,
      updateShape: vi.fn(),
      deleteShape: vi.fn(),
      getOwnedShapes: vi.fn(() => [])
    })

    render(<Canvas user={mockUser} />)
    
    const addRectangleButton = screen.getByText('+ Rectangle')
    fireEvent.click(addRectangleButton)
    
    await waitFor(() => {
      expect(mockCreateShape).toHaveBeenCalledWith('rectangle', expect.any(Number), expect.any(Number), {
        color: '#3B82F6'
      })
    })
  })

  it('should handle color selection', async () => {
    const mockUpdateShape = vi.fn(() => Promise.resolve())
    const { useShapes } = await import('../../../src/hooks/useShapes')
    const { useCanvas } = await import('../../../src/hooks/useCanvas')
    
    useShapes.mockReturnValue({
      shapes: [{ id: 'shape-1', type: 'rectangle', x: 100, y: 200, width: 150, height: 100, color: '#3B82F6' }],
      loading: false,
      error: null,
      createShape: vi.fn(),
      updateShape: mockUpdateShape,
      deleteShape: vi.fn(),
      getOwnedShapes: vi.fn(() => ['shape-1'])
    })
    
    useCanvas.mockReturnValue({
      selectedShapeId: 'shape-1',
      selectedColor: '#3B82F6',
      updateShapePosition: vi.fn(),
      updateShapeRotation: vi.fn(),
      updateShapeZIndex: vi.fn(),
      updateShapeColor: vi.fn(),
      updateShapeOwnership: vi.fn(),
      selectShape: vi.fn(),
      deselectAll: vi.fn(),
      setSelectedColor: vi.fn()
    })

    render(<Canvas user={mockUser} />)
    
    const redColorButton = screen.getByTitle('#EF4444')
    fireEvent.click(redColorButton)
    
    await waitFor(() => {
      expect(mockUpdateShape).toHaveBeenCalledWith('shape-1', { color: '#EF4444' })
    })
  })

  it('should handle shape deletion', async () => {
    const mockDeleteShape = vi.fn(() => Promise.resolve(true))
    const { useShapes } = await import('../../../src/hooks/useShapes')
    const { useCanvas } = await import('../../../src/hooks/useCanvas')
    
    useShapes.mockReturnValue({
      shapes: [{ id: 'shape-1', type: 'rectangle', x: 100, y: 200, width: 150, height: 100, color: '#3B82F6' }],
      loading: false,
      error: null,
      createShape: vi.fn(),
      updateShape: vi.fn(),
      deleteShape: mockDeleteShape,
      getOwnedShapes: vi.fn(() => ['shape-1'])
    })
    
    useCanvas.mockReturnValue({
      selectedShapeId: 'shape-1',
      selectedColor: '#3B82F6',
      updateShapePosition: vi.fn(),
      updateShapeRotation: vi.fn(),
      updateShapeZIndex: vi.fn(),
      updateShapeColor: vi.fn(),
      updateShapeOwnership: vi.fn(),
      selectShape: vi.fn(),
      deselectAll: vi.fn(),
      setSelectedColor: vi.fn()
    })

    render(<Canvas user={mockUser} />)
    
    const deleteButton = screen.getByText('Delete Selected')
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(mockDeleteShape).toHaveBeenCalledWith('shape-1')
    })
  })

  it('should show loading state', () => {
    const { useShapes } = require('../../../src/hooks/useShapes')
    useShapes.mockReturnValue({
      shapes: [],
      loading: true,
      error: null,
      createShape: vi.fn(),
      updateShape: vi.fn(),
      deleteShape: vi.fn(),
      getOwnedShapes: vi.fn(() => [])
    })

    render(<Canvas user={mockUser} />)
    
    expect(screen.getByText('⏳ Loading...')).toBeInTheDocument()
    expect(screen.getByText('+ Rectangle')).toBeDisabled()
    expect(screen.getByText('+ Circle')).toBeDisabled()
    expect(screen.getByText('+ Text')).toBeDisabled()
  })

  it('should show error state', () => {
    const { useShapes } = require('../../../src/hooks/useShapes')
    useShapes.mockReturnValue({
      shapes: [],
      loading: false,
      error: 'Database connection failed',
      createShape: vi.fn(),
      updateShape: vi.fn(),
      deleteShape: vi.fn(),
      getOwnedShapes: vi.fn(() => [])
    })

    render(<Canvas user={mockUser} />)
    
    expect(screen.getByText('❌ Error: Database connection failed')).toBeInTheDocument()
  })

  it('should handle offline state', () => {
    const { usePresence } = require('../../../src/hooks/usePresence')
    usePresence.mockReturnValue({
      onlineUsers: [],
      isOnline: false,
      setOnline: vi.fn(),
      setOffline: vi.fn()
    })

    render(<Canvas user={mockUser} />)
    
    expect(screen.getByText('🔴 Offline')).toBeInTheDocument()
  })

  it('should initialize ownership manager on mount', () => {
    const { ownershipManager } = require('../../../src/utils/OwnershipManager')
    
    render(<Canvas user={mockUser} />)
    
    expect(ownershipManager.start).toHaveBeenCalled()
  })

  it('should pass correct props to Rectangle components', () => {
    render(<Canvas user={mockUser} />)
    
    const rectangle = screen.getByTestId('rectangle-shape-1')
    expect(rectangle).toHaveAttribute('currentUserId', 'user123')
    expect(rectangle).toHaveAttribute('isOwned', 'true')
  })

  it('should handle missing user gracefully', () => {
    expect(() => {
      render(<Canvas user={null} />)
    }).not.toThrow()
  })

  it('should handle user without metadata', () => {
    const userWithoutMetadata = { id: 'user123' }
    
    expect(() => {
      render(<Canvas user={userWithoutMetadata} />)
    }).not.toThrow()
  })

  it('should disable delete button when no shape is selected', () => {
    render(<Canvas user={mockUser} />)
    
    const deleteButton = screen.getByText('Delete Selected')
    expect(deleteButton).toBeDisabled()
  })

  it('should handle cursor movement', () => {
    const mockUpdateCursorPosition = vi.fn()
    const { useCursors } = require('../../../src/hooks/useCursors')
    useCursors.mockReturnValue({
      otherCursors: [],
      isActive: true,
      updateCursorPosition: mockUpdateCursorPosition,
      setUserActive: vi.fn(),
      setUserInactive: vi.fn()
    })

    render(<Canvas user={mockUser} />)
    
    const stage = screen.getByTestId('canvas-stage')
    fireEvent.mouseMove(stage)
    
    // The actual cursor update would be called with stage coordinates
    // This test verifies the event handler is attached
    expect(stage).toHaveAttribute('onMouseMove')
  })
})
