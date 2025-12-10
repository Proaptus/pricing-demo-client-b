import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Suppress browser extension communication errors
// Extensions like React DevTools, LastPass, etc. may try to communicate after port disconnect
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('Attempting to use a disconnected port object') ||
    event.message?.includes('Extension context invalidated') ||
    event.message?.includes('chrome.runtime') ||
    event.filename?.includes('proxy.js') ||
    event.filename?.includes('content-script')
  ) {
    // Suppress extension-related errors - they don't affect app functionality
    event.preventDefault()
    return false
  }
})

// Also handle unhandled promise rejections from extensions
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('Attempting to use a disconnected port object') ||
    event.reason?.message?.includes('Extension context invalidated')
  ) {
    event.preventDefault()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
