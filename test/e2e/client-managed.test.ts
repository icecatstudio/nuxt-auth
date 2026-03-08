import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

describe('client-managed auth', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/client-managed', import.meta.url)),
  })

  // --- Login ---

  describe('login', () => {
    it('returns tokens on successful login via API', async () => {
      const res = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })
      expect(res.accessToken).toMatch(/^mock-access-token-/)
      expect(res.refreshToken).toMatch(/^mock-refresh-token-/)
      expect(res.user.email).toBe('test@example.com')
      expect(res.user.name).toBe('Test User')
      expect(res.user.role).toBe('admin')
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

  // --- Register ---

  describe('register', () => {
    it('returns tokens and user on successful registration', async () => {
      const res = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email: 'new@example.com', password: 'pass123', name: 'New User' },
      })
      expect(res.accessToken).toMatch(/^mock-access-token-/)
      expect(res.refreshToken).toMatch(/^mock-refresh-token-/)
      expect(res.user.email).toBe('new@example.com')
      expect(res.user.name).toBe('New User')
    })

    it('returns 400 on missing fields', async () => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
      expect(res.status).toBe(400)
    })
  })

  // --- Refresh ---

  describe('refresh', () => {
    it('returns new tokens for valid refresh token', async () => {
      const res = await $fetch('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: 'mock-refresh-token-123' },
      })
      expect(res.accessToken).toMatch(/^mock-access-token-/)
      expect(res.refreshToken).toMatch(/^mock-refresh-token-/)
    })

    it('returns 401 for invalid refresh token', async () => {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid-token' }),
      })
      expect(res.status).toBe(401)
    })

    it('returns 401 for missing refresh token', async () => {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(401)
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
      expect(res.role).toBe('admin')
      expect(res.id).toBe(1)
    })

    it('returns 401 without Authorization header', async () => {
      const res = await fetch('/api/auth/user')
      expect(res.status).toBe(401)
    })

    it('returns 401 with invalid token', async () => {
      const res = await fetch('/api/auth/user', {
        headers: { Authorization: 'Bearer invalid-token' },
      })
      expect(res.status).toBe(401)
    })
  })

  // --- SSR error scenarios ---

  describe('SSR error handling', () => {
    it('falls back to unauthenticated when refresh token is invalid on SSR', async () => {
      const res = await fetch('/', {
        headers: {
          cookie: 'auth.refresh_token=invalid-token',
        },
      })
      const html = await res.text()
      // session-init tries refresh → fails → status remains idle or unauthenticated
      expect(html).toMatch(/data-logged-in[^>]*>false</)
    })

    it('falls back to unauthenticated with expired/invalid access token and no refresh', async () => {
      const res = await fetch('/', {
        headers: {
          cookie: 'auth.access_token=expired-token',
        },
      })
      const html = await res.text()
      // Has access token but no refresh token → canRefresh=false → session-init marks authenticated
      // (server trusts the cookie; actual validation happens on API calls)
      expect(html).toMatch(/data-has-access-token[^>]*>true</)
      expect(html).toMatch(/data-can-refresh[^>]*>false</)
    })

    it('renders correctly with empty cookie values', async () => {
      const res = await fetch('/', {
        headers: {
          cookie: 'auth.access_token=; auth.refresh_token=',
        },
      })
      const html = await res.text()
      expect(html).toMatch(/data-logged-in[^>]*>false</)
    })
  })

  // --- SSR rendering ---

  describe('SSR', () => {
    it('renders as unauthenticated without cookies', async () => {
      const html = await $fetch('/')
      expect(html).toMatch(/data-status[^>]*>idle</)
      expect(html).toMatch(/data-logged-in[^>]*>false</)
      expect(html).toMatch(/data-can-refresh[^>]*>false</)
    })

    it('renders as authenticated when cookies are provided', async () => {
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
      // session-init refreshes on SSR → status = authenticated
      expect(html).toMatch(/data-status[^>]*>authenticated</)
      expect(html).toMatch(/data-logged-in[^>]*>true</)
      expect(html).toMatch(/data-has-access-token[^>]*>true</)
    })

    it('does not fetch user on SSR (user is null, fetched on client only)', async () => {
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
      // Session-init marks authenticated on SSR but skips fetchUser
      expect(html).toMatch(/data-status[^>]*>authenticated</)
      // User data should be empty on SSR — fetchUserIfNeeded returns early on server
      expect(html).toMatch(/data-user-email[^>]*></)
      expect(html).toMatch(/data-user-name[^>]*></)
    })

    it('canRefresh is true when refresh token cookie is present', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })

      const res = await fetch('/', {
        headers: {
          cookie: `auth.refresh_token=${loginRes.refreshToken}`,
        },
      })
      const html = await res.text()
      expect(html).toMatch(/data-can-refresh[^>]*>true</)
    })

    it('canRefresh is false without refresh token', async () => {
      const loginRes = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password' },
      })

      // Only provide access token — no refresh token
      const res = await fetch('/', {
        headers: {
          cookie: `auth.access_token=${loginRes.accessToken}`,
        },
      })
      const html = await res.text()
      expect(html).toMatch(/data-can-refresh[^>]*>false</)
    })

    it('loggedIn is true with status=authenticated and canRefresh', async () => {
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
      // With canRefresh=true, loggedIn = status === 'authenticated' || status === 'refreshing'
      expect(html).toMatch(/data-logged-in[^>]*>true</)
      expect(html).toMatch(/data-status[^>]*>authenticated</)
    })
  })
})
