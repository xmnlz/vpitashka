import humanizeDuration from 'humanize-duration';

export const humanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  fallbacks: ['shortEn', 'en'],
  round: true,
  spacer: '',
  delimiter: ' ',
  languages: {
    shortEn: {
      d: () => 'd',
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms',
    },
  },
});

export const humanize = (ms: number) => humanizer(ms);

export const humanizeMinutes = (m: number) => humanizer(m * 60 * 1000, { units: ['h', 'm', 's'] });

export const humanizeSeconds = (s: number) => humanizer(s * 1000, { units: ['h', 'm', 's'] });

export const parseTimeString = (input: string) => {
  const match = input.match(/^(\+|\-)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/);

  if (!match) return undefined;

  const [, sign, hours, minutes, seconds] = match;

  return {
    sign: sign || null,
    hours: hours ? parseInt(hours, 10) : null,
    minutes: minutes ? parseInt(minutes, 10) : null,
    seconds: seconds ? parseInt(seconds, 10) : null,
  };
};

export const totalTimeInSeconds = ({
  seconds,
  minutes,
  hours,
}: {
  seconds: number | null;
  minutes: number | null;
  hours: number | null;
}) => {
  let totalSeconds = 0;

  if (hours !== null) {
    totalSeconds += hours * 3600; // 1 hour = 3600 seconds
  }

  if (minutes !== null) {
    totalSeconds += minutes * 60; // 1 minute = 60 seconds
  }

  if (seconds !== null) {
    totalSeconds += seconds;
  }

  return totalSeconds;
};
