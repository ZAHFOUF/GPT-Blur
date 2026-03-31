/**
 * Applique ou retire le flou sur les titres de conversations détectés.
 */

import { extensionConfig } from '@/config/extensionConfig'
import { getAllConversationTitleElements } from './selectors'

type ExcludedSet = ReadonlySet<string>

export type BlurSyncOptions = {
  /** Préférence utilisateur (switch) + éventuel kill-switch `features.blurEnabled`. */
  active: boolean
}

export function syncConversationTitleBlur(
  excluded: ExcludedSet,
  options: BlurSyncOptions,
): void {
  const blurClass = extensionConfig.blur.titleClassName

  if (!extensionConfig.features.blurEnabled || !options.active) {
    clearBlurClassInRoot(document, blurClass)
    return
  }

  const titleElements = getAllConversationTitleElements(excluded)
  const shouldBlurTargets = new Set<HTMLElement>(titleElements)

  for (const el of shouldBlurTargets) {
    el.classList.add(blurClass)
  }

  document.documentElement.querySelectorAll(`.${blurClass}`).forEach((node) => {
    if (node instanceof HTMLElement && !shouldBlurTargets.has(node)) {
      node.classList.remove(blurClass)
    }
  })
}

function clearBlurClassInRoot(doc: Document, blurClass: string): void {
  doc.querySelectorAll(`.${blurClass}`).forEach((node) => {
    node.classList.remove(blurClass)
  })
}
