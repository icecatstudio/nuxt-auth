<template>
  <div>
    <span data-page>dashboard</span>
    <span data-status>{{ auth.status.value }}</span>
    <span data-logged-in>{{ auth.loggedIn.value }}</span>
    <span data-user-email>{{ auth.user.value?.email ?? '' }}</span>
    <span data-user-name>{{ auth.user.value?.name ?? '' }}</span>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ auth: true })
const auth = useAuth()
</script>
