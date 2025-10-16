import { Text, Rect, Group } from 'react-konva'
import { useRef, useEffect, useState, useCallback } from 'react'
import { throttle } from '../../utils/syncHelpers'
import { CANVAS_CONFIG } from '../../lib/constants'
import objectStore from '../../lib/ObjectStore'

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
  const [localText, setLocalText] = useState('')
  const textRef = useRef(null)
  const inputRef = useRef(null)
  const blurTimeoutRef = useRef(null)
  const ownershipTimeoutRef = useRef(null)

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
    
    // Get the current Group position (which is already top-left)
    let newX = e.target.x()
    let newY = e.target.y()
    
    // Ensure textbox stays within 5000x5000 workspace
    newX = Math.max(0, Math.min(newX, CANVAS_CONFIG.WIDTH - textBox.width))
    newY = Math.max(0, Math.min(newY, CANVAS_CONFIG.HEIGHT - textBox.height))
    
    // Update the visual position if it was constrained
    if (newX !== e.target.x() || newY !== e.target.y()) {
      e.target.position({ x: newX, y: newY })
    }
    
    // Use requestAnimationFrame to ensure position is set before updating store
    requestAnimationFrame(() => {
      const newPos = { x: newX, y: newY }
      onDragEnd?.(textBox.id, newPos)
    })
  }

  // No throttling - local updates only during transform

  const handleTransform = (e) => {
    const node = e.target
    const newWidth = Math.max(50, node.width() * node.scaleX())
    const newHeight = Math.max(30, node.height() * node.scaleY())
    
    // Reset scale and update the actual dimensions
    node.scaleX(1)
    node.scaleY(1)
    node.width(newWidth)
    node.height(newHeight)
    
    // Update the Rect and Text inside the Group to match new dimensions
    const rect = node.findOne('Rect')
    const text = node.findOne('Text')
    if (rect) {
      rect.width(newWidth)
      rect.height(newHeight)
    }
    if (text) {
      text.width(newWidth)
      text.height(newHeight)
    }
    
    // Update local ObjectStore immediately (no throttling for instant UI response)
    objectStore.update(textBox.id, {
      x: node.x(), // Use current Group position
      y: node.y(), // Use current Group position
      width: newWidth,
      height: newHeight
    })
    
    // NO database broadcast during transform - only sync on transform end for performance
    // This makes local resizing completely smooth and snappy
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
    
    // Update the Rect and Text inside the Group to match new dimensions
    const rect = node.findOne('Rect')
    const text = node.findOne('Text')
    if (rect) {
      rect.width(newWidth)
      rect.height(newHeight)
    }
    if (text) {
      text.width(newWidth)
      text.height(newHeight)
    }
    
    // Send final update immediately (not throttled)
    onTransformEnd?.(textBox.id, {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight
    })
  }

  const handleDoubleClick = () => {
    if (isOwnedByOther) return // Cannot edit if owned by another user
    // console.log('🎯 STARTING EDIT: TextBox', textBox.id)
    setLocalText(textBox.text_content || '')
    setIsEditing(true)
    
    // Mark as editing in ObjectStore to prevent remote updates
    objectStore.setEditing(textBox.id)
    // console.log('🔒 LOCKED: TextBox', textBox.id, 'for editing')
    
    // Set up 35-second ownership timeout (for future conflict resolution)
    ownershipTimeoutRef.current = setTimeout(() => {
      // console.log('⏰ TIMEOUT: Textbox ownership timeout reached, auto-saving:', textBox.id)
      if (inputRef.current) {
        handleTextSave(inputRef.current.value)
      }
    }, 35000) // 35 seconds
  }

  const handleTextSave = useCallback((newText) => {
    // console.log('💾 SAVING: TextBox', textBox.id, 'with text:', newText)
    // Clear any pending timeouts
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (ownershipTimeoutRef.current) {
      clearTimeout(ownershipTimeoutRef.current)
      ownershipTimeoutRef.current = null
    }
    
    // Mark as no longer editing in ObjectStore
    objectStore.setNotEditing(textBox.id)
    // console.log('🔓 UNLOCKED: TextBox', textBox.id)
    
    if (onTextChange) {
      onTextChange(textBox.id, newText)
    }
    setIsEditing(false)
    setLocalText('')
  }, [textBox.id, onTextChange])

  const handleTextCancel = useCallback(() => {
    // console.log('❌ CANCELING: TextBox', textBox.id)
    // Clear any pending timeouts
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (ownershipTimeoutRef.current) {
      clearTimeout(ownershipTimeoutRef.current)
      ownershipTimeoutRef.current = null
    }
    
    // Mark as no longer editing in ObjectStore
    objectStore.setNotEditing(textBox.id)
    // console.log('🔓 UNLOCKED: TextBox', textBox.id)
    
    setIsEditing(false)
    setLocalText('')
  }, [textBox.id])

  const handleClick = (e) => {
    e.cancelBubble = true
    onSelect?.(textBox.id)
    
    // If we're in editing mode and click on the textbox, stay in editing mode
    // If we click outside (handled by parent), we'll exit editing mode
  }

  // Exit editing mode when clicking outside - handled by parent Canvas component
  useEffect(() => {
    if (onExitEditing && isEditing) {
      // Clear any pending timeouts
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
        blurTimeoutRef.current = null
      }
      if (ownershipTimeoutRef.current) {
        clearTimeout(ownershipTimeoutRef.current)
        ownershipTimeoutRef.current = null
      }
      
      // Mark as no longer editing in ObjectStore
      objectStore.setNotEditing(textBox.id)
      
      setIsEditing(false)
      setLocalText('')
    }
  }, [onExitEditing, isEditing, textBox.id])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
      if (ownershipTimeoutRef.current) {
        clearTimeout(ownershipTimeoutRef.current)
      }
    }
  }, [])

  // Handle text editing with DOM input
  useEffect(() => {
    // console.log('🔧 DOM INPUT useEffect running:', { isEditing, textBoxId: textBox.id })
    if (isEditing && textRef.current) {
      // console.log('🔧 Creating new DOM input for:', textBox.id)
      const input = document.createElement('input')
      inputRef.current = input
      
      // Position the input over the textbox
      const stage = textRef.current.getStage()
      const stageBox = stage.container().getBoundingClientRect()
      const textBoxPos = textRef.current.getAbsolutePosition()
      
      input.value = localText || textBox.text_content || ''
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
          // console.log('⌨️ ENTER PRESSED: saving with input.value:', input.value)
          handleTextSave(input.value)
        } else if (e.key === 'Escape') {
          // console.log('⌨️ ESCAPE PRESSED: canceling')
          handleTextCancel()
        }
      }
      
      const handleInput = (e) => {
        // console.log('📝 TYPING: TextBox', textBox.id, 'new value:', e.target.value)
        // Don't update localText - let the DOM input handle its own value
        // We'll get the value from input.value when saving
      }
      
      const handleBlur = () => {
        // console.log('👁️ BLUR EVENT: input.value:', input.value)
        // Add a delay before saving to give user time to click back
        blurTimeoutRef.current = setTimeout(() => {
          // console.log('⏰ BLUR TIMEOUT: saving with input.value:', input.value)
          handleTextSave(input.value)
        }, 5000) // 5 second delay
      }
      
      const handleFocus = () => {
        // Clear the blur timeout if user focuses back
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current)
          blurTimeoutRef.current = null
        }
      }
      
      input.addEventListener('keydown', handleKeyDown)
      input.addEventListener('input', handleInput)
      input.addEventListener('blur', handleBlur)
      input.addEventListener('focus', handleFocus)
      
      return () => {
        // console.log('🧹 DOM INPUT cleanup running for:', textBox.id)
        if (inputRef.current && document.body.contains(inputRef.current)) {
          // console.log('🧹 Removing DOM input from body')
          input.removeEventListener('keydown', handleKeyDown)
          input.removeEventListener('input', handleInput)
          input.removeEventListener('blur', handleBlur)
          input.removeEventListener('focus', handleFocus)
          document.body.removeChild(inputRef.current)
          inputRef.current = null
        }
      }
    }
  }, [isEditing, textBox.id])


  const displayText = textBox.text_content || 'Double-click to edit'
  
  // Debug: Log when displayText changes
  // useEffect(() => {
  //   console.log('🔄 DISPLAY TEXT CHANGED:', textBox.id, 'isEditing:', isEditing, 'displayText:', displayText)
  // }, [displayText, isEditing, textBox.id])

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
        text={displayText}
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