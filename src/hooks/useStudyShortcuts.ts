/**
 * Raccourcis clavier de l'écran de révision, réservés aux grands écrans.
 * Sur téléphone et tablette il n'y a pas de clavier physique, et les capturer
 * gênerait le clavier virtuel ; ils ne sont donc branchés qu'au-delà du palier
 * « ordinateur », là où l'aide qui les annonce est visible.
 */
import { useEffect } from 'react';
import { AGAIN, GOOD, HARD, type Grade } from '../lib/srs';

/** Ce que le hook doit savoir pour décider quoi déclencher. */
export interface StudyShortcutsOptions {
  enabled: boolean; // faux hors session et sous 1024 px
  canFlip: boolean; // la carte peut-elle être retournée maintenant ?
  canGrade: boolean; // les boutons de notation sont-ils affichés ?
  onFlip: () => void;
  onGrade: (grade: Grade) => void;
  onQuit: () => void;
}

/** Touche chiffre vers note, dans l'ordre des boutons à l'écran. */
const DIGIT_TO_GRADE: Record<string, Grade> = { '1': AGAIN, '2': HARD, '3': GOOD };

/**
 * Le focus est-il dans une zone où l'utilisateur saisit du texte ?
 * Le champ de restauration de sauvegarde contient du JSON : y taper « 1 » ne doit
 * jamais noter une carte, et Espace doit y insérer une espace.
 * @param target cible de l'événement clavier
 */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return /^(input|textarea|select)$/i.test(target.tagName);
}

/**
 * Branche Espace (retourner), 1 / 2 / 3 (noter) et Échap (quitter le paquet).
 * @param options état courant de la session et actions à déclencher
 */
export function useStudyShortcuts({
  enabled,
  canFlip,
  canGrade,
  onFlip,
  onGrade,
  onQuit,
}: StudyShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Les combinaisons appartiennent au navigateur : Ctrl+1 change d'onglet,
      // et le lui reprendre serait une mauvaise surprise.
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      if (isEditable(event.target)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onQuit();
        return;
      }

      if (event.key === ' ' || event.key === 'Spacebar') {
        if (!canFlip) return;
        // Sans `preventDefault`, Espace fait défiler la page et, si un bouton a le
        // focus, l'active au relâchement : la carte serait retournée deux fois.
        event.preventDefault();
        onFlip();
        return;
      }

      const grade = DIGIT_TO_GRADE[event.key];
      if (grade !== undefined && canGrade) {
        event.preventDefault();
        onGrade(grade);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, canFlip, canGrade, onFlip, onGrade, onQuit]);
}
