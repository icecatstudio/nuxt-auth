import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

describe('server-managed auth', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/server-managed', import.meta.url)),
  })

  // Helper: login and return { accessToken, refreshCookie }
  async function loginAndGetCookies() {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    })
    const body = await res.json()
    const setCookieHeader = res.headers.get('set-cookie') || ''
    const cookieMatch = setCookieHeader.match(/auth\.refresh_token=([^;]+)/)
    return {
      accessToken: body.accessToken as string,
      refreshCookieValue: cookieMatch![1] as string,
    }
  }

  // --- Login ---

  describe('login', () => {
    it('returns access token and user (no refreshToken in body)', async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.accessToken).toMatch(/^mock-access-token-/)
      expect(body.user.email).toBe('test@example.com')
      expect(body.user.name).toBe('Test User')
      // Refresh token should NOT be in the body (it's in httpOnly cookie)
      expect(body.refreshToken).toBeUndefined()
    })

    it('sets httpOnly refresh token cookie on login', async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })
      const setCookieHeader = res.headers.get('set-cookie') || ''
      expect(setCookieHeader).toContain('auth.refresh_token=')
      expect(setCookieHeader.toLowerCase()).toContain('httponly')
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

  // --- Refresh ---

  describe('refresh', () => {
    it('returns new access token when httpOnly cookie is present', async () => {
      const { refreshCookieValue } = await loginAndGetCookies()

      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cookie': `auth.refresh_token=${refreshCookieValue}`,
        },
        body: JSON.stringify({}),
      })
      expect(refreshRes.status).toBe(200)
      const body = await refreshRes.json()
      expect(body.accessToken).toMatch(/^mock-access-token-/)
      // No refresh token in body for server-managed
      expect(body.refreshToken).toBeUndefined()
    })

    it('sets new httpOnly cookie on refresh', async () => {
      const { refreshCookieValue } = await loginAndGetCookies()

      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cookie': `auth.refresh_token=${refreshCookieValue}`,
        },
        body: JSON.stringify({}),
      })
      const newSetCookie = refreshRes.headers.get('set-cookie') || ''
      expect(newSetCookie).toContain('auth.refresh_token=')
      expect(newSetCookie.toLowerCase()).toContain('httponly')
    })

    it('returns 401 without refresh cookie', async () => {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(401)
    })
  })

  // --- Logout ---

  describe('logout', () => {
    it('deletes httpOnly refresh cookie on logout', async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.message).toBe('Logged out successfully')
      // The set-cookie header should clear the refresh token
      const setCookieHeader = res.headers.get('set-cookie') || ''
      expect(setCookieHeader).toContain('auth.refresh_token=')
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
      expect(html).toMatch(/data-logged-in[^>]*>false</)
    })

    it('canRefresh is always true for server-managed (even without cookies)', async () => {
      // In server-managed mode, canRefresh = refreshEnabled && serverManaged = true
      // regardless of whether a cookie is present (server handles the cookie)
      const html = await $fetch('/')
      expect(html).toMatch(/data-can-refresh[^>]*>true</)
    })

    it('renders as authenticated with both access token and refresh cookie', async () => {
      const { accessToken, refreshCookieValue } = await loginAndGetCookies()

      const res = await fetch('/', {
        headers: {
          cookie: `auth.access_token=${accessToken}; auth.refresh_token=${refreshCookieValue}`,
        },
      })
      const html = await res.text()
      expect(html).toMatch(/data-status[^>]*>authenticated</)
      expect(html).toMatch(/data-logged-in[^>]*>true</)
      expect(html).toMatch(/data-has-access-token[^>]*>true</)
      // User is NOT fetched on SSR — fetchUserIfNeeded skips on server
      expect(html).toMatch(/data-user-email[^>]*></)
    })

    it('refreshes on SSR with httpOnly cookie forwarding (no access token)', async () => {
      const { refreshCookieValue } = await loginAndGetCookies()

      // Provide only httpOnly refresh cookie (no access token)
      // SSR session-init forwards cookies to refresh endpoint → gets new access token
      const res = await fetch('/', {
        headers: {
          cookie: `auth.refresh_token=${refreshCookieValue}`,
        },
      })
      const html = await res.text()
      expect(res.status).toBe(200)
      // After SSR refresh, status should be authenticated
      expect(html).toMatch(/data-status[^>]*>authenticated</)
      expect(html).toMatch(/data-logged-in[^>]*>true</)
      expect(html).toMatch(/data-has-access-token[^>]*>true</)
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

    it('allows access to protected page with valid cookies', async () => {
      const { accessToken, refreshCookieValue } = await loginAndGetCookies()

      const res = await fetch('/dashboard', {
        headers: {
          cookie: `auth.access_token=${accessToken}; auth.refresh_token=${refreshCookieValue}`,
        },
      })
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toMatch(/data-page[^>]*>dashboard</)
    })

    it('refreshes via cookie and grants access with only httpOnly cookie', async () => {
      const { refreshCookieValue } = await loginAndGetCookies()

      // Only httpOnly refresh cookie, no access token
      // session-init refreshes → middleware sees loggedIn=true → allows access
      const res = await fetch('/dashboard', {
        headers: {
          cookie: `auth.refresh_token=${refreshCookieValue}`,
        },
      })
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toMatch(/data-page[^>]*>dashboard</)
    })
  })
})
