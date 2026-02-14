export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Simple mock registration
  if (body.email && body.password && body.name) {
    const accessToken = 'mock-access-token-' + Date.now()
    const refreshToken = 'mock-refresh-token-' + Date.now()

    // Check if server-managed mode
    const authMode = process.env.AUTH_MODE || ''
    if (authMode === 'server-managed') {
      setCookie(event, 'auth.refresh_token', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return {
        accessToken,
        user: {
          id: Math.floor(Math.random() * 1000),
          email: body.email,
          name: body.name,
          role: 'user',
        },
      }
    }

    // Client-managed mode
    return {
      accessToken,
      refreshToken,
      user: {
        id: Math.floor(Math.random() * 1000),
        email: body.email,
        name: body.name,
        role: 'user',
      },
    }
  }

  throw createError({
    statusCode: 400,
    message: 'Missing required fields',
  })
})