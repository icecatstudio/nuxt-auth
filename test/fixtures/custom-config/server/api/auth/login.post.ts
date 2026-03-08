export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.email === 'test@example.com' && body.password === 'password') {
    return {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      // Nested user data under data.user (matches user.property config)
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    }
  }

  throw createError({
    statusCode: 401,
    message: 'Invalid credentials',
  })
})
