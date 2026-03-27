/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── PRIMARY: Violet — Intelligence, AI, Ambition ───────────────
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },

        // ─── ACCENT: Electric Blue — CTAs, links, highlights ────────────
        accent: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        // ─── ENERGY: Fuchsia/Pink — Excitement, CTA pop, highlights ────────
        energy: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },

        // ─── FRESH: Cyan — Innovation, tech clarity, skill indicators ────────
        fresh: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },

        // ─── NEUTRAL: Blue-charcoal — Professional, dark surfaces ────────
        neutral: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#131c2e',
          900: '#0d1424',
          950: '#080e1a',
        },

        // ─── SUCCESS: Emerald — Match scores, completed items ────────────
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },

        // ─── WARNING: Amber — Skill gaps, in-progress ────────────────────
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        // ─── DANGER: Rose — Errors, missing skills ───────────────────────
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },

      // ─── FONTS ─────────────────────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      // ─── BORDER RADIUS ─────────────────────────────────────────────────
      borderRadius: {
        card: '16px',
        xl2: '20px',
        xl3: '24px',
      },

      // ─── SHADOWS ───────────────────────────────────────────────────────
      boxShadow: {
        'soft':   '0 2px 8px rgba(0,0,0,0.06)',
        'card':   '0 4px 16px rgba(0,0,0,0.10)',
        'strong': '0 8px 32px rgba(0,0,0,0.18)',
        'glow-sm':    '0 0 16px rgba(139,92,246,0.25)',
        'glow':      '0 0 32px rgba(139,92,246,0.30)',
        'glow-lg':   '0 0 64px rgba(139,92,246,0.35)',
        'glow-cyan': '0 0 28px rgba(6,182,212,0.30)',
        'glow-pink': '0 0 28px rgba(217,70,239,0.30)',
        'dark-lg':'0 24px 64px rgba(0,0,0,0.55)',
      },

      // ─── ANIMATIONS ────────────────────────────────────────────────────
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.5s ease-out',
        'aurora-1':   'aurora1 14s ease-in-out infinite',
        'aurora-2':   'aurora2 18s ease-in-out infinite',
        'aurora-3':   'aurora3 22s ease-in-out infinite',
        'aurora-4':   'aurora4 16s ease-in-out infinite',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in':   'scaleIn 0.3s ease-out',
        'float':      'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer':    'shimmer 2.2s linear infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        slideUp:    { '0%': { transform:'translateY(16px)', opacity:'0' }, '100%': { transform:'translateY(0)', opacity:'1' } },
        slideDown:  { '0%': { transform:'translateY(-10px)', opacity:'0' }, '100%': { transform:'translateY(0)', opacity:'1' } },
        scaleIn:    { '0%': { transform:'scale(0.96)', opacity:'0' }, '100%': { transform:'scale(1)', opacity:'1' } },
        float:      { '0%,100%': { transform:'translateY(0px)' }, '50%': { transform:'translateY(-12px)' } },
        aurora1: {
          '0%,100%': { transform:'translate(0%, 0%) scale(1)' },
          '25%':     { transform:'translate(4%, -6%) scale(1.12)' },
          '50%':     { transform:'translate(-3%, 4%) scale(0.92)' },
          '75%':     { transform:'translate(6%, 2%) scale(1.06)' },
        },
        aurora2: {
          '0%,100%': { transform:'translate(0%, 0%) scale(1)' },
          '30%':     { transform:'translate(-5%, 4%) scale(1.08)' },
          '60%':     { transform:'translate(4%, -3%) scale(0.94)' },
          '80%':     { transform:'translate(-2%, -5%) scale(1.1)' },
        },
        aurora3: {
          '0%,100%': { transform:'translate(0%, 0%) scale(1)' },
          '20%':     { transform:'translate(3%, 5%) scale(0.9)' },
          '55%':     { transform:'translate(-4%, -3%) scale(1.15)' },
          '75%':     { transform:'translate(5%, -2%) scale(0.96)' },
        },
        aurora4: {
          '0%,100%': { transform:'translate(0%, 0%) scale(1)' },
          '40%':     { transform:'translate(-3%, -4%) scale(1.1)' },
          '70%':     { transform:'translate(4%, 3%) scale(0.93)' },
        },
        pulseSoft:  { '0%,100%': { opacity:'1' }, '50%': { opacity:'0.7' } },
        shimmer:    { '0%': { transform:'translateX(-100%)' }, '100%': { transform:'translateX(200%)' } },
      },

      // ─── BACKGROUND SIZE ───────────────────────────────────────────────
      backgroundSize: {
        '200%': '200%',
      },
    },
  },
  plugins: [],
};