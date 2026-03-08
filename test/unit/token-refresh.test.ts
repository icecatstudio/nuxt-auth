import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { createDefaultConfig } from './_helpers'
import type { Ref } from 'vue'

// --- Mock state ---

let config = createDefaultConfig()
let mockAuth: {
  status: Ref<string>
  loggedIn: Ref<boolean>
  canRefresh: Ref<boolean>
  refresh: ReturnType<typeof vi.fn>
}
let mockTokenManager: {
  coordinationTimestamp: Ref<number | null>
}
let watchCallback: ((value: boolean) => void) | null = null
let providedManager: Record<string, unknown> | null = null
let visibilityHandler: (() => void) | null = null

function createMockAuth() {
  return {
    status: ref('idle'),
    loggedIn: ref(false),
    canRefresh: ref(true),
    refresh: vi.fn().mockResolvedValue(undefined),
  }
}

vi.mock('#imports', () => {
  return {
    defineNuxtPlugin: (cb: (app: Record<string, unknown>) => void) => {
      const nuxtApp = {
        provide: (key: string, value: unknown) => {
          providedManager = value as Record<string, unknown>
        },
      }
      cb(nuxtApp)
    },
    useAuth: () => mockAuth,
    useRuntimeConfig: () => ({ public: { auth: config } }),
    watch: (_getter: () => boolean, cb: (val: boolean) => void) => {
      watchCallback = cb
    },
  }
})

vi.mock('../../src/runtime/composables/useTokenManager', () => ({
  useTokenManager: () => mockTokenManager,
}))

