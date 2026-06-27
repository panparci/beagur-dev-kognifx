import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080';
const authTarget = process.env.VITE_AUTH_PROXY_TARGET || 'http://localhost:3001';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/auth': { target: authTarget, changeOrigin: true },
          '/api': { target: apiTarget, changeOrigin: true },
          '/healthz': { target: apiTarget, changeOrigin: true },
          '/readyz': { target: apiTarget, changeOrigin: true },
        },
      },
      plugins: [tailwindcss(), react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@core': path.resolve(__dirname, 'src/core'),
          '@modules': path.resolve(__dirname, 'src/modules'),
        }
      }
    };
});
