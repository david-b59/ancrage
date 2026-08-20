/**
 * Persistance de la progression dans `localStorage`.
 * Contient la clé de stockage, la lecture des clés héritées, la validation
 * défensive de ce qui est relu, et la sérialisation. C'est le seul fichier de
 * l'application autorisé à toucher `localStorage`.
 */
import type { ModeId } from '../data/types';
import { INITIAL_EASE, MAX_EASE, MIN_EASE, type CardState, type CardStates } from './srs';

/**
 * Clé de stockage. NE JAMAIS LA MODIFIER, ni la suffixer d'un numéro de version.
 * Elle est le seul lien entre l'utilisateur et des mois de révisions : la changer
 * ne « migre » rien, cela remet silencieusement tous les compteurs à zéro. Pour la
 * même raison l'adresse de publication doit rester stable, `localStorage` étant
 * lié à l'origine.
 */
export const STORAGE_KEY = 'ancrage.progress';

/** Clés des versions antérieures, relues si la clé courante est vide. Elles ne
 *  sont jamais écrites : la première sauvegarde bascule tout sur STORAGE_KEY. */
export const LEGACY_KEYS = ['ancrage_v3', 'eng_tech_v2', 'eng_tech_lot1_v1'];

/** Clé de secours. Si le contenu relu est illisible, la chaîne brute y est copiée
 *  avant tout repli sur un état neuf : une progression corrompue reste
 *  récupérable à la main, elle n'est jamais écrasée sans trace. */
export const BACKUP_KEY = 'ancrage.progress.corrupt';

/** Modes acceptés à la relecture. Un mode inconnu (version future, valeur bricolée)
 *  est ramené sur `fr_en` au lieu de casser l'affichage. */
const VALID_MODES: ModeId[] = ['fr_en', 'en_fr', 'listen', 'pronounce'];

/** Vitesse de lecture par défaut, reprise de `index.html` : légèrement sous la
 *  vitesse normale, assez pour distinguer les formes réduites. */
export const DEFAULT_RATE = 0.92;

/** La progression complète, telle qu'elle est sérialisée sous STORAGE_KEY.
 *  Cette forme est celle de `index.html` : elle n'a pas changé, une sauvegarde
 *  produite par l'ancienne version est relue telle quelle. */
export interface Progress {
  cards: CardStates; // états d'ordonnancement, indexés par `paquet|anglais`
  mode: ModeId; // dernier mode de révision choisi
  lastDay: number | null; // minuit UTC du dernier jour d'ouverture ; `null` au premier lancement
  day: number; // compteur de jours d'utilisation, affiché sur l'accueil
  voice: string | null; // `voiceURI` de la voix retenue ; `null` = choix automatique
  rate: number; // vitesse de la synthèse vocale
}

/**
 * Progression neuve, utilisée au premier lancement et comme repli.
 * @returns un objet nouvellement alloué, sûr à modifier
 */
export function newProgress(): Progress {
  return { cards: {}, mode: 'fr_en', lastDay: null, day: 1, voice: null, rate: DEFAULT_RATE };
}

/** Un nombre fini et exploitable ? `NaN` et `Infinity` survivent à `typeof`
 *  mais empoisonnent tous les calculs d'échéance en aval. */
function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Valide un état de carte relu du stockage.
 * @param raw valeur brute issue de `JSON.parse`
 * @returns un état sain, ou `null` si l'entrée est inexploitable — l'appelant
 *          la laisse alors de côté sans toucher au reste de la progression
 */
function validateCardState(raw: unknown): CardState | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!isFiniteNumber(o.iv) || !isFiniteNumber(o.due)) return null;

  const ease = isFiniteNumber(o.ease) ? Math.min(MAX_EASE, Math.max(MIN_EASE, o.ease)) : INITIAL_EASE;
  const reps = isFiniteNumber(o.reps) ? Math.max(0, Math.round(o.reps)) : 0;
  return {
    reps,
    ease,
    iv: Math.max(0, Math.round(o.iv)),
    due: o.due,
    arch: o.arch === true,
  };
}

/**
 * Valide une progression relue du stockage.
 * Tolérante par principe : les entrées de carte abîmées sont écartées une à une,
 * les champs manquants reprennent leur valeur par défaut. Seul un contenu qui
 * n'est même pas un objet fait échouer la lecture.
 * @param raw valeur brute issue de `JSON.parse`
 * @returns une progression saine, ou `null` si rien n'est récupérable
 */
