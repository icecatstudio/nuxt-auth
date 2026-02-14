export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.email && body.password && body.name) {
    return {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
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
