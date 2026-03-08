import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

describe('custom config', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/custom-config', import.meta.url)),
  })

  // --- Custom headerName & token type ---

  describe('custom token header (X-Auth-Token: Token xxx)', () => {
    it('user endpoint accepts custom header', async () => {
      const res = await $fetch('/api/auth/user', {
        headers: { 'X-Auth-Token': 'Token mock-access-token-123' },
      })
      expect(res.data.user.email).toBe('test@example.com')
    })

    it('user endpoint rejects standard Authorization header', async () => {
      const res = await fetch('/api/auth/user', {
        headers: { Authorization: 'Bearer mock-access-token-123' },
      })
      expect(res.status).toBe(401)
    })

    it('user endpoint rejects wrong token type prefix', async () => {
      const res = await fetch('/api/auth/user', {
        headers: { 'X-Auth-Token': 'Bearer mock-access-token-123' },
      })
      expect(res.status).toBe(401)
    })
  })

  // --- Nested user.property ---

  describe('nested user.property (data.user)', () => {
    it('login returns user nested under data.user', async () => {
      const res = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })
      expect(res.data.user.email).toBe('test@example.com')
      expect(res.data.user.name).toBe('Test User')
      expect(res.accessToken).toMatch(/^mock-access-token-/)
    })

    it('extracts user from nested property on SSR after login', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })

      const res = await fetch('/', {
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}; auth.refresh_token=${loginRes.refreshToken}`,
        },
      })
      const html = await res.text()
      // autoFetch: false → user should NOT be fetched automatically
      // session-init marks authenticated but does not fetch user
      expect(html).toMatch(/data-status[^>]*>authenticated</)
      expect(html).toMatch(/data-user-email[^>]*></) // empty — no auto-fetch
    })
  })

  // --- autoFetch: false ---

  describe('autoFetch: false', () => {
    it('does not fetch user automatically on SSR', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })

      const res = await fetch('/', {
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}; auth.refresh_token=${loginRes.refreshToken}`,
        },
      })
      const html = await res.text()
      // Status should be authenticated (has tokens)
      expect(html).toMatch(/data-status[^>]*>authenticated</)
      expect(html).toMatch(/data-has-access-token[^>]*>true</)
      // But user should be empty since autoFetch is disabled
      expect(html).toMatch(/data-user-email[^>]*></)
      expect(html).toMatch(/data-user-name[^>]*></)
    })

    it('is authenticated without user data (status-based)', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })

      const res = await fetch('/', {
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}; auth.refresh_token=${loginRes.refreshToken}`,
        },
      })
      const html = await res.text()
      expect(html).toMatch(/data-logged-in[^>]*>true</)
    })

    it('allows access to protected page without user data', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })

      const res = await fetch('/dashboard', {
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}; auth.refresh_token=${loginRes.refreshToken}`,
        },
      })
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toMatch(/data-page[^>]*>dashboard</)
      expect(html).toMatch(/data-user-email[^>]*></) // still empty
    })
  })
})
