import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Button from '../common components/Button';
import ThemeToggle from '../common components/themeToggle';
import brandLogo from '../../assets/Gemini_Generated_Image_hi4jb6hi4jb6hi4j.png';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Detect scroll for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
        // sets scrolled state
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

//   items for nav 
  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#workflow' },
    { name: 'Job Roles', href: '/job-roles' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white dark:bg-neutral-900 shadow-md'
          : 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={brandLogo}
              alt="TakeuUpward logo"
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span className="text-xl font-bold">
  <span className="text-neutral-900 dark:text-white">Takeu</span>
  <span className="text-primary-600 dark:text-primary-500">Upward</span>
</span>
          </Link>

          {/* Desktop Navigation.. specially for desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-500 font-medium transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons + Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-700 py-4 animate-slide-down">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-500 font-medium transition-colors px-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    navigate('/signup');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;