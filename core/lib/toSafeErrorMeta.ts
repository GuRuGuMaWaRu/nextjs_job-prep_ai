/**
 * Converts an error to a safe error meta object. "message" and "stack" are omitted.
 * @param err - The error to convert.
 * @returns A safe error meta object.
 */
export function toSafeErrorMeta(err: unknown): { name: string; code?: string } {
  // If the error is an instance of Error, return the name and code if it exists.
  if (err instanceof Error) {
    const withCode = err as Error & { code?: string };
    return {
      name: err.name,
      ...(withCode.code ? { code: String(withCode.code) } : {}),
    };
  }
  return { name: "UnknownError" };
}
