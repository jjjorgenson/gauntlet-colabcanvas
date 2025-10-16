// Canvas Configuration
export const CANVAS_CONFIG = {
  WIDTH: 5000,
  HEIGHT: 5000,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  DEFAULT_ZOOM: 1,
  ZOOM_STEP: 0.1,
  ZOOM_ANIMATION_DURATION: 200, // ms
  SIDEBAR_WIDTH: 200, // px
  SHAPE_EDGE_PAN_THRESHOLD: 50, // px from edge when dragging shapes (future)
}

// Shape Configuration
export const SHAPE_CONFIG = {
  RECTANGLE: {
    DEFAULT_WIDTH: 100,
    DEFAULT_HEIGHT: 100,
    DEFAULT_COLOR: '#3B82F6',
    MIN_SIZE: 20,
  },
}

// Color Palette
export const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
]

// Realtime Configuration
export const REALTIME_CONFIG = {
  CURSOR_UPDATE_INTERVAL: 50, // ms
  PRESENCE_UPDATE_INTERVAL: 10000, // ms
  PRESENCE_TIMEOUT: 30000, // ms
  DRAG_UPDATE_INTERVAL: 100, // ms - throttle drag position updates
  TRANSFORM_UPDATE_INTERVAL: 100, // ms - throttle resize updates
}

// Database Table Names
export const TABLES = {
  CANVAS_OBJECTS: 'canvas_objects',
  USER_PRESENCE: 'user_presence',
}

