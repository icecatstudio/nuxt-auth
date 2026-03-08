# @icecat-studio/nuxt-auth

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Modern authentication module for Nuxt 3+ with token-based auth, auto-refresh, SSR support, and smart tab coordination.

## Features

- 🔐 **Token-based Authentication** — JWT/Bearer token support out of the box
- 🔄 **Auto-refresh Tokens** — Automatic token renewal with configurable intervals
- 🖥️ **SSR Ready** — Full server-side rendering support with proper hydration
- 🎯 **Smart Tab Coordination** — Prevents multiple tabs from refreshing simultaneously
- ⏸️ **Pause on Inactive** — Automatically pauses refresh when tab is hidden
- 🛡️ **Auth Fetch** — Composable with automatic auth headers and 401 retry
- 🎨 **Flexible Token Management** — Client-managed, server-managed (httpOnly), or no refresh
- 📦 **Type-safe** — Full TypeScript support with user type augmentation
- 🚀 **Composable API** — Simple `useAuth()` and `useAuthFetch()` composables
- 🔧 **Route Middleware** — Built-in auth middleware for route protection

## Quick Setup

Install the module:

```bash
npm install @icecat-studio/nuxt-auth
```

Add it to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@icecat-studio/nuxt-auth'],

  auth: {
    baseUrl: '/api/auth',
    endpoints: {
      login: { path: '/login', method: 'post' },
      logout: { path: '/logout', method: 'post' },
      refresh: { path: '/refresh', method: 'post' },
      user: { path: '/user', method: 'get' },
    },
  },
})
```

That's it! You can now use `@icecat-studio/nuxt-auth` in your Nuxt app ✨

## Usage

### Login

```vue
<script setup lang="ts">
const auth = useAuth()

const login = async () => {
  try {
    await auth.login({
      email: 'user@example.com',
      password: 'password',
    })
    // Redirects to home page automatically
  }
  catch (error) {
    console.error('Login failed:', error)
  }
}
</script>
```

You can control redirect behavior per call:

```ts
// Disable redirect
await auth.login(credentials, { redirect: false })

// Custom redirect path
await auth.login(credentials, { redirect: '/dashboard' })

// External redirect
await auth.login(credentials, { redirect: { url: 'https://app.example.com', external: true } })
```

### Registration

```vue
<script setup lang="ts">
const auth = useAuth()

const register = async () => {
  try {
    await auth.register({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
    })
    // If the API returns tokens — logs in automatically
    // Otherwise — redirects to login page
  }
  catch (error) {
    console.error('Registration failed:', error)
  }
}
</script>
```

### Protect Routes

```vue
<script setup lang="ts">
definePageMeta({
  auth: true, // Requires authentication
})
</script>
```

For guest-only pages (login, register):

```vue
<script setup lang="ts">
definePageMeta({
  auth: 'guest', // Redirects authenticated users away
})
</script>
```

Public pages (opt out of global middleware):

```vue
<script setup lang="ts">
definePageMeta({
  auth: false, // Accessible to everyone
})
</script>
```

### Access User Data

```vue
<script setup lang="ts">
const { loggedIn, user, logout } = useAuth()
</script>

<template>
  <div v-if="loggedIn">
    <p>Welcome, {{ user?.name }}!</p>
    <button @click="logout()">Logout</button>
  </div>
</template>
```

### Authenticated HTTP Requests

Use `useAuthFetch()` for requests that need authentication. It automatically injects auth headers and handles 401 responses:

```vue
<script setup lang="ts">
const authFetch = useAuthFetch()

