import { useLayoutEffect, useRef, useState } from 'react';

export function CampaignTags({ tags }: { tags: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenMeasureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);

  useLayoutEffect(() => {
    if (!containerRef.current || !hiddenMeasureRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!containerRef.current || !hiddenMeasureRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const children = Array.from(hiddenMeasureRef.current.children) as HTMLElement[];

      let currentWidth = 0;
      let count = 0;
      const gap = 6;
      const badgeWidth = 35;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child) continue;
        const childWidth = child.offsetWidth;

        // If adding this child (and the +X badge if it's not the last child) exceeds width
        if (currentWidth + childWidth + (i < tags.length - 1 ? badgeWidth : 0) > containerWidth) {
          break;
        }

        currentWidth += childWidth + gap;
        count++;
      }

      setVisibleCount(Math.max(1, count)); // Always show at least 1 tag
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [tags]);

  const visibleTags = tags.slice(0, visibleCount);
  const hiddenCount = tags.length - visibleCount;

  return (
    <div className="relative mt-4 group">
      <div ref={containerRef} className="relative flex gap-1.5 overflow-hidden">
        <div
          ref={hiddenMeasureRef}
          className="absolute left-0 top-0 opacity-0 pointer-events-none flex flex-nowrap gap-1.5"
          aria-hidden="true"
        >
          {tags.map((t) => (
            <span
              key={t}
              className="shrink-0 px-2.5 py-1 text-[11px] font-medium border border-transparent"
            >
              {t}
            </span>
          ))}
        </div>

        {visibleTags.map((category) => (
          <span
            key={category}
            className="shrink-0 rounded-full bg-[#eeeeee] px-3 py-1 text-[11px] font-semibold text-[#102820]"
          >
            {category}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="shrink-0 rounded-full bg-[#eeeeee] px-3 py-1 text-[11px] font-semibold text-[#102820]/70 transition-colors hover:bg-[#e4e4e4] cursor-default">
            +{hiddenCount}
          </span>
        )}
      </div>

      {hiddenCount > 0 && (
        <div className="absolute top-full left-0 mt-2 z-[60] hidden group-hover:flex w-max max-w-[280px] sm:max-w-xs flex-wrap gap-1.5 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          {tags.map((category) => (
            <span
              key={category}
              className="rounded-full bg-[#eeeeee] px-3 py-1 text-[11px] font-semibold text-[#102820]"
            >
              {category}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
