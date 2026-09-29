# LUXORA 360° — Jmal + Kass d'Atay 🐪🍵

Le site vitrine a été **annulé / supprimé**. Il ne reste que le code du personnage :

| Fichier | Rôle |
| --- | --- |
| `components/luxora-jmal.tsx` | `CustomCursor` (verre de thé à la menthe) + `CharacterCanvas` (Gaze Engine 360°, physique du tarbouche, clignement, sommeil, poussière). |
| `components/jmal-draw.ts` | Le **moteur de dessin pur** : `drawJmal(ctx, width, height, frame)` — SANS React, donc testable et réutilisable à volonté. |
| `tools/render-preview.mjs` | Rendu du personnage **hors navigateur** (Node) pour vérifier le dessin. |
| `docs/jmal-preview.png` | Aperçu généré (centre / gauche / droite / sommeil). |

---

## Utilisation (drop-in)

Copie les deux fichiers dans ton projet (React 18+ ou 19) et garde le chemin relatif
`./jmal-draw` entre eux :

```tsx
import { CustomCursor, CharacterCanvas } from './components/luxora-jmal';

export default function Page() {
  return (
    <>
      <CustomCursor />
      <CharacterCanvas onGazeUpdate={(info) => console.log(info)} />
    </>
  );
}
```

`CustomCursor` ajoute la classe `luxora-cursor-hidden` sur `<body>` (à styler avec
`cursor: none`) et se désactive tout seul sur mobile / tablette.
`CharacterCanvas` s'adapte à son conteneur (aspect carré conseillé).

---

## Aperçu hors navigateur

```bash
npm install
npm run preview:character      # → docs/jmal-preview.png
```

Nécessite Node ≥ 22.18 (type stripping). L'aperçu utilise **exactement** le même
`jmal-draw.ts` que le canvas du navigateur : une seule source de vérité.

---

## Réglages principaux

| Constante (dans `luxora-jmal.tsx`) | Effet |
| --- | --- |
| `HEAD_TURN_FRAMES` | Nombre de paliers de rotation de la tête (7 par défaut, impair = centré). |
| `IDLE_SLEEP_MS` | Délai avant que le chameau s'endorme (7000 ms). |
| `HEAD_ANCHOR` | Position du « centre de la tête » pour le calcul du regard (0.5 / 0.44). |
| `BASE_SIZE` (dans `jmal-draw.ts`) | Espace de dessin interne 480×480, mis à l'échelle automatiquement. |

Physique de la choucha (gland du tarbouche) : ressort amorti → `velocity += ΔangleDeTête × 7.5`,
rappel `−0.55 × angle`, amortissement `0.9^dt`, butée ±0.95 rad.

---

## Récupérer l'ancien site

Le site vitrine reste dans l'historique Git (commit `fae1a53`) :

```bash
git checkout fae1a53 -- app package.json package-lock.json next.config.mjs \
  postcss.config.mjs tsconfig.json components/gaze-panel.tsx lib
```
