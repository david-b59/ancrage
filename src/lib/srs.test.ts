/**
 * Tests du moteur d'ordonnancement.
 * Couvrent les trois notations, les bornes du facteur de facilité, le passage à
 * l'archivage et la construction d'une session. Le jour courant est toujours
 * passé en argument : aucun test ne dépend de l'heure à laquelle il tourne.
 */
import { describe, expect, it } from 'vitest';
import {
  AGAIN,
  ARCHIVE_AT,
  DAY,
  GOOD,
  HARD,
  INITIAL_EASE,
  MAX_EASE,
  MIN_EASE,
  SESSION_SIZE,
  buildSession,
  cardId,
  dueCount,
  isArchived,
  isDue,
  isMature,
  maturePct,
  newCardState,
  previewDelay,
  review,
  startOfDay,
  unarchiveAll,
  type CardState,
  type CardStates,
  type Grade,
} from './srs';
import type { Card } from '../data/types';

/** Jour de référence arbitraire mais fixe, pour que les échéances soient vérifiables. */
const TODAY = Date.UTC(2026, 0, 15);

/** Rejoue une suite de notations depuis une carte neuve. */
function sequence(grades: Grade[], from: CardState | null = null): CardState {
  return grades.reduce<CardState>((state, g) => review(state, g, TODAY), from ?? newCardState());
}

describe('startOfDay', () => {
  it('ramène une date à minuit UTC', () => {
    expect(startOfDay(new Date(2026, 0, 15, 23, 59))).toBe(Date.UTC(2026, 0, 15));
  });
});

describe('cardId', () => {
  it('combine le paquet et la face anglaise', () => {
    expect(cardId({ d: 'm', en: 'Any blockers?', fr: '', ex: '' })).toBe('m|Any blockers?');
  });
});

describe('review — première révision', () => {
  it('« Je savais » place la carte à 1 jour', () => {
    const s = review(null, GOOD, TODAY);
    expect(s.reps).toBe(1);
    expect(s.iv).toBe(1);
    expect(s.due).toBe(TODAY + DAY);
    expect(s.ease).toBeCloseTo(INITIAL_EASE + 0.05, 5);
  });

  it('« Difficile » place aussi la carte à 1 jour, mais baisse la facilité', () => {
    const s = review(null, HARD, TODAY);
    expect(s.iv).toBe(1);
    expect(s.ease).toBeCloseTo(INITIAL_EASE - 0.15, 5);
  });

  it('« À revoir » place la carte à 1 jour et laisse la série à zéro', () => {
    const s = review(null, AGAIN, TODAY);
    expect(s.reps).toBe(0);
    expect(s.iv).toBe(1);
    expect(s.ease).toBeCloseTo(INITIAL_EASE - 0.2, 5);
  });
});

describe('review — progression des intervalles', () => {
  it('suit 1 jour, 3 jours, puis intervalle × facilité', () => {
    const first = review(null, GOOD, TODAY);
    expect(first.iv).toBe(1);
    const second = review(first, GOOD, TODAY);
    expect(second.iv).toBe(3);
    const third = review(second, GOOD, TODAY);
    // facilité à 2,65 après trois réussites : 3 × 2,65 = 7,95, arrondi à 8
    expect(third.ease).toBeCloseTo(2.65, 5);
    expect(third.iv).toBe(8);
  });

  it('« Difficile » n’allonge l’intervalle que de 20 %', () => {
    const base: CardState = { reps: 3, ease: 2.5, iv: 10, due: 0, arch: false };
    expect(review(base, HARD, TODAY).iv).toBe(12);
  });

  it('« Difficile » ne descend jamais sous 1 jour', () => {
    const base: CardState = { reps: 3, ease: 2.5, iv: 0, due: 0, arch: false };
    expect(review(base, HARD, TODAY).iv).toBe(1);
  });

  it('« À revoir » ramène une carte mûre à 1 jour', () => {
    const base: CardState = { reps: 6, ease: 2.5, iv: 120, due: 0, arch: false };
    const s = review(base, AGAIN, TODAY);
    expect(s.iv).toBe(1);
    expect(s.reps).toBe(0);
    expect(s.due).toBe(TODAY + DAY);
  });
});

