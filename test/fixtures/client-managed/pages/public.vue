<template>
  <div>
    <span data-page>public</span>
    <span data-status>{{ auth.status.value }}</span>
    <span data-logged-in>{{ auth.loggedIn.value }}</span>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ auth: false })
const auth = useAuth()
</script>
