/**
 * Configuration centralisée : branding, blur, domaines et exclusions.
 * Modifier uniquement ce fichier pour ajuster l’extension avant publication.
 */

export const extensionConfig = {
  branding: {
    name: 'GPT-Blur',
    /** Affiché là où l’espace est limité (barre d’outils, etc.) */
    shortName: 'GPT-Blur',
    description:
      'Floute visuellement les titres des conversations dans la barre latérale ChatGPT. Préférence enregistrée localement uniquement.',
    author: '',
  },

  /**
   * Chemins des icônes relatifs à la racine de l’extension packagée (dossier public → racine du build).
   */
  icons: {
    16: 'icons/icon-16.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },

  /**
   * Motifs `matches` Manifest V3 pour l’injection du content script.
   */
  contentMatches: [
    'https://chatgpt.com/*',
    'https://*.chatgpt.com/*',
    'https://chat.openai.com/*',
  ],

  blur: {
    /** Rayon du flou en px (injecté en `--gpt-blur-amount`). */
    amountPx: 6,
    /** Classe CSS appliquée sur l’élément titre */
    titleClassName: 'gpt-blur-conversation-title',
  },

  /**
   * Libellés d’UI à ne jamais flouter (comparaison normalisée : casse, espaces, accents optionnels).
   * Ajouter les variantes FR/EN utiles selon la langue affichée par ChatGPT.
   */
  excludedUiLabels: [
    'new chat',
    'search chats',
    'nouveau chat',
    'rechercher dans les discussions',
    'rechercher des discussions',
    /** Onglets / zones Project (correspondance exacte normalisée). */
    'chats',
    'sources',
    'discussions',
    'projets',
  ],

  /** Clés `chrome.storage.local` (aucune donnée n’est envoyée hors de l’appareil). */
  storage: {
    blurTitlesOn: 'gptBlur.titlesOn',
  },

  /** Valeur par défaut si aucune préférence enregistrée (première visite). */
  defaults: {
    blurTitlesOn: true,
  },

  /** Libellés du popup d’action (barre d’outils Chrome). */
  ui: {
    popupToggleLabel: 'Blur chat titles',
  },

  features: {
    /** Si false, désactive le flou partout (utile pour le débogage). */
    blurEnabled: true,
    debugLog: false,
  },

  dom: {
    /**
     * Segment d’URL identifiant un fil de conversation dans le href d’un lien sidebar.
     * Si OpenAI change le format des URLs, ajuster ici uniquement.
     */
    conversationPathSegment: '/c/',
  },
} as const

export type ExtensionConfig = typeof extensionConfig