describe('review — bornes du facteur de facilité', () => {
  it('ne descend pas sous le plancher, même après dix échecs', () => {
    const s = sequence(Array<Grade>(10).fill(AGAIN));
    expect(s.ease).toBe(MIN_EASE);
  });

  it('ne dépasse pas le plafond, même après vingt réussites', () => {
    const s = sequence(Array<Grade>(20).fill(GOOD));
    expect(s.ease).toBeLessThanOrEqual(MAX_EASE);
    expect(s.ease).toBe(MAX_EASE);
  });

  it('« Difficile » respecte aussi le plancher', () => {
    const base: CardState = { reps: 2, ease: MIN_EASE + 0.05, iv: 5, due: 0, arch: false };
    expect(review(base, HARD, TODAY).ease).toBe(MIN_EASE);
  });
});

describe('review — archivage', () => {
  it('archive la carte dès que l’intervalle atteint un an', () => {
    const base: CardState = { reps: 8, ease: MAX_EASE, iv: 200, due: 0, arch: false };
    const s = review(base, GOOD, TODAY);
    expect(s.arch).toBe(true);
    // 200 × 2,8 = 560 jours, plafonné à 365 pour garder une échéance plausible
    expect(s.iv).toBe(ARCHIVE_AT);
    expect(s.due).toBe(TODAY + ARCHIVE_AT * DAY);
  });

  it('n’archive pas une carte qui reste sous le seuil', () => {
    const base: CardState = { reps: 8, ease: 2.0, iv: 100, due: 0, arch: false };
    expect(review(base, GOOD, TODAY).arch).toBe(false);
  });

  it('désarchive une carte réapprise après « À revoir »', () => {
    const archivedState: CardState = { reps: 8, ease: 2.5, iv: 365, due: 0, arch: true };
    const s = review(archivedState, AGAIN, TODAY);
    expect(s.arch).toBe(false);
    expect(s.iv).toBe(1);
  });

  it('ne modifie pas l’état reçu', () => {
    const base: CardState = { reps: 1, ease: 2.5, iv: 3, due: 42, arch: false };
    review(base, GOOD, TODAY);
    expect(base).toEqual({ reps: 1, ease: 2.5, iv: 3, due: 42, arch: false });
  });
});

describe('previewDelay', () => {
  it('annonce le délai en jours en deçà de deux mois', () => {
    expect(previewDelay(null, GOOD, TODAY)).toBe('1 j');
    expect(previewDelay(review(null, GOOD, TODAY), GOOD, TODAY)).toBe('3 j');
  });

  it('bascule en mois au-delà de 60 jours', () => {
    const base: CardState = { reps: 5, ease: 2.5, iv: 50, due: 0, arch: false };
    // 50 × 2,55 = 127,5 → 128 jours → 4 mois
    expect(previewDelay(base, GOOD, TODAY)).toBe('4 mois');
  });

  it('annonce l’archivage quand la notation y mène', () => {
    const base: CardState = { reps: 8, ease: MAX_EASE, iv: 200, due: 0, arch: false };
    expect(previewDelay(base, GOOD, TODAY)).toBe('archivée');
  });

  it('correspond exactement à ce que la notation produit', () => {
    const base: CardState = { reps: 4, ease: 2.4, iv: 12, due: 0, arch: false };
    const after = review(base, GOOD, TODAY);
    expect(previewDelay(base, GOOD, TODAY)).toBe(`${after.iv} j`);
  });
});

describe('isDue / isMature / isArchived', () => {
  it('considère une carte jamais vue comme due', () => {
    expect(isDue(null, TODAY)).toBe(true);
  });

  it('considère une carte archivée comme jamais due', () => {
    expect(isDue({ reps: 8, ease: 2.5, iv: 365, due: 0, arch: true }, TODAY)).toBe(false);
  });

  it('rend due une carte dont l’échéance est passée ou atteinte', () => {
    expect(isDue({ reps: 1, ease: 2.5, iv: 1, due: TODAY, arch: false }, TODAY)).toBe(true);
    expect(isDue({ reps: 1, ease: 2.5, iv: 1, due: TODAY + DAY, arch: false }, TODAY)).toBe(false);
  });

  it('compte comme ancrée une carte à trois semaines ou archivée', () => {
    expect(isMature({ reps: 4, ease: 2.5, iv: 21, due: 0, arch: false })).toBe(true);
    expect(isMature({ reps: 4, ease: 2.5, iv: 20, due: 0, arch: false })).toBe(false);
    expect(isMature({ reps: 9, ease: 2.5, iv: 365, due: 0, arch: true })).toBe(true);
    expect(isMature(null)).toBe(false);
  });

  it('reconnaît une carte archivée', () => {
    expect(isArchived({ reps: 9, ease: 2.5, iv: 365, due: 0, arch: true })).toBe(true);
    expect(isArchived(undefined)).toBe(false);
  });
});

