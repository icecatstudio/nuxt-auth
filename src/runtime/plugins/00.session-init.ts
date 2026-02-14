import { defineNuxtPlugin, useAuth, useRuntimeConfig, useState } from '#imports'
import type { ResolvedModuleOptions } from '../types'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig().public.auth as ResolvedModuleOptions
  const auth = useAuth()

  // Config constants
  const isServerManaged = config.refreshToken.serverManaged
  const shouldAutoFetch = config.user.autoFetch && config.endpoints.user

  // Store SSR refresh result to sync to client (boolean only — no token in HTML payload)
  interface SSRRefreshResult {
    attempted: boolean
    success: boolean
  }

  const ssrRefreshResult = useState<SSRRefreshResult | null>('auth:ssr-refresh-result', () => null)

  if (import.meta.dev) {
    console.log('[Auth] Session initialization starting:', {
      isServer: import.meta.server,
      isServerManaged,
      canRefresh: auth.canRefresh.value,
      shouldAutoFetch,
      ssrRefreshResult: ssrRefreshResult.value,
    })
  }

  if (import.meta.client && import.meta.dev && ssrRefreshResult.value) {
    console.log('[Auth] SSR refresh result:', ssrRefreshResult.value)
  }

  try {
    await initializeSession()
    if (import.meta.dev) {
      console.log('[Auth] Session initialization completed:', {
        isServer: import.meta.server,
        status: auth.status.value,
        hasAccessToken: !!auth.accessToken.value,
      })
    }
  }
  catch (error) {
    if (import.meta.dev) {
      console.error('[Auth] Session initialization failed:', error)
    }
  }
  finally {
    // Clear SSR result after initialization
    if (import.meta.client) {
      ssrRefreshResult.value = null
    }
  }

  async function initializeSession() {
    const hasAccessToken = !!auth.accessToken.value
    const hasRefreshToken = !!auth.refreshToken.value

    if (import.meta.dev) {
      console.log('[Auth] Checking session state:', {
        isServer: import.meta.server,
        hasAccessToken,
        hasRefreshToken,
        currentStatus: auth.status.value,
      })
    }

    if (auth.canRefresh.value) {
      if (import.meta.dev) {
        console.log('[Auth] Attempting refresh on first load', {
          isServer: import.meta.server,
          mode: isServerManaged ? 'server-managed' : 'client-managed',
        })
      }

      // On server: always refresh and store result for client
      if (import.meta.server) {
        try {
          await tryRefreshAndFetchUser()
          // Store successful result (token syncs via useCookie hydration)
          ssrRefreshResult.value = {
            attempted: true,
            success: true,
          }
        }
        catch (error) {
          // Store failed result
          ssrRefreshResult.value = {
            attempted: true,
            success: false,
          }
          throw error
        }
        return
      }

      // On client: check if SSR already attempted refresh
      // If SSR attempted refresh, don't try again (success or failure)
      if (ssrRefreshResult.value?.attempted) {
        if (import.meta.dev) {
          console.log('[Auth] Skipping client refresh - SSR already attempted', {
            success: ssrRefreshResult.value.success,
          })
        }

        // If successful, fetch user; if failed, session stays unauthenticated
        if (ssrRefreshResult.value.success) {
          await fetchUserIfNeeded()
        }
        return
      }

      // Otherwise, refresh (no SSR or direct client navigation)
      await tryRefreshAndFetchUser()
      return
    }

    // Fallback: We have access token but no refresh capability - fetch user
    if (hasAccessToken) {
      if (import.meta.dev) {
        console.log('[Auth] Case 3: Has access token - restoring session')
      }
      await fetchUserIfNeeded()
    }
    else if (import.meta.dev) {
      console.log('[Auth] No tokens available - skipping session initialization')
    }
  }

  async function tryRefreshAndFetchUser() {
    try {
      await auth.refresh()
      await fetchUserIfNeeded()
    }
    catch (error) {
      // In server-managed mode, we don't clear tokens on failure
      // as the refresh token is in httpOnly cookie
      if (!isServerManaged) {
        auth.refreshToken.value = null
      }
      throw error
    }
  }

  async function fetchUserIfNeeded() {
    // On server: just mark as authenticated, don't fetch user
    if (import.meta.server) {
      auth.status.value = 'authenticated'
      return
    }

    // After SSR refresh, access token may not be hydrated yet — refresh on client if needed
    if (!auth.accessToken.value && auth.canRefresh.value) {
      try {
        await auth.refresh()
      }
      catch {
        // Refresh failed on client — session lost
        return
      }
    }

    // On client: fetch user if configured
    if (shouldAutoFetch) {
      try {
        await auth.fetchUser()
      }
      catch (error) {
        if (import.meta.dev) {
          console.error('[Auth] Failed to fetch user:', error)
        }
        // Don't throw, user can still be considered authenticated with just a token
        auth.status.value = 'authenticated'
      }
    }
    else {
      // No user fetch configured, but we have a token
      auth.status.value = 'authenticated'
    }
  }
})
