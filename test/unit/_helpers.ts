import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ResolvedModuleOptions } from '../../src/runtime/types'

/**
 * Creates a default resolved config for unit tests.
 * All fields match module.ts defaults.
 */
export function createDefaultConfig(overrides?: Record<string, unknown>): ResolvedModuleOptions {
  const base = {
    baseUrl: '/api/auth',
    endpoints: {
      login: { path: '/login', method: 'post', fetchOptions: {} },
      logout: { path: '/logout', method: 'post', fetchOptions: {} },
      register: { path: '/register', method: 'post', fetchOptions: {} },
      refresh: { path: '/refresh', method: 'post', fetchOptions: {} },
      user: { path: '/user', method: 'get', fetchOptions: {} },
    },
    accessToken: {
      property: 'accessToken',
      cookieName: 'auth.access_token',
      httpOnly: false,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      domain: '',
      maxAge: 900,
      type: 'Bearer',
      headerName: 'Authorization',
    },
    refreshToken: {
      property: 'refreshToken',
      cookieName: 'auth.refresh_token',
      httpOnly: false,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      domain: '',
      maxAge: 604800,
      serverManaged: false,
      bodyProperty: 'refreshToken',
      name: 'auth.refresh_token',
    },
    autoRefresh: {
      enabled: true,
      interval: 675,
      pauseOnInactive: true,
      enableTabCoordination: true,
      coordinationCookieName: 'auth.last_refresh',
      coordinationThreshold: 5,
    },
    user: {
      property: '',
      autoFetch: true,
    },
    redirect: {
      login: '/login',
      logout: '/',
      home: '/',
    },
    globalMiddleware: false,
  }

  if (overrides) {
    return deepMerge(base, overrides) as ResolvedModuleOptions
  }

  return base as unknown as ResolvedModuleOptions
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
      && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
    }
    else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * Creates a mock useCookie that stores values in simple refs.
 * Returns the factory and a map of all created cookies for inspection.
 */
export function createCookieMock() {
  const cookies = new Map<string, Ref<unknown>>()

  const useCookie = (name: string, opts?: { default?: () => unknown }) => {
    if (!cookies.has(name)) {
      cookies.set(name, ref(opts?.default?.() ?? null))
    }
    return cookies.get(name)!
  }

  return { useCookie, cookies }
}
