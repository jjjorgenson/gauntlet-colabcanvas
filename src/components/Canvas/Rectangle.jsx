import { Rect } from 'react-konva'
import { useState } from 'react'
import { CANVAS_CONFIG } from '../../lib/constants'

export const Rectangle = ({
  rectangle,
  isSelected,
  isOwnedByMe,
  isOwnedByOther,
  onSelect,
  onDragEnd,
  onDragStart,
  onDragMove,
  onDragMoveBroadcast,
  onTransform,
  onTransformEnd,
  onCursorUpdate,
  onAcquireOwnership
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = async (e) => {
    // FIRST: Check ownership and acquire if needed
    if (!isOwnedByMe && !isOwnedByOther) {
      // Try to acquire ownership for unowned shapes
      const ownershipAcquired = await onAcquireOwnership?.(rectangle.id)
      if (!ownershipAcquired) {
        // Block drag if ownership acquisition failed
        e.evt.preventDefault()
        return false
      }
    } else if (isOwnedByOther) {
      // Block drag if owned by another user
      e.evt.preventDefault()
      return false
    }
    
    // ONLY start dragging if ownership is confirmed
    setIsDragging(true)
    onDragStart?.(rectangle.id)
  }

  const handleDragMove = (e) => {
    if (isDragging) {
      const stage = e.target.getStage()
      const pointer = stage.getPointerPosition()
      if (pointer) {
        // Update cursor position during drag for real-time collaboration
        onCursorUpdate?.(pointer.x, pointer.y)
        
        onDragMove?.(pointer.x, pointer.y)
        
        // Broadcast position update during drag
        const newPos = {
          x: e.target.x(),
          y: e.target.y()
        }
        onDragMoveBroadcast?.(rectangle.id, newPos)
      }
    }
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
      height: newHeight,
      rotation: node.rotation()
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
      height: newHeight,
      rotation: node.rotation()
    })
  }

  // Determine visual properties based on ownership
  const getVisualProps = () => {
    if (isOwnedByOther) {
      return {
        stroke: '#EF4444', // Red border for owned by others
        strokeWidth: isSelected ? 2 : 1,
        opacity: 0.15, // 15% transparency
        draggable: false // Cannot drag shapes owned by others
      }
    } else if (isOwnedByMe || !rectangle.owner_id) {
      return {
        stroke: isSelected ? '#1F2937' : '#E5E7EB',
        strokeWidth: isSelected ? 2 : 1,
        opacity: 1, // Full opacity
        draggable: true // Can drag own shapes or unowned shapes
      }
    }
  }

  const visualProps = getVisualProps()

  return (
    <Rect
      id={rectangle.id}
      x={rectangle.x}
      y={rectangle.y}
      width={rectangle.width}
      height={rectangle.height}
      rotation={rectangle.rotation}
      fill={rectangle.color}
      stroke={visualProps.stroke}
      strokeWidth={visualProps.strokeWidth}
      opacity={visualProps.opacity}
      draggable={visualProps.draggable}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
      onClick={(e) => {
        e.cancelBubble = true
        onSelect?.(rectangle.id, e.evt)
      }}
      shadowColor="black"
      shadowBlur={isDragging ? 10 : 5}
      shadowOpacity={isDragging ? 0.3 : 0.2}
      shadowOffsetX={isDragging ? 5 : 2}
      shadowOffsetY={isDragging ? 5 : 2}
    />
  )
}

