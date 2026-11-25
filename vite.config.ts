import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
// @ts-expect-error plain module shared with the harness
import { buildInfoPlugin } from './tools/lib/hashes.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root,
  base: './',
  publicDir: 'public',
  plugins: [buildInfoPlugin(root)],
  css: { modules: { localsConvention: 'camelCaseOnly' } },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022', assetsInlineLimit: 0, sourcemap: false, chunkSizeWarningLimit: 6000 },
  server: { port: 5173, strictPort: false },
  test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 20000 }
})
