import { Group, Circle, Text } from 'react-konva'

export const Cursor = ({ x, y, username, color }) => {
  return (
    <Group x={x} y={y}>
      {/* Cursor pointer */}
      <Circle
        x={0}
        y={0}
        radius={4}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      
      {/* Username label */}
      <Text
        x={8}
        y={-8}
        text={username}
        fontSize={12}
        fontFamily="Arial"
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={1}
      />
    </Group>
  )
}

