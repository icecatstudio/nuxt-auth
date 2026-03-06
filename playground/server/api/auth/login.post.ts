export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Simple mock authentication
  if (body.email === 'test@example.com' && body.password === 'password') {
    const accessToken = 'mock-access-token-' + Date.now()
    const refreshToken = 'mock-refresh-token-' + Date.now()

    // Detect server-managed mode by checking AUTH_MODE environment variable
    const authMode = process.env.AUTH_MODE || ''
    if (authMode === 'server-managed') {
      setCookie(event, 'auth.refresh_token', refreshToken, {
        httpOnly: true,
        secure: false, // false for local development
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      // Return only access token and user (refresh token in cookie)
      return {
        accessToken,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
        },
      }
    }

    // Client-managed mode: return everything
    return {
      accessToken,
      refreshToken,
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      },
    }
  }

  throw createError({
    statusCode: 401,
    message: 'Invalid credentials',
  })
})
