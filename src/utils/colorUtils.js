/**
 * Color utility functions for the CanvasCollab application
 */

/**
 * Validate hex color format
 * @param {string} color - Hex color string (e.g., "#FF0000")
 * @returns {boolean} - True if valid hex color
 */
export const isValidHexColor = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color)
}

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string (e.g., "#FF0000")
 * @returns {object} - RGB object {r, g, b}
 */
export const hexToRgb = (hex) => {
  if (!isValidHexColor(hex)) {
    console.warn(`Invalid hex color: ${hex}. Returning default black.`)
    return { r: 0, g: 0, b: 0 }
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Convert RGB object to hex color
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} - Hex color string
 */
export const rgbToHex = (r, g, b) => {
  // Clamp values to 0-255 range
  const clamp = (val) => Math.max(0, Math.min(255, Math.round(val)))
  
  const hexR = clamp(r).toString(16).padStart(2, '0')
  const hexG = clamp(g).toString(16).padStart(2, '0')
  const hexB = clamp(b).toString(16).padStart(2, '0')
  
  return `#${hexR}${hexG}${hexB}`.toUpperCase()
}

/**
 * Generate a random color
 * @returns {string} - Random hex color
 */
export const generateRandomColor = () => {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return rgbToHex(r, g, b)
}

/**
 * Get contrast color (black or white) for a given background color
 * @param {string} backgroundColor - Hex background color
 * @returns {string} - "#000000" for light backgrounds, "#FFFFFF" for dark backgrounds
 */
export const getContrastColor = (backgroundColor) => {
  const rgb = hexToRgb(backgroundColor)
  
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Parse and validate custom colors array
 * @param {Array} colors - Array of color strings
 * @returns {Array} - Array of valid hex colors
 */
export const parseCustomColors = (colors) => {
  if (!Array.isArray(colors)) {
    return []
  }
  
  return colors
    .filter(color => typeof color === 'string' && isValidHexColor(color))
    .slice(0, 3) // Limit to 3 custom colors as per PRD
}

/**
 * Add color to custom colors array (FIFO, max 3 colors)
 * @param {Array} currentColors - Current custom colors array
 * @param {string} newColor - New color to add
 * @returns {Array} - Updated custom colors array
 */
export const addCustomColor = (currentColors, newColor) => {
  if (!isValidHexColor(newColor)) {
    throw new Error(`Invalid hex color: ${newColor}`)
  }
  
  const colors = parseCustomColors(currentColors)
  
  // Remove if already exists
  const filteredColors = colors.filter(color => color !== newColor)
  
  // Add to beginning
  const newColors = [newColor, ...filteredColors]
  
  // Limit to 3 colors (FIFO)
  return newColors.slice(0, 3)
}

/**
 * Get default color palette
 * @returns {Array} - Array of default hex colors
 */
export const getDefaultColors = () => [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
]

/**
 * Lighten a color by a percentage
 * @param {string} hex - Hex color string
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} - Lightened hex color
 */
export const lightenColor = (hex, percent) => {
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return hex
  }
  
  const factor = percent / 100
  const newR = rgb.r + (255 - rgb.r) * factor
  const newG = rgb.g + (255 - rgb.g) * factor
  const newB = rgb.b + (255 - rgb.b) * factor
  
  return rgbToHex(newR, newG, newB)
}

/**
 * Darken a color by a percentage
 * @param {string} hex - Hex color string
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} - Darkened hex color
 */
export const darkenColor = (hex, percent) => {
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return hex
  }
  
  const factor = percent / 100
  const newR = rgb.r * (1 - factor)
  const newG = rgb.g * (1 - factor)
  const newB = rgb.b * (1 - factor)
  
  return rgbToHex(newR, newG, newB)
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {object} - RGB object {r, g, b}
 */
export const hslToRgb = (h, s, l) => {
  h = h / 360
  s = s / 100
  l = l / 100
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  
  let r, g, b
  
  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {object} - HSL object {h, s, l}
 */
export const rgbToHsl = (r, g, b) => {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  
  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}
