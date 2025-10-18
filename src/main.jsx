import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress React DevTools warning
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('Download the React DevTools')) {
    return // Suppress this specific warning
  }
  originalConsoleWarn.apply(console, args)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
