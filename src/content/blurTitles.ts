/**
 * Applique ou retire le flou sur les titres de conversations détectés.
 */

import { extensionConfig } from '@/config/extensionConfig'
import {
  findConversationAnchors,
  findSidebarRoot,
  resolveTitleElement,
  shouldSkipAnchorForExcludedLabel,
} from './selectors'

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

  const root = findSidebarRoot()
  const anchors = findConversationAnchors(root)
  const shouldBlurTargets = new Set<HTMLElement>()

  for (const anchor of anchors) {
    if (shouldSkipAnchorForExcludedLabel(anchor, excluded)) continue
    const target = resolveTitleElement(anchor)
    shouldBlurTargets.add(target)
  }

  for (const el of shouldBlurTargets) {
    el.classList.add(blurClass)
  }

  const scope: Document | Element = root instanceof Document ? document.documentElement : root
  scope.querySelectorAll(`.${blurClass}`).forEach((node) => {
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
