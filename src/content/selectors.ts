/**
 * Heuristiques de sélection du DOM ChatGPT (sidebar, Project > Chats, Search chats).
 * En cas de changement d’interface, ajuster prioritairement ce module.
 */

import { extensionConfig } from '@/config/extensionConfig'
import { matchesExcludedLabel, normalizeLabel } from '@/utils/text'

type ExcludedSet = ReadonlySet<string>

const NEW_CHAT_IN_PREFIXES = [
  'new chat in',
  'nouveau chat dans',
  'nouvelle conversation dans',
] as const

export function isConversationHref(href: string): boolean {
  const segment = extensionConfig.dom.conversationPathSegment
  try {
    const url = new URL(href, window.location.origin)
    return url.pathname.includes(segment)
  } catch {
    return false
  }
}

/** Libellés UI, préfixes « new chat in … », etc. */
export function isExcludedLabel(text: string, excluded: ExcludedSet): boolean {
  if (matchesExcludedLabel(text, excluded)) return true
  const n = normalizeLabel(text)
  if (!n) return false
  for (const p of NEW_CHAT_IN_PREFIXES) {
    if (n.startsWith(normalizeLabel(p))) return true
  }
  return false
}

/**
 * Dates courtes affichées à droite des lignes (évite de flouter la date au lieu du titre).
 */
