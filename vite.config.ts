import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const root = process.cwd();
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY),
        'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY),
        // Also expose as import.meta.env for Vite
        'import.meta.env.VITE_DEEPSEEK_API_KEY': JSON.stringify(env.VITE_DEEPSEEK_API_KEY || env.DEEPSEEK_API_KEY),
        // Polyfill for Node.js globals
        global: 'globalThis',
        'process.env': {},
      },
      resolve: {
        alias: {
          '@': path.resolve(root, '.'),
          // Explicit aliases to ensure Vercel resolves them correctly
          '@/lib/web3': path.resolve(root, './lib/web3.ts'),
          '@/lib': path.resolve(root, './lib'),
          '@/services': path.resolve(root, './services'),
          '@/components': path.resolve(root, './components'),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
      },
      // TypeScript configuration for Vite
      esbuild: {
        target: 'es2020',
        include: /\.tsx?$/,
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
        commonjsOptions: {
          include: [/node_modules/],
          transformMixedEsModules: true,
        },
      },
      optimizeDeps: {
        exclude: ['ethers'],
        include: ['ethers > @ethersproject/providers'],
      },
    };
});
