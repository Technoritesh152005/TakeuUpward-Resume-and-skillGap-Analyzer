import { clsx } from 'clsx';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-neutral-100 text-neutral-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    primary: 'bg-primary-100 text-primary-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  const classes = clsx(
    baseStyles,
    variants[variant],
    sizes[size],
    className
  );
  
  return (
    <span className={classes}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;