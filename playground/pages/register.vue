<template>
  <div class="container">
    <h1>Register</h1>

    <form
      class="auth-form"
      @submit.prevent="handleRegister"
    >
      <div class="form-group">
        <label for="name">Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="John Doe"
          required
        >
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="john@example.com"
          required
        >
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="Enter password"
          required
          minlength="6"
        >
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="form.confirmPassword"
          type="password"
          placeholder="Confirm password"
          required
          minlength="6"
        >
      </div>

      <div
        v-if="error"
        class="error-message"
      >
        {{ error }}
      </div>

      <div class="form-actions">
        <button
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
        <NuxtLink to="/login">Already have an account? Login</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: 'guestOnly',
})

const auth = useAuth()
const router = useRouter()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''

  // Validate passwords match
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    loading.value = false
    return
  }

  try {
    await auth.register({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
    })

    // Redirect to dashboard on success
    await router.push('/dashboard')
  }
  catch (err: any) {
    error.value = err.message || 'Registration failed. Please try again.'
    console.error('Register error:', err)
  }
  finally {
    loading.value = false
  }
}

// Redirect if already logged in
onMounted(() => {
  if (auth.loggedIn.value) {
    router.push('/dashboard')
  }
})
</script>

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
</style>
