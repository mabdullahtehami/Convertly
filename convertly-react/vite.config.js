import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* Absolute base: the app is served from the domain root and every
   route (/tools/<slug> etc.) needs absolute asset URLs to resolve. */
export default defineConfig({
  base: '/',
  plugins: [react()],
  // css/ and js/tool-icons.js are used by both versions and sit one
  // level above this app, so the dev server has to be allowed to read them.
  server: {
    fs: { allow: ['..'] },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
})
