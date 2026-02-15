import type { ModuleOptions } from '../../src/runtime/types'

export type AuthMode = 'client-managed' | 'server-managed' | 'no-refresh'

export interface AuthPreset {
  name: string
  description: string
  config: ModuleOptions
}

const baseConfig = {
  baseUrl: '/api/auth',
  endpoints: {
    login: {
      path: '/login',
      method: 'post' as const,
      fetchOptions: {
        credentials: 'include' as RequestCredentials,
      },
    },
    logout: {
      path: '/logout',
      method: 'post' as const,
      fetchOptions: {
        credentials: 'include' as RequestCredentials,
      },
    },
    register: {
      path: '/register',
      method: 'post' as const,
      fetchOptions: {
        credentials: 'include' as RequestCredentials,
      },
    },
    user: {
      path: '/user',
      method: 'get' as const,
      fetchOptions: {
        credentials: 'include' as RequestCredentials,
      },
    },
  },
  redirect: {
    login: '/login',
    logout: '/',
    home: '/dashboard',
  },
  autoRefresh: {
    enabled: true,
    // interval: 7, // 7 seconds for testing
  },
}

export const authPresets: Record<AuthMode, AuthPreset> = {
  'client-managed': {
    name: 'Client-Managed Refresh',
    description: 'Refresh token stored in client-side cookie, sent in request body',
    config: {
      ...baseConfig,
      endpoints: {
        ...baseConfig.endpoints,
        refresh: {
          path: '/refresh',
          method: 'post',
          fetchOptions: {
            credentials: 'include',
          },
        },
      },
      accessToken: {
        property: 'accessToken',
        cookieName: 'auth:client_access_token',
        httpOnly: false,
        secure: false, // false for local development
        sameSite: 'lax',
        path: '/',
        // maxAge: 60 * 30, // 30 minutes
        maxAge: 10, // 10 seconds for testing auto-refresh
        type: 'Bearer',
        headerName: 'Authorization',
      },
      refreshToken: {
        property: 'refreshToken',
        cookieName: 'auth:client_refresh_token',
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 604800, // 7 days
        serverManaged: false,
      },
      user: {
        property: undefined,
        autoFetch: true,
      },
    },
  },
  'server-managed': {
    name: 'Server-Managed Refresh',
    description: 'Refresh token stored in httpOnly cookie, managed by server',
    config: {
      ...baseConfig,
      endpoints: {
        ...baseConfig.endpoints,
        refresh: {
          path: '/refresh-server',
          method: 'post',
          fetchOptions: {
            credentials: 'include',
          },
        },
      },
      accessToken: {
        property: 'accessToken',
        cookieName: 'auth:server_access_token',
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 10, // 10 seconds for testing auto-refresh
        type: 'Bearer',
        headerName: 'Authorization',
      },
      refreshToken: {
        serverManaged: true, // Server manages httpOnly cookie
      },
      user: {
        property: undefined,
        autoFetch: true,
      },
    },
  },
  'no-refresh': {
    name: 'No Refresh Token',
    description: 'Only access token, no refresh capability',
    config: {
      ...baseConfig,
      endpoints: {
        ...baseConfig.endpoints,
        refresh: false,
      },
      accessToken: {
        property: 'accessToken',
        cookieName: 'auth:no_refresh_access_token',
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 10, // 10 seconds for testing auto-expiry
        type: 'Bearer',
        headerName: 'Authorization',
      },
      user: {
        property: undefined,
        autoFetch: true,
      },
    },
  },
}

export function getPresetConfig(mode: AuthMode): ModuleOptions {
  return authPresets[mode].config
}
