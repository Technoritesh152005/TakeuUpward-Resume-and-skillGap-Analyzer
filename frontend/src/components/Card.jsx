import { clsx } from 'clsx';

const Card = ({
  children,
  variant = 'elevated',
  padding = 'normal',
  hover = false,
  onClick,
  className,
}) => {
  const baseStyles = 'bg-white rounded-card transition-all duration-200';
  
  const variants = {
    elevated: 'shadow-card hover:shadow-strong',
    flat: 'border border-neutral-200',
    outlined: 'border-2 border-neutral-300',
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
  };
  
  const classes = clsx(
    baseStyles,
    variants[variant],
    paddings[padding],
    hover && 'cursor-pointer hover:scale-[1.02]',
    onClick && 'cursor-pointer',
    className
  );
  
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

// Card subcomponents
Card.Header = ({ children, className }) => (
  <div className={clsx('mb-4 pb-4 border-b border-neutral-200', className)}>
    {children}
  </div>
);

Card.Title = ({ children, className }) => (
  <h3 className={clsx('text-xl font-semibold text-neutral-900', className)}>
    {children}
  </h3>
);

Card.Description = ({ children, className }) => (
  <p className={clsx('text-neutral-600 mt-1', className)}>
    {children}
  </p>
);

Card.Body = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

Card.Footer = ({ children, className }) => (
  <div className={clsx('mt-4 pt-4 border-t border-neutral-200', className)}>
    {children}
  </div>
);

export default Card;