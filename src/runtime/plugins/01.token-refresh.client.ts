import { defineNuxtPlugin, useAuth, useRuntimeConfig, watch } from '#imports'
import type { ResolvedModuleOptions } from '../types'
import { useTokenManager } from '../composables/useTokenManager'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.auth as ResolvedModuleOptions

  // Skip if auto-refresh is disabled
  if (!config?.autoRefresh?.enabled || config?.endpoints?.refresh === false) {
    return
  }

  const auth = useAuth()
  const tokenManager = useTokenManager()
  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  let isPageVisible = true
  let hasStarted = false

  const refreshInterval = config.autoRefresh.interval
  const pauseOnInactive = config.autoRefresh.pauseOnInactive
  const enableTabCoordination = config.autoRefresh.enableTabCoordination
  const coordinationThreshold = config.autoRefresh.coordinationThreshold

  const stop = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  // Cross-tab: skip if another tab refreshed within the threshold
  const shouldSkipDueToCoordination = (): boolean => {
    if (!enableTabCoordination) return false

    const lastCoordination = tokenManager.coordinationTimestamp.value
    if (!lastCoordination) return false

    return (Date.now() - lastCoordination) < coordinationThreshold * 1000
  }

  const performRefresh = async () => {
    if (shouldSkipDueToCoordination()) {
      if (import.meta.dev) {
        console.debug('[Auth] Skipping refresh - another tab refreshed recently')
      }
      schedule()
      return
    }

    try {
      await auth.refresh()
      schedule()
    }
    catch (error) {
      const responseStatus = (error as { response?: { status?: number } })?.response?.status
      const isServerRejection = responseStatus !== undefined && responseStatus >= 400 && responseStatus < 500

      if (isServerRejection) {
        // Server rejected — auth.refresh() already cleared tokens
        // loggedIn watcher will call stop()
        if (import.meta.dev) {
          console.debug('[Auth] Refresh rejected by server, stopping auto-refresh')
        }
      }
      else {
        // Network error — reschedule with double interval
        if (import.meta.dev) {
          console.debug('[Auth] Refresh failed (network), retrying later:', error)
        }
        refreshTimer = setTimeout(performRefresh, refreshInterval * 2 * 1000)
      }
    }
  }

  const schedule = (immediate = false) => {
    stop()

    if (pauseOnInactive && !isPageVisible) {
      if (import.meta.dev) {
        console.debug('[Auth] Pausing refresh - page is not visible')
      }
      return
    }

    if (auth.canRefresh.value) {
      if (immediate) {
        refreshTimer = setTimeout(performRefresh, 0)
      }
      else {
        refreshTimer = setTimeout(performRefresh, refreshInterval * 1000)
      }
    }
  }

  // Provide refresh manager for external use
  nuxtApp.provide('refreshManager', {
    start: schedule,
    stop,
    refresh: () => auth.refresh(),
  })

  // Start auto-refresh if user is already authenticated
  // Always use full interval — session-init plugin already refreshed the token
  if (auth.loggedIn.value) {
    schedule()
    hasStarted = true
  }

  // React to auth state changes
  watch(() => auth.loggedIn.value, (isLoggedIn) => {
    if (isLoggedIn && !hasStarted) {
      schedule()
      hasStarted = true
    }
    else if (!isLoggedIn) {
      stop()
      hasStarted = false
    }
  })

  // Pause when tab is hidden, resume with immediate refresh when visible
  if (pauseOnInactive && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      isPageVisible = !document.hidden

      if (import.meta.dev) {
        console.debug('[Auth] Page visibility changed:', isPageVisible ? 'visible' : 'hidden')
      }

      if (isPageVisible && hasStarted) {
        schedule(true)
      }
      else if (!isPageVisible) {
        stop()
      }
    })
  }
})
