/**
 * Builds the Electron main process and preload script using esbuild.
 * Produces proper CJS output with 'electron' marked as external.
 * Run via: node scripts/build-electron.mjs
 */
import { build } from 'esbuild'
import { mkdirSync } from 'fs'

mkdirSync('dist-electron', { recursive: true })

const sharedConfig = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['electron'],  // Electron's built-in, not the npm package
  format: 'esm',           // ESM — 'import from electron' resolves to Electron's built-in in ESM mode
  sourcemap: false,
  minify: false,
}

await build({
  ...sharedConfig,
  entryPoints: ['electron/main.ts'],
  outfile: 'dist-electron/main.mjs',
})

// Preload uses CJS because contextBridge works with CJS in Electron's preload context
await build({
  ...sharedConfig,
  format: 'cjs',
  entryPoints: ['electron/preload.ts'],
  outfile: 'dist-electron/preload.cjs',
})

// Write a package.json in dist-electron/ so Node.js treats .js files there as ESM
// (needed because root package.json has "type":"module")
import { writeFileSync } from 'fs'
writeFileSync('dist-electron/package.json', JSON.stringify({ type: 'module' }, null, 2))

console.log('Electron main process built successfully.')