const { data } = await useAsyncData(() => authFetch('/api/orders'))
</script>
```

`useAuthFetch` provides:
- Automatic `Authorization` header injection
- Proactive token refresh if the access token is missing but refresh is available
- Automatic retry on 401 after a successful token refresh (client-side)
- Cookie forwarding during SSR for server-managed tokens

## Authentication Modes

The module supports three token management strategies:

### Client-Managed Refresh Token

The refresh token is stored in a client-accessible cookie and sent in the request body during refresh.

```ts
export default defineNuxtConfig({
  auth: {
    refreshToken: {
      serverManaged: false, // default
      property: 'refreshToken',
      bodyProperty: 'refreshToken',
    },
  },
})
```

### Server-Managed Refresh Token (httpOnly)

The refresh token is managed entirely by the server via an httpOnly cookie. It is never accessible to JavaScript — the browser sends it automatically.

```ts
export default defineNuxtConfig({
  auth: {
    refreshToken: {
      serverManaged: true,
    },
  },
})
```

### No Refresh (Access Token Only)

Disable the refresh endpoint for simple access-token-only flows. The session ends when the token expires.

```ts
export default defineNuxtConfig({
  auth: {
    endpoints: {
      refresh: false,
    },
  },
})
```

## Configuration

All options with their default values are listed in the [Default Configuration](#default-configuration) section below.

### Endpoints

Each endpoint can be configured or disabled individually by setting it to `false`:

```ts
endpoints: {
  logout: false,   // disable logout endpoint
  register: false, // disable register endpoint
  refresh: false,  // disable token refresh entirely
}
```

You can also pass additional fetch options per endpoint:

```ts
endpoints: {
  login: {
    path: '/login',
    method: 'post',
    fetchOptions: { credentials: 'include' },
  },
}
```

### Auto-Refresh

The `interval` is auto-calculated as `accessToken.maxAge * 0.75` by default, so you usually don't need to set it manually. For example, with the default `maxAge` of 900 seconds (15 min), the interval will be 675 seconds (~11 min).

### Redirects

Redirects support external URLs:

```ts
redirect: {
  home: { url: 'https://app.example.com/dashboard', external: true },
}
```

### Global Middleware

Enable authentication check on all routes by default:

```ts
export default defineNuxtConfig({
  auth: {
    globalMiddleware: true,
  },
})
```

Then opt out specific routes with `auth: false` in `definePageMeta`.

## API Reference

### `useAuth<T>()`

The main composable for authentication. Returns a singleton instance.

#### State

| Property | Type | Description |
|---|---|---|
| `user` | `Ref<T \| null>` | Current user data (reactive) |
| `status` | `Ref<AuthStatus>` | Auth status (see below) |
| `loggedIn` | `ComputedRef<boolean>` | Whether the user is logged in |
| `accessToken` | `Ref<string \| null>` | Current access token |
| `refreshToken` | `Ref<string \| null>` | Current refresh token (`null` if server-managed) |
| `canRefresh` | `ComputedRef<boolean>` | Whether token refresh is available |

**Auth status values:**

| Status | Description |
|---|---|
| `idle` | Initial state, no auth activity |
| `loading` | Login or registration in progress |
| `refreshing` | Token refresh in progress |
| `authenticated` | User is authenticated |
| `unauthenticated` | No valid session |

**`loggedIn` logic:**
- With refresh endpoint: `true` when status is `authenticated` or `refreshing` (session is alive until refresh explicitly fails)
- Without refresh endpoint: `true` when status is `authenticated` **and** access token exists

#### Methods

| Method | Signature | Description |
|---|---|---|
| `login` | `(credentials: Record<string, any>, options?: LoginOptions) => Promise<void>` | Login with credentials |
| `logout` | `() => Promise<void>` | Logout and clear session |
| `register` | `(data: Record<string, any>) => Promise<void>` | Register a new user |
| `refresh` | `() => Promise<void>` | Manually refresh tokens |
| `fetchUser` | `() => Promise<void>` | Fetch user data from the user endpoint |
| `getAuthHeaders` | `() => Record<string, string>` | Get authorization headers for manual requests |

### `useAuthFetch()`

Returns an enhanced `$fetch` function with automatic auth handling:

```ts
const authFetch = useAuthFetch()

// Typed response
const user = await authFetch<User>('/api/me')

