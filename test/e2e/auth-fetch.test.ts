import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

describe('useAuthFetch', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/client-managed', import.meta.url)),
  })

  describe('auth header injection', () => {
    it('injects Authorization header and fetches protected data on SSR', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })

      const res = await fetch('/fetch-test', {
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}; auth.refresh_token=${loginRes.refreshToken}`,
        },
      })
      const html = await res.text()
      expect(html).toMatch(/data-fetch-result[^>]*>2</) // 2 items
      expect(html).toMatch(/data-fetch-error[^>]*></) // no error
    })

    it('does not fetch protected data without access token', async () => {
      const res = await fetch('/fetch-test')
      const html = await res.text()
      // No access token → authFetch not called on SSR (guarded by if)
      expect(html).toMatch(/data-fetch-result[^>]*></)
    })
  })

  describe('proactive refresh', () => {
    it('refreshes token before making request when only refresh token is present', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })

      // Provide only refresh token — authFetch should proactively refresh
      // But our fetch-test page only calls authFetch when accessToken exists on SSR
      // The session-init plugin will refresh first, giving us an access token
      const res = await fetch('/fetch-test', {
        headers: {
          cookie: `auth.refresh_token=${loginRes.refreshToken}`,
        },
      })
      const html = await res.text()
      // session-init refreshes → access token obtained → authFetch succeeds
      expect(html).toMatch(/data-status[^>]*>authenticated</)
      expect(html).toMatch(/data-fetch-result[^>]*>2</)
    })
  })

  describe('direct API with auth headers', () => {
    it('protected endpoint returns 401 without auth', async () => {
      const res = await fetch('/api/protected-data')
      expect(res.status).toBe(401)
    })

    it('protected endpoint returns data with valid token', async () => {
      const data = await $fetch('/api/protected-data', {
        headers: { Authorization: 'Bearer mock-access-token-123' },
      })
      expect(data.items).toHaveLength(2)
      expect(data.items[0].name).toBe('Item 1')
    })

    it('protected endpoint returns 401 with invalid token', async () => {
      const res = await fetch('/api/protected-data', {
        headers: { Authorization: 'Bearer invalid-token' },
      })
      expect(res.status).toBe(401)
    })
  })
})
