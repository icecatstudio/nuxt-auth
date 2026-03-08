import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { createDefaultConfig, createCookieMock } from './_helpers'

let cookieMock: ReturnType<typeof createCookieMock>
let config = createDefaultConfig()

vi.mock('#imports', () => {
  return {
    useCookie: (...args: unknown[]) => cookieMock.useCookie(args[0] as string, args[1] as { default?: () => unknown }),
    useRuntimeConfig: () => ({ public: { auth: config } }),
    ref: (val: unknown) => ref(val),
  }
})

import { useTokenManager } from '../../src/runtime/composables/useTokenManager'

describe('useTokenManager', () => {
  beforeEach(() => {
    cookieMock = createCookieMock()
    config = createDefaultConfig()
  })

  describe('getAuthHeaders', () => {
    it('returns empty object when no access token', () => {
      const tm = useTokenManager()
      expect(tm.getAuthHeaders()).toEqual({})
    })

    it('returns Authorization header with Bearer token', () => {
      const tm = useTokenManager()
      tm.accessToken.value = 'my-token'
      expect(tm.getAuthHeaders()).toEqual({ Authorization: 'Bearer my-token' })
    })

    it('uses custom headerName and type from config', () => {
      config = createDefaultConfig({
        accessToken: { headerName: 'X-Auth', type: 'Token' },
      })
      const tm = useTokenManager()
      tm.accessToken.value = 'abc'
      expect(tm.getAuthHeaders()).toEqual({ 'X-Auth': 'Token abc' })
    })
  })

  describe('setTokensFromResponse', () => {
    it('extracts access token from response', () => {
      const tm = useTokenManager()
      tm.setTokensFromResponse({ accessToken: 'at-123' })
      expect(tm.accessToken.value).toBe('at-123')
    })

    it('extracts refresh token from response', () => {
      const tm = useTokenManager()
      tm.setTokensFromResponse({ accessToken: 'at', refreshToken: 'rt-456' })
      expect(tm.refreshToken.value).toBe('rt-456')
    })

    it('extracts tokens from nested paths', () => {
      config = createDefaultConfig({
        accessToken: { property: 'data.access' },
        refreshToken: { property: 'data.refresh' },
      })
      const tm = useTokenManager()
      tm.setTokensFromResponse({ data: { access: 'nested-at', refresh: 'nested-rt' } })
      expect(tm.accessToken.value).toBe('nested-at')
      expect(tm.refreshToken.value).toBe('nested-rt')
    })

    it('does not set refresh token when serverManaged is true', () => {
      config = createDefaultConfig({ refreshToken: { serverManaged: true } })
      const tm = useTokenManager()
      tm.setTokensFromResponse({ accessToken: 'at', refreshToken: 'rt' })
      expect(tm.accessToken.value).toBe('at')
      expect(tm.refreshToken.value).toBeNull()
    })

    it('does not set refresh token when refresh endpoint is disabled', () => {
      config = createDefaultConfig({ endpoints: { refresh: false } })
      const tm = useTokenManager()
      tm.setTokensFromResponse({ accessToken: 'at', refreshToken: 'rt' })
      expect(tm.accessToken.value).toBe('at')
      expect(tm.refreshToken.value).toBeNull()
    })

    it('ignores empty string token values', () => {
      const tm = useTokenManager()
      tm.setTokensFromResponse({ accessToken: '', refreshToken: '' })
      expect(tm.accessToken.value).toBeNull()
      expect(tm.refreshToken.value).toBeNull()
    })

    it('ignores non-string token values', () => {
      const tm = useTokenManager()
      tm.setTokensFromResponse({ accessToken: 123, refreshToken: { bad: true } })
      expect(tm.accessToken.value).toBeNull()
      expect(tm.refreshToken.value).toBeNull()
    })

    it('ignores missing token properties', () => {
      const tm = useTokenManager()
      tm.setTokensFromResponse({ someOtherField: 'value' })
      expect(tm.accessToken.value).toBeNull()
      expect(tm.refreshToken.value).toBeNull()
    })
  })

  describe('clearTokens', () => {
    it('clears both tokens in client-managed mode', () => {
      const tm = useTokenManager()
      tm.accessToken.value = 'at'
      tm.refreshToken.value = 'rt'
      tm.clearTokens()
      expect(tm.accessToken.value).toBeNull()
      expect(tm.refreshToken.value).toBeNull()
    })

    it('clears only access token when serverManaged is true', () => {
      config = createDefaultConfig({ refreshToken: { serverManaged: true } })
      const tm = useTokenManager()
      tm.accessToken.value = 'at'
      tm.clearTokens()
      expect(tm.accessToken.value).toBeNull()
      // refreshToken is a plain ref(null) in server-managed mode, should stay null
      expect(tm.refreshToken.value).toBeNull()
    })
  })

  describe('hasTokens', () => {
    it('reports both tokens as absent initially', () => {
      const tm = useTokenManager()
      expect(tm.hasTokens()).toEqual({ access: false, refresh: false })
    })

    it('reports correct state when tokens are set', () => {
      const tm = useTokenManager()
      tm.accessToken.value = 'at'
      expect(tm.hasTokens()).toEqual({ access: true, refresh: false })
      tm.refreshToken.value = 'rt'
      expect(tm.hasTokens()).toEqual({ access: true, refresh: true })
    })
  })

  describe('coordination cookie', () => {
    it('updates coordination cookie with timestamp', () => {
      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      const tm = useTokenManager()
      tm.updateCoordinationCookie()
      expect(tm.coordinationTimestamp.value).toBe(now)
      vi.restoreAllMocks()
    })

    it('clears coordination cookie', () => {
      const tm = useTokenManager()
      tm.updateCoordinationCookie()
      expect(tm.coordinationTimestamp.value).not.toBeNull()
      tm.clearCoordinationCookie()
      expect(tm.coordinationTimestamp.value).toBeNull()
    })

    it('is a no-op when tab coordination is disabled', () => {
      config = createDefaultConfig({ autoRefresh: { enableTabCoordination: false } })
      const tm = useTokenManager()
      tm.updateCoordinationCookie()
      expect(tm.coordinationTimestamp.value).toBeNull()
    })
  })

  describe('cookie initialization', () => {
    it('uses useCookie for refresh token in client-managed mode', () => {
      useTokenManager()
      expect(cookieMock.cookies.has('auth.refresh_token')).toBe(true)
    })

    it('uses plain ref for refresh token when serverManaged', () => {
      config = createDefaultConfig({ refreshToken: { serverManaged: true } })
      useTokenManager()
      expect(cookieMock.cookies.has('auth.refresh_token')).toBe(false)
    })

    it('uses plain ref for refresh token when refresh endpoint is disabled', () => {
      config = createDefaultConfig({ endpoints: { refresh: false } })
      useTokenManager()
      expect(cookieMock.cookies.has('auth.refresh_token')).toBe(false)
    })
  })
})
