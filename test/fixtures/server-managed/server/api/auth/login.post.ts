export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.email === 'test@example.com' && body.password === 'password') {
    const accessToken = 'mock-access-token-' + Date.now()
    const refreshToken = 'mock-refresh-token-' + Date.now()

    // Server-managed: set refresh token as httpOnly cookie
    setCookie(event, 'auth.refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
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

  throw createError({
    statusCode: 401,
    message: 'Invalid credentials',
  })
})
