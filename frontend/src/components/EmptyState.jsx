import { FileQuestion } from 'lucide-react';
import Button from './Button.jsx'

const EmptyState = ({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  actionLabel,
  className,
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
        <Icon className="w-8 h-8 text-neutral-400" />
      </div>
      
      {title && (
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-neutral-600 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <Button onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;