/**
 * Moteur de répétition espacée (variante SM-2 de `index.html`).
 * Tout ce fichier est pur : aucune lecture de `localStorage`, aucun effet de bord,
 * aucune horloge implicite — le jour courant est toujours passé en argument.
 * C'est ce qui rend l'ordonnancement testable et rejouable à l'identique.
 */
import type { Card, DeckId } from '../data/types';

/** Un jour en millisecondes. Les échéances sont stockées en millisecondes UTC. */
export const DAY = 86_400_000;

/** Nombre de cartes tirées par session. Repris de `index.html`. */
export const SESSION_SIZE = 15;

/** Intervalle (en jours) à partir duquel une carte sort du cycle.
 *  Un an sans oubli signifie que l'expression est acquise : la revoir ne sert plus
 *  qu'à occuper la session. La carte n'est jamais supprimée, seulement mise de côté. */
export const ARCHIVE_AT = 365;

/** Intervalle (en jours) au-delà duquel une carte est considérée « ancrée ».
 *  Trois semaines : le seuil classique de la mémoire à long terme en SM-2. */
export const MATURE_AT = 21;

/** Facteur de facilité de départ, valeur historique de SM-2. */
export const INITIAL_EASE = 2.5;

/** Plancher du facteur de facilité. En dessous de 1,3 les intervalles cessent de
 *  croître de façon utile : la carte reviendrait presque tous les jours et
 *  saturerait les sessions. SM-2 pose cette borne pour cette raison exacte. */
export const MIN_EASE = 1.3;

/** Plafond du facteur de facilité. Au-delà de 2,8 les intervalles s'allongent plus
 *  vite que la mémoire ne tient, et la carte revient trop tard pour être rattrapée. */
export const MAX_EASE = 2.8;

/** Les trois notations possibles, dans l'ordre des boutons à l'écran.
 *  Les valeurs numériques sont celles de `index.html` — elles ne sont pas stockées,
 *  mais les garder identiques évite toute divergence de lecture du code d'origine. */
export const AGAIN = 0;
export const HARD = 1;
export const GOOD = 2;

/** Note attribuée à une carte : 0 « À revoir », 1 « Difficile », 2 « Je savais ». */
export type Grade = typeof AGAIN | typeof HARD | typeof GOOD;

/** État d'ordonnancement d'une seule carte, tel qu'il est sérialisé dans
 *  `localStorage`. Les noms de champs sont courts et figés depuis `index.html` :
 *  les renommer casserait la lecture des progressions existantes. */
export interface CardState {
  reps: number; // nombre de réussites consécutives ; remis à 0 par « À revoir »
  ease: number; // facteur de facilité, entre MIN_EASE et MAX_EASE
  iv: number; // intervalle courant en jours, plafonné à ARCHIVE_AT
  due: number; // échéance en millisecondes UTC (minuit du jour d'échéance)
  arch: boolean; // vrai quand la carte est sortie du cycle
}

/** Table des états, indexée par identifiant de carte (`paquet|anglais`). */
export type CardStates = Record<string, CardState>;

/**
 * Renvoie l'instant « minuit UTC » du jour d'une date donnée.
 * Le calendrier est calé sur UTC, comme dans `index.html` : un fuseau local ferait
 * changer les échéances d'un utilisateur qui voyage, et donc réviser deux fois.
 * @param date date de référence, par défaut maintenant
 * @returns millisecondes depuis l'époque, à minuit UTC
 */
export function startOfDay(date: Date = new Date()): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Identifiant stable d'une carte dans la progression.
 * Composé du paquet et de la face anglaise : ni l'un ni l'autre ne doit être
 * retouché dans `cards.ts`, sous peine de détacher la carte de son historique.
 * @param card la carte
 * @returns une chaîne de la forme `m|Any blockers?`
 */
export function cardId(card: Card): string {
  return `${card.d}|${card.en}`;
}

/**
 * État par défaut d'une carte jamais révisée.
 * @returns un état neuf, jamais partagé entre deux cartes (nouvel objet à chaque appel)
 */
export function newCardState(): CardState {
  return { reps: 0, ease: INITIAL_EASE, iv: 0, due: 0, arch: false };
}

/**
 * Applique une notation à l'état d'une carte. Cœur du moteur, fonction pure.
 *
 * Règles, identiques à `index.html` :
 * - « À revoir » : retour à 1 jour, série remise à zéro, facilité −0,20
 * - « Difficile » : 1 jour à la première révision, sinon intervalle ×1,2, facilité −0,15
 * - « Je savais » : 1 jour, puis 3 jours, puis intervalle × facilité, facilité +0,05
 *
 * Un intervalle qui atteint ARCHIVE_AT archive la carte ; l'intervalle est alors
 * plafonné à cette valeur pour que l'échéance reste une date plausible.
 *
 * @param previous état actuel de la carte, ou `null` si elle n'a jamais été vue
 * @param grade la note donnée
 * @param today minuit UTC du jour courant, base de calcul de la nouvelle échéance
 * @returns un nouvel état ; l'objet reçu n'est jamais modifié
 */
