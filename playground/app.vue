<template>
  <div>
    <ClientOnly>
      <AuthDebugPanel />
    </ClientOnly>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
