import { useState } from 'react'
import { AppRouter } from './router'
import { AuthProvider } from './providers/AuthProvider'
import { SplashScreen } from '@/shared/components/SplashScreen'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <AuthProvider>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <AppRouter />
      )}
    </AuthProvider>
  )
}

export default App