export function review(previous: CardState | null, grade: Grade, today: number): CardState {
  const s: CardState = previous ? { ...previous } : newCardState();

  if (grade === AGAIN) {
    s.reps = 0;
    s.iv = 1;
    s.ease = Math.max(MIN_EASE, s.ease - 0.2);
  } else if (grade === HARD) {
    s.reps += 1;
    s.ease = Math.max(MIN_EASE, s.ease - 0.15);
    s.iv = s.reps === 1 ? 1 : Math.max(1, Math.round(s.iv * 1.2));
  } else {
    s.reps += 1;
    s.ease = Math.min(MAX_EASE, s.ease + 0.05);
    if (s.reps === 1) s.iv = 1;
    else if (s.reps === 2) s.iv = 3;
    else s.iv = Math.round(s.iv * s.ease);
  }

  s.arch = s.iv >= ARCHIVE_AT;
  s.iv = Math.min(s.iv, ARCHIVE_AT);
  s.due = today + s.iv * DAY;
  return s;
}

/**
 * Met en forme le délai annoncé sur un bouton de notation.
 * @param state état résultant de la notation envisagée
 * @returns « archivée », « N mois » au-delà de deux mois, sinon « N j »
 */
export function formatDelay(state: CardState): string {
  if (state.arch) return 'archivée';
  if (state.iv >= 60) return `${Math.round(state.iv / 30)} mois`;
  return `${state.iv} j`;
}

/**
 * Délai qu'une notation déclencherait, sans rien modifier.
 * Calculé en rejouant `review` : le libellé affiché sur le bouton est donc, par
 * construction, exactement le délai obtenu si l'utilisateur appuie dessus.
 * @param previous état actuel de la carte, ou `null`
 * @param grade la note envisagée
 * @param today minuit UTC du jour courant
 * @returns le libellé prêt à afficher
 */
export function previewDelay(previous: CardState | null, grade: Grade, today: number): string {
  return formatDelay(review(previous, grade, today));
}

/**
 * La carte est-elle sortie du cycle ?
 * @param state état de la carte, ou `null` si jamais vue
 */
export function isArchived(state: CardState | null | undefined): boolean {
  return !!state?.arch;
}

/**
 * La carte est-elle à réviser aujourd'hui ?
 * Une carte jamais vue est due. Une carte archivée ne l'est jamais.
 * @param state état de la carte, ou `null`
 * @param today minuit UTC du jour courant
 */
export function isDue(state: CardState | null | undefined, today: number): boolean {
  if (!state) return true;
  if (state.arch) return false;
  return state.due <= today;
}

/**
 * La carte est-elle « ancrée » ? Une carte archivée compte comme ancrée : elle a
 * dépassé le seuil bien avant de sortir du cycle.
 * @param state état de la carte, ou `null`
 */
export function isMature(state: CardState | null | undefined): boolean {
  return !!state && (state.iv >= MATURE_AT || state.arch);
}

/**
 * Réactive toutes les cartes archivées.
 * Elles reviennent à un intervalle de 30 jours et sont dues immédiatement : les
 * remettre à 1 jour punirait une réussite, les laisser à 365 les ramènerait dans
 * un an — un mois est le compromis retenu par `index.html`.
 * @param cards table des états
 * @param today minuit UTC du jour courant
 * @returns une nouvelle table ; l'originale n'est pas modifiée
 */
export function unarchiveAll(cards: CardStates, today: number): CardStates {
  const next: CardStates = {};
  for (const [key, state] of Object.entries(cards)) {
    next[key] = state.arch ? { ...state, arch: false, iv: 30, due: today } : state;
  }
  return next;
}

/**
 * Construit la file d'une session de révision.
 * Les cartes dues sont prioritaires ; s'il n'y en a aucune, on révise librement
 * dans le paquet (hors archives) plutôt que d'afficher un écran vide.
 * @param allCards catalogue complet
 * @param cards table des états
 * @param deck paquet choisi
 * @param today minuit UTC du jour courant
 * @param shuffle fonction de mélange, injectable pour rendre les tests déterministes
 * @returns au plus SESSION_SIZE cartes ; tableau vide si le paquet est entièrement archivé
 */
export function buildSession(
  allCards: Card[],
  cards: CardStates,
  deck: DeckId,
  today: number,
  shuffle: <T>(items: T[]) => T[] = defaultShuffle,
): Card[] {
  const inDeck = allCards.filter((c) => c.d === deck);
  const due = inDeck.filter((c) => isDue(cards[cardId(c)], today));
  const pool = due.length ? due : inDeck.filter((c) => !isArchived(cards[cardId(c)]));
  return shuffle(pool).slice(0, SESSION_SIZE);
}

/**
 * Mélange de Fisher-Yates. `sort(() => Math.random() - 0.5)`, utilisé dans
 * `index.html`, produit une distribution biaisée : les premières cartes du paquet
 * revenaient plus souvent que les autres.
 * @param items tableau d'entrée, non modifié
 * @returns une copie mélangée
 */
export function defaultShuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/**
 * Nombre de cartes dues aujourd'hui dans un paquet.
 * @param allCards catalogue complet
 * @param cards table des états
 * @param deck paquet visé
 * @param today minuit UTC du jour courant
 */
export function dueCount(allCards: Card[], cards: CardStates, deck: DeckId, today: number): number {
  return allCards.filter((c) => c.d === deck && isDue(cards[cardId(c)], today)).length;
}

/**
 * Part du paquet déjà ancrée, entre 0 et 1. Sert à remplir l'anneau de progression.
 * @param allCards catalogue complet
 * @param cards table des états
 * @param deck paquet visé
 * @returns 0 si le paquet est vide, pour éviter une division par zéro
 */
export function maturePct(allCards: Card[], cards: CardStates, deck: DeckId): number {
  const inDeck = allCards.filter((c) => c.d === deck);
  if (!inDeck.length) return 0;
  return inDeck.filter((c) => isMature(cards[cardId(c)])).length / inDeck.length;
}
