import { Fancybox as NativeFancybox } from '@fancyapps/ui';
import type React from 'react';
import { useEffect, useRef } from 'react';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

interface FancyboxProps {
  delegate?: string;
  options?: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
}

export function Fancybox({
  delegate = '[data-fancybox]',
  options = {},
  children,
  className,
}: FancyboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    NativeFancybox.bind(container, delegate, options);

    return () => {
      NativeFancybox.unbind(container);
      NativeFancybox.close();
    };
  }, [delegate, options]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
