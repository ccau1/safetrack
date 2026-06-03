import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/translation.json';
import zhCN from './locales/zh_CN/translation.json';
import zhTW from './locales/zh_TW/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh_CN: { translation: zhCN },
      zh_TW: { translation: zhTW },
    },
    fallbackLng: {
      zh: ['zh_TW', 'en'],
      'zh-Hans': ['zh_CN', 'zh_TW', 'en'],
      'zh-Hant': ['zh_TW', 'en'],
      'zh-CN': ['zh_CN', 'zh_TW', 'en'],
      'zh-TW': ['zh_TW', 'en'],
      default: ['en'],
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);
});

export default i18n;
