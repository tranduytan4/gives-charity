import { Cloud, Moon, Sun, Sunrise } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function getGreeting(t: (key: string) => string): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      text: t('dashboardHeader.goodMorning'),
      icon: <Sunrise className="h-5 w-5 text-amber-500" />,
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      text: t('dashboardHeader.goodAfternoon'),
      icon: <Sun className="h-5 w-5 text-orange-500" />,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      text: t('dashboardHeader.goodEvening'),
      icon: <Cloud className="h-5 w-5 text-indigo-400" />,
    };
  }
  return {
    text: t('dashboardHeader.goodNight'),
    icon: <Moon className="h-5 w-5 text-blue-400" />,
  };
}

export function DashboardHeader() {
  const { t, i18n } = useTranslation('admin');
  const { text, icon } = getGreeting(t);

  const date = new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {t('dashboardHeader.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('dashboardHeader.subtitle')}</p>
      </div>
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-gray-900 tracking-tight leading-tight">
            {text}
          </span>
          <span className="text-[11px] text-gray-400 font-medium mt-0.5">{date}</span>
        </div>
      </div>
    </div>
  );
}
