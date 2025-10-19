import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { TABLES } from '../../lib/constants'

export const SettingsDropdown = ({ user, username, email }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Load user's theme preference on mount
  useEffect(() => {
    const loadUserTheme = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from(TABLES.PROFILES)
          .select('theme')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error loading user theme:', error)
          return
        }

        if (data?.theme) {
          setTheme(data.theme)
          applyTheme(data.theme)
        }
      } catch (error) {
        console.error('Error in loadUserTheme:', error)
      }
    }

    loadUserTheme()
  }, [user?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Apply theme to document
  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName)
    console.log('🎨 Theme applied:', themeName)
  }

  // Save theme preference to Supabase
  const saveTheme = async (newTheme) => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({ 
          theme: newTheme,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving theme:', error)
        return
      }

      setTheme(newTheme)
      applyTheme(newTheme)
      console.log('✅ Theme saved:', newTheme)
    } catch (error) {
      console.error('Error in saveTheme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeChange = (newTheme) => {
    saveTheme(newTheme)
  }


  return (
    <div className="settings-container" ref={dropdownRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="settings-button"
        title="Settings"
      >
        ⚙️
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="settings-dropdown">
          <div className="settings-header">
            <h4>Settings</h4>
            <button 
              onClick={() => setIsOpen(false)}
              className="close-button"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="settings-content">
            {/* User Info */}
            <div className="user-info">
              <div className="info-item">
                <label>Username:</label>
                <span>{username || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{email || 'N/A'}</span>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="theme-section">
              <label className="section-label">Theme:</label>
              <div className="theme-options">
                {[
                  { value: 'light', label: 'Light', description: 'Clean and bright' },
                  { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
                  { value: 'darker', label: 'Darker', description: 'High contrast' }
                ].map((option) => (
                  <label key={option.value} className="theme-option">
                    <input
                      type="radio"
                      name="theme"
                      value={option.value}
                      checked={theme === option.value}
                      onChange={() => handleThemeChange(option.value)}
                      disabled={isLoading}
                    />
                    <div className="theme-info">
                      <span className="theme-label">{option.label}</span>
                      <span className="theme-description">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
