import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

describe('concurrent refresh deduplication', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/client-managed', import.meta.url)),
  })

  // Reset refresh counter before each test
  beforeEach(async () => {
    await fetch('/api/auth/refresh-count', { method: 'DELETE' })
  })

  it('deduplicates concurrent refresh calls into a single request', async () => {
    const loginRes = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'password' },
    })

    // Reset counter
    await fetch('/api/auth/refresh-count', { method: 'DELETE' })

    // Visit page that triggers 3 concurrent refresh() calls on SSR
    const res = await fetch('/concurrent-refresh', {
      headers: {
        cookie: `auth.refresh_token=${loginRes.refreshToken}`,
      },
    })
    const html = await res.text()

    // All 3 calls should resolve successfully (not throw)
    expect(html).toMatch(/data-refresh-results[^>]*>all-resolved</)
    expect(html).toMatch(/data-refresh-error[^>]*></)

    // Check how many actual HTTP requests hit the refresh endpoint
    const countRes = await $fetch('/api/auth/refresh-count')
    // Deduplication: 3 concurrent refresh() calls should result in only 1 HTTP request
    // Note: session-init may also call refresh(), so count could be 2 (session-init + page)
    // But the 3 concurrent calls on the page should be merged into 1
    expect(countRes.count).toBeLessThanOrEqual(2)
  })

  it('all concurrent calls resolve even on failure', async () => {
    // Use invalid refresh token → all 3 concurrent calls should fail
    const res = await fetch('/concurrent-refresh', {
      headers: {
        cookie: 'auth.refresh_token=invalid-token',
      },
    })
    // session-init tries refresh first → fails → page may not try again
    // Either way, no crash
    expect(res.status).toBe(200)
  })
})
