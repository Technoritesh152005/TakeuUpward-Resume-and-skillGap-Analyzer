import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '../../services/authStore.js';
import LoadingSpinner from '../common components/LoadingSpinner';

// While accessing any protected route: check auth; if not logged in, save location and redirect to login.
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, hasCheckedAuth, loadUser } = useAuthStore();

  // Load user on mount if not already loaded
// when components loads it checks if valid
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Show loading spinner while checking auth
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  // Save the attempted location so we can redirect back after login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected component
  return children;
};

export default ProtectedRoute;
