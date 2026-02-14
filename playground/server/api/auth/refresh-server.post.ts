export default defineEventHandler(async (event) => {
  // Read refresh token from httpOnly cookie
  const refreshToken = getCookie(event, 'auth.refresh_token')

  if (!refreshToken || !refreshToken.startsWith('mock-refresh-token-')) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or missing refresh token',
    })
  }

  // Generate new access token
  const newAccessToken = 'mock-access-token-' + Date.now()
  const newRefreshToken = 'mock-refresh-token-' + Date.now()

  // Set new refresh token as httpOnly cookie (server-managed)
  setCookie(event, 'auth.refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: false, // false for local development
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  // Return only access token (refresh token is in cookie)
  return {
    accessToken: newAccessToken,
  }
})
