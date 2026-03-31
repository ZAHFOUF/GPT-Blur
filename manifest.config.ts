import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from './package.json' with { type: 'json' }
import { extensionConfig } from './src/config/extensionConfig'

export default defineManifest({
  manifest_version: 3,
  name: extensionConfig.branding.name,
  short_name: extensionConfig.branding.shortName,
  description: extensionConfig.branding.description,
  version: packageJson.version,
  icons: {
    '16': extensionConfig.icons[16],
    '48': extensionConfig.icons[48],
    '128': extensionConfig.icons[128],
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: extensionConfig.branding.name,
    default_icon: {
      '16': extensionConfig.icons[16],
      '48': extensionConfig.icons[48],
      '128': extensionConfig.icons[128],
    },
  },
  permissions: ['storage'],
  content_scripts: [
    {
      matches: [...extensionConfig.contentMatches],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
})
