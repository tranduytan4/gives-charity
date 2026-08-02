import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { cn } from '@/shared/utils/cn';

interface DragScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  speed?: number;
  elasticLimit?: number;
  elasticFactor?: number;
  onDragEnd?: () => void;
}

export const DragScrollContainer = forwardRef<HTMLDivElement, DragScrollContainerProps>(
  (
    {
      children,
      className,
      speed = 1.0,
      elasticLimit = 100,
      elasticFactor = 20,
      onDragEnd,
      ...props
    },
    ref,
  ) => {
    const localRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => {
      if (!localRef.current) {
        throw new Error('DragScrollContainer is not mounted');
      }
      return localRef.current;
    });

    const [isDragScrolling, setIsDragScrolling] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragScrollLeft, setDragScrollLeft] = useState(0);

    const onDragEndRef = useRef(onDragEnd);
    useEffect(() => {
      onDragEndRef.current = onDragEnd;
    }, [onDragEnd]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.drag-handle') ||
        target.closest('[data-drag-handle]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea')
      ) {
        return;
      }
      setIsDragScrolling(true);
      if (localRef.current) {
        localRef.current.style.transition = '';
      }
      setDragStartX(e.pageX - (localRef.current?.offsetLeft || 0));
      setDragScrollLeft(localRef.current?.scrollLeft || 0);
    };

    useEffect(() => {
      if (!isDragScrolling) return;

      const originalBodyCursor = document.body.style.cursor;
      const originalBodyUserSelect = document.body.style.userSelect;
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      const handleMouseMoveGlobal = (e: MouseEvent) => {
        if (!localRef.current) return;
        e.preventDefault();

        const container = localRef.current;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - dragStartX) * speed;

        const newScrollLeft = dragScrollLeft - walk;
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (newScrollLeft < 0) {
          const overscroll = -newScrollLeft;
          const elasticOffset = Math.min(elasticLimit, Math.log1p(overscroll) * elasticFactor);
          container.style.transform = `translateX(${elasticOffset}px)`;
          container.scrollLeft = 0;
        } else if (newScrollLeft > maxScroll) {
          const overscroll = newScrollLeft - maxScroll;
          const elasticOffset = Math.min(elasticLimit, Math.log1p(overscroll) * elasticFactor);
          container.style.transform = `translateX(${-elasticOffset}px)`;
          container.scrollLeft = maxScroll;
        } else {
          container.style.transform = 'none';
          container.scrollLeft = newScrollLeft;
        }
      };

      const handleMouseUpGlobal = () => {
        setIsDragScrolling(false);
        if (localRef.current) {
          localRef.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          localRef.current.style.transform = 'none';
        }
        onDragEndRef.current?.();
      };

      window.addEventListener('mousemove', handleMouseMoveGlobal);
      window.addEventListener('mouseup', handleMouseUpGlobal);
      return () => {
        document.body.style.cursor = originalBodyCursor;
        document.body.style.userSelect = originalBodyUserSelect;
        window.removeEventListener('mousemove', handleMouseMoveGlobal);
        window.removeEventListener('mouseup', handleMouseUpGlobal);
      };
    }, [isDragScrolling, dragStartX, dragScrollLeft, speed, elasticLimit, elasticFactor]);

    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: Mouse drag-scroll requires pointer events on a container div
      <div
        role="presentation"
        ref={localRef}
        onMouseDown={handleMouseDown}
        className={cn(
          'flex flex-row overflow-x-auto gap-1.5 pb-2 select-none cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

DragScrollContainer.displayName = 'DragScrollContainer';
