<template>
  <div class="auth-navigation">
    <h4>Navigation</h4>
    <div class="links-grid">
      <NuxtLink to="/">
        Home
      </NuxtLink>
      <NuxtLink to="/login">
        Login Page
      </NuxtLink>
      <NuxtLink to="/register">
        Register Page
      </NuxtLink>
      <NuxtLink to="/dashboard">
        Dashboard
      </NuxtLink>
      <NuxtLink to="/tokens">
        Tokens
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.auth-navigation {
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

.links-grid {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  align-content: flex-start;
}

.links-grid a {
  padding: 0.65rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: #42b983;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.links-grid a:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #42b983;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.2);
}

.links-grid a.router-link-active {
  background: linear-gradient(135deg, #42b983 0%, #359268 100%);
  color: #fff;
  border-color: #42b983;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}
</style>