export function isDateLike(text: string): boolean {
  const t = text.trim()
  if (t.length < 3 || t.length > 48) return false
  const lower = t.toLowerCase()
  if (/^(today|yesterday|tomorrow|now|hier|demain|aujourd['’]hui)$/i.test(lower)) return true
  // Mar 31, March 31, 2024
  if (/^[a-z]{3,9}\s+\d{1,2}(?:,?\s*\d{4})?$/i.test(t)) return true
  if (/^\d{1,2}\s+[a-z]{3,9}(?:\s+\d{4})?$/i.test(lower)) return true
  // jj/mm/aaaa
  if (/^\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?$/.test(t)) return true
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return true
  // heure courte
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) return true
  return false
}

/**
 * Racine probable de la barre latérale historique.
 */
export function findSidebarRoot(): Document | Element {
  const withHistoryAside = document.querySelector(
    'aside[aria-label="Chat history"], aside[aria-label="Historique de discussion"]',
  )
  if (withHistoryAside) return withHistoryAside

  for (const aside of document.querySelectorAll('aside')) {
    if (aside.querySelector(`a[href*="${segmentSelectorSafe()}"]`)) return aside
  }

  const navWithChats = Array.from(document.querySelectorAll('nav')).find((nav) =>
    nav.querySelector(`a[href*="${segmentSelectorSafe()}"]`),
  )
  if (navWithChats) return navWithChats

  return document
}

/**
 * Barre latérale « historique de discussion » globale (pas la colonne Projet / fichiers).
 * Sert à ne pas mélanger sidebar globale et liste des chats d’un projet.
 */
function findGlobalChatHistoryContainer(): Element | null {
  return document.querySelector(
    'aside[aria-label="Chat history"], aside[aria-label="Historique de discussion"]',
  )
}

function resolveSidebarAsideElement(): Element | null {
  const hist = findGlobalChatHistoryContainer()
  if (hist) return hist
  const r = findSidebarRoot()
  if (r instanceof Element && r !== document.documentElement) return r
  return document.querySelector('aside')
}

/** Segment utilisable dans `querySelector`. */
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

export function shouldSkipAnchorForExcludedLabel(
  anchor: HTMLAnchorElement,
  excluded: ExcludedSet,
): boolean {
  const parts = collectLabelCandidates(anchor)
  return parts.some((p) => isExcludedLabel(p, excluded))
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
 * Bloc titre principal dans une ligne / carte de conversation (pas le snippet ni la date).
 * `root` peut être l’ancre `<a>` ou un conteneur qui en contient une.
 */
export function getConversationTitleFromListItem(
  root: Element,
  excluded: ExcludedSet,
): HTMLElement | null {
  const anchor = resolveConversationAnchor(root)
  if (!anchor) return null
  return pickPrimaryTitleInsideAnchor(anchor, excluded)
}

function resolveConversationAnchor(row: Element): HTMLAnchorElement | null {
  if (row instanceof HTMLAnchorElement && isConversationHref(row.href)) return row
  const direct = row.closest(`a[href*="${segmentSelectorSafe()}"]`)
  if (direct instanceof HTMLAnchorElement && isConversationHref(direct.href)) return direct
  const any = row.querySelector(`a[href*="${segmentSelectorSafe()}"]`)
  if (any instanceof HTMLAnchorElement && isConversationHref(any.href)) return any
  return null
}

function pickPrimaryTitleInsideAnchor(
  anchor: HTMLAnchorElement,
  excluded: ExcludedSet,
): HTMLElement | null {
  const withTruncate = anchor.querySelectorAll<HTMLElement>(
    '[class*="truncate"], [class*="line-clamp"]',
  )
  for (const el of withTruncate) {
    if (!isLikelyTitleNode(el, excluded)) continue
    return el
  }

  const fallback = resolveTitleElement(anchor)
  const ft = fallback.textContent?.trim() ?? ''
  if (!ft || isDateLike(ft) || isExcludedLabel(ft, excluded)) return null
  if (isLikelySnippetBlock(fallback)) return null
  return fallback
}

function isLikelySnippetBlock(el: HTMLElement): boolean {
  const cls = typeof el.className === 'string' ? el.className : ''
  if (/\bline-clamp-[2-9]\b/.test(cls)) return true
  const m = cls.match(/line-clamp-(\d+)/)
  if (m && parseInt(m[1], 10) >= 2) return true
  return false
}

function isLikelyTitleNode(el: HTMLElement, excluded: ExcludedSet): boolean {
  const cls = typeof el.className === 'string' ? el.className : ''
  if (/\bline-clamp-[2-9]\b/.test(cls)) return false
  const m = cls.match(/line-clamp-(\d+)/)
  if (m && parseInt(m[1], 10) >= 2) return false

  const text = el.textContent?.trim() ?? ''
  if (text.length < 2 || text.length > 220) return false
  if (isDateLike(text)) return false
  if (isExcludedLabel(text, excluded)) return false
  return true
}

function resolveTitleElement(anchor: HTMLAnchorElement): HTMLElement {
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

function collectTitlesFromAnchors(
  anchors: readonly HTMLAnchorElement[],
  excluded: ExcludedSet,
): HTMLElement[] {
  const out: HTMLElement[] = []
  for (const anchor of anchors) {
    if (shouldSkipAnchorForExcludedLabel(anchor, excluded)) continue
    if (anchor.closest('[contenteditable="true"]')) continue
    const title = getConversationTitleFromListItem(anchor, excluded)
    if (title) out.push(title)
  }
  return out
}

/** Titres dans la barre latérale (historique global uniquement si repéré, sinon repli actuel). */
export function getSidebarConversationTitleElements(excluded: ExcludedSet): HTMLElement[] {
  const hist = findGlobalChatHistoryContainer()
  const scope: Element | null =
    hist ??
    (findSidebarRoot() instanceof Element && findSidebarRoot() !== document.documentElement
      ? (findSidebarRoot() as Element)
      : resolveSidebarAsideElement())
  if (!scope) return []
  return collectTitlesFromAnchors(findConversationAnchors(scope), excluded)
}

/**
 * Ancres conversation dans la zone « workspace » : tout sauf historique global et sauf dialogues
 * (recherche). Couvre Project > Chats (souvent hors `<main>` ou dans une 2ᵉ colonne), grilles
 * centrales, etc.
 */
function collectWorkspaceConversationAnchors(): HTMLAnchorElement[] {
  const seen = new Set<HTMLAnchorElement>()
  const out: HTMLAnchorElement[] = []
  const globalHistory = findGlobalChatHistoryContainer()

  for (const a of findConversationAnchors(document)) {
    if (seen.has(a)) continue
    if (globalHistory?.contains(a)) continue
    if (isAnchorInsideVisibleDialog(a)) continue
    seen.add(a)
    out.push(a)
  }
  return out
}

function isAnchorInsideVisibleDialog(anchor: Element): boolean {
  const dialog = anchor.closest('[role="dialog"]')
  return dialog instanceof HTMLElement && isRoughlyVisible(dialog)
}

/** Titres des chats projet / zone principale / colonnes hors historique global. */
export function getProjectChatTitleElements(excluded: ExcludedSet): HTMLElement[] {
  return collectTitlesFromAnchors(collectWorkspaceConversationAnchors(), excluded)
}

function isRoughlyVisible(el: HTMLElement): boolean {
  const s = window.getComputedStyle(el)
  if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

/** Titres dans les résultats Search chats (souvent sous `role="dialog"`). */
export function getSearchChatTitleElements(excluded: ExcludedSet): HTMLElement[] {
  const anchors: HTMLAnchorElement[] = []
  const seen = new Set<HTMLAnchorElement>()

  for (const dialog of document.querySelectorAll('[role="dialog"]')) {
    if (!(dialog instanceof HTMLElement) || !isRoughlyVisible(dialog)) continue
    for (const a of findConversationAnchors(dialog)) {
      if (!seen.has(a)) {
        seen.add(a)
        anchors.push(a)
      }
    }
  }

  return collectTitlesFromAnchors(anchors, excluded)
}

/** Fusion sidebar + zone projet + recherche, sans doublons sur le nœud titre. */
export function getAllConversationTitleElements(excluded: ExcludedSet): HTMLElement[] {
  const merged = [
    ...getSidebarConversationTitleElements(excluded),
    ...getProjectChatTitleElements(excluded),
    ...getSearchChatTitleElements(excluded),
  ]
  const seen = new Set<HTMLElement>()
  const unique: HTMLElement[] = []
  for (const el of merged) {
    if (!seen.has(el)) {
      seen.add(el)
      unique.push(el)
    }
  }
  return unique
}
