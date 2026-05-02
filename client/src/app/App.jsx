import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from 'react-router'
import { router } from './routes'
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from './providers/ThemeContext'
import { Toaster } from '@/shared/components/ui/sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

function App() {
  useEffect(() => {
    const handler = () => {
      // Clear auth state and redirect to login
      // Note: In this app, we can clear the session and let the AuthProvider or router handle it.
      // For now, we'll just reload to clear state if needed or rely on the redirect logic in apiClient.
      window.location.href = "/login";
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
