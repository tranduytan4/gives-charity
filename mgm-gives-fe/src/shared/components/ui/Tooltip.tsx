import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside (essential for mobile/touch devices)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);
  const handleFocus = () => setIsVisible(true);
  const handleBlur = () => setIsVisible(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    // Prevent event bubbling to avoid triggering parent card click events (e.g. navigation)
    e.stopPropagation();
    setIsVisible((prev) => !prev);
  };

  const childProps = children.props;

  // Preserve the child element's existing handlers before applying tooltip behavior.
  const trigger = React.cloneElement(children, {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(event);
      handleMouseEnter();
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(event);
      handleMouseLeave();
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(event);
      handleFocus();
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(event);
      handleBlur();
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      childProps.onKeyDown?.(event);
      handleKeyDown(event);
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      childProps.onClick?.(event);
      handleTriggerClick(event);
    },
    tabIndex: childProps.tabIndex ?? 0,
    className: childProps.className,
  });

  return (
    <div ref={containerRef} className="relative inline-block">
      {trigger}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            role="tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-100 text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap pointer-events-none select-none"
          >
            {content}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 -translate-y-1/2 rotate-45 bg-slate-900 border-r border-b border-slate-800 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
