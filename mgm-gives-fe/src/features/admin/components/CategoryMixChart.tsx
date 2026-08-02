import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import type { CategoryMix } from '../types';

const VISIBLE_CATEGORY_LIMIT = 7;

export function CategoryMixChart({
  data,
  totalCampaigns,
}: {
  data: CategoryMix[];
  totalCampaigns?: number;
}) {
  const { i18n } = useTranslation('admin');
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const [hoverInfo, setHoverInfo] = useState<{ item: CategoryMix; x: number; y: number } | null>(
    null,
  );

  const sumOfCounts = data.reduce((sum, d) => sum + d.count, 0);
  const displayTotal = totalCampaigns ?? sumOfCounts;
  const visibleCategories = data.slice(0, VISIBLE_CATEGORY_LIMIT);
  const hiddenCategories = data.slice(VISIBLE_CATEGORY_LIMIT);

  if (sumOfCounts === 0) {
    return (
      <div className="flex flex-col h-full">
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADMIN_CATEGORIES)}
          className="flex items-center gap-1.5 text-base font-bold text-gray-900 tracking-tight mb-4 hover:text-blue-600 transition-colors cursor-pointer group"
        >
          {currentLang === 'vi' ? 'Phân bổ danh mục' : 'Category mix'}
          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </button>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          {currentLang === 'vi' ? 'Chưa có dữ liệu danh mục' : 'No category data available'}
        </div>
      </div>
    );
  }

  const radius = 64;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="flex flex-col h-full">
      <button
        type="button"
        onClick={() => navigate(ROUTES.ADMIN_CATEGORIES)}
        className="flex items-center gap-1.5 text-base font-bold text-gray-900 tracking-tight mb-4 hover:text-blue-600 transition-colors cursor-pointer group"
      >
        {currentLang === 'vi' ? 'Phân bổ danh mục' : 'Category mix'}
        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </button>
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <Link
          to={ROUTES.ADMIN_CATEGORIES}
          className="relative mx-auto h-44 w-44 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4"
          onMouseLeave={() => setHoverInfo(null)}
          aria-label="View categories"
        >
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full -rotate-90 animate-donut"
            aria-label="Category Mix"
          >
            <style>
              {`
                @keyframes scaleFadeIn {
                  0% { opacity: 0; transform: scale(0.5) rotate(-180deg); }
                  100% { opacity: 1; transform: scale(1) rotate(-90deg); }
                }
                .animate-donut {
                  animation: scaleFadeIn 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                  transform-origin: center;
                }
                @keyframes fadeInDelayed {
                  0% { opacity: 0; transform: scale(0.8); }
                  50% { opacity: 0; transform: scale(0.8); }
                  100% { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-delayed {
                  animation: fadeInDelayed 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }
              `}
            </style>
            <title>Category Mix Chart</title>
            {data.map((item) => {
              const percentage = item.count / sumOfCounts;
              const segmentLength = percentage * circumference;
              const gap = segmentLength > 4 && data.length > 1 ? 4 : 0;
              const dashArray = `${Math.max(0, segmentLength - gap)} ${circumference}`;
              const dashOffset = -currentOffset;

              currentOffset += segmentLength;

              return (
                <g key={item.name}>
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: tooltip element */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-300 cursor-pointer hover:opacity-80"
                    onMouseMove={(e) => {
                      const svg = e.currentTarget.ownerSVGElement;
                      if (!svg) return;
                      const rect = svg.getBoundingClientRect();
                      setHoverInfo({
                        item,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }}
                  />
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in-delayed">
            <span className="text-xl font-extrabold text-gray-800">{displayTotal}</span>
          </div>

          {hoverInfo && (
            <div
              className="absolute pointer-events-none z-20 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 px-3 py-2 text-left whitespace-nowrap"
              style={{
                left: hoverInfo.x,
                top: hoverInfo.y - 10,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p className="text-[12px] font-medium text-gray-800">
                {hoverInfo.item.name} : {hoverInfo.item.count}
              </p>
            </div>
          )}
        </Link>

        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] items-start gap-x-4 gap-y-2 text-left">
          {visibleCategories.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => navigate(ROUTES.ADMIN_CATEGORIES)}
              className="group flex min-w-0 items-start gap-2 rounded-md text-left outline-none transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label={`View ${item.name} in categories`}
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 text-[11px] font-semibold leading-4 text-gray-500 transition-colors group-hover:text-blue-600">
                {item.name}
              </span>
            </button>
          ))}

          {hiddenCategories.length > 0 && (
            <div className="group relative min-w-0">
              <button
                type="button"
                className="rounded-md text-left text-[11px] font-bold leading-4 text-blue-600 outline-none transition-colors hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label={`Show ${hiddenCategories.length} more categories`}
              >
                +{hiddenCategories.length} more
              </button>

              <div
                role="tooltip"
                className="invisible absolute bottom-full right-0 z-30 mb-2 max-h-52 w-64 overflow-y-auto rounded-xl border border-gray-100 bg-white p-3 opacity-0 shadow-[0_10px_30px_rgba(15,23,42,0.14)] transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
              >
                <p className="mb-2 text-xs font-bold text-gray-900">More categories</p>
                <div className="space-y-2">
                  {hiddenCategories.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => navigate(ROUTES.ADMIN_CATEGORIES)}
                      className="flex w-full min-w-0 items-start gap-2 rounded-md text-left outline-none transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={`View ${item.name} in categories`}
                    >
                      <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="min-w-0 text-[11px] font-semibold leading-4 text-gray-600">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
