import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './AuthCallback.css'

export const AuthCallback = () => {
  const [status, setStatus] = useState('Verifying email...')
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('Verification failed. Please try again.')
          setTimeout(() => navigate('/'), 3000)
          return
        }

        if (data.session) {
          setStatus('Email verified successfully! Redirecting...')
          setTimeout(() => navigate('/auth/callback/success'), 1000)
        } else {
          setStatus('No active session found. Please try logging in.')
          setTimeout(() => navigate('/'), 3000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('Verification failed. Please try again.')
        setTimeout(() => navigate('/'), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="auth-callback">
      <div className="auth-callback-content">
        <div className="spinner"></div>
        <h2>{status}</h2>
        <p>Please wait while we verify your email address...</p>
      </div>
    </div>
  )
}
