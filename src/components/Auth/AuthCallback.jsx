import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './AuthCallback.css'

export const AuthCallback = () => {
  const [status, setStatus] = useState('Verifying email...')
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback with URL fragments
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('Verification failed. Please try again.')
          setTimeout(() => navigate('/'), 3000)
          return
        }

        if (data.session) {
          setStatus('Email verified successfully! ✅')
          setIsSuccess(true)
          // Auto-redirect to login page after 3 seconds
          setTimeout(() => navigate('/'), 3000)
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
        {!isSuccess && <div className="spinner"></div>}
        {isSuccess && <div className="success-icon">✅</div>}
        <h2>{status}</h2>
        {isSuccess ? (
          <>
            <p>You can now close this window and login</p>
            <p className="redirect-text">Redirecting to login page in 3 seconds...</p>
          </>
        ) : (
          <p>Please wait while we verify your email address...</p>
        )}
      </div>
    </div>
  )
}
