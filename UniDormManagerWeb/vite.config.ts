import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // 把第三方依赖按生态分组,避免单 bundle 超 500KB(rollup 警告)。
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom', 'react-router-dom'],
              recharts: ['recharts'],
              lucide: ['lucide-react'],
              gemini: ['@google/genai'],
            },
          },
        },
        // 单 chunk 大于此值才警告,目前 react/recharts 200~300KB 是合理的
        chunkSizeWarningLimit: 700,
      }
    };
});
