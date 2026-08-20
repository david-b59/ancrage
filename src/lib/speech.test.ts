/**
 * Tests de la normalisation et du score de prononciation.
 * Ils fixent la règle du mode Prononciation : ce qui est mesuré est
 * l'intelligibilité — les mots qu'un interlocuteur reconnaîtrait — pas la manière
 * dont le moteur de reconnaissance a choisi d'orthographier ce qu'il a entendu.
 */
import { describe, expect, it } from 'vitest';
import { INTELLIGIBLE_AT, normalizeWords, pickVoice, scorePronunciation, youglishUrl } from './speech';

describe('normalizeWords', () => {
  it('passe en minuscules et retire la ponctuation', () => {
    expect(normalizeWords('Any blockers?')).toEqual(['any', 'blockers']);
  });

  it('déplie les formes réduites du troisième paquet', () => {
    expect(normalizeWords("I'm gonna check that.")).toEqual(['i', 'am', 'going', 'to', 'check', 'that']);
    expect(normalizeWords('Do you wanna join?')).toEqual(['do', 'you', 'want', 'to', 'join']);
    expect(normalizeWords('Lemme check.')).toEqual(['let', 'me', 'check']);
  });

  it('traite les contractions irrégulières avant la règle générale', () => {
    // Sans cette précédence, « can't » deviendrait « ca not ».
    expect(normalizeWords("I can't do it.")).toEqual(['i', 'can', 'not', 'do', 'it']);
    expect(normalizeWords("We won't ship today.")).toEqual(['we', 'will', 'not', 'ship', 'today']);
  });

  it('rapproche deux écritures de la même phrase', () => {
    expect(normalizeWords('I dunno yet.')).toEqual(normalizeWords("I don't know yet"));
    expect(normalizeWords("Let's get started.")).toEqual(normalizeWords('Let us get started'));
    expect(normalizeWords("We've done it, I'll send it.")).toEqual(
      normalizeWords('We have done it, I will send it.'),
    );
  });

  it('accepte les apostrophes typographiques des moteurs de reconnaissance', () => {
    expect(normalizeWords('I’m working on it.')).toEqual(normalizeWords("I'm working on it."));
  });

  it('ne coupe pas un mot qui contient une suite ressemblant à une contraction', () => {
    expect(normalizeWords('modern hardware')).toEqual(['modern', 'hardware']);
  });

  it('renvoie une liste vide pour un texte sans mot', () => {
    expect(normalizeWords('  …  ')).toEqual([]);
  });
});

describe('scorePronunciation', () => {
  it('donne 100 % à une phrase entièrement reconnue', () => {
    const r = scorePronunciation('Can you hear me?', 'can you hear me');
    expect(r.score).toBe(1);
    expect(r.words.every((w) => w.ok)).toBe(true);
  });

  it('marque en échec les seuls mots manquants', () => {
    const r = scorePronunciation('Can you hear me?', 'can you me');
    expect(r.matched).toBe(3);
    expect(r.expected).toBe(4);
    expect(r.score).toBe(0.75);
    expect(r.words.find((w) => !w.ok)?.word).toBe('hear');
  });

  it('ne se laisse pas dérouter par un mot avalé au début', () => {
    // Une comparaison position par position noterait tout le reste faux.
    const r = scorePronunciation("Let's take it offline.", 'take it offline');
    expect(r.matched).toBe(3);
  });

  it('ne valide pas deux mots attendus avec une seule occurrence entendue', () => {
    const r = scorePronunciation('the scope the scope', 'the scope');
    expect(r.matched).toBe(2);
    expect(r.score).toBe(0.5);
  });

  it('ignore la façon dont la contraction a été transcrite', () => {
    expect(scorePronunciation("I'm working on it.", 'I am working on it').score).toBe(1);
    expect(scorePronunciation('I dunno yet.', "I don't know yet").score).toBe(1);
  });

  it('renvoie zéro quand rien n’a été entendu', () => {
    const r = scorePronunciation('Any blockers?', '');
    expect(r.score).toBe(0);
    expect(r.words.every((w) => !w.ok)).toBe(true);
  });

  it('renvoie zéro plutôt qu’une division par zéro sur une phrase vide', () => {
    expect(scorePronunciation('', 'anything').score).toBe(0);
  });

  it('franchit le seuil d’intelligibilité dès quatre mots sur cinq', () => {
    const r = scorePronunciation('I will get back to you', 'I will get back to');
    expect(r.score).toBeGreaterThanOrEqual(INTELLIGIBLE_AT);
  });
});

describe('pickVoice', () => {
  /** Fabrique une voix minimale, suffisante pour la sélection. */
  const voice = (name: string, lang: string): SpeechSynthesisVoice =>
    ({ name, lang, voiceURI: name, default: false, localService: true }) as SpeechSynthesisVoice;

  it('respecte le choix enregistré par l’utilisateur', () => {
    const voices = [voice('Daniel', 'en-GB'), voice('Samantha', 'en-US')];
    expect(pickVoice(voices, 'Daniel')?.name).toBe('Daniel');
  });

  it('préfère une voix américaine de qualité quand rien n’est enregistré', () => {
    const voices = [voice('Daniel', 'en-GB'), voice('Alex', 'en-US'), voice('Google US English', 'en-US')];
    expect(pickVoice(voices, null)?.name).toBe('Google US English');
  });

  it('retombe sur la première voix disponible', () => {
    expect(pickVoice([voice('Daniel', 'en-GB')], 'absente')?.name).toBe('Daniel');
    expect(pickVoice([], null)).toBeNull();
  });
});

describe('youglishUrl', () => {
  it('encode l’expression dans l’adresse', () => {
    expect(youglishUrl('Any blockers?')).toBe('https://youglish.com/pronounce/Any%20blockers%3F/english');
  });
});
