/**
 * Tests de persistance.
 * Le point sensible du projet : ce qui est relu doit être validé, et une donnée
 * abîmée ne doit jamais faire disparaître la progression sans laisser de trace.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  BACKUP_KEY,
  DEFAULT_RATE,
  LEGACY_KEYS,
  STORAGE_KEY,
  exportProgress,
  importProgress,
  loadProgress,
  newProgress,
  readRaw,
  saveProgress,
  validateProgress,
  type Progress,
} from './storage';
import { INITIAL_EASE, MAX_EASE, MIN_EASE } from './srs';

beforeEach(() => {
  localStorage.clear();
});

describe('clé de stockage', () => {
  it('vaut exactement « ancrage.progress »', () => {
    // Ce test est un garde-fou : la clé relie l'utilisateur à des mois de
    // révisions, la changer remettrait tous les compteurs à zéro.
    expect(STORAGE_KEY).toBe('ancrage.progress');
  });

  it('conserve la liste des clés héritées de la version en un seul fichier', () => {
    expect(LEGACY_KEYS).toEqual(['ancrage_v3', 'eng_tech_v2', 'eng_tech_lot1_v1']);
  });
});

describe('readRaw', () => {
  it('renvoie null quand rien n’a jamais été enregistré', () => {
    expect(readRaw()).toBeNull();
  });

  it('lit la clé courante en priorité', () => {
    localStorage.setItem(STORAGE_KEY, '{"day":7}');
    localStorage.setItem('ancrage_v3', '{"day":99}');
    expect(readRaw()).toBe('{"day":7}');
  });

  it('reprend une clé héritée quand la clé courante est vide', () => {
    localStorage.setItem('eng_tech_v2', '{"day":42}');
    expect(readRaw()).toBe('{"day":42}');
  });
});

describe('validateProgress', () => {
  it('refuse ce qui n’est pas un objet', () => {
    expect(validateProgress(null)).toBeNull();
    expect(validateProgress('texte')).toBeNull();
    expect(validateProgress([1, 2])).toBeNull();
  });

  it('complète les champs absents par leurs valeurs par défaut', () => {
    expect(validateProgress({})).toEqual(newProgress());
  });

  it('relit telle quelle une progression de la version d’origine', () => {
    const legacy = {
      cards: { 'm|Any blockers?': { reps: 3, ease: 2.35, iv: 9, due: 1_800_000_000_000, arch: false } },
      mode: 'en_fr',
      lastDay: 1_700_000_000_000,
      day: 61,
      voice: 'Google US English',
      rate: 0.92,
    };
    expect(validateProgress(legacy)).toEqual(legacy);
  });

  it('écarte les entrées de carte abîmées sans toucher aux autres', () => {
    const parsed = validateProgress({
      cards: {
        bonne: { reps: 2, ease: 2.4, iv: 5, due: 1_000, arch: false },
        sansIntervalle: { reps: 2, ease: 2.4, due: 1_000 },
        nulle: null,
        texte: 'cassé',
      },
    });
    expect(Object.keys(parsed?.cards ?? {})).toEqual(['bonne']);
  });

  it('ramène un facteur de facilité hors bornes dans la plage utile', () => {
    const parsed = validateProgress({
      cards: {
        trop: { reps: 1, ease: 9, iv: 5, due: 0, arch: false },
        pasAssez: { reps: 1, ease: 0.1, iv: 5, due: 0, arch: false },
        absurde: { reps: 1, ease: Number.NaN, iv: 5, due: 0, arch: false },
      },
    });
    expect(parsed?.cards.trop?.ease).toBe(MAX_EASE);
    expect(parsed?.cards.pasAssez?.ease).toBe(MIN_EASE);
    expect(parsed?.cards.absurde?.ease).toBe(INITIAL_EASE);
  });

  it('ignore un mode inconnu', () => {
    expect(validateProgress({ mode: 'telepathie' })?.mode).toBe('fr_en');
    expect(validateProgress({ mode: 'pronounce' })?.mode).toBe('pronounce');
  });

  it('borne une vitesse de lecture aberrante', () => {
    expect(validateProgress({ rate: 12 })?.rate).toBe(2);
    expect(validateProgress({ rate: 0 })?.rate).toBe(0.5);
    expect(validateProgress({})?.rate).toBe(DEFAULT_RATE);
  });
});

describe('loadProgress', () => {
  it('part d’un état neuf au premier lancement', () => {
    expect(loadProgress()).toEqual(newProgress());
  });

  it('conserve la donnée brute et repart à neuf quand le JSON est tronqué', () => {
    localStorage.setItem(STORAGE_KEY, '{"cards":{"m|a":{"iv":3');
    expect(loadProgress()).toEqual(newProgress());
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{"cards":{"m|a":{"iv":3');
  });

  it('conserve la donnée brute quand le contenu n’est pas une progression', () => {
    localStorage.setItem(STORAGE_KEY, '"bonjour"');
    expect(loadProgress()).toEqual(newProgress());
    expect(localStorage.getItem(BACKUP_KEY)).toBe('"bonjour"');
  });

  it('n’écrase pas une sauvegarde de secours antérieure', () => {
    localStorage.setItem(BACKUP_KEY, 'première corruption');
    localStorage.setItem(STORAGE_KEY, 'seconde corruption');
    loadProgress();
    expect(localStorage.getItem(BACKUP_KEY)).toBe('première corruption');
  });
});

describe('aller-retour', () => {
  it('relit à l’identique ce qui a été écrit', () => {
    const progress: Progress = {
      cards: { 'm|Any blockers?': { reps: 4, ease: 2.6, iv: 21, due: 1_800_000_000_000, arch: false } },
      mode: 'listen',
      lastDay: 1_800_000_000_000,
      day: 12,
      voice: 'Samantha',
      rate: 0.92,
    };
    expect(saveProgress(progress)).toBe(true);
    expect(loadProgress()).toEqual(progress);
  });

  it('exporte puis réimporte sans perte', () => {
    const progress = newProgress();
    progress.cards['t|a query'] = { reps: 2, ease: 2.4, iv: 6, due: 1_700_000_000_000, arch: false };
    progress.day = 30;
    expect(importProgress(exportProgress(progress))).toEqual(progress);
  });

  it('refuse un texte collé qui n’est pas une sauvegarde', () => {
    expect(importProgress('ceci n’est pas du JSON')).toBeNull();
    expect(importProgress('[]')).toBeNull();
  });
});