describe('token-refresh plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    config = createDefaultConfig()
    mockAuth = createMockAuth()
    mockTokenManager = { coordinationTimestamp: ref(null) }
    watchCallback = null
    providedManager = null
    visibilityHandler = null

    // Mock document for visibility tests
    vi.stubGlobal('document', {
      hidden: false,
      addEventListener: (_event: string, handler: () => void) => {
        visibilityHandler = handler
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  async function loadPlugin() {
    vi.resetModules()

    vi.doMock('#imports', () => ({
      defineNuxtPlugin: (cb: (app: Record<string, unknown>) => void) => {
        const nuxtApp = {
          provide: (key: string, value: unknown) => {
            providedManager = value as Record<string, unknown>
          },
        }
        cb(nuxtApp)
      },
      useAuth: () => mockAuth,
      useRuntimeConfig: () => ({ public: { auth: config } }),
      watch: (_getter: () => boolean, cb: (val: boolean) => void) => {
        watchCallback = cb
      },
    }))

    vi.doMock('../../src/runtime/composables/useTokenManager', () => ({
      useTokenManager: () => mockTokenManager,
    }))

    await import('../../src/runtime/plugins/01.token-refresh.client')
  }

  it('does not schedule when autoRefresh is disabled', async () => {
    config = createDefaultConfig({ autoRefresh: { enabled: false } })
    await loadPlugin()
    expect(providedManager).toBeNull()
    vi.advanceTimersByTime(config.autoRefresh.interval * 1000)
    expect(mockAuth.refresh).not.toHaveBeenCalled()
  })

  it('does not schedule when refresh endpoint is disabled', async () => {
    config = createDefaultConfig({ endpoints: { refresh: false } })
    await loadPlugin()
    expect(providedManager).toBeNull()
  })

  it('schedules refresh when user is already logged in', async () => {
    mockAuth.loggedIn.value = true
    await loadPlugin()
    expect(mockAuth.refresh).not.toHaveBeenCalled()
    vi.advanceTimersByTime(config.autoRefresh.interval * 1000)
    expect(mockAuth.refresh).toHaveBeenCalledTimes(1)
  })

  it('schedules refresh with configured interval', async () => {
    config = createDefaultConfig({ autoRefresh: { interval: 100 } })
    mockAuth.loggedIn.value = true
    await loadPlugin()

    vi.advanceTimersByTime(99 * 1000)
    expect(mockAuth.refresh).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1 * 1000)
    expect(mockAuth.refresh).toHaveBeenCalledTimes(1)
  })

  it('starts scheduling when loggedIn changes to true', async () => {
    await loadPlugin()
    expect(watchCallback).not.toBeNull()

    watchCallback!(true)
    vi.advanceTimersByTime(config.autoRefresh.interval * 1000)
    expect(mockAuth.refresh).toHaveBeenCalledTimes(1)
  })

  it('stops scheduling when loggedIn changes to false', async () => {
    mockAuth.loggedIn.value = true
    await loadPlugin()

    watchCallback!(false)
    vi.advanceTimersByTime(config.autoRefresh.interval * 2 * 1000)
    expect(mockAuth.refresh).not.toHaveBeenCalled()
  })

  it('reschedules with double interval on network error', async () => {
    mockAuth.loggedIn.value = true
    const networkError = new Error('Network error')
    mockAuth.refresh.mockRejectedValueOnce(networkError)
    await loadPlugin()

    // Trigger first refresh
    await vi.advanceTimersByTimeAsync(config.autoRefresh.interval * 1000)
    expect(mockAuth.refresh).toHaveBeenCalledTimes(1)

    // Should NOT have retried yet at normal interval
    mockAuth.refresh.mockResolvedValueOnce(undefined)
    await vi.advanceTimersByTimeAsync(config.autoRefresh.interval * 1000)
    expect(mockAuth.refresh).toHaveBeenCalledTimes(1)

    // Should retry at doubled interval
    await vi.advanceTimersByTimeAsync(config.autoRefresh.interval * 1000)
    expect(mockAuth.refresh).toHaveBeenCalledTimes(2)
  })

  it('stops on server rejection (4xx)', async () => {
    mockAuth.loggedIn.value = true
    const serverError = { response: { status: 401 } }
    mockAuth.refresh.mockRejectedValueOnce(serverError)
    await loadPlugin()

    vi.advanceTimersByTime(config.autoRefresh.interval * 1000)
    await vi.runAllTimersAsync()
    expect(mockAuth.refresh).toHaveBeenCalledTimes(1)

    // Should NOT reschedule after server rejection
    vi.advanceTimersByTime(config.autoRefresh.interval * 10 * 1000)
    await vi.runAllTimersAsync()
    expect(mockAuth.refresh).toHaveBeenCalledTimes(1)
  })

  describe('tab coordination', () => {
    it('skips refresh when another tab refreshed recently', async () => {
      const now = Date.now()
      vi.setSystemTime(now)
      mockAuth.loggedIn.value = true
      // Set timestamp so that when performRefresh fires (after interval*1000ms),
      // the timestamp is still within the 5s threshold
      const fireTime = now + config.autoRefresh.interval * 1000
      mockTokenManager.coordinationTimestamp.value = fireTime - 2000
      await loadPlugin()

      await vi.advanceTimersByTimeAsync(config.autoRefresh.interval * 1000)
      expect(mockAuth.refresh).not.toHaveBeenCalled()
    })

    it('does not skip when coordination is disabled', async () => {
      config = createDefaultConfig({ autoRefresh: { enableTabCoordination: false } })
      mockAuth.loggedIn.value = true
      mockTokenManager.coordinationTimestamp.value = Date.now()
      mockAuth.refresh.mockResolvedValueOnce(undefined)
      await loadPlugin()

      await vi.advanceTimersByTimeAsync(config.autoRefresh.interval * 1000)
      expect(mockAuth.refresh).toHaveBeenCalledTimes(1)
    })

    it('does not skip when timestamp is beyond threshold', async () => {
      const now = Date.now()
      vi.setSystemTime(now)
      mockAuth.loggedIn.value = true
      // Another tab refreshed 10 seconds ago (beyond 5s threshold)
      mockTokenManager.coordinationTimestamp.value = now - 10000
      mockAuth.refresh.mockResolvedValueOnce(undefined)
      await loadPlugin()

      await vi.advanceTimersByTimeAsync(config.autoRefresh.interval * 1000)
      expect(mockAuth.refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('visibility handling', () => {
    it('pauses when page becomes hidden', async () => {
      mockAuth.loggedIn.value = true
      await loadPlugin()

      // Simulate page hidden
      ;(document as unknown as Record<string, boolean>).hidden = true
      visibilityHandler!()

      vi.advanceTimersByTime(config.autoRefresh.interval * 2 * 1000)
      await vi.runAllTimersAsync()
      expect(mockAuth.refresh).not.toHaveBeenCalled()
    })

    it('triggers immediate refresh when page becomes visible', async () => {
      mockAuth.loggedIn.value = true
      await loadPlugin()

      // Hide page
      ;(document as unknown as Record<string, boolean>).hidden = true
      visibilityHandler!()

      // Show page
      ;(document as unknown as Record<string, boolean>).hidden = false
      visibilityHandler!()

      // Should schedule immediate (setTimeout 0)
      await vi.advanceTimersByTimeAsync(0)
      expect(mockAuth.refresh).toHaveBeenCalledTimes(1)
    })

    it('does not register listener when pauseOnInactive is false', async () => {
      config = createDefaultConfig({ autoRefresh: { pauseOnInactive: false } })
      mockAuth.loggedIn.value = true
      await loadPlugin()
      expect(visibilityHandler).toBeNull()
    })
  })

  describe('refreshManager', () => {
    it('provides start, stop, and refresh methods', async () => {
      mockAuth.loggedIn.value = true
      await loadPlugin()
      expect(providedManager).not.toBeNull()
      expect(typeof providedManager!.start).toBe('function')
      expect(typeof providedManager!.stop).toBe('function')
      expect(typeof providedManager!.refresh).toBe('function')
    })
  })
})
