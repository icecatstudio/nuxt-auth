<template>
  <div class="auth-quick-login">
    <h4>Quick Login</h4>
    <form
      class="quick-login-form"
      @submit.prevent="handleQuickLogin"
    >
      <input
        v-model="email"
        type="email"
        placeholder="Email (test@example.com)"
        required
      >
      <input
        v-model="password"
        type="password"
        placeholder="Password (password)"
        required
      >
      <button
        type="submit"
        :disabled="loading"
      >
        {{ loading ? 'Loading...' : 'Login' }}
      </button>
      <button
        type="button"
        :disabled="!auth.loggedIn.value"
        @click="handleLogout"
      >
        Logout
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth()

const email = ref('test@example.com')
const password = ref('password')
const loading = ref(false)

const handleQuickLogin = async () => {
  loading.value = true
  try {
    await auth.login({
      email: email.value,
      password: password.value,
    })
  }
  catch (error) {
    console.error('Login error:', error)
  }
  finally {
    loading.value = false
  }
}

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
.auth-quick-login {
  flex: 1;
}

h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #999;
  letter-spacing: 1.5px;
  font-weight: 600;
}

.quick-login-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.quick-login-form input {
  grid-column: span 1;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.quick-login-form input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.quick-login-form input:focus {
  outline: none;
  border-color: #42b983;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.quick-login-form button {
  padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg, #42b983 0%, #359268 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.quick-login-form button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
}

.quick-login-form button:active:not(:disabled) {
  transform: translateY(0);
}

.quick-login-form button:disabled {
  background: linear-gradient(135deg, #555 0%, #444 100%);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.quick-login-form button[type="button"] {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.quick-login-form button[type="button"]:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}
</style>
