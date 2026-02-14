export default defineEventHandler(async (event) => {
  // Server-managed: read refresh token from httpOnly cookie
  const refreshToken = getCookie(event, 'auth.refresh_token')

  if (!refreshToken || !refreshToken.startsWith('mock-refresh-token-')) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or missing refresh token',
    })
  }

  const newAccessToken = 'mock-access-token-' + Date.now()
  const newRefreshToken = 'mock-refresh-token-' + Date.now()

  // Set new refresh token as httpOnly cookie
  setCookie(event, 'auth.refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  // Return only access token
  return {
    accessToken: newAccessToken,
  }
})
