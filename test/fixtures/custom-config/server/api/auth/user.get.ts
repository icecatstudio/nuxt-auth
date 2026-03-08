export default defineEventHandler((event) => {
  // Uses custom header: X-Auth-Token instead of Authorization
  const authHeader = getHeader(event, 'X-Auth-Token')

  if (!authHeader || !authHeader.startsWith('Token ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const token = authHeader.replace('Token ', '')

  if (token.startsWith('mock-access-token-')) {
    // Returns nested user data matching user.property: 'data.user'
    return {
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
    message: 'Invalid token',
  })
})
