import { computed, useNuxtApp, useRuntimeConfig, useState } from '#imports'
import type { ComputedRef, Ref } from 'vue'
import type { LoginCredentials, LoginOptions, RegisterData, ResolvedModuleOptions, User } from '../types'
import { getNestedProperty, isObject } from '../utils/helpers'
import { handleRedirect } from '../utils/redirect'
import { useTokenManager } from './useTokenManager'

export type { User, LoginCredentials, RegisterData }

export type AuthStatus = 'idle' | 'loading' | 'refreshing' | 'authenticated' | 'unauthenticated'

/**
 * Auth composable return type
 * @template TUser - User type, defaults to User interface
 */
export interface Auth<TUser = User> {
  user: Ref<TUser | null>
  status: Ref<AuthStatus>
  loggedIn: ComputedRef<boolean>
  accessToken: Ref<string | null>
  refreshToken: Ref<string | null>
  canRefresh: ComputedRef<boolean>
  login: (credentials: LoginCredentials, options?: LoginOptions) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  refresh: () => Promise<void>
  fetchUser: () => Promise<void>
  getAuthHeaders: () => Record<string, string>
}

/**
 * Auth composable for managing authentication state
 * @template TUser - User type, defaults to User interface (can be augmented globally)
 * @example
 * // Use with default User type (augmented globally)
 * const auth = useAuth()
 *
 * // Or override with specific type
 * interface CustomUser { id: number; email: string }
 * const auth = useAuth<CustomUser>()
 */
