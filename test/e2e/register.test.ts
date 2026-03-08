import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

describe('register scenarios', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/client-managed', import.meta.url)),
  })

  describe('register without tokens (no auto-login)', () => {
    it('returns success but no tokens', async () => {
      const res = await $fetch('/api/auth/register-no-tokens', {
        method: 'POST',
        body: { email: 'new@example.com', password: 'pass123', name: 'New User' },
      })
      expect(res.message).toContain('verify')
      expect(res.accessToken).toBeUndefined()
      expect(res.refreshToken).toBeUndefined()
    })

    it('returns 400 on missing fields', async () => {
      const res = await fetch('/api/auth/register-no-tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
      expect(res.status).toBe(400)
    })
  })
})
