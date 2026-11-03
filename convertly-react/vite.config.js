import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built app can be opened from any folder / static host.
export default defineConfig({
  base: './',
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
