import { getPresetConfig } from './configs/presets'
import type { AuthMode } from './configs/presets'

// Default mode (can be overridden at runtime via localStorage)
const defaultMode: AuthMode = (process.env.AUTH_MODE as AuthMode) || 'client-managed'

export default defineNuxtConfig({
  // ssr: false,
  modules: ['../src/module'],

  auth: getPresetConfig(defaultMode),

  runtimeConfig: {
    public: {
      authMode: defaultMode,
    },
  },

  typescript: {
    typeCheck: true,
  },

  devtools: { enabled: true },
})
