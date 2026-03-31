/**
 * Popup d’action : lit et met à jour chrome.storage.local ; le content script réagit via onChanged.
 */

import { extensionConfig } from '@/config/extensionConfig'
import './popup.css'

const KEY = extensionConfig.storage.blurTitlesOn
const DEFAULT = extensionConfig.defaults.blurTitlesOn

const brandEl = document.querySelector('#popup-brand')
const labelEl = document.querySelector('#popup-label')
const input = document.querySelector('#blur-toggle') as HTMLInputElement | null

function setSwitchUi(on: boolean): void {
  if (!input) return
  input.checked = on
  input.setAttribute('aria-checked', String(on))
}

async function loadState(): Promise<boolean> {
  const r = await chrome.storage.local.get(KEY)
  const v = r[KEY]
  return typeof v === 'boolean' ? v : DEFAULT
}

function bindBrandAndLabel(): void {
  if (brandEl) brandEl.textContent = extensionConfig.branding.shortName
  if (labelEl) labelEl.textContent = extensionConfig.ui.popupToggleLabel
}

async function init(): Promise<void> {
  bindBrandAndLabel()
  if (!input) return

  const on = await loadState()
  setSwitchUi(on)

  input.addEventListener('change', async () => {
    const next = input.checked
    setSwitchUi(next)
    await chrome.storage.local.set({ [KEY]: next })
  })

  /** Garde le switch aligné si la valeur change dans un autre contexte (rare dans le popup). */
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(KEY in changes)) return
    const nv = changes[KEY]?.newValue
    if (typeof nv === 'boolean') setSwitchUi(nv)
  })
}

void init()
