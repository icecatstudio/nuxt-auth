<template>
  <div class="container">
    <h1>Tokens Management</h1>

    <div class="description">
      <p>This page demonstrates access to tokens via the <code>useAuth</code> composable.</p>
      <p>
        Tokens are now exposed as computed properties: <code>auth.accessToken</code> and <code>auth.refreshToken</code>
      </p>
    </div>

    <div class="tokens-card">
      <h3>Access Token</h3>
      <div class="token-display">
        <pre v-if="auth.accessToken.value">{{ auth.accessToken.value }}</pre>
        <p
          v-else
          class="no-token"
        >
          No access token available
        </p>
      </div>
    </div>

    <div class="tokens-card">
      <h3>Refresh Token</h3>
      <div class="token-display">
        <pre v-if="auth.refreshToken.value">{{ auth.refreshToken.value }}</pre>
        <p
          v-else
          class="no-token"
        >
          No refresh token available
        </p>
      </div>
    </div>

    <div class="actions-card">
      <h3>Token Actions</h3>
      <div class="actions-grid">
        <button
          :disabled="refreshing || !auth.refreshToken.value"
          @click="handleRefreshTokens"
        >
          {{ refreshing ? 'Refreshing...' : 'Refresh Tokens' }}
        </button>
        <button
          :disabled="!auth.accessToken.value"
          @click="handleCopyAccessToken"
        >
          Copy Access Token
        </button>
        <button
          :disabled="!auth.refreshToken.value"
          @click="handleCopyRefreshToken"
        >
          Copy Refresh Token
        </button>
      </div>
      <p
        v-if="copyMessage"
        class="copy-message"
      >
        {{ copyMessage }}
      </p>
    </div>

    <div class="info-card">
      <h3>Token Storage Configuration</h3>
      <p><strong>Access Token Storage:</strong> cookie</p>
      <p><strong>Refresh Token Storage:</strong> cookie</p>
      <p><strong>Auto Refresh:</strong> enabled</p>
    </div>

    <div class="navigation">
      <NuxtLink to="/">Back to Home</NuxtLink>
      <NuxtLink
        v-if="auth.loggedIn.value"
        to="/dashboard"
      >Go to Dashboard</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: true,
})

const auth = useAuth()
const refreshing = ref(false)
const copyMessage = ref('')

const handleRefreshTokens = async () => {
  refreshing.value = true
  try {
    await auth.refresh()
    copyMessage.value = 'Tokens refreshed successfully!'
    setTimeout(() => {
      copyMessage.value = ''
    }, 3000)
  }
  catch (error) {
    console.error('Refresh error:', error)
    copyMessage.value = 'Failed to refresh tokens'
  }
  finally {
    refreshing.value = false
  }
}

const handleCopyAccessToken = async () => {
  if (auth.accessToken.value) {
    try {
      await navigator.clipboard.writeText(auth.accessToken.value)
      copyMessage.value = 'Access token copied to clipboard!'
      setTimeout(() => {
        copyMessage.value = ''
      }, 2000)
    }
    catch (error) {
      copyMessage.value = 'Failed to copy to clipboard'
    }
  }
}

const handleCopyRefreshToken = async () => {
  if (auth.refreshToken.value) {
    try {
      await navigator.clipboard.writeText(auth.refreshToken.value)
      copyMessage.value = 'Refresh token copied to clipboard!'
      setTimeout(() => {
        copyMessage.value = ''
      }, 2000)
    }
    catch (error) {
      copyMessage.value = 'Failed to copy to clipboard'
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.description {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #e7f3ff;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
}

.description p {
  margin: 0.5rem 0;
  color: #555;
}

.description code {
  background: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  color: #e83e8c;
}

.tokens-card,
.actions-card,
.info-card {
  background: #fff;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.token-display pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  word-break: break-all;
  white-space: pre-wrap;
  font-size: 0.9rem;
  color: #333;
}

.no-token {
  color: #999;
  font-style: italic;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
  margin: 0;
}

.actions-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
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

.copy-message {
  color: #42b983;
  font-weight: 500;
  margin: 0;
}

.info-card p {
  margin: 0.5rem 0;
  color: #555;
}

.navigation {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

a {
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
  font-weight: 500;
  transition: background 0.3s;
}

a:hover {
  background: #2980b9;
}
</style>
