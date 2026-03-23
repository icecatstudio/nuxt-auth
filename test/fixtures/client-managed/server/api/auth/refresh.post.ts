// Track refresh calls for deduplication testing
// eslint-disable-next-line import/no-mutable-exports
let refreshCallCount = 0

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.refreshToken || !body.refreshToken.startsWith('mock-refresh-token-')) {
    throw createError({
      statusCode: 401,
      message: 'Invalid refresh token',
    })
  }

  refreshCallCount++

  // Small delay to make concurrent calls overlap
  await new Promise(resolve => setTimeout(resolve, 50))

  return {
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
    _refreshCallCount: refreshCallCount,
  }
})

// Export for reset
export { refreshCallCount }
