import { useState ,useEffect} from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common components/Button.jsx';
import Input from '../common components/input.jsx';
import useAuthStore from '../../services/authStore.js'
import GoogleSignInButton from '../common components/googleSignInButton.jsx';

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearError } = useAuthStore();
  useEffect(() => {
    clearError();
  }, [clearError]);
  const { login, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

//   states to manage whether to show pass or not
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

//   whenever there is event on form this gets called
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

//   used to validate form inputs
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid or doesnt match email pattern';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // if there is validation in form dont submit
    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });

      toast.success('Welcome back! 🎉');
      // Redirect to dashboard, or to the page user was trying to visit (e.g. from ProtectedRoute)
      const from = location?.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.message || err?.error || 'Login failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Email Address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="email@example.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={validationErrors.email}
          disabled={isLoading}
        />
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          error={validationErrors.password}
          disabled={isLoading}
        />
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            disabled={isLoading}
          />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Remember me</span>
        </label>

        <Link
          to="/forgot-password"
          className="text-sm font-medium text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400"
        >
          Forgot password?
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="font-medium text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400"
        >
          Sign up for free
        </Link>
      </p>

      <div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
      Or continue with
    </span>
  </div>
</div>

{/* Google Sign In */}
<GoogleSignInButton text="Sign in with Google" />
    </form>
  );
};

export default LoginForm;