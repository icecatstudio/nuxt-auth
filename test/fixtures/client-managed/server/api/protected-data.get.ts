export default defineEventHandler((event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const token = authHeader.replace('Bearer ', '')

  if (!token.startsWith('mock-access-token-')) {
    throw createError({
      statusCode: 401,
      message: 'Invalid token',
    })
  }

  return {
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ],
  }
})
