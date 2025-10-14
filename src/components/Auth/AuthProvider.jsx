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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    })
    
    if (error) {
      // Handle specific Supabase error messages
      if (error.message.includes('already registered')) {
        throw new Error('This email is already registered')
      } else if (error.message.includes('username')) {
        throw new Error('Username is already taken')
      } else if (error.message.includes('password')) {
        throw new Error('Password is too weak')
      }
      throw error
    }
    
    return data
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      // Generic error message for login
      throw new Error('Invalid email or password')
    }
    
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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
