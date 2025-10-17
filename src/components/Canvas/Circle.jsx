import { Circle as KonvaCircle, Transformer } from 'react-konva'
import { useState, useRef, useEffect } from 'react'

export const Circle = ({ 
  circle, 
  isSelected, 
  onSelect, 
  onDragEnd, 
  onDragStart,
  onRotate,
  onResize,
  onColorChange,
  onZIndexChange,
  currentUserId,
  isOwned = false
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const transformerRef = useRef(null)

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current) {
      // Find the Circle node by its position and properties
      const stage = transformerRef.current.getStage()
      const circleNode = stage.findOne(node => 
        node.getClassName() === 'Circle' && 
        node.x() === circle.x && 
        node.y() === circle.y
      )
      if (circleNode) {
        transformerRef.current.nodes([circleNode])
        transformerRef.current.getLayer().batchDraw()
      }
    }
  }, [isSelected, circle.x, circle.y])

  const handleDragStart = (e) => {
    setIsDragging(true)
    
    // Calculate the offset from cursor to circle center
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    const circlePos = e.target.position()
    
    setDragOffset({
      x: pointerPosition.x - circlePos.x,
      y: pointerPosition.y - circlePos.y
    })
    
    onDragStart?.(circle.id)
  }

  const handleDragMove = (e) => {
    if (!isDragging) return
    
    // Apply the offset to keep the circle in the same relative position
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    e.target.position({
      x: pointerPosition.x - dragOffset.x,
      y: pointerPosition.y - dragOffset.y
    })
  }

  const handleDragEnd = (e) => {
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
    
    const newPos = {
      x: e.target.x(),
      y: e.target.y()
    }
    onDragEnd?.(circle.id, newPos)
  }

  const handleTransformEnd = (e) => {
    const node = e.target
    const newAttrs = {
      x: node.x(),
      y: node.y(),
      radius: Math.max(5, node.radius() * node.scaleX()),
      rotation: node.rotation()
    }
    
    // Update the shape with new attributes
    if (onResize) {
      onResize(circle.id, {
        width: newAttrs.radius * 2, // Convert radius to width for consistency
        height: newAttrs.radius * 2 // Convert radius to height for consistency
      })
    }
    
    if (onRotate) {
      onRotate(circle.id, newAttrs.rotation)
    }
    
    if (onDragEnd) {
      onDragEnd(circle.id, {
        x: newAttrs.x,
        y: newAttrs.y
      })
    }
    
    // Reset scale after updating the shape
    node.scaleX(1)
    node.scaleY(1)
  }

  const handleTransformStart = () => {
    setIsResizing(true)
  }

  const handleTransformEndComplete = () => {
    setIsResizing(false)
  }

  // Determine if the shape can be interacted with
  const canInteract = isOwned || circle.ownerId === currentUserId || !circle.ownerId

  // Visual indicators for ownership
  const getStrokeColor = () => {
    if (!canInteract) return '#9CA3AF' // Gray for locked
    if (isSelected) return '#1F2937' // Dark gray for selected
    if (circle.ownerId && circle.ownerId !== currentUserId) return '#F59E0B' // Amber for owned by others
    return '#E5E7EB' // Light gray for default
  }

  const getStrokeWidth = () => {
    if (!canInteract) return 1
    if (isSelected) return 3
    if (circle.ownerId && circle.ownerId !== currentUserId) return 2
    return 1
  }

  // Calculate radius from width/height (assuming circle is stored as width/height in DB)
  const radius = Math.min(circle.width || 50, circle.height || 50) / 2

  return (
    <>
      <KonvaCircle
        x={circle.x}
        y={circle.y}
        radius={radius}
        fill={circle.color}
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        rotation={circle.rotation || 0}
        draggable={canInteract}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.cancelBubble = true
          onSelect?.(circle.id)
        }}
        shadowColor="black"
        shadowBlur={isDragging || isResizing ? 10 : 5}
        shadowOpacity={isDragging || isResizing ? 0.3 : 0.2}
        shadowOffsetX={isDragging || isResizing ? 5 : 2}
        shadowOffsetY={isDragging || isResizing ? 5 : 2}
        // Transform controls for resizing and rotation
        {...(canInteract && isSelected && {
          onTransformStart: handleTransformStart,
          onTransformEnd: handleTransformEnd,
          onTransformEndComplete: handleTransformEndComplete
        })}
        // Visual feedback for interaction state
        opacity={canInteract ? 1 : 0.6}
      />
      
      {/* Transformer for resize/rotate handles */}
      {isSelected && canInteract && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
}
