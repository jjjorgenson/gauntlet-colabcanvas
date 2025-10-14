import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export const LoginForm = () => {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showVerificationBanner, setShowVerificationBanner] = useState(false)
  const { login, signup } = useAuth()

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  // Username validation (3+ chars, alphanumeric + underscore)
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return false
    }
    
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return false
    }
    
    if (!password.trim()) {
      setError('Please enter a password')
      return false
    }
    
    if (isSignup && !username.trim()) {
      setError('Please enter a username')
      return false
    }
    
    if (isSignup && !usernameRegex.test(username)) {
      setError('Username must be at least 3 characters and contain only letters, numbers, and underscores')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError('')
    setShowVerificationBanner(false)

    try {
      if (isSignup) {
        await signup(email.trim(), password, username.trim())
        setShowVerificationBanner(true)
        setError('')
      } else {
        await login(email.trim(), password)
      }
    } catch (err) {
      // Handle specific error messages for signup
      if (isSignup) {
        if (err.message.includes('already registered')) {
          setError('This email is already registered. Please try logging in instead.')
        } else if (err.message.includes('username')) {
          setError('Username is already taken. Please choose a different username.')
        } else if (err.message.includes('password')) {
          setError('Password is too weak. Please choose a stronger password.')
        } else {
          setError(err.message || 'Signup failed. Please try again.')
        }
      } else {
        // Generic error for login
        setError('Invalid email or password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>CollabCanvas</h1>
        <p>{isSignup ? 'Create an account to start collaborating' : 'Sign in to your account'}</p>
        
        {/* Tab Toggle */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-button ${!isSignup ? 'active' : ''}`}
            onClick={() => {
              setIsSignup(false)
              setError('')
              setShowVerificationBanner(false)
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`tab-button ${isSignup ? 'active' : ''}`}
            onClick={() => {
              setIsSignup(true)
              setError('')
              setShowVerificationBanner(false)
            }}
          >
            Sign Up
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>
          
          {isSignup && (
            <div className="form-group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                disabled={isLoading}
              />
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {showVerificationBanner && (
            <div className="verification-banner">
              <p>✅ Account created! Please check your email and verify your account before logging in.</p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="login-button"
          >
            {isLoading 
              ? (isSignup ? 'Creating Account...' : 'Signing In...') 
              : (isSignup ? 'Create Account' : 'Sign In')
            }
          </button>
        </form>
      </div>
    </div>
  )
}

