/**
 * i18n Configuration
 *
 * Internationalization setup using i18next with react-i18next.
 * Supports English (default) and Chinese languages.
 */

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import translation resources
import en from '@/locales/en';
import zh from '@/locales/zh';

// Supported languages
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English' },
  zh: { name: 'Chinese', nativeName: '中文' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      zh,
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'sidebar', 'table', 'dialog', 'settings', 'error'],

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'sqlpro-language',
    },

    react: {
      useSuspense: false, // Disable suspense for better UX
    },
  });

export default i18n;

// Sync initial language to main process for native menu translations
setTimeout(() => {
  const lang = i18n.language?.split('-')[0] as 'en' | 'zh';
  window.api?.language
    ?.update({ language: lang === 'zh' ? 'zh' : 'en' })
    .catch(() => {
      // Ignore errors if API is not available
    });
}, 100);

/**
 * Change the current language
 */
export async function changeLanguage(lng: LanguageCode): Promise<void> {
  await i18n.changeLanguage(lng);
  // Sync with main process for native menu translations
  try {
    await window.api?.language?.update({ language: lng });
  } catch {
    // Ignore errors if API is not available (e.g., in browser context)
  }
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): LanguageCode {
  const lang = i18n.language?.split('-')[0];
  return (lang === 'zh' ? 'zh' : 'en') as LanguageCode;
}
