import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import adminEn from './locales/en/admin';
import announcementEn from './locales/en/announcement';
import authEn from './locales/en/auth';
import campaignEn from './locales/en/campaign';
import commonEn from './locales/en/common';
import dashboardEn from './locales/en/dashboard';
import donationEn from './locales/en/donation';
import notificationEn from './locales/en/notification';
import profileEn from './locales/en/profile';
import settingsEn from './locales/en/settings';
import validationEn from './locales/en/validation';

import adminVi from './locales/vi/admin';
import announcementVi from './locales/vi/announcement';
import authVi from './locales/vi/auth';
import campaignVi from './locales/vi/campaign';
import commonVi from './locales/vi/common';
import dashboardVi from './locales/vi/dashboard';
import donationVi from './locales/vi/donation';
import notificationVi from './locales/vi/notification';
import profileVi from './locales/vi/profile';
import settingsVi from './locales/vi/settings';
import validationVi from './locales/vi/validation';

const STORAGE_KEY = 'mgmGivesLanguage';

const getSavedLanguage = (): string => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'vi' || saved === 'en') {
    return saved;
  }
  return 'en';
};

const initialLanguage = getSavedLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEn,
      auth: authEn,
      dashboard: dashboardEn,
      campaign: campaignEn,
      donation: donationEn,
      announcement: announcementEn,
      admin: adminEn,
      notification: notificationEn,
      profile: profileEn,
      settings: settingsEn,
      validation: validationEn,
    },
    vi: {
      common: commonVi,
      auth: authVi,
      dashboard: dashboardVi,
      campaign: campaignVi,
      donation: donationVi,
      announcement: announcementVi,
      admin: adminVi,
      notification: notificationVi,
      profile: profileVi,
      settings: settingsVi,
      validation: validationVi,
    },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: [
    'common',
    'auth',
    'dashboard',
    'campaign',
    'donation',
    'announcement',
    'admin',
    'notification',
    'profile',
    'settings',
    'validation',
  ],
  interpolation: {
    escapeValue: false,
  },
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

export default i18n;
