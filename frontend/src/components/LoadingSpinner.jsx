import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  text,
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  
  const colors = {
    primary: 'text-primary-600',
    white: 'text-white',
    neutral: 'text-neutral-600',
  };
  
  const spinner = (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={clsx(sizes[size], colors[color], 'animate-spin')} />
      {text && (
        <p className={clsx('text-sm font-medium', colors[color])}>
          {text}
        </p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }
  
  return spinner;
};

export default LoadingSpinner;