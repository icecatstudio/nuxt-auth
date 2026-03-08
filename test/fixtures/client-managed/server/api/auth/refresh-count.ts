// Tracks refresh call count per request batch for testing deduplication
// GET: returns current count, POST: increments and returns
let refreshCallCount = 0

export default defineEventHandler((event) => {
  const method = event.method

  if (method === 'DELETE') {
    refreshCallCount = 0
    return { count: 0 }
  }

  if (method === 'POST') {
    refreshCallCount++
    return { count: refreshCallCount }
  }

  // GET
  return { count: refreshCallCount }
})
