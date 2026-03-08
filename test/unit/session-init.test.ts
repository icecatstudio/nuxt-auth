import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { createDefaultConfig } from './_helpers'
import type { Ref } from 'vue'

// --- Mock state ---

let config = createDefaultConfig()
let mockAuth: {
  status: Ref<string>
  accessToken: Ref<string | null>
  refreshToken: Ref<string | null>
  canRefresh: Ref<boolean>
  loggedIn: Ref<boolean>
  refresh: ReturnType<typeof vi.fn>
  fetchUser: ReturnType<typeof vi.fn>
}
let ssrRefreshState: Ref<{ attempted: boolean, success: boolean } | null>

function createMockAuth() {
  return {
    status: ref('idle'),
    accessToken: ref<string | null>(null),
    refreshToken: ref<string | null>(null),
    canRefresh: ref(false),
    loggedIn: ref(false),
    refresh: vi.fn(),
    fetchUser: vi.fn(),
  }
}

// Track the plugin callback so we can invoke it manually
let pluginCallback: (() => Promise<void>) | null = null

vi.mock('#imports', () => {
  return {
    defineNuxtPlugin: (cb: () => Promise<void>) => {
      pluginCallback = cb
    },
    useAuth: () => mockAuth,
    useRuntimeConfig: () => ({ public: { auth: config } }),
    useState: (_key: string, init?: () => unknown) => {
      if (_key === 'auth:ssr-refresh-result') {
        return ssrRefreshState
      }
      return ref(init?.())
    },
  }
})

// Import the plugin to register the callback via defineNuxtPlugin mock
async function loadPlugin() {
  // Clear the module cache to re-execute the plugin definition
  vi.resetModules()

  // Re-mock after resetModules
  vi.doMock('#imports', () => ({
    defineNuxtPlugin: (cb: () => Promise<void>) => {
      pluginCallback = cb
    },
    useAuth: () => mockAuth,
    useRuntimeConfig: () => ({ public: { auth: config } }),
    useState: (_key: string, init?: () => unknown) => {
      if (_key === 'auth:ssr-refresh-result') {
        return ssrRefreshState
      }
      return ref(init?.())
    },
  }))

  await import('../../src/runtime/plugins/00.session-init')
}

describe('session-init plugin', () => {
  beforeEach(() => {
    config = createDefaultConfig()
    mockAuth = createMockAuth()
    ssrRefreshState = ref(null)
    pluginCallback = null
  })

  it('does nothing when no tokens and no refresh capability', async () => {
    await loadPlugin()
    await pluginCallback!()
    expect(mockAuth.refresh).not.toHaveBeenCalled()
    expect(mockAuth.fetchUser).not.toHaveBeenCalled()
    expect(mockAuth.status.value).toBe('idle')
  })

  it('fetches user when access token exists but cannot refresh', async () => {
    mockAuth.accessToken.value = 'my-token'
    mockAuth.canRefresh.value = false
    await loadPlugin()
    await pluginCallback!()
    expect(mockAuth.refresh).not.toHaveBeenCalled()
    expect(mockAuth.fetchUser).toHaveBeenCalled()
  })

  it('sets status to authenticated when access token exists and autoFetch is disabled', async () => {
    config = createDefaultConfig({ user: { autoFetch: false } })
    mockAuth.accessToken.value = 'my-token'
    mockAuth.canRefresh.value = false
    await loadPlugin()
    await pluginCallback!()
    expect(mockAuth.fetchUser).not.toHaveBeenCalled()
    expect(mockAuth.status.value).toBe('authenticated')
  })

  it('refreshes and fetches user when canRefresh is true (client, no SSR result)', async () => {
    mockAuth.canRefresh.value = true
    mockAuth.refreshToken.value = 'rt'
    mockAuth.refresh.mockImplementation(async () => {
      mockAuth.accessToken.value = 'new-at'
    })
    await loadPlugin()
    await pluginCallback!()
    expect(mockAuth.refresh).toHaveBeenCalled()
    expect(mockAuth.fetchUser).toHaveBeenCalled()
  })

  it('skips refresh on client when SSR already attempted successfully', async () => {
    mockAuth.canRefresh.value = true
    mockAuth.accessToken.value = 'ssr-token'
    ssrRefreshState.value = { attempted: true, success: true }
    await loadPlugin()
    await pluginCallback!()
    expect(mockAuth.refresh).not.toHaveBeenCalled()
    expect(mockAuth.fetchUser).toHaveBeenCalled()
  })

  it('skips refresh and fetchUser on client when SSR refresh failed', async () => {
    mockAuth.canRefresh.value = true
    ssrRefreshState.value = { attempted: true, success: false }
    await loadPlugin()
    await pluginCallback!()
    expect(mockAuth.refresh).not.toHaveBeenCalled()
    expect(mockAuth.fetchUser).not.toHaveBeenCalled()
  })

  it('clears refresh token on failure in client-managed mode', async () => {
    mockAuth.canRefresh.value = true
    mockAuth.refreshToken.value = 'rt'
    mockAuth.refresh.mockRejectedValue(new Error('refresh failed'))
    await loadPlugin()
    await pluginCallback!()
    expect(mockAuth.refreshToken.value).toBeNull()
  })

  it('does not clear refresh token on failure in server-managed mode', async () => {
    config = createDefaultConfig({ refreshToken: { serverManaged: true } })
    mockAuth.canRefresh.value = true
    mockAuth.refreshToken.value = 'rt'
    mockAuth.refresh.mockRejectedValue(new Error('refresh failed'))
    await loadPlugin()
    await pluginCallback!()
    // In server-managed mode, the plugin should not clear the refresh token
    expect(mockAuth.refreshToken.value).toBe('rt')
  })

  it('sets status to authenticated when fetchUser fails', async () => {
    mockAuth.accessToken.value = 'my-token'
    mockAuth.canRefresh.value = false
    mockAuth.fetchUser.mockRejectedValue(new Error('network error'))
    await loadPlugin()
    await pluginCallback!()
    expect(mockAuth.status.value).toBe('authenticated')
  })

  it('stays idle when client re-refresh fails inside fetchUserIfNeeded', async () => {
    // SSR refresh succeeded but access token did not hydrate on client
    mockAuth.canRefresh.value = true
    mockAuth.accessToken.value = null
    ssrRefreshState.value = { attempted: true, success: true }
    mockAuth.refresh.mockRejectedValue(new Error('re-refresh failed'))

    await loadPlugin()
    await pluginCallback!()

    // fetchUserIfNeeded tried refresh() once, it failed — silent return
    expect(mockAuth.refresh).toHaveBeenCalledTimes(1)
    expect(mockAuth.fetchUser).not.toHaveBeenCalled()
    expect(mockAuth.status.value).toBe('idle')
  })
})
