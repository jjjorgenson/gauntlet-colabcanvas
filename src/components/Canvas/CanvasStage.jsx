import { forwardRef } from 'react'
import { Stage, Layer } from 'react-konva'
import { CANVAS_CONFIG } from '../../lib/constants'

export const CanvasStage = forwardRef(({ 
  children, 
  onStageClick, 
  onStageDrag, 
  onWheel,
  onMouseMove
}, ref) => {
  return (
    <Stage
      ref={ref}
      width={window.innerWidth}
      height={window.innerHeight}
      draggable
      onDragEnd={onStageDrag}
      onClick={onStageClick}
      onWheel={onWheel}
      onMouseMove={onMouseMove}
      scaleX={CANVAS_CONFIG.DEFAULT_ZOOM}
      scaleY={CANVAS_CONFIG.DEFAULT_ZOOM}
    >
      <Layer>
        {children}
      </Layer>
    </Stage>
  )
})

CanvasStage.displayName = 'CanvasStage'
