/**
 * Type guard to check if value is an object with index signature
 * @param value - The value to check
 * @returns True if the value is an indexable object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Get nested property value from an object using dot notation
 * @param obj - The object to get the value from
 * @param path - The path to the property (e.g., 'data.user.profile')
 * @returns The value at the specified path or undefined
 */
export function getNestedProperty(obj: unknown, path: string): unknown {
  if (!isObject(obj)) {
    return undefined
  }

  return path.split('.').reduce<unknown>((current, key) => {
    if (isObject(current)) {
      return current[key]
    }
    return undefined
  }, obj)
}

/**
 * Set nested property value in an object using dot notation
 * @param obj - The object to set the value in
 * @param path - The path to the property (e.g., 'data.user.profile')
 * @param value - The value to set
 */
export function setNestedProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  const lastKey = keys.pop()

  if (!lastKey)
    return

  const target = keys.reduce<Record<string, unknown>>((current, key) => {
    if (!current[key] || !isObject(current[key])) {
      current[key] = {}
    }
    return current[key] as Record<string, unknown>
  }, obj)

  target[lastKey] = value
}

/**
 * Check if a value is defined and not null
 * @param value - The value to check
 * @returns True if the value is defined and not null
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Safely parse JSON string
 * @param str - The string to parse
 * @param fallback - The fallback value if parsing fails
 * @returns The parsed value or fallback
 */
export function safeJsonParse<T = unknown>(str: string, fallback: T | null = null): T | null {
  try {
    return JSON.parse(str) as T
  }
  catch {
    return fallback
  }
}
