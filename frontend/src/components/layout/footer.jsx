import { Link } from 'react-router-dom';
import { FileText, Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

//   list of nav items..
  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'How It Works', href: '#workflow' },
      { name: 'Job Roles', href: '/job-roles' },
    ],
    resources: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Upload Resume', href: '/upload' },
      { name: 'My Resumes', href: '/resumes' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
    ],
  };

  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-neutral-300">
      <div className="container-custom py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Takeu<span className="text-primary-500">Upward</span>
              </span>
            </div>
            <p className="text-neutral-400 mb-4 max-w-sm">
              AI-powered career guidance platform helping students identify skill gaps 
              and build personalized learning roadmaps.More features and with better service is coming soon...
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/Technoritesh152005"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-primary-500 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/in/riteshkhilari"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-primary-500 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-primary-500 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-neutral-400 hover:text-primary-500 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-neutral-400 hover:text-primary-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-800 dark:border-neutral-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-400 text-sm">
              © {currentYear} TakeuUpward. All rights reserved and will be reserved forward.
            </p>
            <p className="text-neutral-400 text-sm">
              Made by{' '}
              <a
                href="https://riteshkhilari.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-400 transition-colors"
              >
                Ritesh Khilari
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
