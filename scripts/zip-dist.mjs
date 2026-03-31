/**
 * Crée une archive zip du dossier `dist/` à la racine du projet (fichiers à la racine du zip),
 * prête pour le flux Chrome Web Store (manifest + assets à la racine de l’archive).
 */
import { execSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const outZip = path.join(root, 'gpt-blur-store.zip')

if (!existsSync(distDir)) {
  console.error('[gpt-blur] dist/ introuvable. Lancez d’abord npm run build.')
  process.exit(1)
}

if (existsSync(outZip)) {
  unlinkSync(outZip)
}

if (process.platform === 'win32') {
  const distEscaped = distDir.replace(/'/g, "''")
  const zipEscaped = outZip.replace(/'/g, "''")
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath '${distEscaped}' | ForEach-Object { $_.FullName }) -DestinationPath '${zipEscaped}' -Force"`,
    { stdio: 'inherit', cwd: root },
  )
} else {
  execSync(`zip -r "${outZip}" .`, { stdio: 'inherit', cwd: distDir })
}

console.info(`[gpt-blur] Archive créée : ${path.relative(root, outZip)}`)
