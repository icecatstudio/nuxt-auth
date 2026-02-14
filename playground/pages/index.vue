<template>
  <div class="container">
    <h1>Nuxt Auth Module - Playground</h1>

    <div v-if="auth.loggedIn.value" class="user-info">
      <h2>Welcome, {{ auth.user.value?.name }}!</h2>
      <pre>{{ JSON.stringify(auth.user.value, null, 2) }}</pre>
      <div class="actions">
        <button @click="handleLogout">Logout</button>
        <NuxtLink to="/dashboard">Go to Dashboard</NuxtLink>
        <NuxtLink to="/tokens">View Tokens</NuxtLink>
      </div>
    </div>

    <div v-else class="auth-links">
      <h2>Please authenticate</h2>
      <div class="actions">
        <NuxtLink to="/login">Login</NuxtLink>
        <NuxtLink to="/register">Register</NuxtLink>
      </div>
    </div>

    <div class="status">
      <p><strong>Status:</strong> {{ auth.status.value }}</p>
      <p><strong>Logged In:</strong> {{ auth.loggedIn.value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false, // Public page, accessible to everyone
})

const auth = useAuth()

const handleLogout = async () => {
  try {
    await auth.logout()
  }
  catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
}

.user-info,
.auth-links {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

button,
a {
  padding: 0.5rem 1rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

button:hover,
a:hover {
  background: #359268;
}

.status {
  margin-top: 2rem;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 4px;
}
</style>