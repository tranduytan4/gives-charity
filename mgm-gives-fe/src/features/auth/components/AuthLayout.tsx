import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Logo } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';

const imageModules = import.meta.glob<{ default: string }>(
  '../../../assets/image/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true },
);

const IMAGES = Object.values(imageModules).map((mod) => mod.default);

export function AuthLayout({
  title,
  subtitle,
  children,
  allowScroll = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  allowScroll?: boolean;
}) {
  const { t } = useTranslation(['auth', 'common']);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isImageOnly, setIsImageOnly] = useState(false);
  const [formOffset, setFormOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (IMAGES.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleDoubleClick = (event: MouseEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('[data-auth-form="true"]')) {
        return;
      }

      setIsImageOnly((current) => !current);
    };

    window.addEventListener('dblclick', handleDoubleClick);

    return () => window.removeEventListener('dblclick', handleDoubleClick);
  }, []);

  const handleFormDragStart = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: formOffset.x,
      originY: formOffset.y,
    };
  };

  const handleFormDragMove = (event: PointerEvent<HTMLButtonElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    setFormOffset({
      x: dragStart.originX + event.clientX - dragStart.startX,
      y: dragStart.originY + event.clientY - dragStart.startY,
    });
  };

  const handleFormDragEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStartRef.current?.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className={`relative w-full bg-slate-950 ${
        allowScroll ? 'min-h-screen overflow-x-hidden' : 'h-screen overflow-hidden'
      }`}
    >
      {IMAGES.length > 0 &&
        IMAGES.map((img, idx) => (
          <img
            key={img}
            src={img}
            alt={`Campaign moment ${idx + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              idx === currentIdx ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

      <div
        className={`absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.62)_0%,rgba(15,23,42,0.25)_44%,rgba(15,23,42,0.12)_100%),linear-gradient(180deg,rgba(15,23,42,0.18)_0%,rgba(15,23,42,0.08)_45%,rgba(15,23,42,0.46)_100%)] transition-opacity duration-700 ${
          isImageOnly ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        className={`absolute inset-0 bg-primary/[0.06] transition-opacity duration-700 ${
          isImageOnly ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div
        className={`relative flex flex-col px-5 py-4 text-white transition-opacity duration-700 sm:px-8 lg:px-12 ${
          allowScroll ? 'min-h-screen' : 'h-full'
        } ${isImageOnly ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        <div className="flex shrink-0 items-center justify-between">
          <Link
            to={ROUTES.DEFAULT}
            aria-label="mgmGives home"
            className="rounded-2xl bg-white/88 px-3 py-2 shadow-lg shadow-slate-950/10 backdrop-blur"
          >
            <Logo className="h-10 w-auto" />
          </Link>
          <Link
            to={ROUTES.DEFAULT}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-extrabold text-white shadow-sm backdrop-blur transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:actions.back')}
          </Link>
        </div>

        <div
          className={`grid flex-1 items-center gap-8 py-2 lg:grid-cols-[1fr_31rem] xl:grid-cols-[1fr_33rem] ${
            allowScroll ? 'min-h-[calc(100vh-4.5rem)]' : 'min-h-0'
          }`}
        >
          <div className="hidden max-w-2xl lg:block">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-xs font-black uppercase text-white backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              {t('common:nav.charityPlatform')}
            </div>
            <h2 className="text-5xl font-black leading-tight tracking-normal xl:text-6xl">
              Give hope, join campaigns, create real change.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/82">
              Donate, volunteer, follow campaign progress, and keep every contribution visible from
              start to final report.
            </p>
            <div className="mt-8 flex gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/14 px-5 py-4 backdrop-blur">
                <div className="text-2xl font-black">860+</div>
                <div className="mt-1 text-xs font-semibold text-white/75">Active helpers</div>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/14 px-5 py-4 backdrop-blur">
                <div className="text-2xl font-black">120+</div>
                <div className="mt-1 text-xs font-semibold text-white/75">
                  {t('common:nav.campaigns')}
                </div>
              </div>
            </div>
          </div>

          <div
            data-auth-form="true"
            className="mx-auto w-full max-w-[31rem] rounded-[1.75rem] border border-white/24 bg-white/[0.08] p-4 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-2xl transition-shadow duration-200 sm:p-5"
            style={{ transform: `translate3d(${formOffset.x}px, ${formOffset.y}px, 0)` }}
          >
            <div className="relative mb-4 select-none">
              <button
                type="button"
                className="absolute inset-0 z-10 cursor-grab touch-none rounded-2xl bg-transparent active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Drag auth form. Press Enter to reset position."
                onPointerDown={handleFormDragStart}
                onPointerMove={handleFormDragMove}
                onPointerUp={handleFormDragEnd}
                onPointerCancel={handleFormDragEnd}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  setFormOffset({ x: 0, y: 0 });
                }}
              />
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-black leading-tight tracking-normal text-white drop-shadow-sm sm:text-3xl">
                  {title}
                </h1>
                <div className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border border-white/30 bg-white/18 px-3.5 py-2 text-xs font-black text-white shadow-sm backdrop-blur">
                  <ShieldCheck className="h-4 w-4" />
                  mgmGives
                </div>
              </div>
              {subtitle && <p className="mt-2 text-sm leading-6 text-white/82">{subtitle}</p>}
            </div>

            <div className="rounded-[1.35rem] border border-white/24 bg-white/[0.10] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:p-5">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
