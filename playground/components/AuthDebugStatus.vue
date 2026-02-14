<template>
  <div class="auth-debug-status">
    <h4>Debug Status ({{ currentMode }})</h4>
    <div class="debug-grid">
      <div class="debug-item">
        <span class="debug-label">Status:</span>
        <span class="debug-value status" :class="auth.status.value">{{ auth.status.value }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">Logged In:</span>
        <span class="debug-value" :class="auth.loggedIn.value ? 'success' : 'error'">
          {{ auth.loggedIn.value ? 'Yes' : 'No' }}
        </span>
      </div>
      <div class="debug-item">
        <span class="debug-label">Refresh Enabled:</span>
        <span class="debug-value" :class="refreshEnabled ? 'success' : 'error'">
          {{ refreshEnabled ? 'Yes' : 'No' }}
        </span>
      </div>
      <div class="debug-item">
        <span class="debug-label">Auto Refresh:</span>
        <span class="debug-value" :class="autoRefreshEnabled ? 'success' : 'error'">
          {{ autoRefreshEnabled ? 'Yes' : 'No' }}
        </span>
      </div>
      <div class="debug-item">
        <span class="debug-label">Refresh Interval:</span>
        <span class="debug-value">
          {{ refreshInterval }}
        </span>
      </div>
      <div class="debug-item">
        <span class="debug-label">Access Token maxAge:</span>
        <span class="debug-value">{{ accessTokenMaxAge }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">Refresh Token maxAge:</span>
        <span class="debug-value">{{ refreshTokenMaxAge }}</span>
      </div>
      <div class="debug-item">
        <span class="debug-label">Access Token Expires:</span>
        <span class="debug-value" :class="countdownClass">{{ countdownDisplay }}</span>
      </div>
      <div class="debug-item full-width">
        <span class="debug-label">User:</span>
        <span class="debug-value">{{ auth.user.value ? JSON.stringify(auth.user.value) : 'null' }}</span>
      </div>
      <div class="debug-item full-width">
        <span class="debug-label">Access Token:</span>
        <span class="debug-value token">{{ auth.accessToken.value || 'null' }}</span>
      </div>
      <div class="debug-item full-width">
        <span class="debug-label">Refresh Token:</span>
        <span class="debug-value token">{{ auth.refreshToken.value || 'null' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth()
const config = useRuntimeConfig()

const currentMode = config.public.authMode || 'client-managed'

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s`
  }
  else if (minutes > 0) {
    return `${minutes}m`
  }
  else {
    return `${seconds}s`
  }
}

const refreshEnabled = computed(() => {
  return config.public.auth.endpoints?.refresh !== false
})

const autoRefreshEnabled = computed(() => {
  return config.public.auth.autoRefresh?.enabled !== false
})

const refreshInterval = computed(() => {
  if (!autoRefreshEnabled.value) return '—'

  const interval = config.public.auth.autoRefresh?.interval
  if (!interval) return 'N/A'

  return formatDuration(interval)
})

const accessTokenMaxAge = computed(() => {
  const maxAge = config.public.auth.accessToken?.maxAge
  return maxAge ? formatDuration(maxAge) : '—'
})

const refreshTokenMaxAge = computed(() => {
  if (!refreshEnabled.value) return '—'

  const refreshConfig = config.public.auth.refreshToken
  if (refreshConfig?.serverManaged) return 'Server-managed'

  const maxAge = refreshConfig?.maxAge
  return maxAge ? formatDuration(maxAge) : '—'
})

// Countdown timer
const tokenSetAt = ref<number>(0)
const remainingSeconds = ref<number>(-1)
let countdownInterval: ReturnType<typeof setInterval> | null = null

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

function startCountdown() {
  stopCountdown()

  const maxAge = config.public.auth.accessToken?.maxAge
  if (!maxAge || !auth.accessToken.value) {
    remainingSeconds.value = -1
    return
  }

  tokenSetAt.value = Date.now()
  remainingSeconds.value = maxAge

  countdownInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - tokenSetAt.value) / 1000)
    remainingSeconds.value = maxAge - elapsed

    if (remainingSeconds.value <= 0) {
      remainingSeconds.value = 0
      stopCountdown()
    }
  }, 1000)
}

watch(() => auth.accessToken.value, (newToken) => {
  if (newToken) {
    startCountdown()
  }
  else {
    stopCountdown()
    remainingSeconds.value = -1
  }
}, { immediate: true })

onUnmounted(() => {
  stopCountdown()
})

const countdownDisplay = computed(() => {
  if (remainingSeconds.value < 0) return '—'
  if (remainingSeconds.value === 0) return 'Expired'

  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const countdownClass = computed(() => {
  if (remainingSeconds.value < 0) return ''

  const maxAge = config.public.auth.accessToken?.maxAge
  if (!maxAge) return ''

  const ratio = remainingSeconds.value / maxAge
  if (ratio > 0.3) return 'countdown-ok'
  if (ratio > 0.1) return 'countdown-warning'
  return 'countdown-danger'
})
</script>

<style scoped>
.auth-debug-status {
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

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  font-size: 0.85rem;
}

.debug-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.debug-item.full-width {
  grid-column: 1 / -1;
}

.debug-label {
  font-weight: 600;
  color: #888;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.debug-value {
  color: #fff;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  word-break: break-all;
  transition: all 0.2s;
}

.debug-value:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(66, 185, 131, 0.3);
}

.debug-value.token {
  font-size: 0.75rem;
}

.debug-value.status {
  display: inline-block;
  padding: 0.65rem 1.25rem;
  border-radius: 6px;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 1px;
  border: none;
}

.debug-value.status.authenticated {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.debug-value.status.unauthenticated {
  background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.debug-value.status.loading,
.debug-value.status.refreshing {
  background: linear-gradient(135deg, #ff9800 0%, #fb8c00 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.debug-value.status.idle {
  background: linear-gradient(135deg, #607d8b 0%, #546e7a 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(96, 125, 139, 0.3);
}

.debug-value.success {
  color: #4caf50;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.debug-value.error {
  color: #f44336;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.debug-value.countdown-ok {
  color: #4caf50;
  font-weight: 700;
}

.debug-value.countdown-warning {
  color: #ff9800;
  font-weight: 700;
}

.debug-value.countdown-danger {
  color: #f44336;
  font-weight: 700;
}
</style>