describe('unarchiveAll', () => {
  it('remet les cartes archivées à 30 jours et les rend dues', () => {
    const cards: CardStates = {
      'm|a': { reps: 9, ease: 2.5, iv: 365, due: TODAY + 365 * DAY, arch: true },
      'm|b': { reps: 2, ease: 2.5, iv: 3, due: TODAY, arch: false },
    };
    const next = unarchiveAll(cards, TODAY);
    expect(next['m|a']).toEqual({ reps: 9, ease: 2.5, iv: 30, due: TODAY, arch: false });
    expect(next['m|b']).toBe(cards['m|b']);
    expect(cards['m|a']?.arch).toBe(true);
  });
});

describe('sélection des cartes', () => {
  const deckCards: Card[] = Array.from({ length: 20 }, (_, i) => ({
    d: 'm',
    en: `card ${i}`,
    fr: '',
    ex: '',
  }));
  const otherDeck: Card[] = [{ d: 't', en: 'other', fr: '', ex: '' }];
  const all = [...deckCards, ...otherDeck];
  /** Mélange neutre : rend l'ordre du tirage prévisible dans les tests. */
  const identity = <T>(items: T[]): T[] => items;

  it('limite la session à quinze cartes', () => {
    expect(buildSession(all, {}, 'm', TODAY, identity)).toHaveLength(SESSION_SIZE);
  });

  it('ne tire que dans le paquet demandé', () => {
    expect(buildSession(all, {}, 'm', TODAY, identity).every((c) => c.d === 'm')).toBe(true);
  });

  it('privilégie les cartes dues', () => {
    const cards: CardStates = {};
    for (const c of deckCards)
      cards[cardId(c)] = { reps: 3, ease: 2.5, iv: 9, due: TODAY + DAY, arch: false };
    const firstCard = deckCards[0] as Card;
    cards[cardId(firstCard)] = { reps: 1, ease: 2.5, iv: 1, due: TODAY, arch: false };
    expect(buildSession(all, cards, 'm', TODAY, identity)).toEqual([firstCard]);
  });

  it('révise librement quand plus rien n’est dû', () => {
    const cards: CardStates = {};
    for (const c of deckCards)
      cards[cardId(c)] = { reps: 3, ease: 2.5, iv: 9, due: TODAY + DAY, arch: false };
    expect(buildSession(all, cards, 'm', TODAY, identity)).toHaveLength(SESSION_SIZE);
  });

  it('laisse les archivées de côté dans la révision libre', () => {
    const cards: CardStates = {};
    for (const c of deckCards) cards[cardId(c)] = { reps: 9, ease: 2.5, iv: 365, due: TODAY, arch: true };
    expect(buildSession(all, cards, 'm', TODAY, identity)).toEqual([]);
  });
});

describe('compteurs d’accueil', () => {
  const cards: Card[] = [
    { d: 'm', en: 'a', fr: '', ex: '' },
    { d: 'm', en: 'b', fr: '', ex: '' },
    { d: 'm', en: 'c', fr: '', ex: '' },
    { d: 'm', en: 'd', fr: '', ex: '' },
  ];

  it('compte les cartes dues du paquet', () => {
    const states: CardStates = {
      'm|a': { reps: 1, ease: 2.5, iv: 1, due: TODAY, arch: false },
      'm|b': { reps: 1, ease: 2.5, iv: 1, due: TODAY + DAY, arch: false },
    };
    // « c » et « d » n'ont jamais été vues : elles sont dues elles aussi.
    expect(dueCount(cards, states, 'm', TODAY)).toBe(3);
  });

  it('mesure la part ancrée du paquet', () => {
    const states: CardStates = {
      'm|a': { reps: 5, ease: 2.5, iv: 30, due: TODAY, arch: false },
      'm|b': { reps: 5, ease: 2.5, iv: 30, due: TODAY, arch: false },
    };
    expect(maturePct(cards, states, 'm')).toBe(0.5);
  });

  it('renvoie zéro pour un paquet vide plutôt qu’une division par zéro', () => {
    expect(maturePct([], {}, 'm')).toBe(0);
  });
});
