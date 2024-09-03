export const isEmptyObject = (obj: object) => {
  return Object.keys(obj).length === 0;
};

export const objectDiff = <T extends Record<string, unknown>>(
  obj1: T,
  obj2: T,
): Partial<Diff<T>> => {
  const diff: Diff<T> = {};

  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj1.hasOwnProperty(key) && obj1[key] !== obj2[key]) {
        diff[key] = obj2[key];
      } else if (!obj1.hasOwnProperty(key)) {
        diff[key] = obj2[key];
      }
    }
  }

  return diff;
};

type Diff<T> = {
  [key in keyof T]?: T[key];
};
