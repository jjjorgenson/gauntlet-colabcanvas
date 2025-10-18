import { Group, Circle, Text } from 'react-konva'

export const Cursor = ({ x, y, username, color, isDragging = false }) => {
  return (
    <Group x={x} y={y}>
      {/* Cursor pointer */}
      <Circle
        x={0}
        y={0}
        radius={isDragging ? 5 : 4} // Slightly larger during drag
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      
      {/* Username label */}
      <Text
        x={8}
        y={-8}
        text={isDragging ? `${username} (dragging)` : username}
        fontSize={12}
        fontFamily="Arial"
        fill="#000000"
      />
    </Group>
  )
}

