import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built app can be opened from any folder / static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 4000,
  },
})
