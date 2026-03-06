export default defineEventHandler((event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const token = authHeader.replace('Bearer ', '')

  // Mock user data based on token
  if (token.startsWith('mock-access-token-')) {
    return {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    }
  }

  throw createError({
    statusCode: 401,
    message: 'Invalid token',
  })
})
