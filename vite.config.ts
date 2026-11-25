import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildInfoPlugin } from './tools/lib/hashes.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root,
  base: './',
  publicDir: 'public',
  plugins: [buildInfoPlugin(root)],
  css: { modules: { localsConvention: 'camelCaseOnly' } },
  build: { outDir: 'dist', assetsDir: 'bundle', emptyOutDir: true, target: 'es2022', assetsInlineLimit: 0, sourcemap: false, chunkSizeWarningLimit: 6000 },
  server: { port: 5173, strictPort: false },
  test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 20000, setupFiles: ['tests/setup.ts'] }
})
