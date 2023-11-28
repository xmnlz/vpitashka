import pkg from 'humanize-duration';

export const humanizeDuration = pkg.humanizer({
  language: 'shortEn',
  fallbacks: ['shortEn', 'en'],
  round: true,
  spacer: '',
  languages: {
    shortEn: {
      y: () => 'y',
      mo: () => 'mo',
      w: () => 'w',
      d: () => 'd',
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms',
    },
  },
});

export const humanize = (s: number) => humanizeDuration(s);
export const humanizeMinutes = (m: number) => humanizeDuration(m * 60 * 1000);
