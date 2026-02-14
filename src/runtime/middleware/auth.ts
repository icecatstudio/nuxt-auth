import type { RouteLocationNormalized } from 'vue-router'
import { defineNuxtRouteMiddleware, useAuth, useRuntimeConfig } from '#imports'
import type { ResolvedModuleOptions } from '../types'
import { handleRedirect } from '../utils/redirect'

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized) => {
  const auth = useAuth()
  const config = useRuntimeConfig().public.auth as ResolvedModuleOptions

  const authMeta = to.meta.auth

  // Public pages - allow access regardless of auth status
  if (authMeta === false) {
    return
  }

  // Guest only pages (login, register) - redirect if authenticated
  if ((authMeta === 'guest' || authMeta === 'guestOnly') && auth.loggedIn.value) {
    return handleRedirect(config.redirect.home)
  }

  // Check if auth is required
  const requiresAuth = authMeta === true || (authMeta === undefined && config.globalMiddleware)

  if (requiresAuth && !auth.loggedIn.value) {
    // Not logged in at all — try to refresh before redirecting
    if (auth.canRefresh.value) {
      try {
        await auth.refresh()
      }
      catch {
        // Refresh failed — will redirect to login below
      }
    }

    if (!auth.loggedIn.value) {
      return handleRedirect(config.redirect.login)
    }
  }

  // Logged in but access token expired (useCookie cleared ref on maxAge) — refresh lazily on navigation
  if (auth.loggedIn.value && !auth.accessToken.value && auth.canRefresh.value) {
    try {
      await auth.refresh()
    }
    catch {
      // Refresh failed — session lost
    }
  }
})
