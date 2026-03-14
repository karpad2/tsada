/**
 * Creates a portable zip distribution of the DC Chat app.
 * Run after electron-builder --dir to package win-unpacked into a zip.
 *
 * Usage: node scripts/package-dc.mjs
 */
import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')

const unpacked = join(root, 'release', 'win-unpacked')
const zip7 = join(root, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe')
const version = JSON.parse((await import('fs')).readFileSync(join(root, 'package.json'), 'utf8')).version
const outZip = join(root, 'release', `DC Chat-${version}-win-x64.zip`)

if (!existsSync(unpacked)) {
  console.error('win-unpacked directory not found. Run electron-builder --dir first.')
  process.exit(1)
}

if (!existsSync(zip7)) {
  console.error('7za.exe not found in node_modules. Install 7zip-bin.')
  process.exit(1)
}

console.log(`Creating ${outZip}...`)
execSync(`"${zip7}" a -tzip "${outZip}" "${unpacked}${process.platform === 'win32' ? '\\' : '/'}*" -r`, { stdio: 'inherit' })
console.log('Done! Portable zip created:', outZip)
