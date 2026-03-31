/**
 * Écrit des PNG 1×1 minimaux si absents, pour que le build et le chargement Chrome fonctionnent out of the box.
 * Remplacez les fichiers dans public/icons/ par vos vraies icônes avant publication sur le Chrome Web Store.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const iconsDir = path.join(root, 'public', 'icons')

/** PNG 1×1 transparent (minimal valide). */
const MINI_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

const files = ['icon-16.png', 'icon-48.png', 'icon-128.png']

mkdirSync(iconsDir, { recursive: true })

for (const file of files) {
  const dest = path.join(iconsDir, file)
  if (!existsSync(dest)) {
    writeFileSync(dest, MINI_PNG)
    console.info(`[gpt-blur] Created placeholder ${path.relative(root, dest)}`)
  }
}
