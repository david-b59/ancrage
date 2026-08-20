/**
 * Hook de progression : détient l'unique copie en mémoire de ce qui est persisté,
 * et expose les seules opérations autorisées à la modifier.
 * Toute écriture dans `localStorage` part d'ici, et seulement en réponse à une
 * action de l'utilisateur — jamais pendant un rendu.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card, ModeId } from '../data/types';
import { cardId, review, startOfDay, unarchiveAll, type Grade } from '../lib/srs';
import { loadProgress, saveProgress, type Progress } from '../lib/storage';

/** Ce que le hook rend à l'application. */
export interface UseProgress {
  progress: Progress; // la progression courante, en lecture seule côté composants
  today: number; // minuit UTC du jour courant, figé au montage
  gradeCard: (card: Card, grade: Grade) => void; // note une carte et persiste
  setMode: (mode: ModeId) => void; // change le mode de révision et persiste
  setVoice: (voiceUri: string) => void; // mémorise la voix choisie
  unarchive: () => void; // remet toutes les cartes archivées en circulation
  replaceProgress: (next: Progress) => void; // remplace tout, après import confirmé
}

/**
 * Charge la progression, tient à jour le compteur de jours, et fournit les
 * mutations. La lecture du stockage a lieu une seule fois, à l'initialisation
 * paresseuse de l'état.
 * @returns la progression et les opérations qui la modifient
 */
export function useProgress(): UseProgress {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  // Copie de référence de l'état courant. Elle permet de calculer la nouvelle
  // progression *avant* d'appeler React, donc d'écrire dans le stockage en dehors
  // d'une fonction de mise à jour — que React est libre de rejouer deux fois.
  const progressRef = useRef<Progress>(progress);

  // Le jour courant est figé au montage : le recalculer à chaque rendu ferait
  // basculer l'affichage en plein milieu d'une session ouverte à minuit. Un état
  // sans setter plutôt qu'une ref, parce que cette valeur, elle, sert au rendu.
  const [today] = useState<number>(() => startOfDay());

  /** Applique une mutation, met à jour l'affichage, puis persiste. */
  const update = useCallback((fn: (prev: Progress) => Progress) => {
    const next = fn(progressRef.current);
    if (next === progressRef.current) return;
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);

  // Incrément du compteur de jours, dans un effet et non pendant le rendu.
  // L'opération est idempotente : au second passage, `lastDay` vaut déjà `today`.
  useEffect(() => {
    update((prev) =>
      prev.lastDay === today
        ? prev
        : { ...prev, day: prev.lastDay ? (prev.day || 1) + 1 : 1, lastDay: today },
    );
  }, [update, today]);

  const gradeCard = useCallback(
    (card: Card, grade: Grade) => {
      update((prev) => {
        const key = cardId(card);
        return {
          ...prev,
          cards: { ...prev.cards, [key]: review(prev.cards[key] ?? null, grade, today) },
        };
      });
    },
    [update, today],
  );

  const setMode = useCallback(
    (mode: ModeId) => update((prev) => (prev.mode === mode ? prev : { ...prev, mode })),
    [update],
  );

  const setVoice = useCallback(
    (voiceUri: string) => update((prev) => ({ ...prev, voice: voiceUri })),
    [update],
  );

  const unarchive = useCallback(
    () => update((prev) => ({ ...prev, cards: unarchiveAll(prev.cards, today) })),
    [update, today],
  );

  const replaceProgress = useCallback((next: Progress) => update(() => next), [update]);

  return { progress, today, gradeCard, setMode, setVoice, unarchive, replaceProgress };
}
