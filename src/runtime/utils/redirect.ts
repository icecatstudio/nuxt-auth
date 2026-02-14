import { navigateTo } from '#imports'
import type { RedirectTarget } from '../types'

/**
 * Handle redirect with support for both string URLs and RedirectTarget objects
 * @param redirectConfig - URL string or RedirectTarget with external option
 * @returns Navigation result or undefined if no redirect config provided
 */
export function handleRedirect(redirectConfig?: string | RedirectTarget) {
  if (!redirectConfig) return

  // Normalize to RedirectTarget format
  const target: RedirectTarget = typeof redirectConfig === 'string'
    ? { url: redirectConfig, external: false }
    : redirectConfig

  // Perform redirect
  return navigateTo(target.url, { external: target.external })
}
