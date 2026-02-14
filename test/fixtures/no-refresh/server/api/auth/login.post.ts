export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.email === 'test@example.com' && body.password === 'password') {
    return {
      accessToken: 'mock-access-token-' + Date.now(),
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
