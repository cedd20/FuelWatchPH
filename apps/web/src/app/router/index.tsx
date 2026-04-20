import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { MainLayout } from '@/shared/layouts/MainLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuth } from '../providers/AuthProvider'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 animate-pulse font-medium italic">Preparing your workspace...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick stats or cards will go here */}
            <div className="h-32 bg-slate-100 dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 animate-pulse"></div>
            <div className="h-32 bg-slate-100 dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 animate-pulse delay-75"></div>
            <div className="h-32 bg-slate-100 dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 animate-pulse delay-150"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginForm />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
