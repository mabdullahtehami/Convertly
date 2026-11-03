import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built app can be opened from any folder / static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  // shared/ holds the CSS and icons used by both versions and sits one
  // level above this app, so the dev server has to be allowed to read it.
  server: {
    fs: { allow: ['..'] },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
})
