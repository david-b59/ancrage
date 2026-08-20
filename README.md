# Ancrage

Application de révision par répétition espacée, sans compte, sans serveur, sans base de
données. Elle fonctionne hors ligne et garde la progression dans le navigateur, sur
l'appareil. Aucune donnée ne part ailleurs.

Première série de cartes : anglais professionnel pour la tech (réunions, vocabulaire data,
formes réduites à l'oral).

## Utiliser

Ouvrir l'adresse publiée, puis « Ajouter à l'écran d'accueil » depuis le menu du navigateur.
L'application s'installe comme une application native et se lance sans réseau.

## Fonctionnement

**Quatre modes de révision**

- FR → EN : produire l'anglais à partir du français
- EN → FR : reconnaître l'anglais
- Écoute : entendre d'abord, deviner ensuite
- Prononciation : dire la phrase, mesurer ce qui a été compris

**Ordonnancement (SM-2)**
Chaque carte porte un facteur de facilité (2,5 au départ, entre 1,3 et 2,8) et un intervalle.

| Réponse   | Effet                                     |
| --------- | ----------------------------------------- |
| À revoir  | retour à 1 jour, facilité −0,20           |
| Difficile | intervalle ×1,2, facilité −0,15           |
| Je savais | 1 j, puis 3 j, puis intervalle × facilité |

Chaque bouton affiche le délai qu'il déclenche. Une carte qui atteint 365 jours d'intervalle
est archivée : elle sort du cycle sans être supprimée, et se réactive d'un bouton depuis
l'accueil. Une session compte au plus quinze cartes, tirées au hasard parmi les cartes dues.

**Audio**
Synthèse vocale du navigateur (Web Speech API), voix sélectionnable et mémorisée, lecture
ralentie. Un lien Youglish ouvre la même expression prononcée par de vrais locuteurs — c'est
le seul accès réseau de l'application, et il s'ouvre dans un onglet séparé.

**Mode Prononciation**
Construit sur `SpeechRecognition`, préfixé `webkit` sur Chrome Android. La phrase anglaise
s'affiche, le micro écoute, la transcription est comparée mot à mot après normalisation
(minuscules, ponctuation retirée, contractions dépliées : `gonna` → `going to`, `I'm` →
`I am`). Chaque mot reconnu s'affiche en vert, les autres en rouge, et le score est la part
de mots retrouvés.

Ce score mesure l'intelligibilité, pas l'accent : l'objectif est d'être compris, pas de
sonner américain. Au-dessus de 80 %, « Je savais » est suggéré ; en dessous, « À revoir ».
La suggestion se voit, elle ne décide pas — la note reste celle de l'utilisateur.

Sur un navigateur sans reconnaissance vocale (Firefox, iOS), le mode n'apparaît pas dans la
liste. Aucune erreur n'est affichée.

**Sauvegarde**
Un bouton copie la progression au format JSON dans le presse-papiers, un champ permet de la
recoller. Le remplacement demande une confirmation explicite.

## Mise en page

Trois paliers, le téléphone en premier — c'est là que la révision a lieu.

| Largeur       | Mise en page                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| < 768 px      | colonne unique de 600 px, cibles tactiles d'au moins 44 px, actions dans la moitié basse                          |
| 768 – 1023 px | colonne unique élargie à 720 px, typographie et cartes un cran plus grandes                                       |
| ≥ 1024 px     | deux colonnes dans 1280 px centrés : à gauche titre, progression, modes et paquets ; à droite légende et réglages |

En session de révision, la colonne reste centrée et plafonnée à 760 px quelle que soit la
largeur de l'écran : la carte doit dominer, pas s'étirer jusqu'aux bords.

**Raccourcis clavier**, au-delà de 1024 px uniquement, rappelés sous la carte :

| Touche      | Effet                            |
| ----------- | -------------------------------- |
| `Espace`    | retourne la carte                |
| `1` `2` `3` | À revoir / Difficile / Je savais |
| `Échap`     | quitte le paquet                 |

Ils ne se déclenchent jamais quand le focus est dans un champ de saisie — taper « 1 » dans le
champ de restauration de sauvegarde ne doit pas noter une carte — ni en combinaison avec
Ctrl, Alt ou Cmd, qui appartiennent au navigateur.

## Développer

```bash
npm install
npm run dev        # serveur de développement
npm run lint       # ESLint
npm run typecheck  # TypeScript, mode strict
npm run test       # Vitest
npm run build      # production, sortie dans dist/
```

Vite + React + TypeScript strict, Tailwind CSS. Aucune bibliothèque de répétition espacée :
le moteur est écrit à la main dans `src/lib/srs.ts`, et c'est une fonction pure — elle reçoit
l'état d'une carte et une note, elle renvoie le nouvel état, sans toucher au stockage.

```
src/
  data/          cartes et paquets, typés
  lib/           srs.ts (moteur), speech.ts (voix), storage.ts (persistance)
  components/    composants de présentation
  hooks/         useProgress, useSpeech, useMediaQuery, useStudyShortcuts
  App.tsx
```

Les paliers de mise en page sont écrits en classes Tailwind (`md:`, `lg:`), qui s'appliquent
sans JavaScript dès le premier rendu. `useMediaQuery` ne sert qu'à conditionner un
comportement — le branchement du clavier — jamais une mise en forme.

Les cartes sont dans `src/data/cards.ts` :

```ts
{ d: 'm', en: 'Any blockers?', fr: 'Des points bloquants ?', ex: 'Quick round: any blockers on your side?' }
```

`d` désigne le paquet, défini juste au-dessus dans `DECKS`.

La version d'origine, en un seul fichier HTML sans étape de build, est conservée telle quelle
dans [`legacy/index.html`](legacy/index.html). Elle reste la référence en cas de doute sur un
comportement.

Les icônes PWA sont produites par `node scripts/generate-icons.mjs` et versionnées ; à
relancer seulement si le dessin change.

### Règles à ne pas enfreindre

**La clé de stockage.** La constante `STORAGE_KEY` vaut `ancrage.progress` et **ne doit jamais
changer**, ni recevoir de suffixe de version. Le navigateur range la progression sous cette
clé : la modifier ne migre rien, cela remet tous les compteurs à zéro. Un test l'affirme
explicitement dans `src/lib/storage.test.ts`.

Pour la même raison, l'adresse de publication doit rester stable — le stockage est lié à
l'origine, pas au fichier.

**Les identifiants de carte.** Une carte est identifiée par `paquet|anglais`. Retoucher le
champ `en` d'une carte existante la détache de son historique de révisions. Ajouter des
cartes est sans risque ; en modifier ne l'est pas.

**La forme des données.** La structure enregistrée est validée à la relecture, entrée par
entrée. Une donnée corrompue ne fait pas planter l'application et n'efface rien : elle est
recopiée sous `ancrage.progress.corrupt`, et l'application repart d'un état neuf.

## Secrets

Cette version n'utilise aucune clé d'API et ne contacte aucun serveur. La règle vaut pour la
suite :

- aucun secret dans le code source, jamais, même en commentaire
- les secrets vivent dans les variables d'environnement Netlify, et localement dans un
  `.env.local` exclu par le `.gitignore`
- `.env.example` est versionné, avec les noms des variables et aucune valeur
- tout appel nécessitant une clé passe par une Netlify Function : la clé reste côté serveur
- une variable préfixée `VITE_` se retrouve en clair dans le paquet livré au navigateur —
  jamais de secret derrière ce préfixe

## Intégration continue

`.github/workflows/ci.yml` s'exécute sur push et pull request vers `main` et enchaîne, en
s'arrêtant au premier échec : `npm ci`, `lint`, `typecheck`, `test`, `build`. Au commit, Husky
et lint-staged formatent et lintent les seuls fichiers modifiés. Dependabot surveille les
dépendances chaque semaine, en groupant les montées mineures.

## Publier

Netlify, avec `netlify.toml` déjà configuré : build `npm run build`, dossier publié `dist`.
Chaque `git push` met la page à jour ; l'adresse ne bouge pas, la progression est conservée.

## À venir

- Mode écrit : taper la réponse au lieu de retourner la carte
- Séries de cartes dans d'autres langues

## Licence

MIT — voir [LICENSE](LICENSE).
