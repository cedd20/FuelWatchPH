import { RouterProvider } from 'react-router'
import { router } from './routes'
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from './providers/ThemeContext'
import { Toaster } from '@/shared/components/ui/sonner'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
