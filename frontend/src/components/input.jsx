import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

const Input = ({
  label,
  type = 'text',
  name,
  id,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  const inputId = id || name;
  
  const inputClasses = clsx(
    'w-full px-4 py-3 rounded-lg border transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:border-transparent',
    'placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:cursor-not-allowed',
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-neutral-300 focus:ring-primary-500',
    leftIcon && 'pl-11',
    rightIcon && 'pr-11',
    className
  );
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          id={inputId}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {rightIcon}
          </div>
        )}
        
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;