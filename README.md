# GPT-Blur

Extension Chrome (**Manifest V3**) en **TypeScript** : applique un **flou visuel uniquement côté client** sur les **titres des conversations** dans la **barre latérale** de ChatGPT. Aucune requête réseau supplémentaire, aucun suivi, aucun backend.

## Fonctionnalités

- **Interrupteur dans le popup Chrome** (clic sur l’icône de l’extension) : activer ou désactiver le flou ; l’état est **mémorisé localement** (`chrome.storage.local`). **Aucune UI n’est injectée dans ChatGPT.**
- Cible les liens de conversation (`href` contenant le segment configuré, par défaut `/c/`).
- Exclut explicitement des libellés d’interface configurables (ex. « New chat », « Search chats », équivalents FR dans la config).
- Suit les changements du DOM via `MutationObserver` (pas de `setInterval`).
- Configuration centralisée : [src/config/extensionConfig.ts](src/config/extensionConfig.ts) (nom, description, intensité du flou, domaines, exclusions, clé de stockage, valeur par défaut du switch).

## Prérequis

- [Node.js](https://nodejs.org/) 18+ (recommandé LTS 20+)
- npm

## Installation des dépendances

```bash
npm install
```

## Build

```bash
npm run build
```

Le dossier de sortie est **`dist/`** (extension prête à charger).

### Mode watch (rebuild automatique)

```bash
npm run dev
```

À chaque modification, rechargez l’extension dans `chrome://extensions` (icône de rechargement).

## Tester localement dans Chrome

1. Exécutez `npm run build`.
2. Ouvrez `chrome://extensions`.
3. Activez le **Mode développeur**.
4. **Charger l’extension non empaquetée** → sélectionnez le dossier **`dist`** (pas la racine du repo).

Ensuite, ouvrez [https://chatgpt.com](https://chatgpt.com) et activez le flou via **l’icône de l’extension** (popup) si besoin. Les titres de la liste des conversations seront floutés lorsque l’option est ON ; rien n’est ajouté à l’interface du site.

### Ajuster la détection si l’interface ChatGPT change

La logique sensible se trouve dans [src/content/selectors.ts](src/content/selectors.ts) :

- détection de la racine de la sidebar (`aside`, `nav`, etc.) ;
- résolution de l’élément « titre » à l’intérieur du lien (`truncate`, dernier `div`, etc.).

Évitez de disperser ces sélecteurs ailleurs pour garder une maintenance simple.

## Packaging zip (Chrome Web Store)

Après un build réussi :

```bash
npm run pack
```

Cela produit **`gpt-blur-store.zip`** à la racine (contenu de `dist/` avec le manifest à la racine de l’archive). Remplacez les icônes placeholder dans **`public/icons/`** par vos PNG 16 / 48 / 128 avant publication.

Sur Windows, le script utilise PowerShell (`Compress-Archive`). Sous macOS / Linux, `zip` doit être disponible dans le `PATH`.

## Icônes

Le script `prebuild` crée des **PNG 1×1** minimaux si les fichiers manquent, pour permettre un chargement immédiat. Pour le **Chrome Web Store**, remplacez :

- `public/icons/icon-16.png`
- `public/icons/icon-48.png`
- `public/icons/icon-128.png`

par vos visuels conformes aux [directives Google](https://developer.chrome.com/docs/webstore/images).

## Confidentialité et sécurité

- **Permissions** : `storage` pour enregistrer uniquement le choix on/off du flou sur l’appareil ; injection sur les URLs définies dans `content_scripts.matches` (voir [manifest.config.ts](manifest.config.ts)).
- **Pas de tracking**, pas d’analytics, pas de serveur : le script manipule le DOM / les styles et lit-écrit la préférence localement.
- Valeur par défaut du switch : [extensionConfig.defaults.blurTitlesOn](src/config/extensionConfig.ts).

## Arborescence principale

```
src/
  config/extensionConfig.ts   # Branding, blur, domaines, exclusions, libellés popup
  content/
    index.ts                   # Content script (flou uniquement)
    blurTitles.ts
    selectors.ts
    observer.ts
  popup/
    index.html                 # Popup d’action (toolbar)
    main.ts
    popup.css
  styles/content.css          # Styles du flou uniquement (page ChatGPT)
  utils/text.ts
  utils/storagePreference.ts   # Cache + onChanged côté page
public/icons/                 # Icônes (PNG)
scripts/
  generate-placeholder-icons.mjs
  zip-dist.mjs
manifest.config.ts            # Manifest MV3 (CRXJS)
vite.config.ts
```

## Choix techniques

- **Vite 6** + **@crxjs/vite-plugin** : build MV3, manifest typé, bundling du content script et du CSS.
- **TypeScript strict** : typage explicite, maintenance par un autre développeur facilitée.
- **MutationObserver + rAF** : mise à jour groupée après mutations, sans polling.

## Licence

Ce projet est sous **GNU General Public License v3.0** : voir le fichier [LICENSE](LICENSE) (texte officiel). Identifiant SPDX : `GPL-3.0`.
