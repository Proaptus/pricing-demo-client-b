import React, { useState, useEffect } from 'react'
import RedPegasusPricingCalculator from './components/RedPegasusPricingCalculator'
import Login from './components/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is already authenticated on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated')
    console.log('Auth status from sessionStorage:', authStatus)
    console.log('Is authenticated:', authStatus === 'true')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated')
    setIsAuthenticated(false)
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    console.log('Rendering Login component')
    return <Login onLogin={handleLogin} />
  }

  // Show Pricing Model if authenticated
  console.log('Rendering Pricing Model component')
  return (
    <div className="min-h-screen bg-slate-50">
      <RedPegasusPricingCalculator onLogout={handleLogout} />
    </div>
  )
}

export default App
