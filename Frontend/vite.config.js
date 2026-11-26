import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Laravel in dev. API_PROXY_TARGET points a second dev server at another Laravel (e.g. port 8001 for tests).
// eslint-disable-next-line no-undef
const api = process.env.API_PROXY_TARGET ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': api,
      '/sanctum': api,
      // Laravel's Google sign-in routes. Not all of /auth: /auth/google/done is a React route.
      '^/auth/google/(redirect|callback)': api,
    },
  },
});
