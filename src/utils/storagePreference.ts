/**
 * Préférence utilisateur persistée dans chrome.storage.local (on/off flou).
 */

import { extensionConfig } from '@/config/extensionConfig'

const KEY = extensionConfig.storage.blurTitlesOn
const DEFAULT = extensionConfig.defaults.blurTitlesOn

let cache: boolean | null = null

export function getBlurTitlesOnFromCache(): boolean {
  return cache ?? DEFAULT
}

export async function loadBlurTitlesPreference(): Promise<boolean> {
  const result = await chrome.storage.local.get(KEY)
  const v = result[KEY]
  cache = typeof v === 'boolean' ? v : DEFAULT
  return cache
}

/** Autres onglets ChatGPT : resynchroniser le flou si la préférence change. */
export function onBlurTitlesPreferenceChanged(callback: () => void): () => void {
  const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
    changes,
    areaName,
  ) => {
    if (areaName !== 'local' || !(KEY in changes)) return
    const next = changes[KEY]?.newValue
    cache = typeof next === 'boolean' ? next : DEFAULT
    callback()
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
