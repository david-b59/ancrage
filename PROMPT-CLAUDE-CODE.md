# Prompt à donner à Claude Code

> Ouvrir VS Code sur le dossier `ancrage`, qui contient déjà `index.html` et `README.md`,
> puis coller le texte ci-dessous dans Claude Code.

---

## Mission

Ce dossier contient une application de révision par répétition espacée écrite dans un seul
fichier HTML. Elle est fonctionnelle et utilisée quotidiennement. Reconstruis-la en React,
sans rien perdre, et ajoute un mode de prononciation.

Lis `index.html` et `README.md` en entier avant d'écrire la moindre ligne. Le README décrit
l'algorithme et les règles du projet. `index.html` est la référence fonctionnelle : en cas de
doute sur un comportement, il fait foi.

## Stack imposée

- Vite + React + TypeScript, mode strict
- Tailwind CSS
- Aucune bibliothèque de répétition espacée : l'algorithme est écrit à la main
- Aucun backend, aucune clé d'API, aucun appel réseau au démarrage
- Déploiement Netlify : build `npm run build`, dossier publié `dist`

## Règles non négociables

**1. La clé de stockage.** La progression est enregistrée dans `localStorage` sous la clé
`ancrage.progress`. Cette chaîne ne doit jamais changer, jamais recevoir de suffixe de
version. Elle est ce qui relie l'utilisateur à des mois de révisions. Reprends aussi la
lecture des clés héritées présentes dans `index.html`.

**2. Compatibilité des données.** La forme de l'objet stocké doit rester lisible telle
quelle. Si tu la fais évoluer, écris une migration qui lit l'ancienne forme sans perte, et
teste-la.

**3. Hors ligne.** L'application doit fonctionner sans réseau, sauf le lien Youglish qui
ouvre un onglet externe. Ajoute un manifeste PWA et un service worker pour l'installation
sur l'écran d'accueil Android.

**4. Responsive.** Conçue pour un téléphone tenu à une main : cibles tactiles d'au moins
44 px, actions principales dans la moitié basse de l'écran. Doit rester correcte sur
tablette et sur ordinateur, largeur de contenu plafonnée.

**5. Accessibilité.** Focus clavier visible, `prefers-reduced-motion` respecté, contrastes
suffisants, boutons réellement étiquetés.

## À reproduire à l'identique

- Trois paquets de cartes, données reprises telles quelles depuis `index.html`
- Trois modes : FR → EN, EN → FR, Écoute
- Ordonnancement SM-2 : facteur de facilité initial 2,5, plancher 1,3, plafond 2,8 ;
  échec → 1 jour et −0,20 ; difficile → intervalle ×1,2 et −0,15 ; réussite → 1 j, 3 j,
  puis intervalle × facilité
- Archivage à 365 jours d'intervalle, sans suppression, réactivable depuis l'accueil
- Sessions de 15 cartes, cartes dues tirées au hasard
- Chaque bouton de notation affiche le délai qu'il déclenche
- Synthèse vocale via l'API Web Speech, sélection de voix persistée, lecture ralentie
- Lien Youglish par carte
- Anneau de progression par paquet, compteur global, compteur de jours

## À ajouter : mode Prononciation

Quatrième mode, construit sur `SpeechRecognition` (préfixé `webkit` sur Chrome Android).

Déroulé : la carte affiche la phrase anglaise. L'utilisateur appuie sur le micro et la
prononce. La transcription est comparée à la phrase cible et un score s'affiche.

- Comparaison mot à mot, après normalisation : minuscules, ponctuation retirée,
  contractions dépliées (`gonna` → `going to`, `I'm` → `I am`)
- Score = mots correctement reconnus / mots attendus, affiché en pourcentage
- Chaque mot est coloré : reconnu en vert, manquant ou différent en rouge
- Le score alimente la notation : au-dessus de 80 % propose « Je savais », en dessous
  propose « À revoir » — l'utilisateur garde le dernier mot
- Si l'API est absente, le mode n'apparaît pas dans la liste ; jamais d'erreur affichée

Formule cette fonctionnalité comme une mesure d'intelligibilité, pas d'accent. Le texte
d'aide doit le dire : l'objectif est d'être compris, pas de sonner américain.

## À ajouter : sauvegarde

Un bouton qui copie la progression au format JSON dans le presse-papiers, un champ pour la
recoller. Confirmation demandée avant tout remplacement.

## Architecture attendue

```
src/
  data/          cartes et paquets, typés
  lib/           srs.ts (moteur), speech.ts (voix), storage.ts (persistance)
  components/    composants de présentation, sans logique métier
  hooks/         useProgress, useSpeech
  App.tsx
```

