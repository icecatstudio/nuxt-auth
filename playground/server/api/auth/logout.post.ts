export default defineEventHandler((event) => {
  // Clear httpOnly refresh token if in server-managed mode
  const authMode = process.env.AUTH_MODE || ''
  if (authMode === 'server-managed') {
    deleteCookie(event, 'auth.refresh_token', {
      path: '/',
    })
  }

  // In a real app, you would invalidate the session here
  return {
    message: 'Logged out successfully',
  }
})
