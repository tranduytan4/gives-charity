import { useTranslation } from 'react-i18next';
import type { MonthlyActivity } from '../types';

export function PlatformActivityChart({ data }: { data: MonthlyActivity[] }) {
  const { i18n } = useTranslation('admin');
  const currentLang = i18n.language;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const step = Math.max(1, Math.ceil(maxCount / 4));
  const yMax = step * 4;
  const yLabels = [yMax, step * 3, step * 2, step, 0];

  const svgW = 600;
  const svgH = 220;
  const padLeft = 0;
  const padRight = 0;
  const padTop = 10;
  const padBottom = 0;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const points = data.map((item, i) => {
    const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padTop + chartH - (item.count / yMax) * chartH;
    return { x, y, ...item };
  });

  let pathD = '';
  if (points.length > 0) {
    const first = points[0];
    if (first) {
      pathD = `M ${first.x},${first.y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (p1 && p2) {
          const midX = (p1.x + p2.x) / 2;
          pathD += ` C ${midX},${p1.y} ${midX},${p2.y} ${p2.x},${p2.y}`;
        }
      }
    }
  }

  const last = points[points.length - 1];
  const first = points[0];
  const areaPathD =
    points.length > 0 && first && last
      ? `${pathD} L ${last.x},${padTop + chartH} L ${first.x},${padTop + chartH} Z`
      : '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">
          {currentLang === 'vi' ? 'Hoạt động hệ thống' : 'Platform activity'}
        </h3>
      </div>
      <div className="flex-1 flex">
        <div className="flex flex-col justify-between pr-3 py-1 text-[11px] text-blue-400 font-semibold min-w-[32px] text-right">
          {yLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-full"
              preserveAspectRatio="none"
              aria-label="Platform Activity Chart"
            >
              <title>Platform Activity</title>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <style>
                {`
                  @keyframes revealRight {
                    0% { clip-path: inset(0 100% 0 0); }
                    100% { clip-path: inset(0 0 0 0); }
                  }
                  .animate-reveal-right {
                    animation: revealRight 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                  }
                `}
              </style>

              {yLabels.map((label) => {
                const gy = padTop + chartH - (label / yMax) * chartH;
                return (
                  <line
                    key={`grid-${label}`}
                    x1={padLeft}
                    y1={gy}
                    x2={padLeft + chartW}
                    y2={gy}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                );
              })}

              <g className="animate-reveal-right">
                {points.length > 1 && <path d={areaPathD} fill="url(#areaGrad)" />}

                {points.length > 1 && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            </svg>

            {points.map((p, i) => (
              <div
                key={p.month}
                className="absolute top-0 bottom-0 group"
                style={{
                  left: `${(i / Math.max(data.length - 1, 1)) * 100}%`,
                  width: `${100 / Math.max(data.length, 1)}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />

                <div
                  className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10"
                  style={{ top: `calc(${(p.y / svgH) * 100}% - 5px)` }}
                />

                <div className="absolute left-1/2 -translate-x-1/2 top-[40%] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 px-3 py-2 text-left whitespace-nowrap">
                  <p className="text-xs font-bold text-gray-800">{p.month}</p>
                  <p className="text-[11px] text-blue-600 font-medium">
                    {currentLang === 'vi' ? `Quyên góp: ${p.count}` : `Donations : ${p.count}`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative h-6 mt-3 w-full">
            {data.map((item, i) => {
              const isFirst = i === 0;
              const isLast = i === data.length - 1;
              const pct = (i / Math.max(data.length - 1, 1)) * 100;
              return (
                <div
                  key={item.month}
                  className={`absolute top-0 text-[11px] text-gray-400 font-semibold ${
                    isFirst
                      ? 'text-left left-0'
                      : isLast
                        ? 'text-right right-0'
                        : 'text-center -translate-x-1/2'
                  }`}
                  style={!isFirst && !isLast ? { left: `${pct}%` } : {}}
                >
                  {item.month}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
