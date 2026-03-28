import React from 'react';

const Logo = ({ className = '', showText = true, size = 'md' }) => {
  const sizes = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* ── Icon Logic: Stylized 'U' + Upward Arrow ── */}
      <div className={`relative ${iconSizes[size]} shrink-0 group`}>
        {/* Glow behind the icon */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
        
        {/* SVG Icon Container */}
        <div className="relative h-full w-full rounded-xl bg-neutral-950 border border-white/12 flex items-center justify-center overflow-hidden shadow-2xl">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            className="w-3/5 h-3/5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" /> {/* Primary-600 */}
                <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
              </linearGradient>
            </defs>
            {/* The Stylized 'U' + Arrow Path */}
            <path
              d="M10 12 V22 C10 27.52 14.48 32 20 32 C25.52 32 30 27.52 30 22 V20 M30 18 V8 M30 8 L24 14 M30 8 L36 14"
              stroke="url(#logo-gradient)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:stroke-white transition-colors duration-500"
            />
          </svg>
          
          {/* Subtle shine effect inside the icon box */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
      </div>

      {/* ── Text Branding ── */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black text-white uppercase tracking-[0.2em] leading-none ${size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-lg'}`}>
            TakeU<span className="text-primary-400">Upward</span>
          </span>
          {size === 'xl' && (
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] mt-1 text-center">AI Command Center</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
