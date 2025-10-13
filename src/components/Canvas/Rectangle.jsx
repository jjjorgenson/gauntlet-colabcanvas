import { Rect } from 'react-konva'
import { useState } from 'react'

export const Rectangle = ({ 
  rectangle, 
  isSelected, 
  onSelect, 
  onDragEnd, 
  onDragStart 
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    onDragStart?.(rectangle.id)
  }

  const handleDragEnd = (e) => {
    setIsDragging(false)
    const newPos = {
      x: e.target.x(),
      y: e.target.y()
    }
    onDragEnd?.(rectangle.id, newPos)
  }

  return (
    <Rect
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

