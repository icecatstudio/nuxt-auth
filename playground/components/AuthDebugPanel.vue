<template>
  <div class="auth-debug-panel">
    <h3>Auth Debug Info</h3>
    <div class="debug-layout">
      <AuthDebugStatus />
      <div class="right-column">
        <AuthQuickLogin />
        <AuthNavigation />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-debug-panel {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #fff;
  padding: 1.5rem;
  border-bottom: 3px solid #42b983;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

h3 {
  margin: 0 0 1.25rem 0;
  font-size: 1rem;
  text-transform: uppercase;
  color: #42b983;
  letter-spacing: 2px;
  font-weight: 700;
}

.debug-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .debug-layout {
    grid-template-columns: 1fr;
  }
}
</style>
