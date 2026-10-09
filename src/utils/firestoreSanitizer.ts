/**
 * Recursively removes all `undefined` values from objects and arrays
 * to prevent Firestore "Function addDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as any;
  }
  if (typeof data === 'object') {
    // Retain Date instances or Firestore Timestamp/FieldValue if present
    if (
      data instanceof Date ||
      (data as any)?.toMillis ||
      (data as any)?._methodName ||
      (data as any)?.constructor?.name === 'FieldValue' ||
      (data as any)?.constructor?.name === 'Timestamp'
    ) {
      return data;
    }
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = cleanFirestoreData(value);
      }
    }
    return clean as any;
  }
  return data;
}
