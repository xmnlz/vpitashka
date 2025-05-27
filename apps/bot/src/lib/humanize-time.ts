type TimeUnit = "second" | "minute" | "hour" | "day" | "week";

interface HumanizeOptions {
  maxUnit?: TimeUnit;
  minUnit?: TimeUnit;
  i18n?: (value: number, unit: TimeUnit) => string;
}

const SECONDS_IN: Record<TimeUnit, number> = {
  week: 604800,
  day: 86400,
  hour: 3600,
  minute: 60,
  second: 1,
};

const orderedUnits: TimeUnit[] = ["week", "day", "hour", "minute", "second"];

export function humanizeSeconds(
  totalSeconds: number,
  options: HumanizeOptions = {},
) {
  const { maxUnit = "week", minUnit = "second", i18n } = options;

  const startIndex = orderedUnits.indexOf(maxUnit);
  const endIndex = orderedUnits.indexOf(minUnit);

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    throw new Error("Invalid minUnit or maxUnit range");
  }

  const activeUnits = orderedUnits.slice(startIndex, endIndex + 1);

  const result: string[] = [];

  for (const unit of activeUnits) {
    const unitSeconds = SECONDS_IN[unit];
    const value = Math.floor(totalSeconds / unitSeconds);
    if (value > 0 || result.length > 0 || unit === minUnit) {
      totalSeconds -= value * unitSeconds;
      const label = i18n ? i18n(value, unit) : `${value}${unit[0]}`; // fallback: "1h", "2m"
      result.push(label);
    }
  }

  return result.join(" ");
}
