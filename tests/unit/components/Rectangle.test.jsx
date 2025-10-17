import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Rectangle } from '../../../src/components/Canvas/Rectangle'

// Mock react-konva
vi.mock('react-konva', () => ({
  Rect: ({ children, ...props }) => (
    <div data-testid="rectangle" {...props}>
      {children}
    </div>
  )
}))

describe('Rectangle Component', () => {
  const mockRectangle = {
    id: 'test-rectangle-1',
    type: 'rectangle',
    x: 100,
    y: 200,
    width: 150,
    height: 100,
    rotation: 0,
    color: '#3B82F6',
    zIndex: 0,
    textContent: null,
    fontSize: 16,
    ownerId: null,
    ownershipTimestamp: null,
    createdBy: 'user123',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  }

  const defaultProps = {
    rectangle: mockRectangle,
    isSelected: false,
    onSelect: vi.fn(),
    onDragEnd: vi.fn(),
    onDragStart: vi.fn(),
    onRotate: vi.fn(),
    onResize: vi.fn(),
    onColorChange: vi.fn(),
    onZIndexChange: vi.fn(),
    currentUserId: 'user123',
    isOwned: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render rectangle with basic properties', () => {
    render(<Rectangle {...defaultProps} />)
    
    const rectangle = screen.getByTestId('rectangle')
    expect(rectangle).toBeInTheDocument()
    expect(rectangle).toHaveAttribute('x', '100')
    expect(rectangle).toHaveAttribute('y', '200')
    expect(rectangle).toHaveAttribute('width', '150')
    expect(rectangle).toHaveAttribute('height', '100')
    expect(rectangle).toHaveAttribute('fill', '#3B82F6')
  })

  it('should render with new schema fields', () => {
    const rectangleWithNewFields = {
      ...mockRectangle,
      rotation: 45,
      zIndex: 5,
      ownerId: 'user123',
      ownershipTimestamp: '2023-01-01T01:00:00.000Z'
    }

    render(<Rectangle {...defaultProps} rectangle={rectangleWithNewFields} />)
    
    const rectangle = screen.getByTestId('rectangle')
    expect(rectangle).toHaveAttribute('rotation', '45')
    expect(rectangle).toHaveAttribute('zIndex', '5')
  })

  it('should show selected state with different stroke', () => {
    render(<Rectangle {...defaultProps} isSelected={true} />)
    
    const rectangle = screen.getByTestId('rectangle')
    expect(rectangle).toHaveAttribute('stroke', '#1F2937')
    expect(rectangle).toHaveAttribute('strokeWidth', '3')
  })

  it('should show owned by others state', () => {
    const ownedByOthers = {
      ...mockRectangle,
      ownerId: 'user456'
    }

    render(<Rectangle {...defaultProps} rectangle={ownedByOthers} currentUserId="user123" />)
    
    const rectangle = screen.getByTestId('rectangle')
    expect(rectangle).toHaveAttribute('stroke', '#F59E0B')
    expect(rectangle).toHaveAttribute('strokeWidth', '2')
  })

  it('should show locked state for non-interactive shapes', () => {
    const lockedRectangle = {
      ...mockRectangle,
      ownerId: 'user456'
    }

    render(<Rectangle {...defaultProps} rectangle={lockedRectangle} currentUserId="user123" />)
    
    const rectangle = screen.getByTestId('rectangle')
    expect(rectangle).toHaveAttribute('stroke', '#9CA3AF')
    expect(rectangle).toHaveAttribute('strokeWidth', '1')
    expect(rectangle).toHaveAttribute('opacity', '0.6')
  })

  it('should handle click events', () => {
    render(<Rectangle {...defaultProps} />)
    
    const rectangle = screen.getByTestId('rectangle')
    fireEvent.click(rectangle)
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith('test-rectangle-1')
  })

  it('should handle drag start events', () => {
    render(<Rectangle {...defaultProps} />)
    
    const rectangle = screen.getByTestId('rectangle')
    fireEvent.dragStart(rectangle)
    
    expect(defaultProps.onDragStart).toHaveBeenCalledWith('test-rectangle-1')
  })

  it('should handle drag end events', () => {
    render(<Rectangle {...defaultProps} />)
    
    const rectangle = screen.getByTestId('rectangle')
    // Mock the event target with x and y methods
    const mockEvent = {
      target: {
        x: () => 150,
        y: () => 250
      }
    }
    
    fireEvent.dragEnd(rectangle, mockEvent)
    
    expect(defaultProps.onDragEnd).toHaveBeenCalledWith('test-rectangle-1', {
      x: 150,
      y: 250
    })
  })

  it('should show transform controls when selected and owned', () => {
    render(<Rectangle {...defaultProps} isSelected={true} isOwned={true} />)
    
    const rectangle = screen.getByTestId('rectangle')
    expect(rectangle).toHaveAttribute('draggable', 'true')
  })

  it('should disable interaction when not owned', () => {
    const notOwnedRectangle = {
      ...mockRectangle,
      ownerId: 'user456'
    }

    render(<Rectangle {...defaultProps} rectangle={notOwnedRectangle} currentUserId="user123" />)
    
    const rectangle = screen.getByTestId('rectangle')
    expect(rectangle).toHaveAttribute('draggable', 'false')
  })

  it('should handle transform end events', () => {
    render(<Rectangle {...defaultProps} isSelected={true} isOwned={true} />)
    
    const rectangle = screen.getByTestId('rectangle')
    const mockEvent = {
      target: {
        x: () => 200,
        y: () => 300,
        width: () => 200,
        height: () => 150,
        scaleX: vi.fn().mockReturnValue(1.5),
        scaleY: vi.fn().mockReturnValue(1.2),
        rotation: () => 30
      }
    }
    
    fireEvent.transitionEnd(rectangle, mockEvent)
    
    expect(defaultProps.onResize).toHaveBeenCalledWith('test-rectangle-1', {
      width: 300, // 200 * 1.5
      height: 180 // 150 * 1.2
    })
    expect(defaultProps.onRotate).toHaveBeenCalledWith('test-rectangle-1', 30)
  })

  it('should handle minimum size constraints', () => {
    render(<Rectangle {...defaultProps} isSelected={true} isOwned={true} />)
    
    const rectangle = screen.getByTestId('rectangle')
    const mockEvent = {
      target: {
        x: () => 200,
        y: () => 300,
        width: () => 5, // Very small width
        height: () => 3, // Very small height
        scaleX: vi.fn().mockReturnValue(0.1),
        scaleY: vi.fn().mockReturnValue(0.1),
        rotation: () => 0
      }
    }
    
    fireEvent.transitionEnd(rectangle, mockEvent)
    
    expect(defaultProps.onResize).toHaveBeenCalledWith('test-rectangle-1', {
      width: 10, // Minimum width
      height: 10 // Minimum height
    })
  })

  it('should show different visual states for different ownership scenarios', () => {
    const scenarios = [
      {
        name: 'unowned shape',
        rectangle: { ...mockRectangle, ownerId: null },
        currentUserId: 'user123',
        expectedStroke: '#E5E7EB',
        expectedWidth: '1'
      },
      {
        name: 'owned by current user',
        rectangle: { ...mockRectangle, ownerId: 'user123' },
        currentUserId: 'user123',
        expectedStroke: '#E5E7EB',
        expectedWidth: '1'
      },
      {
        name: 'owned by other user',
        rectangle: { ...mockRectangle, ownerId: 'user456' },
        currentUserId: 'user123',
        expectedStroke: '#F59E0B',
        expectedWidth: '2'
      },
      {
        name: 'selected shape',
        rectangle: { ...mockRectangle, ownerId: 'user123' },
        currentUserId: 'user123',
        isSelected: true,
        expectedStroke: '#1F2937',
        expectedWidth: '3'
      }
    ]

    scenarios.forEach(({ name, rectangle, currentUserId, isSelected = false, expectedStroke, expectedWidth }) => {
      const { unmount } = render(
        <Rectangle 
          {...defaultProps} 
          rectangle={rectangle}
          currentUserId={currentUserId}
          isSelected={isSelected}
        />
      )
      
      const rect = screen.getByTestId('rectangle')
      expect(rect).toHaveAttribute('stroke', expectedStroke)
      expect(rect).toHaveAttribute('strokeWidth', expectedWidth)
      
      unmount()
    })
  })

  it('should handle missing optional props gracefully', () => {
    const minimalProps = {
      rectangle: mockRectangle,
      isSelected: false
    }

    expect(() => {
      render(<Rectangle {...minimalProps} />)
    }).not.toThrow()
  })

  it('should handle null/undefined rectangle properties', () => {
    const rectangleWithNulls = {
      ...mockRectangle,
      rotation: null,
      zIndex: undefined,
      ownerId: null
    }

    expect(() => {
      render(<Rectangle {...defaultProps} rectangle={rectangleWithNulls} />)
    }).not.toThrow()
    
    const rectangle = screen.getByTestId('rectangle')
    expect(rectangle).toHaveAttribute('rotation', '0') // Default value
    expect(rectangle).toHaveAttribute('zIndex', '0') // Default value
  })
})