export function validateProgress(raw: unknown): Progress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const out = newProgress();

  if (o.cards && typeof o.cards === 'object' && !Array.isArray(o.cards)) {
    for (const [key, value] of Object.entries(o.cards as Record<string, unknown>)) {
      const state = validateCardState(value);
      if (state) out.cards[key] = state;
    }
  }
  if (typeof o.mode === 'string' && (VALID_MODES as string[]).includes(o.mode)) out.mode = o.mode as ModeId;
  if (isFiniteNumber(o.lastDay)) out.lastDay = o.lastDay;
  if (isFiniteNumber(o.day)) out.day = Math.max(1, Math.round(o.day));
  if (typeof o.voice === 'string') out.voice = o.voice;
  // La vitesse est bornée : une valeur hors plage rend la synthèse vocale muette
  // sur certains navigateurs au lieu de lever une erreur visible.
  if (isFiniteNumber(o.rate)) out.rate = Math.min(2, Math.max(0.5, o.rate));
  return out;
}

/** Accès à `localStorage` protégé : en navigation privée ou avec les cookies
 *  tiers bloqués, le simple fait de lire la propriété peut lever. */
function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Lit la chaîne brute de progression, clé courante d'abord, clés héritées ensuite.
 * @returns la chaîne stockée, ou `null` si aucune version n'est présente
 */
export function readRaw(): string | null {
  const ls = safeStorage();
  if (!ls) return null;
  try {
    const current = ls.getItem(STORAGE_KEY);
    if (current) return current;
    for (const key of LEGACY_KEYS) {
      const legacy = ls.getItem(key);
      if (legacy) return legacy; // reprise d'une version antérieure, sans effacer l'ancienne clé
    }
  } catch {
    /* stockage inaccessible : on repart d'un état neuf */
  }
  return null;
}

/**
 * Charge la progression.
 * En cas de contenu illisible ou corrompu, la chaîne brute est recopiée sous
 * BACKUP_KEY et l'application repart d'un état neuf : elle ne plante pas, et la
 * donnée d'origine reste sur l'appareil.
 * @returns la progression relue, ou une progression neuve
 */
export function loadProgress(): Progress {
  const raw = readRaw();
  if (!raw) return newProgress();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    preserveCorrupt(raw);
    return newProgress();
  }

  const valid = validateProgress(parsed);
  if (!valid) {
    preserveCorrupt(raw);
    return newProgress();
  }
  return valid;
}

/**
 * Recopie une progression illisible sous la clé de secours.
 * N'écrase jamais une sauvegarde de secours antérieure : la première corruption
 * est la plus proche de l'original, donc la plus précieuse.
 * @param raw la chaîne brute telle qu'elle a été lue
 */
function preserveCorrupt(raw: string): void {
  const ls = safeStorage();
  if (!ls) return;
  try {
    if (ls.getItem(BACKUP_KEY) === null) ls.setItem(BACKUP_KEY, raw);
  } catch {
    /* quota plein ou stockage refusé : rien de plus à tenter */
  }
}

/**
 * Écrit la progression. Appelée après une notation ou un réglage, jamais pendant
 * un rendu React.
 * @param progress la progression à sérialiser
 * @returns `true` si l'écriture a abouti
 */
export function saveProgress(progress: Progress): boolean {
  const ls = safeStorage();
  if (!ls) return false;
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

/**
 * Sérialise la progression pour l'export manuel (copie dans le presse-papiers).
 * Indentée à deux espaces : le JSON exporté est destiné à être relu par un humain
 * autant qu'à être recollé.
 * @param progress la progression courante
 */
export function exportProgress(progress: Progress): string {
  return JSON.stringify(progress, null, 2);
}

/**
 * Relit une sauvegarde collée par l'utilisateur.
 * @param text le JSON collé
 * @returns la progression validée, ou `null` si le texte n'est pas exploitable —
 *          l'appelant doit alors refuser le remplacement plutôt que d'écraser
 */
export function importProgress(text: string): Progress | null {
  try {
    return validateProgress(JSON.parse(text));
  } catch {
    return null;
  }
}
