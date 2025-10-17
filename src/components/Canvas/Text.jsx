import { Text as KonvaText, Transformer } from 'react-konva'
import { useState, useRef, useEffect } from 'react'

export const Text = ({ 
  text, 
  isSelected, 
  onSelect, 
  onDragEnd, 
  onDragStart,
  onRotate,
  onResize,
  onColorChange,
  onZIndexChange,
  currentUserId,
  isOwned = false,
  onTextEditStart,
  isEditing
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const textRef = useRef(null)
  const transformerRef = useRef(null)

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && textRef.current) {
      transformerRef.current.nodes([textRef.current])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  // Handle double-click to start editing
  const handleDoubleClick = (e) => {
    if (!canInteract) return
    
    e.cancelBubble = true
    onTextEditStart?.(text)
  }

  // Handle clicking to select (not edit)
  const handleClick = (e) => {
    e.cancelBubble = true
    onSelect?.(text.id)
  }

  const handleDragStart = (e) => {
    if (isEditing) return // Don't drag while editing
    
    setIsDragging(true)
    onDragStart?.(text.id)
  }

  const handleDragEnd = (e) => {
    setIsDragging(false)
    const newPos = {
      x: e.target.x(),
      y: e.target.y()
    }
    onDragEnd?.(text.id, newPos)
  }

  const handleTransformEnd = (e) => {
    const node = e.target
    const newAttrs = {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * node.scaleX()),
      height: Math.max(20, node.height() * node.scaleY()),
      rotation: node.rotation()
    }
    
    // Update the shape with new attributes
    if (onResize) {
      onResize(text.id, {
        width: newAttrs.width,
        height: newAttrs.height
      })
    }
    
    if (onRotate) {
      onRotate(text.id, newAttrs.rotation)
    }
    
    if (onDragEnd) {
      onDragEnd(text.id, {
        x: newAttrs.x,
        y: newAttrs.y
      })
    }
    
    // Reset scale after updating the shape
    node.scaleX(1)
    node.scaleY(1)
  }

  const handleTransformStart = () => {
    // Don't allow transforms while editing
    if (isEditing) return
  }

  const handleTransformEndComplete = () => {
    // Transform end complete
  }

  // Determine if the shape can be interacted with
  const canInteract = isOwned || text.ownerId === currentUserId || !text.ownerId

  // Visual indicators for ownership
  const getStrokeColor = () => {
    if (!canInteract) return '#9CA3AF' // Gray for locked
    if (isSelected) return '#1F2937' // Dark gray for selected
    if (text.ownerId && text.ownerId !== currentUserId) return '#F59E0B' // Amber for owned by others
    return '#E5E7EB' // Light gray for default
  }

  const getStrokeWidth = () => {
    if (!canInteract) return 1
    if (isSelected) return 3
    if (text.ownerId && text.ownerId !== currentUserId) return 2
    return 1
  }

  // Get the text content to display
  const displayText = text.textContent || 'Double-click to edit'
  
  // Get the font size
  const fontSize = text.fontSize || 16

  return (
    <>
      <KonvaText
        ref={textRef}
        x={text.x}
        y={text.y}
        text={displayText}
        fontSize={fontSize}
        fill={text.color}
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        rotation={text.rotation || 0}
        draggable={canInteract && !isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        shadowColor="black"
        shadowBlur={isDragging ? 10 : 5}
        shadowOpacity={isDragging ? 0.3 : 0.2}
        shadowOffsetX={isDragging ? 5 : 2}
        shadowOffsetY={isDragging ? 5 : 2}
        // Transform controls for resizing and rotation
        {...(canInteract && isSelected && !isEditing && {
          onTransformStart: handleTransformStart,
          onTransformEnd: handleTransformEnd,
          onTransformEndComplete: handleTransformEndComplete
        })}
        // Visual feedback for interaction state
        opacity={canInteract ? 1 : 0.6}
        // Simple text display - no Konva editing
      />
      
      {/* Transformer for resize/rotate handles */}
      {isSelected && canInteract && !isEditing && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
      
    </>
  )
}
