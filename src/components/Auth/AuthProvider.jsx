import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }
      setUser(session?.user ?? null)
      setLoading(false)
      clearTimeout(timeout)
    }).catch((error) => {
      console.error('Error in getSession:', error)
      setLoading(false)
      clearTimeout(timeout)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      clearTimeout(timeout)
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signup = async (email, password, username) => {
    console.log('Attempting signup with:', { email, username, password: password ? 'Present' : 'Missing' })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        },
        // Use production URL for email verification redirect
        // This URL must be whitelisted in Supabase Auth settings
        // For local testing, you can temporarily change this to:
        // emailRedirectTo: `http://localhost:5173/auth/callback`
        emailRedirectTo: `https://gauntlet-colabcanvas.vercel.app/auth/callback`
      }
    })
    
    if (error) {
      console.error('Signup error:', error)
      // Handle specific Supabase error messages
      if (error.message.includes('already registered')) {
        throw new Error('This email is already registered')
      } else if (error.message.includes('username')) {
        throw new Error('Username is already taken')
      } else if (error.message.includes('password')) {
        throw new Error('Password is too weak')
      } else if (error.message.includes('500')) {
        throw new Error('Server error during signup. Please try again.')
      }
      throw new Error(`Signup failed: ${error.message}`)
    }
    
    console.log('Signup successful:', data)
    return data
  }

  const login = async (email, password) => {
    console.log('Attempting login with:', { email, password: password ? 'Present' : 'Missing' })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Login error:', error)
      // More specific error handling
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password')
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and confirm your account before logging in')
      } else {
        throw new Error(`Login failed: ${error.message}`)
      }
    }
    
    console.log('Login successful:', data)
    return data
  }

  const logout = async () => {
    try {
      // Clear local state first
      setUser(null)
      
      // Try to sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) {
        console.error('Logout error:', error)
        // Error is logged but we've already cleared local state
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Error is logged but we've already cleared local state
    }
  }

  // Get username from user metadata or email fallback
  const getUsername = () => {
    if (!user) return 'Anonymous'
    
    // First try to get from user_metadata (set during signup)
    if (user.user_metadata?.username) {
      return user.user_metadata.username
    }
    
    // Fallback to email prefix
    if (user.email) {
      return user.email.split('@')[0]
    }
    
    return 'Anonymous'
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    isAuthenticated: !!user,
    username: getUsername()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
