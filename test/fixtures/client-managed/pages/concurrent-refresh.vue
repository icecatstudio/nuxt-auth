<template>
  <div>
    <span data-page>concurrent-refresh</span>
    <span data-status>{{ auth.status.value }}</span>
    <span data-refresh-results>{{ refreshResults }}</span>
    <span data-refresh-error>{{ refreshError }}</span>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ auth: false })

const auth = useAuth()

const refreshResults = ref('')
const refreshError = ref('')

// On SSR: call refresh() 3 times concurrently — deduplication should merge them into 1 actual request
if (import.meta.server && auth.canRefresh.value) {
  try {
    const results = await Promise.all([
      auth.refresh(),
      auth.refresh(),
      auth.refresh(),
    ])
    // All three should resolve (not throw)
    refreshResults.value = 'all-resolved'
  }
  catch (e: unknown) {
    refreshError.value = e instanceof Error ? e.message : 'refresh-failed'
  }
}
</script>
