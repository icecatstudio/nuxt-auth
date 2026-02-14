import { useCookie, useRuntimeConfig, ref } from '#imports'
import type { Ref } from 'vue'
import type { ResolvedModuleOptions } from '../types'
import { getNestedProperty } from '../utils/helpers'

export interface TokenManager {
  accessToken: Ref<string | null>
  refreshToken: Ref<string | null>
  coordinationTimestamp: Readonly<Ref<number | null>>
  getAuthHeaders: () => Record<string, string>
  setTokensFromResponse: (data: unknown) => void
  clearTokens: () => void
  hasTokens: () => { access: boolean, refresh: boolean }
  updateCoordinationCookie: () => void
  clearCoordinationCookie: () => void
}

export function useTokenManager(): TokenManager {
  const config = useRuntimeConfig().public.auth as ResolvedModuleOptions

  // Access token cookie
  const accessToken = useCookie<string | null>(config.accessToken.cookieName, {
    httpOnly: config.accessToken.httpOnly,
    secure: config.accessToken.secure,
    sameSite: config.accessToken.sameSite,
    path: config.accessToken.path,
    domain: config.accessToken.domain,
    maxAge: config.accessToken.maxAge,
    default: () => null,
  })

  // Refresh token cookie (only if enabled and not server-managed)
  const refreshToken = config.endpoints?.refresh !== false && !config.refreshToken.serverManaged
    ? useCookie<string | null>(config.refreshToken.cookieName, {
        httpOnly: config.refreshToken.httpOnly,
        secure: config.refreshToken.secure,
        sameSite: config.refreshToken.sameSite,
        path: config.refreshToken.path,
        domain: config.refreshToken.domain,
        maxAge: config.refreshToken.maxAge,
        default: () => null,
      })
    : ref<string | null>(null)

  // Coordination cookie for tab coordination (enabled on both server and client)
  // On server: needed to set cookie for client hydration after SSR refresh
  // On client: needed for tab coordination
  // maxAge is 2x refresh interval to cover at least 2 refresh cycles
  const coordinationCookie = config.autoRefresh?.enableTabCoordination
    ? useCookie<number | null>(config.autoRefresh.coordinationCookieName, {
        maxAge: config.autoRefresh.interval * 2, // 2x refresh interval (already in seconds)
        sameSite: 'lax',
        default: () => null,
      })
    : null

  // Get authorization headers for requests
  const getAuthHeaders = (): Record<string, string> => {
    const token = accessToken.value
    if (!token) return {}

    const headerName = config.accessToken.headerName
    const tokenType = config.accessToken.type

    return {
      [headerName]: `${tokenType} ${token}`,
    }
  }

  // Extract and set tokens from API response
  const setTokensFromResponse = (data: unknown): void => {
    // Set access token
    if (config.accessToken.property) {
      const token = getNestedProperty(data, config.accessToken.property)
      if (token && typeof token === 'string') {
        accessToken.value = token
      }
    }

    // Set refresh token if not server-managed
    if (config.endpoints?.refresh !== false
      && !config.refreshToken.serverManaged
      && config.refreshToken.property) {
      const token = getNestedProperty(data, config.refreshToken.property)
      if (token && typeof token === 'string') {
        refreshToken.value = token
      }
    }
  }

  // Clear all tokens
  const clearTokens = (): void => {
    accessToken.value = null
    if (config.endpoints?.refresh !== false && !config.refreshToken.serverManaged) {
      refreshToken.value = null
    }
  }

  // Check token existence
  const hasTokens = (): { access: boolean, refresh: boolean } => {
    return {
      access: !!accessToken.value,
      refresh: !!refreshToken.value,
    }
  }

  // Update coordination cookie
  const updateCoordinationCookie = (): void => {
    if (coordinationCookie) {
      const previousValue = coordinationCookie.value
      coordinationCookie.value = Date.now()
      if (import.meta.dev) {
        console.log('[TokenManager] Updated coordination cookie:', {
          previousTimestamp: previousValue,
          newTimestamp: coordinationCookie.value,
          timeSinceLast: previousValue ? Date.now() - previousValue : 'N/A',
          isServer: import.meta.server,
        })
      }
    }
    else if (import.meta.dev) {
      console.log('[TokenManager] Coordination cookie not enabled')
    }
  }

  // Clear coordination cookie
  const clearCoordinationCookie = (): void => {
    if (coordinationCookie) {
      if (import.meta.dev) {
        console.log('[TokenManager] Clearing coordination cookie:', {
          previousTimestamp: coordinationCookie.value,
          isServer: import.meta.server,
        })
      }
      coordinationCookie.value = null
    }
  }

  const coordinationTimestamp: Readonly<Ref<number | null>> = coordinationCookie ?? ref(null)

  return {
    accessToken,
    refreshToken,
    coordinationTimestamp,
    getAuthHeaders,
    setTokensFromResponse,
    clearTokens,
    hasTokens,
    updateCoordinationCookie,
    clearCoordinationCookie,
  }
}
