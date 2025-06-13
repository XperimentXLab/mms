import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    cssCodeSplit: true, // Critical for CSS generation
    emptyOutDir: true,    
    manifest: true // Generates manifest.json for debugging   
  },
})
