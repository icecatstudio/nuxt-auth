import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  auth: {
    baseUrl: '/api/auth',
    endpoints: {
      login: { path: '/login', method: 'post' },
      logout: { path: '/logout', method: 'post' },
      register: { path: '/register', method: 'post' },
      refresh: { path: '/refresh', method: 'post' },
      user: { path: '/user', method: 'get' },
    },
    accessToken: {
      property: 'accessToken',
      cookieName: 'auth.access_token',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 900,
      type: 'Bearer',
      headerName: 'Authorization',
    },
    refreshToken: {
      property: 'refreshToken',
      cookieName: 'auth.refresh_token',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 604800,
      serverManaged: false,
    },
    autoRefresh: {
      enabled: false,
    },
    redirect: {
      login: '/login',
      logout: '/',
      home: '/dashboard',
    },
    user: {
      property: undefined,
      autoFetch: true,
    },
  },
})
