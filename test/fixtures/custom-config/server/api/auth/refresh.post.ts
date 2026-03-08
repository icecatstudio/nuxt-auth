export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.refreshToken || !body.refreshToken.startsWith('mock-refresh-token-')) {
    throw createError({
      statusCode: 401,
      message: 'Invalid refresh token',
    })
  }

  return {
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
  }
})
