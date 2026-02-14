<template>
  <div class="container">
    <div class="header">
      <h1>Dashboard</h1>
      <button
        class="logout-btn"
        @click="handleLogout"
      >
        Logout
      </button>
    </div>

    <ClientOnly>
      <div class="welcome-card">
        <h2>Welcome back, {{ auth.user.value?.name }}!</h2>
        <p class="subtitle">
          This is a protected page that requires authentication
        </p>
      </div>

      <div class="user-card">
        <h3>User Information</h3>
        <div class="user-details">
          <div class="detail-row">
            <span class="label">ID:</span>
            <span class="value">{{ auth.user.value?.id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Email:</span>
            <span class="value">{{ auth.user.value?.email }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Name:</span>
            <span class="value">{{ auth.user.value?.name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Role:</span>
            <span class="value">{{ auth.user.value?.role }}</span>
          </div>
        </div>
      </div>

      <div class="raw-data-card">
        <h3>Raw User Data</h3>
        <pre>{{ JSON.stringify(auth.user.value, null, 2) }}</pre>
      </div>
    </ClientOnly>

    <div class="auth-status-card">
      <h3>Auth Status</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">Status:</span>
          <span
            class="status-badge"
            :class="auth.status.value"
          >
            {{ auth.status.value }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">Logged In:</span>
          <span
            class="status-badge"
            :class="auth.loggedIn.value ? 'authenticated' : 'unauthenticated'"
          >
            {{ auth.loggedIn.value ? 'Yes' : 'No' }}
          </span>
        </div>
      </div>
    </div>

    <div class="actions-card">
      <h3>Actions</h3>
      <div class="actions-grid">
        <button
          :disabled="refreshing"
          @click="handleRefreshUser"
        >
          {{ refreshing ? 'Refreshing...' : 'Refresh User Data' }}
        </button>
        <NuxtLink
          to="/"
          class="link-btn"
        >Go to Home</NuxtLink>
        <NuxtLink
          to="/tokens"
          class="link-btn tokens-btn"
        >View Tokens</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: true,
})

const auth = useAuth()
const router = useRouter()

const refreshing = ref(false)

const handleLogout = async () => {
  try {
    await auth.logout()
    await router.push('/')
  }
  catch (error) {
    console.error('Logout error:', error)
  }
}

const handleRefreshUser = async () => {
  refreshing.value = true
  try {
    await auth.fetchUser()
  }
  catch (error) {
    console.error('Refresh user error:', error)
  }
  finally {
    refreshing.value = false
  }
}

// Protect this page - redirect to login if not authenticated
onMounted(() => {
  if (!auth.loggedIn.value) {
    router.push('/login')
  }
})

// Watch for auth changes and redirect if logged out
watch(() => auth.loggedIn.value, (loggedIn) => {
  if (!loggedIn) {
    router.push('/login')
  }
})
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  color: #2c3e50;
  margin: 0;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.logout-btn:hover {
  background: #c0392b;
}

.welcome-card,
.user-card,
.raw-data-card,
.auth-status-card,
.actions-card {
  background: #fff;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.welcome-card h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.subtitle {
  color: #666;
  margin: 0;
}

h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  padding: 0.5rem;
  background: #f8f8f8;
  border-radius: 4px;
}

.label {
  font-weight: 600;
  color: #555;
  min-width: 80px;
}

.value {
  color: #2c3e50;
}

pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-label {
  font-weight: 600;
  color: #555;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  text-align: center;
}

.status-badge.authenticated {
  background: #d4edda;
  color: #155724;
}

.status-badge.unauthenticated {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.idle {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.loading {
  background: #fff3cd;
  color: #856404;
}

.actions-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

button {
  padding: 0.75rem 1.5rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

button:hover:not(:disabled) {
  background: #359268;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.link-btn {
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
  font-weight: 500;
  transition: background 0.3s;
}

.link-btn:hover {
  background: #2980b9;
}

.tokens-btn {
  background: #9b59b6;
}

.tokens-btn:hover {
  background: #8e44ad;
}
</style>