Le moteur SM-2 est une fonction pure : elle reçoit l'état d'une carte et une note, elle
renvoie le nouvel état. Aucun accès au stockage, aucun effet de bord. Couvre-le de tests
Vitest, y compris le passage à l'archivage et les bornes du facteur de facilité.

## Direction visuelle

Reprends la palette existante, elle est délibérée : fond pétrole profond `#0A1F21`,
surfaces `#12383A`, carte en papier clair `#F7F6F1`, ambre `#F5C542` pour ce qui est dû,
menthe `#7FD1B9` pour ce qui est acquis, brique `#E0705C` pour l'échec. Anglais en
police à chasse fixe, français en police système. La carte de révision est l'objet clair
posé sur un fond sombre : c'est la signature de l'interface, ne la dilue pas.

## Documentation du code

Tout fichier livré est documenté. Cette exigence n'est pas négociable et vaut pour chaque
fichier créé ensuite, sans avoir à être redemandée.

- **En-tête de fichier** : un bloc de commentaire en tête de chaque fichier, qui dit ce que
  le fichier contient et quel rôle il joue dans l'application. Deux à quatre lignes suffisent.
- **Fonctions exportées** : un bloc JSDoc au-dessus de chacune — ce qu'elle fait, ce qu'elle
  reçoit, ce qu'elle renvoie, et le cas limite à connaître s'il y en a un.
- **Types** : chaque champ non évident d'une interface reçoit un commentaire de fin de ligne.
- **Commentaires de raison, pas de paraphrase.** `// incrémente i` n'apporte rien. Explique
  pourquoi 1,3 est le plancher du facteur de facilité, pourquoi la clé de stockage ne doit
  jamais changer, pourquoi la reconnaissance vocale est préfixée sur Chrome.
- Documentation en français, code et noms de variables en anglais.

## Secrets et sécurité

Cette version n'utilise aucune clé d'API. La règle est posée pour la suite du projet.

- Aucun secret dans le code source, jamais, même temporairement, même en commentaire
- Les secrets vivent dans les variables d'environnement Netlify, et localement dans un
  fichier `.env.local` que le `.gitignore` exclut
- Un `.env.example` est versionné, avec les noms des variables et aucune valeur
- Tout appel nécessitant une clé passe par une Netlify Function : la clé reste côté serveur,
  jamais dans le paquet livré au navigateur
- Le `.gitignore` couvre au minimum `node_modules`, `dist`, `.env*` sauf `.env.example`

## Qualité et intégration continue

**Outillage local**

- ESLint et Prettier configurés, une seule source de vérité pour le formatage
- Husky + lint-staged : au commit, formatage et lint sur les fichiers modifiés uniquement
- Scripts npm : `lint`, `typecheck`, `test`, `build`

**GitHub Actions**

Un workflow `.github/workflows/ci.yml` déclenché sur push et pull request vers `main`,
qui enchaîne, dans cet ordre et en échouant au premier problème :

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

Ajoute `.github/dependabot.yml` pour les mises à jour de dépendances, en groupant les
montées de version mineures pour éviter le bruit.

**Robustesse des données**

C'est le point le plus sensible du projet : la progression de l'utilisateur est
irremplaçable, elle n'existe qu'à un seul endroit.

- Valide la structure lue depuis `localStorage` avant de l'utiliser. Une donnée corrompue
  ou tronquée ne doit jamais faire planter l'application ni effacer la progression :
  repli sur un état neuf, en conservant la valeur brute d'origine sous une clé de secours.
- Écris un `ErrorBoundary` React : en cas d'erreur d'affichage, l'écran propose de copier
  la sauvegarde avant toute autre action.
- N'écris dans le stockage qu'après une notation réussie, jamais pendant un rendu.

## À ne pas faire

- Ne remplace pas l'algorithme par une bibliothèque tierce
- N'ajoute ni routeur, ni gestionnaire d'état global, ni base de données : l'application
  tient dans un état local et une clé de stockage
- N'ajoute pas d'écran d'accueil, de tutoriel, de statistiques élaborées, de série de
  jours consécutifs ni de badges — rien qui ne serve la révision
- Ne change pas les libellés en français existants sans raison

## Livraison

Crée un fichier `LICENSE` à la racine : licence MIT, année 2026, au nom de David Bauduin.

Termine par un commit propre, un README mis à jour, et la vérification que
`npm run build` passe. Indique en fin de travail ce qui a changé dans la forme des données
stockées, s'il y a lieu.
