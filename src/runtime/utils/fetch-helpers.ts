/**
 * Check if an error is a fetch error with the specified HTTP status code
 * @param error - The error to check
 * @param status - The HTTP status code to match
 * @returns True if the error is a fetch error with the given status
 */
export function isFetchError(error: unknown, status: number): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'response' in error
    && (error as { response?: { status?: number } }).response?.status === status
  )
}

/**
 * Convert various header formats to a plain Record<string, string>
 * @param headers - Headers in any supported format (Headers instance, array of tuples, plain object, or undefined)
 * @returns A plain object with header key-value pairs
 */
export function toPlainHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {}

  if (headers instanceof Headers) {
    const plain: Record<string, string> = {}
    headers.forEach((value, key) => {
      plain[key] = value
    })
    return plain
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }

  return { ...headers } as Record<string, string>
}
