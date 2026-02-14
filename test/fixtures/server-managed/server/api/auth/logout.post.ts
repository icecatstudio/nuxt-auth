export default defineEventHandler((event) => {
  // Clear httpOnly refresh token
  deleteCookie(event, 'auth.refresh_token', { path: '/' })

  return { message: 'Logged out successfully' }
})
