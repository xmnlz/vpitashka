export class XMap<K, V> extends Map<K, V> {
  append(key: K, fieldsToUpdate: Partial<V>): V | undefined {
    const currentValue = this.get(key);
    if (currentValue) {
      const updatedValue = { ...currentValue, ...fieldsToUpdate };
      this.set(key, updatedValue);
      return updatedValue;
    }
    return undefined;
  }
}
