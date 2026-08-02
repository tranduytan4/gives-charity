import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label
        className={cn(
          'flex items-start gap-2',
          props.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
        )}
      >
        <div className="relative flex items-center pt-0.5">
          <input
            type="checkbox"
            ref={ref}
            className={cn(
              'peer h-4 w-4 appearance-none rounded border border-gray-300 bg-white checked:border-primary checked:bg-primary hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
              className,
            )}
            {...props}
          />
          <svg
            className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[-40%] text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {label && <span className="text-sm text-gray-700 leading-snug select-none">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
