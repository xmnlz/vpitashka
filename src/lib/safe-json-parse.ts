import { isEmptyObject } from './is-empty-obj.js';

export const safeJsonParse = <T>(json: string, fallback: T) => {
  try {
    const parsedJson = JSON.parse(json);
    if (isEmptyObject(parsedJson)) return fallback;
    return parsedJson;
  } catch (e) {
    return fallback;
  }
};
