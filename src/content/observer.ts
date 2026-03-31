/**
 * Recalcule le flou après les mutations DOM (rerenders React, renommage de chats, etc.).
 */

export function startDomSyncObserver(onTick: () => void): () => void {
  let rafId = 0

  const schedule = (): void => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      onTick()
    })
  }

  const observer = new MutationObserver(() => {
    schedule()
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['href', 'class', 'aria-label', 'title', 'data-state'],
  })

  return () => {
    observer.disconnect()
    if (rafId) cancelAnimationFrame(rafId)
  }
}
