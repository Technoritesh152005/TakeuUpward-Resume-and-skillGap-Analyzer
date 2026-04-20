import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../services/authStore.js'
import LoadingSpinner from '../common components/LoadingSpinner.jsx'
import toast from 'react-hot-toast';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loadUser } = useAuthStore();
  const hasProcessedRef = useRef(false);

//   every time a login success components loads this runs
  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    const processOAuthCallback = async () => {
      const error = searchParams.get('error');

      // Handle error
      if (error) {
        toast.error('Google sign-in failed. Please try again.');
        navigate('/login');
        return;
      }

      try {
        const userData = await loadUser();

        // Show success message
        toast.success(`Welcome back, ${userData.name || 'User'}!`, { id: 'oauth-success' });

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        toast.error('Failed to complete sign-in. Please try again.');

        navigate('/login', { replace: true });
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, loadUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="text-center">
        <div className="mb-6">
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Completing sign-in...
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
