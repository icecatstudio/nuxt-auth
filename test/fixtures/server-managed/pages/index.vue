<template>
  <div>
    <span data-status>{{ auth.status.value }}</span>
    <span data-logged-in>{{ auth.loggedIn.value }}</span>
    <span data-can-refresh>{{ auth.canRefresh.value }}</span>
    <span data-user-email>{{ auth.user.value?.email ?? '' }}</span>
    <span data-has-access-token>{{ !!auth.accessToken.value }}</span>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ auth: false })
const auth = useAuth()
</script>
