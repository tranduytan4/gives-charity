import { ArrowLeft, FileQuestion, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  backTo?: string;
  backToText?: string;
}

export default function NotFoundPage({
  title,
  description,
  backTo = ROUTES.DEFAULT,
  backToText,
}: NotFoundPageProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const finalTitle = title || t('notFound.title');
  const finalDescription = description || t('notFound.description');
  const finalBackToText = backToText || t('notFound.backToHome');

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] w-full py-16 px-6 overflow-hidden rounded-2xl bg-white/40 border border-white/60 shadow-elevated backdrop-blur-md text-center">
      {/* Background decorations for rich aesthetics matching light theme */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, oklch(0.546 0.215 263 / 0.15) 0, transparent 40%),
            radial-gradient(circle at 90% 80%, oklch(0.78 0.16 70 / 0.1) 0, transparent 40%)
          `,
        }}
      />

      {/* Glowing background radial blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.9_0_0/_0.3)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.9_0_0/_0.3)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Animated Icon Illustration Container */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-card transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/5 to-accent-brand/5 opacity-50" />
          <FileQuestion className="h-12 w-12 text-primary animate-bounce" />
        </div>

        {/* 404 Header text with gradient */}
        <h1 className="font-display text-7xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-accent-brand drop-shadow-[0_1px_2px_oklch(0.546_0.215_263_/_0.15)] select-none">
          404
        </h1>

        {/* Title */}
        <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-gray-900">
          {finalTitle}
        </h2>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">{finalDescription}</p>

        {/* Buttons / Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Button
            variant="default"
            onClick={() => navigate(backTo)}
            className="w-full sm:w-auto px-5 font-semibold gap-2 shadow-sm bg-primary text-white hover:bg-primary/95"
          >
            <Home className="h-4 w-4" />
            {finalBackToText}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 font-semibold gap-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('notFound.goBack')}
          </Button>
        </div>
      </div>
    </div>
  );
}
