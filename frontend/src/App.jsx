import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-neutral-50">
          {/* Temporary content - we'll add routes later */}
          <div className="container-custom section-padding">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gradient mb-4">
                Resume Analyzer
              </h1>
              <p className="text-xl text-neutral-600 mb-8">
                AI-Powered Career Guidance Platform
              </p>
              <div className="card max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4">🚀 Project Setup Complete!</h2>
                <p className="text-neutral-600 mb-4">
                  Frontend is running successfully. We'll add components next.
                </p>
                <div className="flex gap-4 justify-center">
                  <span className="badge badge-success">✓ React 18</span>
                  <span className="badge badge-success">✓ Vite</span>
                  <span className="badge badge-success">✓ Tailwind CSS</span>
                  <span className="badge badge-success">✓ React Router</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#0f172a',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#059669',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;