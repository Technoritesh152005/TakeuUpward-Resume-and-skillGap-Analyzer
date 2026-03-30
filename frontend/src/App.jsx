import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/landingPage.jsx'
import LoginPage from './pages/loginPage.jsx'
import SignupPage from './pages/signupPages.jsx';
import ForgotPasswordPage from './pages/forgotPasswordPage.jsx';
import ResetPasswordPage from './pages/resetPasswordPage.jsx';
import OAuthCallback from './components/auth/OAuthCallback.jsx'
import DashboardPage from './pages/dashBoardPage.jsx'
import ResumeUpload from './pages/uploadResume.jsx'
import MyResumesPage from './pages/resumePage.jsx'
import DetailedResumeOverviewPage from './pages/detailedResumeOverviewPage.jsx'

import AnalysisPage from './pages/analysisPage.jsx'
import AnalysisListPage from './pages/analysisListPage.jsx'
import AnalysisDetailPage from './pages/analysisDetailPage.jsx'
import RoadmapListPage from './pages/roadmapListPage.jsx'
import RoadmapDetailPage from './pages/roadmapDetailPage.jsx'
import RoadmapCreatePage from './pages/roadmapCreatePage.jsx'
import JobRoleListPage from './pages/jobRolesPage.jsx'
import JobRoleDetailPage from './pages/jobRoleDetailPage.jsx'
import ProfilePage from './pages/profilePage.jsx'
// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

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
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resumes"
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route index element={<MyResumesPage />} />
            <Route path=":id" element={<DetailedResumeOverviewPage />} />
          </Route>

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <ResumeUpload />
              </ProtectedRoute>
            }
          />

          
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <AnalysisListPage />
              </ProtectedRoute>
            }
          />

<Route
            path="/analysis/create"
            element={
              <ProtectedRoute>
                <AnalysisPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analysis/:id"
            element={
              <ProtectedRoute>
                <AnalysisDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <RoadmapListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roadmap/create"
            element={
              <ProtectedRoute>
                <RoadmapCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roadmap/:id"
            element={
              <ProtectedRoute>
                <RoadmapDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/job-roles"
            element={
              <ProtectedRoute>
               <JobRoleListPage/>
              </ProtectedRoute>
            }
          />
           <Route
            path="/job-roles/:id"
            element={
              <ProtectedRoute>
               <JobRoleDetailPage/>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                      ⚙️ Settings Page
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      Coming soon! Manage your settings here.
                    </p>
                    <a
                      href="/dashboard"
                      className="inline-block px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      Back to Dashboard
                    </a>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#0f172a',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              padding: '16px',
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


