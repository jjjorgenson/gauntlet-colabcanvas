import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './EmailVerificationSuccess.css'

export const EmailVerificationSuccess = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Auto-redirect to login page after 3 seconds
    const timer = setTimeout(() => {
      navigate('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="email-verification-success">
      <div className="success-content">
        <div className="success-icon">✅</div>
        <h2>Email verified successfully!</h2>
        <p>You can now close this window and login</p>
        <p className="redirect-text">Redirecting to login page in 3 seconds...</p>
      </div>
    </div>
  )
}
