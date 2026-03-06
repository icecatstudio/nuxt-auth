import type { RouterMethod } from 'h3'
import type { RequiredDeep } from 'type-fest'

/**
 * Base token options shared by access and refresh tokens
 */
export interface BaseTokenOptions {
  /** Property name in API response containing the token. Default: 'accessToken' */
  property?: string
  /** Cookie name. Default: 'auth.{tokenType}_token' */
  cookieName?: string
  /** Prevents client-side access to the cookie. Default: false for accessToken, true for refreshToken */
  httpOnly?: boolean
  /** Ensures cookie is only sent over HTTPS. Default: true in production */
  secure?: boolean
  /** Controls cookie cross-site behavior. Default: 'lax' */
  sameSite?: 'lax' | 'strict' | 'none'
  /** Cookie path. Default: '/' */
  path?: string
  /** Cookie domain */
  domain?: string
  /** Cookie expiration time in seconds */
  maxAge?: number
}

/**
 * API endpoint configuration
 */
export interface Endpoint {
  /** API endpoint path */
  path?: string
  /** HTTP method for the request */
  method?: RouterMethod
  /** Additional fetch options for this endpoint */
  fetchOptions?: RequestInit
}

/**
 * Access token configuration
 */
export interface AccessTokenOptions extends BaseTokenOptions {
  /** Token type prefix. Default: 'Bearer' */
  type?: string
  /** Authorization header name. Default: 'Authorization' */
  headerName?: string
}

/**
 * Refresh token configuration
 */
export interface RefreshTokenOptions extends BaseTokenOptions {
  /** Storage name for localStorage/cookie. Default: 'auth.refresh_token' */
  name?: string
  /**
   * Indicates that refresh token is managed by the server via httpOnly cookie.
   * When true, the refresh token won't be sent in the request body.
   * Default: false
   */
  serverManaged?: boolean
  /**
   * Property name used as key when sending refresh token in the request body.
   * Only used when serverManaged is false.
   * Default: 'refreshToken'
   */
  bodyProperty?: string
}

/**
 * Auto-refresh configuration
 */
export interface AutoRefreshOptions {
  /** Enable automatic token refresh. Default: true */
  enabled?: boolean
  /**
   * Token refresh interval in seconds.
   * When not set, automatically calculated as `accessToken.maxAge * 0.75`.
   * For example, with default maxAge of 900s (15 min), interval will be 675s (~11 min).
   */
  interval?: number
  /**
   * Pause refresh when page is not visible (hidden tab).
   * Resumes when tab becomes visible again.
   * Default: true
   */
  pauseOnInactive?: boolean
  /**
   * Enable tab coordination to prevent multiple tabs from refreshing simultaneously.
   * Uses a shared cookie to track the last refresh timestamp across all tabs.
   * Default: true
   */
  enableTabCoordination?: boolean
  /**
   * Cookie name for storing last refresh timestamp for tab coordination.
   * Default: 'auth.last_refresh'
   */
  coordinationCookieName?: string
  /**
   * Minimum time between refreshes across all tabs in seconds.
   * If a refresh happened in another tab within this threshold, skip refresh.
   * Default: 5 (5 seconds)
   */
  coordinationThreshold?: number
}

/**
 * User data configuration
 */
export interface UserOptions {
  /**
   * Property name in API response containing user data.
   * If not specified or empty string, the entire response will be treated as user data.
   * Default: undefined (entire response is user)
   */
  property?: string
  /** Automatically fetch user data on initialization. Default: true */
  autoFetch?: boolean
}

/**
 * Redirect target configuration
 */
export interface RedirectTarget {
  /** URL to redirect to */
  url: string
  /**
   * Use external navigation (allows redirecting to external URLs).
   * When true, performs a full page reload.
   * Default: false
   */
  external?: boolean
}

/**
 * Redirect configuration for auth flows
 */
export interface RedirectOptions {
  /** Redirect path after logout or when unauthenticated. Default: '/login' */
  login?: string | RedirectTarget
  /** Redirect path after logout. Default: '/' */
  logout?: string | RedirectTarget
  /** Redirect path after successful login. Default: '/' */
  home?: string | RedirectTarget
}

/**
 * Options for login function
 */
export interface LoginOptions {
  /**
   * Control redirect behavior after successful login:
   * - false: Disable redirect
   * - string: Custom redirect URL (overrides config.redirect.home)
   * - RedirectTarget: Custom redirect with options
   * - undefined: Use default redirect from config
   */
  redirect?: false | string | RedirectTarget
}

/**
 * Page meta configuration for auth
 */
export interface AuthPageMeta {
  /**
   * Auth configuration for the page:
   * - true: Require authentication (redirect to login if not authenticated)
   * - false: Public page (accessible to everyone)
   * - 'guest' | 'guestOnly': Only for guests (redirect to home if authenticated)
   * - undefined: Uses globalMiddleware setting
   * @default undefined (uses globalMiddleware setting)
   */
  auth?: boolean | 'guest' | 'guestOnly'
}

/**
 * Auth module configuration options
 * These options can be passed in nuxt.config.ts under the 'auth' key
 */
export interface ModuleOptions {
  /** Base URL for all auth API endpoints */
  baseUrl?: string

  /** API endpoint configurations */
  endpoints?: {
    /** Login endpoint. Required for authentication */
    login?: Endpoint
    /** Logout endpoint. Set to false to disable */
    logout?: Endpoint | false
    /** Registration endpoint. Set to false to disable */
    register?: Endpoint | false
    /** Token refresh endpoint. Set to false to disable */
    refresh?: Endpoint | false
    /** User data fetch endpoint */
    user?: Endpoint
  }

  /** Access token configuration */
  accessToken?: AccessTokenOptions

  /** Refresh token configuration */
  refreshToken?: RefreshTokenOptions

  /** Auto-refresh configuration */
  autoRefresh?: AutoRefreshOptions

  /** User data configuration */
  user?: UserOptions

  /** Redirect paths for auth flows */
  redirect?: RedirectOptions

  /** Enable global auth middleware on all pages. Default: false */
  globalMiddleware?: boolean
}

/**
 * Module options with all defaults applied
 * All fields are guaranteed to exist after defu merges with defaults
 * This is what the composables receive at runtime
 */
export type ResolvedModuleOptions = RequiredDeep<ModuleOptions>

/**
 * Default user interface - can be augmented via module declaration
 * @example
 * // In your project: types/auth.d.ts
 * declare module '#auth' {
 *   interface User {
 *     id: number
 *     email: string
 *     name: string
 *   }
 * }
 */
export interface User {
  [key: string]: unknown
}

export interface LoginCredentials {
  [key: string]: unknown
}

export interface RegisterData {
  [key: string]: unknown
}
