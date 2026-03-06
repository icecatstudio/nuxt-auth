import { getPresetConfig } from './configs/presets'
import type { AuthMode } from './configs/presets'

// Default mode (can be overridden at runtime via localStorage)
const defaultMode: AuthMode = (process.env.AUTH_MODE as AuthMode) || 'client-managed'

export default defineNuxtConfig({
  modules: ['../src/module'],

  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      authMode: defaultMode,
    },
  },

  typescript: {
    typeCheck: true,
  },

  auth: getPresetConfig(defaultMode),
})
