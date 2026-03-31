/**
 * Heuristiques de sélection du DOM ChatGPT. En cas de changement d’interface,
 * ajuster prioritairement ce module.
 */

import { extensionConfig } from '@/config/extensionConfig'
import { matchesExcludedLabel } from '@/utils/text'

type ExcludedSet = ReadonlySet<string>

export function isConversationHref(href: string): boolean {
  const segment = extensionConfig.dom.conversationPathSegment
  try {
    const url = new URL(href, window.location.origin)
    return url.pathname.includes(segment)
  } catch {
    return false
  }
}

/**
 * Racine probable de la barre latérale historique.
 * Ordre : sélecteurs stables observés côté ChatGPT → repli large.
 */
export function findSidebarRoot(): Document | Element {
  const withHistoryAside = document.querySelector(
    'aside[aria-label="Chat history"], aside[aria-label="Historique de discussion"]',
  )
  if (withHistoryAside) return withHistoryAside

  /** Si OpenAI expose un test id stable, décommenter / adapter. */
  // const byTestId = document.querySelector('[data-testid="conversations-sidebar"]')
  // if (byTestId) return byTestId

  for (const aside of document.querySelectorAll('aside')) {
    if (aside.querySelector(`a[href*="${segmentSelectorSafe()}"]`)) return aside
  }

  const navWithChats = Array.from(document.querySelectorAll('nav')).find((nav) =>
    nav.querySelector(`a[href*="${segmentSelectorSafe()}"]`),
  )
  if (navWithChats) return navWithChats

  return document
}

/** Segment `/c/` → utilisable dans `querySelector` (pas d’échappement nécessaire ici). */
function segmentSelectorSafe(): string {
  return extensionConfig.dom.conversationPathSegment.replace(/"/g, '\\"')
}

export function findConversationAnchors(root: Document | Element): HTMLAnchorElement[] {
  const list = root.querySelectorAll(`a[href*="${segmentSelectorSafe()}"]`)
  const out: HTMLAnchorElement[] = []
  list.forEach((node) => {
    if (node instanceof HTMLAnchorElement && isConversationHref(node.href)) {
      out.push(node)
    }
  })
  return out
}

/**
 * Vrai si le lien correspond à un libellé d’UI à préserver (liste config), au sens strict normalisé.
 */
export function shouldSkipAnchorForExcludedLabel(
  anchor: HTMLAnchorElement,
  excluded: ExcludedSet,
): boolean {
  const parts = collectLabelCandidates(anchor)
  return parts.some((p) => matchesExcludedLabel(p, excluded))
}

function collectLabelCandidates(anchor: HTMLAnchorElement): string[] {
  const raw: string[] = []
  const aria = anchor.getAttribute('aria-label')
  const title = anchor.getAttribute('title')
  if (aria) raw.push(aria)
  if (title) raw.push(title)
  if (anchor.textContent) raw.push(anchor.textContent)
  return raw
}

/**
 * Cible préférée pour le flou : sous-bloc « titre » plutôt que toute la ligne (icônes, badges).
 * Ajuster l’ordre des stratégies si le layout change.
 */
export function resolveTitleElement(anchor: HTMLAnchorElement): HTMLElement {
  const truncate = anchor.querySelector('[class*="truncate"]')
  if (truncate instanceof HTMLElement && hasMeaningfulText(truncate)) return truncate

  const overflowHidden = anchor.querySelector('[class*="overflow-hidden"]')
  if (overflowHidden instanceof HTMLElement && hasMeaningfulText(overflowHidden)) {
    return overflowHidden
  }

  const divChildren = Array.from(anchor.children).filter(
    (c): c is HTMLDivElement => c instanceof HTMLDivElement,
  )
  if (divChildren.length >= 2) {
    const last = divChildren[divChildren.length - 1]
    if (hasMeaningfulText(last)) return last
  }

  return anchor
}

function hasMeaningfulText(el: HTMLElement): boolean {
  return Boolean(el.textContent?.trim())
}
