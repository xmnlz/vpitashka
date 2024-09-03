import { resources } from '../lib/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: (typeof resources)['en-US'];
  }
}
