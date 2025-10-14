import { Text, Rect, Group } from 'react-konva'
import { useRef, useEffect, useState, useCallback } from 'react'
import { throttle } from '../../utils/syncHelpers'

export const TextBox = ({ 
  textBox, 
  isSelected, 
  isOwnedByMe,
  isOwnedByOther,
  onSelect, 
  onDragEnd, 
  onDragStart,
  onDragMove,
  onDragMoveBroadcast,
  onTextChange,
  onTransform,
  onTransformEnd,
  onExitEditing
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const textRef = useRef(null)
  const inputRef = useRef(null)

  const handleDragStart = (e) => {
    setIsDragging(true)
    onDragStart?.(textBox.id)
  }

  const handleDragMove = (e) => {
    if (isDragging) {
      const stage = e.target.getStage()
      const pointer = stage.getPointerPosition()
      if (pointer) {
        onDragMove?.(pointer.x, pointer.y)
        
        // Broadcast position update during drag
        const newPos = {
          x: e.target.x(),
          y: e.target.y()
        }
        onDragMoveBroadcast?.(textBox.id, newPos)
      }
    }
  }

  const handleDragEnd = (e) => {
    setIsDragging(false)
    const newPos = {
      x: e.target.x(),
      y: e.target.y()
    }
    onDragEnd?.(textBox.id, newPos)
  }

  // Throttled transform handler for smooth resizing
  const handleTransformThrottled = useCallback(
    throttle((shapeId, transform) => {
      onTransform?.(shapeId, transform)
    }, 100),
    [onTransform]
  )

  const handleTransform = (e) => {
    const node = e.target
    const newWidth = Math.max(50, node.width() * node.scaleX())
    const newHeight = Math.max(30, node.height() * node.scaleY())
    
    // Reset scale and update the actual dimensions
    node.scaleX(1)
    node.scaleY(1)
    node.width(newWidth)
    node.height(newHeight)
    
    // Use throttled handler for smooth updates
    handleTransformThrottled(textBox.id, {
      x: node.x(), // Use current Group position
      y: node.y(), // Use current Group position
      width: newWidth,
      height: newHeight
    })
  }

  const handleTransformEnd = (e) => {
    const node = e.target
    const newWidth = Math.max(50, node.width() * node.scaleX())
    const newHeight = Math.max(30, node.height() * node.scaleY())
    
    // Reset scale and update the actual dimensions
    node.scaleX(1)
    node.scaleY(1)
    node.width(newWidth)
    node.height(newHeight)
    
    // Send final update immediately (not throttled)
    onTransform?.(textBox.id, {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight
    })
  }

  const handleDoubleClick = () => {
    if (isOwnedByOther) return // Cannot edit if owned by another user
    setIsEditing(true)
  }

  const handleTextSave = (newText) => {
    if (onTextChange) {
      onTextChange(textBox.id, newText)
    }
    setIsEditing(false)
  }

  const handleTextCancel = () => {
    setIsEditing(false)
  }

  const handleClick = (e) => {
    e.cancelBubble = true
    onSelect?.(textBox.id)
    
    // If we're in editing mode and click on the textbox, stay in editing mode
    // If we click outside (handled by parent), we'll exit editing mode
  }

  // Exit editing mode when clicking outside - handled by parent Canvas component
  useEffect(() => {
    if (onExitEditing && isEditing) {
      setIsEditing(false)
    }
  }, [onExitEditing, isEditing])

  // Handle text editing with DOM input
  useEffect(() => {
    if (isEditing && textRef.current) {
      const input = document.createElement('input')
      inputRef.current = input
      
      // Position the input over the textbox
      const stage = textRef.current.getStage()
      const stageBox = stage.container().getBoundingClientRect()
      const textBoxPos = textRef.current.getAbsolutePosition()
      
      input.value = textBox.text_content || ''
      input.style.position = 'absolute'
      input.style.left = `${stageBox.left + textBoxPos.x}px`
      input.style.top = `${stageBox.top + textBoxPos.y}px`
      input.style.width = `${textBox.width}px`
      input.style.height = `${textBox.height}px`
      input.style.border = '2px solid #2196F3'
      input.style.outline = 'none'
      input.style.background = 'rgba(255, 255, 255, 0.95)'
      input.style.fontSize = `${textBox.font_size || 16}px`
      input.style.fontFamily = 'Arial, sans-serif'
      input.style.color = '#000'
      input.style.padding = '5px'
      input.style.margin = '0'
      input.style.zIndex = '9999'
      input.style.borderRadius = '3px'
      
      document.body.appendChild(input)
      input.focus()
      input.select()
      
      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          handleTextSave(input.value)
        } else if (e.key === 'Escape') {
          handleTextCancel()
        }
      }
      
      const handleBlur = () => {
        handleTextSave(input.value)
      }
      
      input.addEventListener('keydown', handleKeyDown)
      input.addEventListener('blur', handleBlur)
      
      return () => {
        if (inputRef.current && document.body.contains(inputRef.current)) {
          input.removeEventListener('keydown', handleKeyDown)
          input.removeEventListener('blur', handleBlur)
          document.body.removeChild(inputRef.current)
          inputRef.current = null
        }
      }
    }
  }, [isEditing, textBox, handleTextSave, handleTextCancel])

  const displayText = textBox.text_content || 'Double-click to edit'

  // Calculate opacity based on ownership (70% opacity for text boxes when owned by others)
  const opacity = isOwnedByOther ? 0.7 : 1.0

  return (
    <Group
      ref={textRef}
      id={textBox.id}
      x={textBox.x}
      y={textBox.y}
      width={textBox.width}
      height={textBox.height}
      draggable={!isOwnedByOther}
      opacity={opacity}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
    >
      <Rect
        width={textBox.width}
        height={textBox.height}
        fill={isOwnedByOther ? '#F0F0F0' : (isEditing ? '#E3F2FD' : '#FFFFFF')}
        stroke={isOwnedByOther ? '#BBBBBB' : (isEditing ? '#2196F3' : '#000000')}
        strokeWidth={isEditing ? 2 : 1}
        cornerRadius={3}
        shadowColor="black"
        shadowBlur={isDragging ? 10 : 5}
        shadowOpacity={isDragging ? 0.3 : 0.2}
        shadowOffsetX={isDragging ? 5 : 2}
        shadowOffsetY={isDragging ? 5 : 2}
      />
      <Text
        text={isEditing ? 'Editing...' : displayText}
        fontSize={textBox.font_size || 16}
        fontFamily="Arial, sans-serif"
        fill={isOwnedByOther ? '#888888' : (isEditing ? '#2196F3' : '#000000')}
        width={textBox.width}
        height={textBox.height}
        verticalAlign="middle"
        padding={5}
      />
    </Group>
  )
}