# Nuxt Auth Playground

Playground for testing different authentication modes.

## Available Modes

### 1. Client-Managed Refresh (default)
Refresh token is stored in client-side cookie and sent in request body.

```bash
# From project root
npm run dev
# or
npm run dev:client
```

**Features:**
- ✅ Refresh token accessible in client
- ✅ Token sent in request body
- ✅ property: 'refreshToken' in config
- ✅ httpOnly: false

### 2. Server-Managed Refresh
Refresh token is stored in httpOnly cookie and managed by server.

```bash
npm run dev:server
```

**Features:**
- ✅ Refresh token in httpOnly cookie
- ✅ Token NOT sent in body
- ✅ property: undefined (server doesn't return it)
- ✅ serverManaged: true
- ✅ httpOnly: true

**API endpoint:** `/api/auth/refresh-server`

### 3. No Refresh Token
Only access token, no refresh capability.

```bash
npm run dev:no-refresh
```

**Features:**
- ✅ Only access token
- ✅ Refresh endpoint disabled (false)
- ✅ Longer access token lifetime (1 hour)
- ❌ No automatic token refresh

## Test Credentials

- **Email:** test@example.com
- **Password:** password

## Structure

```
playground/
├── configs/
│   └── presets.ts          # Configuration presets for different modes
├── server/api/auth/
│   ├── login.post.ts       # Supports both modes
│   ├── refresh.post.ts     # Client-managed mode
│   └── refresh-server.post.ts  # Server-managed mode
└── components/
    ├── AuthDebugStatus.vue # Shows current mode
    ├── AuthQuickLogin.vue
    └── AuthNavigation.vue
```

## Switching Between Modes

**IMPORTANT:** All commands are run from **project root**, not from playground folder!

Stop dev server (Ctrl+C) and start with desired mode:

```bash
# From project root
cd /path/to/nuxt-auth

# Client-managed
npm run dev:client

# Server-managed
npm run dev:server

# No refresh
npm run dev:no-refresh
```

## Debugging

Debug panel at the top of the page shows:
- Current authentication mode
- Status (idle, loading, authenticated, etc.)
- Logged In (Yes/No)
- Refresh Enabled (Yes/No)
- User data
- Access Token
- Refresh Token (if available)
