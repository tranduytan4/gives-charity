import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, startAdornment, endAdornment, error, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {startAdornment && (
          <div className="pointer-events-none absolute left-3 flex items-center text-gray-500">
            {startAdornment}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
            {
              'border-gray-200 focus:border-primary focus:ring-primary/20': !error,
              'border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900 placeholder:text-red-300':
                error,
              'pl-10': !!startAdornment,
              'pr-10': !!endAdornment,
            },
            className,
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute right-3 flex items-center text-gray-500">{endAdornment}</div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
