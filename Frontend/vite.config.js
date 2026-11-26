import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/sanctum': 'http://localhost:8000',
      // Laravel's Google sign-in routes. Not all of /auth: /auth/google/done is a React route.
      '^/auth/google/(redirect|callback)': 'http://localhost:8000',
    },
  },
});