import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // السطر الجديد 1

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // السطر الجديد 2
  ],
})