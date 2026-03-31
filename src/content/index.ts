/**
 * Content script : uniquement flou + écoute du stockage — aucune UI injectée dans la page.
 */

import { extensionConfig } from '@/config/extensionConfig'
import {
  getBlurTitlesOnFromCache,
  loadBlurTitlesPreference,
  onBlurTitlesPreferenceChanged,
} from '@/utils/storagePreference'
import { buildExcludedLabelSet } from '@/utils/text'
import { syncConversationTitleBlur } from './blurTitles'
import { startDomSyncObserver } from './observer'
import '@/styles/content.css'

const excludedLabels = buildExcludedLabelSet(extensionConfig.excludedUiLabels)

function applyBlurIntensityVar(): void {
  document.documentElement.style.setProperty(
    '--gpt-blur-amount',
    `${extensionConfig.blur.amountPx}px`,
  )
}

function isBlurActive(): boolean {
  return extensionConfig.features.blurEnabled && getBlurTitlesOnFromCache()
}

function sync(): void {
  try {
    applyBlurIntensityVar()
    syncConversationTitleBlur(excludedLabels, { active: isBlurActive() })
  } catch (err) {
    if (extensionConfig.features.debugLog) {
      console.info('[gpt-blur] Synchronisation ignorée :', err)
    }
  }
}

async function bootstrap(): Promise<void> {
  applyBlurIntensityVar()
  await loadBlurTitlesPreference()
  sync()
  startDomSyncObserver(sync)
  onBlurTitlesPreferenceChanged(sync)
}

void bootstrap()
