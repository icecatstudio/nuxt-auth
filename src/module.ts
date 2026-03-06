import {
  addImportsDir,
  addPlugin,
  addRouteMiddleware,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import type { ModuleOptions } from './runtime/types'
import { defu } from 'defu'

export type { ModuleOptions, User, LoginCredentials, RegisterData } from './runtime/types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@icecat-studio/nuxt-auth',
    configKey: 'auth',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {
    baseUrl: '/api/auth',
    endpoints: {
      login: { path: '/login', method: 'post', fetchOptions: {} },
      logout: { path: '/logout', method: 'post', fetchOptions: {} },
      register: { path: '/register', method: 'post', fetchOptions: {} },
      refresh: { path: '/refresh', method: 'post', fetchOptions: {} },
      user: { path: '/user', method: 'get', fetchOptions: {} },
    },
    accessToken: {
      property: 'accessToken',
      cookieName: 'auth.access_token',
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
      type: 'Bearer',
      headerName: 'Authorization',
    },
    refreshToken: {
      property: 'refreshToken',
      cookieName: 'auth.refresh_token',
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      serverManaged: false,
      bodyProperty: 'refreshToken',
    },
    autoRefresh: {
      enabled: true,
      pauseOnInactive: true,
      enableTabCoordination: true,
      coordinationCookieName: 'auth.last_refresh',
      coordinationThreshold: 5, // 5 seconds
    },
    user: {
      property: undefined,
      autoFetch: true,
    },
    redirect: {
      login: '/login',
      logout: '/',
      home: '/',
    },
    globalMiddleware: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Merge options with defaults
    const resolvedOptions = defu(options, nuxt.options.auth || {})

    // Auto-calculate refresh interval from accessToken.maxAge if not explicitly set
    if (resolvedOptions.autoRefresh?.interval === undefined) {
      const maxAge = resolvedOptions.accessToken?.maxAge ?? 60 * 15
      resolvedOptions.autoRefresh = resolvedOptions.autoRefresh || {}
      resolvedOptions.autoRefresh.interval = Math.round(maxAge * 0.75)
    }

    // Add runtime config
    nuxt.options.runtimeConfig.public.auth = resolvedOptions

    // Session initialization plugin (always load)
    addPlugin(resolver.resolve('./runtime/plugins/00.session-init'))

    // Auto-refresh plugin (client only) - controlled by autoRefresh.enabled
    if (resolvedOptions.autoRefresh?.enabled !== false
      && resolvedOptions.endpoints?.refresh !== false) {
      addPlugin(resolver.resolve('./runtime/plugins/01.token-refresh.client'))
    }

    // Add auth middleware
    addRouteMiddleware({
      name: 'auth',
      path: resolver.resolve('./runtime/middleware/auth'),
      global: true,
    })

    // Register #auth alias for type augmentation
    nuxt.options.alias['#auth'] = resolver.resolve('./runtime/types')

    // Auto-import composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Add type definitions
    addTypeTemplate({
      filename: 'types/nuxt-auth.d.ts',
      getContents: () => `
        declare module '#app' {
          interface NuxtApp {
            $auth: import('${resolver.resolve('./runtime/composables/useAuth')}').Auth
            $refreshManager?: {
              start: () => void
              stop: () => void
              refresh: () => Promise<void>
            }
          }
        }

        declare module 'nuxt/schema' {
          interface PublicRuntimeConfig {
            auth: import('${resolver.resolve('./runtime/types')}').ModuleOptions
          }
        }

        declare module '@nuxt/schema' {
          interface NuxtConfig {
            auth?: import('${resolver.resolve('./runtime/types')}').ModuleOptions
          }
          interface NuxtOptions {
            auth?: import('${resolver.resolve('./runtime/types')}').ModuleOptions
          }
        }

        declare module 'vue-router' {
          interface RouteMeta {
            auth?: boolean | 'guest' | 'guestOnly'
          }
        }

        export {}
      `,
    })
  },
})
