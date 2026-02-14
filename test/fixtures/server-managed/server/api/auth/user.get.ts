export default defineEventHandler((event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const token = authHeader.replace('Bearer ', '')

  if (token.startsWith('mock-access-token-')) {
    return {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
    }
  }

  throw createError({
    statusCode: 401,
    message: 'Invalid token',
  })
})
