/**
 * Normalisation des libellés pour comparer le texte du DOM aux entrées `excludedUiLabels`.
 */

/** Supprime les accents (pour rapprocher FR de la liste de config). */
export function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
}

export function normalizeLabel(value: string): string {
  const withoutAccents = stripDiacritics(value)
  return withoutAccents
    .trim()
    .toLowerCase()
    .replace(/[,;:!?.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Correspondance stricte sur libellé normalisé uniquement (évite de flouter un vrai titre
 * qui contiendrait par ex. le mot « search »).
 */
export function matchesExcludedLabel(
  text: string,
  excludedNormalized: ReadonlySet<string>,
): boolean {
  const n = normalizeLabel(text)
  if (!n) return false
  return excludedNormalized.has(n)
}

/** Pré-calcule les exclusions une fois au chargement du content script. */
export function buildExcludedLabelSet(labels: readonly string[]): ReadonlySet<string> {
  return new Set(labels.map((l) => normalizeLabel(l)).filter(Boolean))
}
