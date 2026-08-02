import type { BoardLabel } from '../../types/campaignTask';

interface TaskLabelProps {
  label: BoardLabel;
  isColorblindMode?: boolean;
}

// Renders a unique SVG pattern for each of Trello's 10 canonical colours (colorblind-friendly mode).
// All SVGs are purely decorative, so aria-hidden="true" suppresses the a11y noSvgWithoutTitle rule.
// We support both the original Trello colors and the new beautiful pastel colors.
export function getColorblindPattern(color: string) {
  const c = color.toLowerCase();

  // 1. Green (#61bd4f, #519839, #4da379) → diagonal stripes left (\ \ \)
  if (c === '#61bd4f' || c === '#519839' || c === '#4da379') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 16L16 4M8 16L16 8M4 12L12 4"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // 2. Yellow (#f2d600, #d6af22, #dfac34) → horizontal zigzag
  if (c === '#f2d600' || c === '#d6af22' || c === '#dfac34') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 10L5 6L8 14L11 6L14 14L17 10"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // 3. Orange (#ff9f1a, #d68100, #e08550) → vertical parallel stripes (| | |)
  if (c === '#ff9f1a' || c === '#d68100' || c === '#e08550') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0
        "
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 3V17M10 3V17M14 3V17" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }
  // 4. Red (#eb5a46, #b04632, #e25c5f) → 4-dot grid
  if (c === '#eb5a46' || c === '#b04632' || c === '#e25c5f') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="6" cy="6" r="2.2" fill="white" />
        <circle cx="14" cy="6" r="2.2" fill="white" />
        <circle cx="6" cy="14" r="2.2" fill="white" />
        <circle cx="14" cy="14" r="2.2" fill="white" />
      </svg>
    );
  }
  // 5. Purple (#c377e0, #89609e, #9f72c6) → vertical wave stripes
  if (c === '#c377e0' || c === '#89609e' || c === '#9f72c6') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 3C7 5 3 9 5 11C7 13 3 15 5 17"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 3C12 5 8 9 10 11C12 13 8 15 10 17"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 3C17 5 13 9 15 11C17 13 13 15 15 17"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // 6. Blue (#0079bf, #005a90, #5988d6) → horizontal parallel stripes (≡)
  if (c === '#0079bf' || c === '#005a90' || c === '#5988d6') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M3 6H17M3 10H17M3 14H17" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }
  // 7. Lime (#51e898, #86be54) → crosshatch grid (#)
  if (c === '#51e898' || c === '#86be54') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 3V17M14 3V17M3 6H17M3 14H17"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // 8. Pink (#ff78cb, #e6739a) → large diamond outline (❖)
  if (c === '#ff78cb' || c === '#e6739a') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 3.5L16.5 10L10 16.5L3.5 10Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // 9. Sky (#00c2e0, #55b5cc) → diagonal stripes right (/ / /)
  if (c === '#00c2e0' || c === '#55b5cc') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 16L4 4M12 16L4 8M16 12L8 4"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // 10. Dark (#344563, #5c6f8e) → large plus sign (+)
  if (c === '#344563' || c === '#5c6f8e') {
    return (
      <svg
        aria-hidden="true"
        className="w-5 h-5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 3V17M3 10H17" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }

  // Fallback for any colour not in the canonical list above
  return (
    <svg
      aria-hidden="true"
      className="w-5 h-5 shrink-0"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="5" stroke="white" strokeWidth="2.5" />
    </svg>
  );
}

export function TaskLabel({ label, isColorblindMode = false }: TaskLabelProps) {
  const hasTitle = !!label.title.trim();

  return (
    <span
      style={{ backgroundColor: label.color }}
      className={`inline-flex max-w-full min-w-0 items-center gap-1 overflow-hidden rounded-[4px] text-[9px] font-bold text-white uppercase tracking-wider select-none shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 ${
        hasTitle ? 'px-2 py-0.5' : 'h-2.5 w-10 shrink-0'
      }`}
      title={label.title || 'Color label'}
    >
      {/* Render colorblind pattern overlay on the left side when mode is active */}
      {isColorblindMode && hasTitle && (
        <span className="w-3.5 h-3.5 -ml-1 flex items-center justify-center scale-[0.65] shrink-0 opacity-90 select-none">
          {getColorblindPattern(label.color)}
        </span>
      )}
      {isColorblindMode && !hasTitle && (
        <span className="w-full h-full flex items-center justify-center scale-[0.5] shrink-0 opacity-90 select-none">
          {getColorblindPattern(label.color)}
        </span>
      )}
      {hasTitle ? <span className="min-w-0 truncate">{label.title}</span> : ''}
    </span>
  );
}
