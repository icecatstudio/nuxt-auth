<script setup lang="ts">
definePageMeta({
  auth: 'guestOnly',
})

const auth = useAuth()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await auth.login({
      email: form.value.email,
      password: form.value.password,
    })

    // Redirect to dashboard on success
    await router.push('/dashboard')
  }
  catch (err: any) {
    error.value = err.message || 'Login failed. Please check your credentials.'
    console.error('Login error:', err)
  }
  finally {
    loading.value = false
  }
}

// Redirect if already logged in (only on client after hydration)
if (import.meta.client) {
  watch(() => auth.loggedIn.value, (isLoggedIn) => {
    if (isLoggedIn) {
      router.push('/dashboard')
    }
  }, { immediate: true })
}
</script>

<template>
  <div class="container">
    <h1>Login</h1>

    <form @submit.prevent="handleLogin" class="auth-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="test@example.com"
          required
        >
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="password"
          required
        >
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        <NuxtLink to="/register">Don't have an account? Register</NuxtLink>
      </div>
    </form>

    <div class="test-credentials">
      <h3>Test Credentials</h3>
      <p><strong>Email:</strong> test@example.com</p>
      <p><strong>Password:</strong> password</p>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.auth-form {
  background: #fff;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #42b983;
}

.error-message {
  padding: 0.75rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
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

a {
  text-align: center;
  color: #42b983;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.test-credentials {
  margin-top: 2rem;
  padding: 1rem;
  background: #f0f8ff;
  border: 1px solid #b0d4ff;
  border-radius: 4px;
}

.test-credentials h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.test-credentials p {
  margin: 0.25rem 0;
  color: #555;
}
</style>
