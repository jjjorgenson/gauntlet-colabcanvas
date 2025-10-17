import { describe, it, expect } from 'vitest'
import {
  isValidHexColor,
  hexToRgb,
  rgbToHex,
  generateRandomColor,
  getContrastColor,
  parseCustomColors,
  addCustomColor,
  getDefaultColors,
  lightenColor,
  darkenColor,
  hslToRgb,
  rgbToHsl
} from '../../../src/utils/colorUtils.js'

describe('ColorUtils', () => {
  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true)
      expect(isValidHexColor('#ff0000')).toBe(true)
      expect(isValidHexColor('#00FF00')).toBe(true)
      expect(isValidHexColor('#0000FF')).toBe(true)
      expect(isValidHexColor('#123ABC')).toBe(true)
    })

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('#GG0000')).toBe(false)
      expect(isValidHexColor('#FF00')).toBe(false)
      expect(isValidHexColor('FF0000')).toBe(false)
      expect(isValidHexColor('#FF00000')).toBe(false)
      expect(isValidHexColor('')).toBe(false)
      expect(isValidHexColor(null)).toBe(false)
      expect(isValidHexColor(undefined)).toBe(false)
    })
  })

  describe('hexToRgb', () => {
    it('should convert hex to RGB correctly', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 })
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    })

    it('should return default black for invalid hex colors', () => {
      expect(hexToRgb('#GG0000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('rgbToHex', () => {
    it('should convert RGB to hex correctly', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#FF0000')
      expect(rgbToHex(0, 255, 0)).toBe('#00FF00')
      expect(rgbToHex(0, 0, 255)).toBe('#0000FF')
      expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF')
      expect(rgbToHex(0, 0, 0)).toBe('#000000')
    })

    it('should clamp values to 0-255 range', () => {
      expect(rgbToHex(-10, 300, 128)).toBe('#00FF80')
      expect(rgbToHex(0, 0, 0)).toBe('#000000')
      expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF')
    })
  })

  describe('generateRandomColor', () => {
    it('should generate valid hex colors', () => {
      const color = generateRandomColor()
      expect(isValidHexColor(color)).toBe(true)
      expect(color).toMatch(/^#[0-9A-F]{6}$/)
    })

    it('should generate different colors on multiple calls', () => {
      const colors = Array.from({ length: 10 }, () => generateRandomColor())
      const uniqueColors = new Set(colors)
      // Very unlikely to have duplicates in 10 random colors
      expect(uniqueColors.size).toBeGreaterThan(1)
    })
  })

  describe('getContrastColor', () => {
    it('should return black for light backgrounds', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#000000')
      expect(getContrastColor('#FFFF00')).toBe('#000000')
      expect(getContrastColor('#00FFFF')).toBe('#000000')
    })

    it('should return white for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#FFFFFF')
      expect(getContrastColor('#800000')).toBe('#FFFFFF')
      expect(getContrastColor('#000080')).toBe('#FFFFFF')
    })

    it('should return white for invalid colors (default black background)', () => {
      expect(getContrastColor('invalid')).toBe('#FFFFFF')
      expect(getContrastColor('')).toBe('#FFFFFF')
    })
  })

  describe('parseCustomColors', () => {
    it('should parse valid color arrays', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF']
      expect(parseCustomColors(colors)).toEqual(colors)
    })

    it('should filter out invalid colors', () => {
      const colors = ['#FF0000', 'invalid', '#00FF00', '#GG0000']
      expect(parseCustomColors(colors)).toEqual(['#FF0000', '#00FF00'])
    })

    it('should limit to 3 colors', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
      expect(parseCustomColors(colors)).toEqual(['#FF0000', '#00FF00', '#0000FF'])
    })

    it('should handle non-array input', () => {
      expect(parseCustomColors(null)).toEqual([])
      expect(parseCustomColors(undefined)).toEqual([])
      expect(parseCustomColors('not an array')).toEqual([])
    })
  })

  describe('addCustomColor', () => {
    it('should add new color to beginning of array', () => {
      const currentColors = ['#FF0000', '#00FF00']
      const newColors = addCustomColor(currentColors, '#0000FF')
      expect(newColors).toEqual(['#0000FF', '#FF0000', '#00FF00'])
    })

    it('should remove duplicate and add to beginning', () => {
      const currentColors = ['#FF0000', '#00FF00', '#0000FF']
      const newColors = addCustomColor(currentColors, '#FF0000')
      expect(newColors).toEqual(['#FF0000', '#00FF00', '#0000FF'])
    })

    it('should limit to 3 colors (FIFO)', () => {
      const currentColors = ['#FF0000', '#00FF00', '#0000FF']
      const newColors = addCustomColor(currentColors, '#FFFF00')
      expect(newColors).toEqual(['#FFFF00', '#FF0000', '#00FF00'])
    })

    it('should throw error for invalid colors', () => {
      expect(() => addCustomColor([], 'invalid')).toThrow('Invalid hex color: invalid')
    })
  })

  describe('getDefaultColors', () => {
    it('should return array of 5 default colors', () => {
      const colors = getDefaultColors()
      expect(colors).toHaveLength(5)
      expect(colors).toEqual([
        '#3B82F6', // Blue
        '#EF4444', // Red
        '#10B981', // Green
        '#F59E0B', // Yellow
        '#8B5CF6', // Purple
      ])
    })

    it('should return valid hex colors', () => {
      const colors = getDefaultColors()
      colors.forEach(color => {
        expect(isValidHexColor(color)).toBe(true)
      })
    })
  })

  describe('lightenColor', () => {
    it('should lighten colors correctly', () => {
      expect(lightenColor('#FF0000', 50)).toBe('#FF8080')
      expect(lightenColor('#000000', 50)).toBe('#808080')
      expect(lightenColor('#000000', 100)).toBe('#FFFFFF')
    })

    it('should return default color for invalid input', () => {
      expect(lightenColor('invalid', 50)).toBe('#808080')
    })
  })

  describe('darkenColor', () => {
    it('should darken colors correctly', () => {
      expect(darkenColor('#FF0000', 50)).toBe('#800000')
      expect(darkenColor('#FFFFFF', 50)).toBe('#808080')
      expect(darkenColor('#FFFFFF', 100)).toBe('#000000')
    })

    it('should return default color for invalid input', () => {
      expect(darkenColor('invalid', 50)).toBe('#000000')
    })
  })

  describe('hslToRgb', () => {
    it('should convert HSL to RGB correctly', () => {
      expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 }) // Red
      expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 }) // Green
      expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 }) // Blue
    })

    it('should handle edge cases', () => {
      expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 }) // Black
      expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 }) // White
    })
  })

  describe('rgbToHsl', () => {
    it('should convert RGB to HSL correctly', () => {
      expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 }) // Red
      expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 }) // Green
      expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 }) // Blue
    })

    it('should handle edge cases', () => {
      expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 }) // Black
      expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 }) // White
    })
  })
})
