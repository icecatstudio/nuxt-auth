<template>
  <div>
    <span data-page>login</span>
    <span data-status>{{ auth.status.value }}</span>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ auth: 'guest' })
const auth = useAuth()
</script>
