<template>
  <div>
    <span data-page>fetch-test</span>
    <span data-status>{{ auth.status.value }}</span>
    <span data-logged-in>{{ auth.loggedIn.value }}</span>
    <span data-fetch-result>{{ fetchResult }}</span>
    <span data-fetch-error>{{ fetchError }}</span>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ auth: false })

const auth = useAuth()
const authFetch = useAuthFetch()

const fetchResult = ref('')
const fetchError = ref('')

if (import.meta.server && auth.accessToken.value) {
  try {
    const data = await authFetch<{ items: { id: number, name: string }[] }>('/api/protected-data')
    fetchResult.value = JSON.stringify(data.items.length)
  }
  catch (e: unknown) {
    fetchError.value = e instanceof Error ? e.message : 'fetch-failed'
  }
}
</script>