// With options
const data = await authFetch('/api/data', { method: 'POST', body: { key: 'value' } })
```

**Behavior:**
1. Injects `Authorization` header with the current access token
2. If no access token but refresh is available — refreshes first, then makes the request
3. On 401 response (client-side only) — refreshes the token and retries the request once
4. During SSR — forwards incoming request cookies for server-managed tokens

### TypeScript: Augmenting the User Type

Create a `types/auth.d.ts` file in your project and augment the `#auth` module:

```ts
// types/auth.d.ts
declare module '#auth' {
  interface User {
    id: number
    email: string
    name: string
    avatar?: string
  }
}

export {}
```

Then `useAuth()` will infer the correct type:

```ts
const auth = useAuth()
auth.user.value?.name // string
auth.user.value?.id   // number
```

Or pass the type parameter directly:

```ts
interface MyUser {
  id: number
  name: string
}

const auth = useAuth<MyUser>()
```

## How It Works

### Session Initialization

1. On app start, checks for existing tokens in cookies
2. **SSR:** Attempts token refresh on the server; stores the result for the client
3. **Client hydration:** If the server already refreshed, skips duplicate refresh and fetches user data
4. **Client-only navigation:** Refreshes tokens and restores session normally

### Auto-Refresh

1. Schedules token refresh at the configured interval (default: `maxAge * 0.75`)
2. Pauses when the tab is hidden (if `pauseOnInactive` enabled)
3. Resumes with an immediate refresh when the tab becomes visible
4. On network error — reschedules with a doubled interval
5. On server rejection (4xx) — stops auto-refresh and clears session

### Tab Coordination

1. Uses a shared cookie to track the last refresh timestamp
2. Before refreshing, checks if another tab refreshed recently (within `coordinationThreshold`)
3. Skips refresh if within the threshold, reschedules normal interval
4. Updates the timestamp after a successful refresh

### Error Handling

| Scenario | Behavior |
|---|---|
| **Server rejection (4xx)** | Clears tokens, sets status to `unauthenticated`, stops auto-refresh |
| **Network error** | Keeps tokens intact, reverts status, reschedules with doubled interval |
| **401 in `useAuthFetch`** | Refreshes token and retries request once (client-only) |
| **Middleware: protected page, no session** | Attempts refresh; redirects to login on failure |

## Default Configuration

Full configuration with all default values:

```ts
export default defineNuxtConfig({
  auth: {
    baseUrl: '/api/auth',
    endpoints: {
      login:    { path: '/login',    method: 'post' },
      logout:   { path: '/logout',   method: 'post' },
      register: { path: '/register', method: 'post' },
      refresh:  { path: '/refresh',  method: 'post' },
      user:     { path: '/user',     method: 'get' },
    },
    accessToken: {
      property: 'accessToken',
      cookieName: 'auth.access_token',
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 900,                  // 15 minutes
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
      maxAge: 604800,               // 7 days
      serverManaged: false,
      bodyProperty: 'refreshToken',
    },
    autoRefresh: {
      enabled: true,
      // interval: undefined,         // auto-calculated as maxAge * 0.75
      pauseOnInactive: true,
      enableTabCoordination: true,
      coordinationCookieName: 'auth.last_refresh',
      coordinationThreshold: 5,     // 5 seconds
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
})
```

## Contribution

<details>
  <summary>Local development</summary>

  ```bash
  # Install dependencies
  npm install

  # Generate type stubs
  npm run dev:prepare

  # Develop with client-managed mode
  npm run dev:client

  # Develop with server-managed mode
  npm run dev:server

  # Develop without token refresh
  npm run dev:no-refresh

  # Build the playground
  npm run dev:build

  # Run ESLint
  npm run lint

  # Run Vitest
  npm run test
  npm run test:watch

  # Run type checking
  npm run test:types

  # Release new version
  npm run release
  ```

</details>

## License

[MIT License](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@icecat-studio/nuxt-auth/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@icecat-studio/nuxt-auth

[npm-downloads-src]: https://img.shields.io/npm/dm/@icecat-studio/nuxt-auth.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@icecat-studio/nuxt-auth

[license-src]: https://img.shields.io/npm/l/@icecat-studio/nuxt-auth.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@icecat-studio/nuxt-auth

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
