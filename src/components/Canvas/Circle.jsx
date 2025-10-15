import { Circle as KonvaCircle } from 'react-konva'
import { useState } from 'react'
import { CANVAS_CONFIG } from '../../lib/constants'

export const Circle = ({ 
  circle, 
  isSelected, 
  onSelect, 
  onDragEnd, 
  onDragStart,
  onDragMove,
  onDragMoveBroadcast,
  onTransform,
  onTransformEnd
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    onDragStart?.(circle.id)
  }

  const handleDragMove = (e) => {
    if (isDragging) {
      const stage = e.target.getStage()
      const pointer = stage.getPointerPosition()
      if (pointer) {
        onDragMove?.(pointer.x, pointer.y)
        
        // Broadcast position update during drag
        const radius = circle.width / 2
        const newPos = {
          x: e.target.x() - radius,
          y: e.target.y() - radius
        }
        onDragMoveBroadcast?.(circle.id, newPos)
      }
    }
  }

  const handleDragEnd = (e) => {
    setIsDragging(false)
    
    // Calculate radius from width/height (radius = width / 2)
    const radius = circle.width / 2
    
    // Get the current position (which includes the radius offset)
    let newX = e.target.x() - radius
    let newY = e.target.y() - radius
    
    // Ensure circle stays within 5000x5000 workspace
    newX = Math.max(0, Math.min(newX, CANVAS_CONFIG.WIDTH - circle.width))
    newY = Math.max(0, Math.min(newY, CANVAS_CONFIG.HEIGHT - circle.height))
    
    // Update the visual position (add radius back for display)
    e.target.position({ x: newX + radius, y: newY + radius })
    
    const newPos = { x: newX, y: newY }
    onDragEnd?.(circle.id, newPos)
  }

  const handleTransform = (e) => {
    const node = e.target
    const newRadius = Math.max(10, node.radius() * node.scaleX())
    
    // Reset scale and update the actual radius
    node.scaleX(1)
    node.scaleY(1)
    node.radius(newRadius)
    
    // For circles, we maintain aspect ratio (width = height = 2 * radius)
    const newWidth = newRadius * 2
    const newHeight = newRadius * 2
    
    onTransform?.(circle.id, {
      x: node.x() - newRadius, // Convert center position back to top-left
      y: node.y() - newRadius,
      width: newWidth,
      height: newHeight
    })
  }

  const handleTransformEnd = (e) => {
    const node = e.target
    const newRadius = Math.max(10, node.radius() * node.scaleX())
    
    // Reset scale and update the actual radius
    node.scaleX(1)
    node.scaleY(1)
    node.radius(newRadius)
    
    // For circles, we maintain aspect ratio (width = height = 2 * radius)
    const newWidth = newRadius * 2
    const newHeight = newRadius * 2
    
    onTransformEnd?.(circle.id, {
      x: node.x() - newRadius, // Convert center position back to top-left
      y: node.y() - newRadius,
      width: newWidth,
      height: newHeight
    })
  }

  // Calculate radius from width/height
  const radius = circle.width / 2

  return (
    <KonvaCircle
      id={circle.id}
      x={circle.x + radius}
      y={circle.y + radius}
      radius={radius}
      fill={circle.color}
      stroke={isSelected ? '#1F2937' : '#E5E7EB'}
      strokeWidth={isSelected ? 2 : 1}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
      onClick={(e) => {
        e.cancelBubble = true
        onSelect?.(circle.id)
      }}
      shadowColor="black"
      shadowBlur={isDragging ? 10 : 5}
      shadowOpacity={isDragging ? 0.3 : 0.2}
      shadowOffsetX={isDragging ? 5 : 2}
      shadowOffsetY={isDragging ? 5 : 2}
    />
  )
}
