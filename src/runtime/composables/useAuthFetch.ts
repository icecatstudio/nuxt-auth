import type { AvailableRouterMethod, NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { useNuxtApp } from '#imports'
import { isFetchError, toPlainHeaders } from '../utils/fetch-helpers'
import { useAuth } from './useAuth'

/**
 * Returns a `$fetch`-like function that automatically:
 * - Adds Authorization headers
 * - Forwards cookies on SSR (for httpOnly tokens)
 * - On 401: refreshes token and retries the request (client-only)
 *
 * @example
 * const authFetch = useAuthFetch()
 * const data = await authFetch('/api/orders')
 * const user = await authFetch<User>('/api/me')
 */
export function useAuthFetch() {
  const auth = useAuth()
  const nuxtApp = useNuxtApp()

  async function authFetch<
    ResT = undefined,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = ResT extends undefined
      ? 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT>
      : AvailableRouterMethod<ReqT>,
  >(
    request: ReqT,
    opts?: NitroFetchOptions<ReqT, Method>,
  ) {
    // Proactive: if access token is missing but refresh is possible, refresh first
    if (!auth.accessToken.value && auth.canRefresh.value) {
      await auth.refresh()
    }

    try {
      return await $fetch<ResT, ReqT>(request, withAuthHeaders(opts))
    }
    catch (error: unknown) {
      // Reactive: 401 safety net (token revoked, race condition, etc.)
      if (import.meta.client && isFetchError(error, 401)) {
        try {
          await auth.refresh()
          return await $fetch<ResT, ReqT>(request, withAuthHeaders(opts))
        }
        catch {
          // Refresh failed — throw original 401 so caller can handle it
          throw error
        }
      }
      throw error
    }
  }

  function withAuthHeaders<ReqT extends NitroFetchRequest>(
    opts?: NitroFetchOptions<ReqT>,
  ): NitroFetchOptions<ReqT> {
    const headers: Record<string, string> = {
      ...toPlainHeaders(opts?.headers as HeadersInit | undefined),
      ...auth.getAuthHeaders(),
    }

    if (import.meta.server) {
      const event = nuxtApp.ssrContext?.event
      const cookieHeader = event?.node.req.headers.cookie
      if (cookieHeader) {
        headers.cookie = cookieHeader
      }
    }

    return { ...opts, headers } as NitroFetchOptions<ReqT>
  }

  return authFetch
}
