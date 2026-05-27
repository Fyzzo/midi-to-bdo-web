# 🔍 Rapport d'Audit Technique Impeccable — Marnian Studio

Ce rapport d'audit évalue la qualité technique de l'implémentation de la page principale et des fichiers de configuration du projet `Marnian Studio`. Il se concentre sur les aspects mesurables et vérifiables du code (Accessibilité WCAG, Performances de rendu, Réflectivité responsive, Cohérence thématique et Anti-patterns visuels).

---

## 📊 Tableau des Scores de Santé Technique

| # | Dimension | Score | Problème Clé Identifié |
|---|-----------|-------|-------------------------|
| 1 | **Accessibilité (A11y)** | **1.5 / 4** | Zone de drag & drop (`div` interactive) non focalisable au clavier et absence de labels ARIA sur les sliders. |
| 2 | **Performances** | **3.0 / 4** | Risque de reflow synchrone (layout thrashing) dans `drawPianoRoll` via `getBoundingClientRect()`. |
| 3 | **Ergonomie Responsive** | **3.0 / 4** | Cibles tactiles trop petites (<44px) sur mobile pour les boutons d'édition de canaux et les boutons de fichiers. |
| 4 | **Cohérence Thématique** | **3.5 / 4** | Excellents tokens Tailwind (`bdo-*`), mais persistance de couleurs hexadécimales brutes dans `main.css` et le canvas. |
| 5 | **Anti-Patterns Visuels** | **2.0 / 4** | Présence de plusieurs "AI tells" selon la charte Impeccable (Texte en dégradé, Glassmorphism par défaut, Grille de métriques standard). |
| **Total** | | **13 / 20** | **Acceptable (Des travaux d'optimisation importants sont recommandés)** |

---

## 🚫 Verdict sur les Anti-Patterns (AI Slop Tells)

L'interface de Marnian Studio est visuellement très soignée et immersive. Cependant, au regard de la charte de conception **Impeccable**, elle comporte plusieurs choix de conception génériques couramment générés par les IA (AI tells) :

1. **Texte en dégradé (Gradient Text)** : Le titre principal `Marnian Studio` applique un effet de masque de texte avec dégradé doré (`bg-clip-text text-transparent`). Selon les règles Impeccable, cet effet est décoratif et nuit à la clarté. L'accentuation devrait se faire uniquement via le poids de la police.
2. **Glassmorphism par défaut** : La classe `.bdo-glass` avec flou d'arrière-plan (`backdrop-blur`) est utilisée comme arrière-plan principal pour les cartes complexes de la console. Le flou d'arrière-plan doit être réservé à des superpositions contextuelles (overlays) et non appliqué par défaut aux cartes de contenu.
3. **Le template "Hero Metric"** : Le résumé des statistiques MIDI (Total Notes, Original BPM, Signature, Total Duration) est disposé sous la forme de 4 boîtes côte à côte avec de grands chiffres blancs et des petits labels grisés en haut. Il s'agit d'un cliché classique de dashboard SaaS.
4. **Disque Tournant** : Bien que le disque de vinyle animé apporte une micro-interaction agréable, l'utilisation de rotations permanentes non déclenchées par l'utilisateur peut surcharger cognitivement l'interface si elle est visible en continu.

---

## 📋 Résumé Exécutif

- **Score Global** : **13/20** (Acceptable - Niveau de production nécessitant des ajustements ergonomiques).
- **Décompte des anomalies** :
  - **P0 (Bloquant)** : 0
  - **P1 (Majeur)** : 3 (Accessibilité clavier & Lecteurs d'écran)
  - **P2 (Mineur)** : 3 (Performances & Responsive)
  - **P3 (Finition)** : 2 (Anti-patterns visuels)
- **Top 3 des problèmes critiques** :
  1. La zone principale d'upload de fichiers (drag & drop) est un élément `div` cliquable, ce qui la rend **totalement invisible pour les utilisateurs naviguant uniquement au clavier** (pas de `tabindex` ni d'écouteur d'événements de touches).
  2. Les sliders de volume de préécoute et de défilement temporel (Seek Scrubber) ne possèdent **aucun label associé ni attribut ARIA**, les rendant muets pour les synthétiseurs vocaux.
  3. L'appel à `canvas.getBoundingClientRect()` suivi d'une affectation directe de `canvas.width` dans `drawPianoRoll` provoque un recalcul de mise en page synchrone forcé à chaque re-rendu du piano roll.

---

## 🔍 Rapport de Diagnostic Détaillé

### 🚨 Anomalies Majeures (P1)

#### 1. [P1] Zone de Drag & Drop Inaccessible au Clavier
- **Emplacement** : `app/app.vue` — Ligne 181-194 (bloc `<div v-else @click="triggerFileInput">`)
- **Catégorie** : Accessibilité
- **Impact** : Bloque totalement les utilisateurs souffrant de handicaps moteurs ou visuels naviguant au clavier. Ils ne peuvent ni faire le focus sur la zone, ni l'activer avec la touche Espace ou Entrée.
- **Norme violée** : WCAG 2.1 - 2.1.1 (Clavier)
- **Recommandation** : Transformer la `div` interactive en un véritable élément `<button type="button">` ou lui ajouter les attributs `tabindex="0"`, `role="button"` et un écouteur d'événement `@keydown.enter.prevent` / `@keydown.space.prevent`.

#### 2. [P1] Absence de labels sur les Sliders d'entrée (Ranges)
- **Emplacement** : `app/app.vue` — Lignes 145-153 (Scrubber) et 166-172 (Volume)
- **Catégorie** : Accessibilité
- **Impact** : Les lecteurs d'écran lisent uniquement "curseur, 0%" sans aucune indication sur ce que contrôle ce curseur.
- **Norme violée** : WCAG 2.1 - 4.1.2 (Nom, rôle, valeur)
- **Recommandation** : Ajouter un attribut `aria-label="Position de lecture"` au scrubber temporel et `aria-label="Volume de préécoute"` au slider de volume.

---

### ⚠️ Anomalies Mineures (P2)

#### 3. [P2] Layout Thrashing (Recalcul de layout forcé)
- **Emplacement** : `app/app.vue` — Ligne 1269-1272 (`drawPianoRoll()`)
- **Catégorie** : Performances
- **Impact** : Force le navigateur à recalculer les styles et la mise en page (reflow) de façon synchrone en lisant `rect.width` puis en modifiant directement `canvas.width` juste après, ce qui peut créer des micro-saccades de rendu.
- **Recommandation** : Découpler la mesure des dimensions du canvas de sa phase de dessin, ou stocker les dimensions en mémoire réactive (`useResizeObserver` par exemple) pour éviter de requérir `getBoundingClientRect()` à chaque rafraîchissement graphique du piano roll.

#### 4. [P2] Cibles tactiles mobiles trop petites
- **Emplacement** : `app/app.vue` — Boutons "Change File" (Ligne 62), "Remove" (Ligne 68) et curseurs de volume.
- **Catégorie** : Responsive
- **Impact** : Sur les smartphones, les cibles tactiles font moins de 32px de hauteur, ce qui rend l'activation difficile et frustrante avec le pouce.
- **Norme violée** : WCAG 2.1 - 2.5.5 (Taille de la cible tactile - AAA / requis pour mobile standard à 44x44px)
- **Recommandation** : Augmenter le padding vertical et horizontal (`py-2 px-4`) pour atteindre une hauteur physique d'au moins 44px sur mobile ou ajouter une zone de clic invisible.

---

### ✨ Finitions & Alignement Charte (P3)

#### 5. [P3] Gradient Text (AI Slop Tell)
- **Emplacement** : `app/app.vue` — Lignes 11-13 (Logo `Marnian Studio`)
- **Catégorie** : Anti-pattern visuel
- **Impact** : Donne une esthétique clichée issue des générateurs de code IA d'ancienne génération.
- **Recommandation** : Supprimer le dégradé et utiliser une couleur dorée unie et éclatante (`text-bdo-gold` ou `text-bdo-goldBright`) avec un poids de police bien affirmé pour valoriser la marque de façon authentique et élégante.

#### 6. [P3] Glassmorphism systématique
- **Emplacement** : `app/app.vue` — Cartes principales (Ligne 206)
- **Catégorie** : Anti-pattern visuel
- **Impact** : Surcharge le processeur graphique sur les appareils modestes et nuit au contraste.
- **Recommandation** : Remplacer l'arrière-plan flouté semi-transparent par une surface opaque sombre texturée solide (`bg-bdo-light border border-bdo-border/30`) et réserver les effets de verre à de véritables superpositions flottantes ou menus déroulants.

---

## 🛠️ Actions Recommandées (Ordre de Priorité)

Voici l'ordre d'exécution conseillé pour corriger ces points critiques et amener le score de Marnian Studio à **18+/20 (Excellent)** :

1. **[P1] Accessibilité Clavier** : Corriger l'accessibilité de la zone de drag & drop en lui injectant les attributs `role`, `tabindex` et la gestion des touches physiques.
2. **[P1] Accessibilité Lecteurs d'Écran** : Ajouter les attributs `aria-label` descriptifs sur tous les curseurs et boutons purement iconographiques.
3. **[P2] Optimisation Canvas** : Mettre en cache les dimensions du canvas et découpler le reflow synchrone dans `drawPianoRoll()`.
4. **[P3] Harmonisation Visuelle** : Remplacer le gradient text du logo par une couleur dorée unie très premium et simplifier l'utilisation du glassmorphism.

---

> **Note d'exécution** : Vous pouvez me demander de corriger ces éléments étape par étape.
> Une fois les corrections appliquées, nous pourrons relancer l'audit pour valider l'amélioration de votre score !
