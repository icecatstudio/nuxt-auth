import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

describe('no-refresh auth', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/no-refresh', import.meta.url)),
  })

  // --- Login ---

  describe('login', () => {
    it('returns only accessToken (no refreshToken)', async () => {
      const res = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })
      expect(res.accessToken).toMatch(/^mock-access-token-/)
      expect(res.refreshToken).toBeUndefined()
      expect(res.user.email).toBe('test@example.com')
      expect(res.user.name).toBe('Test User')
    })

    it('returns 401 on invalid credentials', async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@example.com', password: 'wrong' }),
      })
      expect(res.status).toBe(401)
    })
  })

  // --- Logout ---

  describe('logout', () => {
    it('returns success message', async () => {
      const res = await $fetch('/api/auth/logout', { method: 'POST' })
      expect(res.message).toBe('Logged out successfully')
    })
  })

  // --- No refresh endpoint ---

  describe('no refresh capability', () => {
    it('has no refresh endpoint', async () => {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      // Should return 404/405 since refresh endpoint is not defined in the fixture
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('canRefresh is always false', async () => {
      const html = await $fetch('/')
      expect(html).toMatch(/data-can-refresh[^>]*>false</)
    })
  })

  // --- User endpoint ---

  describe('user', () => {
    it('returns user data with valid token', async () => {
      const res = await $fetch('/api/auth/user', {
        headers: { Authorization: 'Bearer mock-access-token-123' },
      })
      expect(res.email).toBe('test@example.com')
      expect(res.name).toBe('Test User')
    })

    it('returns 401 without Authorization header', async () => {
      const res = await fetch('/api/auth/user')
      expect(res.status).toBe(401)
    })
  })

  // --- SSR ---

  describe('SSR', () => {
    it('renders as unauthenticated without cookies', async () => {
      const html = await $fetch('/')
      expect(html).toMatch(/data-status[^>]*>idle</)
      expect(html).toMatch(/data-logged-in[^>]*>false</)
      expect(html).toMatch(/data-can-refresh[^>]*>false</)
    })

    it('renders as authenticated with access token cookie', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })
      const res = await fetch('/', {
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}`,
        },
      })
      const html = await res.text()
      // No refresh → session-init falls to "has access token" → fetchUserIfNeeded → marks authenticated on SSR
      expect(html).toMatch(/data-status[^>]*>authenticated</)
      expect(html).toMatch(/data-logged-in[^>]*>true</)
      expect(html).toMatch(/data-has-access-token[^>]*>true</)
      // User is NOT fetched on SSR — fetchUserIfNeeded skips on server
      expect(html).toMatch(/data-user-email[^>]*></)
    })

    it('loggedIn depends on accessToken presence (not just status)', async () => {
      // Without any tokens: loggedIn should be false
      // With no-refresh mode: loggedIn = status === 'authenticated' && !!accessToken
      const html = await $fetch('/')
      expect(html).toMatch(/data-logged-in[^>]*>false</)
      expect(html).toMatch(/data-has-access-token[^>]*>false</)
    })
  })

  // --- Error scenarios ---

  describe('error handling', () => {
    it('cannot recover session without refresh capability', async () => {
      // No refresh endpoint → once access token is gone, session is lost
      const res = await fetch('/dashboard', {
        redirect: 'manual',
      })
      expect([301, 302]).toContain(res.status)
      const location = res.headers.get('location') || ''
      expect(location).toContain('/login')
    })

    it('loggedIn is false when access token cookie is empty', async () => {
      const res = await fetch('/', {
        headers: {
          cookie: 'auth.access_token=',
        },
      })
      const html = await res.text()
      expect(html).toMatch(/data-logged-in[^>]*>false</)
      expect(html).toMatch(/data-can-refresh[^>]*>false</)
    })
  })

  // --- Middleware ---

  describe('middleware', () => {
    it('redirects to /login when accessing protected page without auth', async () => {
      const res = await fetch('/dashboard', { redirect: 'manual' })
      expect([301, 302]).toContain(res.status)
      const location = res.headers.get('location') || ''
      expect(location).toContain('/login')
    })

    it('allows access to protected page with valid access token', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })
      const res = await fetch('/dashboard', {
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}`,
        },
      })
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toMatch(/data-page[^>]*>dashboard</)
    })

    it('guest page is accessible without auth', async () => {
      const res = await fetch('/login')
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toMatch(/data-page[^>]*>login</)
    })

    it('guest page redirects when authenticated', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })
      const res = await fetch('/login', {
        redirect: 'manual',
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}`,
        },
      })
      expect([301, 302]).toContain(res.status)
      const location = res.headers.get('location') || ''
      expect(location).toContain('/dashboard')
    })
  })
})
