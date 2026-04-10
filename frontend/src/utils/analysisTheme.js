import {
  ShieldCheck,
  Code2,
  Brush,
  Zap,
  LineChart,
  Cpu,
  Globe,
  Database,
  Terminal,
  Layers,
  Search,
  PenTool,
  Boxes,
  Microscope,
} from 'lucide-react';

export const ROLE_THEMES = {
  ENGINEERING: {
    id: 'engineering',
    name: 'Technical',
    primary: 'primary-600',
    primaryLight: 'primary-500',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/30',
    text: 'text-primary-400',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
    gradient: 'from-violet-600 to-indigo-600',
    icon: Terminal,
  },
  DESIGN: {
    id: 'design',
    name: 'Creative',
    primary: 'pink-600',
    primaryLight: 'pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    gradient: 'from-pink-600 to-rose-600',
    icon: Brush,
  },
  PRODUCT: {
    id: 'product',
    name: 'Strategic',
    primary: 'emerald-600',
    primaryLight: 'emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    gradient: 'from-emerald-600 to-teal-600',
    icon: Zap,
  },
  BUSINESS: {
    id: 'business',
    name: 'Growth',
    primary: 'amber-600',
    primaryLight: 'amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    gradient: 'from-amber-600 to-orange-600',
    icon: LineChart,
  },
  DEFAULT: {
    id: 'default',
    name: 'General',
    primary: 'sky-600',
    primaryLight: 'sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    glow: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]',
    gradient: 'from-sky-600 to-blue-600',
    icon: ShieldCheck,
  },
};

/**
 * Maps a job role category or title to a specific UI theme
 * @param {string} category - The category of the job role
 * @param {string} title - The title of the job role (fallback)
 * @returns {object} The theme configuration
 */
export const getRoleTheme = (category = '', title = '') => {
  const cat = String(category).toLowerCase();
  const t = String(title).toLowerCase();

  if (cat.includes('eng') || cat.includes('dev') || t.includes('software') || t.includes('web')) {
    return ROLE_THEMES.ENGINEERING;
  }
  if (cat.includes('design') || cat.includes('creative') || t.includes('designer') || t.includes('ui/ux')) {
    return ROLE_THEMES.DESIGN;
  }
  if (cat.includes('product') || cat.includes('manage') || t.includes('lead')) {
    return ROLE_THEMES.PRODUCT;
  }
  if (cat.includes('business') || cat.includes('sale') || cat.includes('market')) {
    return ROLE_THEMES.BUSINESS;
  }

  return ROLE_THEMES.DEFAULT;
};

export const getStatusConfig = (status) => {
  switch (status) {
    case 'completed':
      return { label: 'Completed', color: 'emerald', icon: ShieldCheck };
    case 'processing':
      return { label: 'Processing', color: 'blue', icon: Cpu };
    case 'queued':
      return { label: 'Queued', color: 'violet', icon: Layers };
    case 'failed':
      return { label: 'Failed', color: 'red', icon: Search };
    default:
      return { label: 'Unknown', color: 'neutral', icon: Boxes };
  }
};
