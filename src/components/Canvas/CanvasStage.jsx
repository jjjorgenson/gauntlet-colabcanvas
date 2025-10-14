import { forwardRef, useState, useEffect, useRef } from 'react'
import { Stage, Layer, Transformer, Rect } from 'react-konva'
import { CANVAS_CONFIG } from '../../lib/constants'

export const CanvasStage = forwardRef(({ 
  children, 
  onStageClick, 
  onStageDrag, 
  onWheel,
  onMouseMove,
  selectedShapeId
}, ref) => {
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth - CANVAS_CONFIG.SIDEBAR_WIDTH,
    height: window.innerHeight
  })
  const transformerRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth - CANVAS_CONFIG.SIDEBAR_WIDTH,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedShapeId) {
      // Find the selected shape node
      const stage = transformerRef.current.getStage()
      const selectedNode = stage.findOne(`#${selectedShapeId}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer().batchDraw()
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [selectedShapeId])

  return (
    <Stage
      ref={ref}
      width={stageSize.width}
      height={stageSize.height}
      draggable
      onDragEnd={onStageDrag}
      onClick={onStageClick}
      onWheel={onWheel}
      onMouseMove={onMouseMove}
      scaleX={CANVAS_CONFIG.DEFAULT_ZOOM}
      scaleY={CANVAS_CONFIG.DEFAULT_ZOOM}
    >
      <Layer>
        {/* Canvas background to show 5000x5000 workspace boundaries */}
        <Rect
          x={0}
          y={0}
          width={CANVAS_CONFIG.WIDTH}
          height={CANVAS_CONFIG.HEIGHT}
          fill="#f8f8f8"
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
        {children}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to workspace boundaries
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox
            }
            return newBox
          }}
        />
      </Layer>
    </Stage>
  )
})

CanvasStage.displayName = 'CanvasStage'
