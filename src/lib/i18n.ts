import i18next from 'i18next';

import ru from '../../locales/ru/translations.json' assert { type: 'json' };
import en_US from '../../locales/en-US/translations.json' assert { type: 'json' };

import { __prod__ } from './is-prod';

export const resources = {
  'en-US': {
    translation: en_US,
  },
  'ru': {
    translation: ru,
  },
} as const;

export type SupportedLanguages = keyof typeof resources;

i18next.init({
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  debug: !__prod__,
  resources,
});

export const i18n = (language: SupportedLanguages) => i18next.getFixedT(language);
