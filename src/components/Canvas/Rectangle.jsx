import { Rect } from 'react-konva'
import { useState } from 'react'
import { CANVAS_CONFIG } from '../../lib/constants'

export const Rectangle = ({
  rectangle,
  isSelected,
  onSelect,
  onDragEnd,
  onDragStart,
  onTransform,
  onTransformEnd
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    onDragStart?.(rectangle.id)
  }

  const handleDragEnd = (e) => {
    setIsDragging(false)
    
    // Enforce workspace boundaries
    let newX = e.target.x()
    let newY = e.target.y()
    
    // Ensure shape stays within 5000x5000 workspace
    newX = Math.max(0, Math.min(newX, CANVAS_CONFIG.WIDTH - rectangle.width))
    newY = Math.max(0, Math.min(newY, CANVAS_CONFIG.HEIGHT - rectangle.height))
    
    // Update position if it was constrained
    if (newX !== e.target.x() || newY !== e.target.y()) {
      e.target.position({ x: newX, y: newY })
    }
    
    const newPos = { x: newX, y: newY }
    onDragEnd?.(rectangle.id, newPos)
  }

  const handleTransform = (e) => {
    const node = e.target
    const newWidth = Math.max(20, node.width() * node.scaleX())
    const newHeight = Math.max(20, node.height() * node.scaleY())
    
    // Reset scale and update the actual dimensions
    node.scaleX(1)
    node.scaleY(1)
    node.width(newWidth)
    node.height(newHeight)
    
    onTransform?.(rectangle.id, {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight
    })
  }

  const handleTransformEnd = (e) => {
    const node = e.target
    const newWidth = Math.max(20, node.width() * node.scaleX())
    const newHeight = Math.max(20, node.height() * node.scaleY())
    
    // Reset scale and update the actual dimensions
    node.scaleX(1)
    node.scaleY(1)
    node.width(newWidth)
    node.height(newHeight)
    
    onTransformEnd?.(rectangle.id, {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight
    })
  }

  return (
    <Rect
      id={rectangle.id}
      x={rectangle.x}
      y={rectangle.y}
      width={rectangle.width}
      height={rectangle.height}
      fill={rectangle.color}
      stroke={isSelected ? '#1F2937' : '#E5E7EB'}
      strokeWidth={isSelected ? 2 : 1}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
      onClick={(e) => {
        e.cancelBubble = true
        onSelect?.(rectangle.id)
      }}
      shadowColor="black"
      shadowBlur={isDragging ? 10 : 5}
      shadowOpacity={isDragging ? 0.3 : 0.2}
      shadowOffsetX={isDragging ? 5 : 2}
      shadowOffsetY={isDragging ? 5 : 2}
    />
  )
}