export function useAuth<TUser = User>(): Auth<TUser> {
  const nuxtApp = useNuxtApp()

  // Return existing instance — avoid recreating computeds and closures
  if (nuxtApp.$auth) {
    return nuxtApp.$auth as Auth<TUser>
  }

  const config = useRuntimeConfig().public.auth as ResolvedModuleOptions

  // Use token manager for all token operations
  const tokenManager = useTokenManager()

  // State
  const user = useState<TUser | null>('auth:user', () => null)
  const status = useState<AuthStatus>('auth:status', () => 'idle')

  // Whether refresh is available (endpoint enabled + token accessible)
  const refreshEnabled = config.endpoints.refresh !== false
  const canRefresh = computed(() => {
    return refreshEnabled && (config.refreshToken.serverManaged || !!tokenManager.refreshToken.value)
  })

  // loggedIn depends on whether refresh is available:
  // - With refresh: status-based (session alive until refresh explicitly fails)
  //   Access token expiry is an implementation detail; refresh happens lazily.
  // - Without refresh: tied to accessToken (when cookie expires, session is over)
  const loggedIn = computed(() => {
    if (canRefresh.value) {
      return status.value === 'authenticated' || status.value === 'refreshing'
    }
    return status.value === 'authenticated' && !!tokenManager.accessToken.value
  })

  const setUser = (newUser: TUser | null) => {
    user.value = newUser
    status.value = newUser ? 'authenticated' : 'unauthenticated'
  }

  // Helper to handle user data from responses
  const handleUserResponse = async (data: unknown): Promise<void> => {
    if (config.user?.property) {
      const userData = getNestedProperty(data, config.user.property)
      if (userData && isObject(userData)) {
        setUser(userData as TUser)
        return
      }
    }

    // Auto-fetch user if configured
    if (config.user?.autoFetch !== false && config.endpoints?.user) {
      await fetchUser()
    }
    else {
      status.value = 'authenticated'
    }
  }

  // Auth methods
  const login = async (credentials: LoginCredentials, options?: LoginOptions): Promise<void> => {
    if (!config.endpoints?.login) {
      throw new Error('Login endpoint is not configured')
    }

    status.value = 'loading'

    try {
      const data = await $fetch(`${config.baseUrl}${config.endpoints.login.path}`, {
        ...config.endpoints.login.fetchOptions,
        method: config.endpoints.login.method,
        body: credentials,
      })

      // Extract and set tokens using token manager
      tokenManager.setTokensFromResponse(data)

      // Update coordination cookie after successful login
      tokenManager.updateCoordinationCookie()

      // Handle user data
      await handleUserResponse(data)

      // Handle redirect based on options
      if (options?.redirect === false) {
        // Explicitly disabled redirect
        return
      }

      if (options?.redirect) {
        // Custom redirect from options
        handleRedirect(options.redirect)
        return
      }

      if (config.redirect?.home) {
        // Default redirect from config
        handleRedirect(config.redirect.home)
      }
    }
    catch (error) {
      status.value = 'unauthenticated'
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    if (config.endpoints?.logout) {
      try {
        await $fetch(`${config.baseUrl}${config.endpoints.logout.path}`, {
          ...config.endpoints.logout.fetchOptions,
          method: config.endpoints.logout.method,
          headers: tokenManager.getAuthHeaders(),
        })
      }
      catch (error) {
        console.error('[Auth] Logout request failed:', error)
      }
    }

    // Clear all auth state
    tokenManager.clearTokens()
    setUser(null)

    // Clear coordination cookie on logout
    tokenManager.clearCoordinationCookie()

    // Stop auto-refresh if active (client-side only)
    if (import.meta.client && '$refreshManager' in nuxtApp) {
      const refreshManager = nuxtApp.$refreshManager as { stop: () => void } | undefined
      refreshManager?.stop()
    }

    // Redirect to logout page
    handleRedirect(config.redirect?.logout)
  }

  const register = async (data: RegisterData): Promise<void> => {
    if (!config.endpoints?.register) {
      throw new Error('Register endpoint is not configured')
    }

    status.value = 'loading'

    try {
      const response = await $fetch(`${config.baseUrl}${config.endpoints.register.path}`, {
        ...config.endpoints.register.fetchOptions,
        method: config.endpoints.register.method,
        body: data,
      })

      // Try to auto-login if tokens are returned
      const accessTokenValue = config.accessToken?.property
        ? getNestedProperty(response, config.accessToken.property)
        : null

      if (accessTokenValue && typeof accessTokenValue === 'string') {
        tokenManager.setTokensFromResponse(response)

        // Update coordination cookie after successful register
        tokenManager.updateCoordinationCookie()

        await handleUserResponse(response)

        // Redirect to home after successful registration
        handleRedirect(config.redirect?.home)
      }
      else {
        status.value = 'unauthenticated'
        // Redirect to login if no tokens returned
        handleRedirect(config.redirect?.login)
      }
    }
    catch (error) {
      status.value = 'unauthenticated'
      throw error
    }
  }

  // Deduplicate concurrent refresh calls — middleware, auto-refresh plugin,
  // and session init can all trigger refresh() around the same time.
  let refreshPromise: Promise<void> | null = null

  const refresh = async (): Promise<void> => {
    if (refreshPromise) {
      if (import.meta.dev) {
        console.debug('[Auth] Refresh already in progress, reusing existing request')
      }
      return refreshPromise
    }

    refreshPromise = doRefresh()
    try {
      return await refreshPromise
    }
    finally {
      refreshPromise = null
    }
  }

  const doRefresh = async (): Promise<void> => {
    if (!config.endpoints?.refresh) {
      throw new Error('Refresh endpoint is not configured or disabled')
    }

    // Check token availability for client-managed mode
    if (!config.refreshToken.serverManaged && !tokenManager.refreshToken.value) {
      throw new Error('No refresh token available')
    }

    if (import.meta.dev) {
      console.log('[Auth] Starting token refresh:', {
        isServer: import.meta.server,
        serverManaged: config.refreshToken.serverManaged,
        endpoint: `${config.baseUrl}${config.endpoints.refresh.path}`,
      })
    }

    status.value = 'refreshing'

    try {
      const body = config.refreshToken.serverManaged
        ? undefined
        : { [config.refreshToken.bodyProperty]: tokenManager.refreshToken.value }

      // On SSR, we need to forward cookies from the incoming request
      const headers: Record<string, string> = {}
      if (import.meta.server) {
        // Get the request event to access incoming cookies
        const event = nuxtApp.ssrContext?.event
        if (event) {
          const cookieHeader = event.node.req.headers.cookie
          if (cookieHeader) {
            headers.cookie = cookieHeader
            if (import.meta.dev) {
              console.log('[Auth] Forwarding cookies on SSR:', cookieHeader)
            }
          }
        }
      }

      const data = await $fetch(`${config.baseUrl}${config.endpoints.refresh.path}`, {
        ...config.endpoints.refresh.fetchOptions,
        method: config.endpoints.refresh.method,
        body,
        headers: {
          ...config.endpoints.refresh.fetchOptions?.headers,
          ...headers,
        },
      })

      // Update tokens using token manager
      tokenManager.setTokensFromResponse(data)

      // Update coordination cookie after successful refresh
      tokenManager.updateCoordinationCookie()

      status.value = 'authenticated'

      if (import.meta.dev) {
        console.log('[Auth] Token refresh successful:', {
          isServer: import.meta.server,
          hasAccessToken: !!tokenManager.accessToken.value,
        })
      }
    }
    catch (error) {
      if (import.meta.dev) {
        console.error('[Auth] Token refresh failed:', {
          isServer: import.meta.server,
          error,
        })
      }

      // Determine if this is a server rejection (4xx) or a network error
      const responseStatus = (error as { response?: { status?: number } })?.response?.status
      const isServerRejection = responseStatus !== undefined && responseStatus >= 400 && responseStatus < 500

      if (isServerRejection) {
        // Server explicitly rejected refresh — tokens are invalid, clear everything
        tokenManager.clearTokens()
        // setUser(null)
        tokenManager.clearCoordinationCookie()
      }

      // Network error — keep tokens intact, caller can retry
      // Status reverts to previous meaningful state
      status.value = isServerRejection ? 'unauthenticated' : 'authenticated'

      throw error
    }
  }

  const fetchUser = async (): Promise<void> => {
    if (!config.endpoints?.user) {
      throw new Error('User endpoint is not configured')
    }

    if (!tokenManager.accessToken.value) {
      if (!canRefresh.value) {
        status.value = 'unauthenticated'
      }
      return
    }

    // Only set 'loading' if not already authenticated — avoids loggedIn flicker
    // that would cause auto-refresh watcher to stop/restart
    if (status.value !== 'authenticated') {
      status.value = 'loading'
    }

    try {
      const data = await $fetch(`${config.baseUrl}${config.endpoints.user.path}`, {
        ...config.endpoints.user.fetchOptions,
        method: config.endpoints.user.method,
        headers: tokenManager.getAuthHeaders(),
      })

      const userData = config.user?.property
        ? getNestedProperty(data, config.user.property)
        : data

      if (isObject(userData)) {
        setUser(userData as TUser)
      }
    }
    catch (error) {
      status.value = 'unauthenticated'
      throw error
    }
  }

  const auth = {
    user,
    status,
    loggedIn,
    canRefresh,
    accessToken: tokenManager.accessToken,
    refreshToken: tokenManager.refreshToken,
    login,
    logout,
    register,
    refresh,
    fetchUser,
    getAuthHeaders: tokenManager.getAuthHeaders,
  } as Auth<TUser>

  nuxtApp.provide('auth', auth)

  return auth
}
