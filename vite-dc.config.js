import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite config for the DC Chat renderer (standalone Electron app)
// The Electron main process is built separately via: node scripts/build-electron.mjs
//
// Dev:  npm run electron:dev   → starts renderer dev server on port 5174
//       Then run:  electron:launch  (in another terminal)
// Prod: npm run electron:build → builds everything + creates installer
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'markdown-loader',
      transform(code, id) {
        if (id.slice(-3) === '.md') {
          return `export default ${JSON.stringify(code)};`
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@a': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  root: '.',
  build: {
    outDir: 'dist-dc',
    emptyOutDir: true,
    target: 'chrome120',
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./dc-index.html', import.meta.url)),
      },
    },
  },
  // './' base so Electron loads assets via file:// in production
  base: './',
  server: {
    port: 5174,
  },
})
