/**
 * Rappel discret des raccourcis clavier, sous la carte.
 * N'apparaît qu'au palier « ordinateur », parce que c'est le seul où les
 * raccourcis sont branchés — annoncer sur téléphone une touche qui n'existe pas
 * serait une promesse en l'air.
 */
import type { ReactNode } from 'react';

interface ShortcutHintsProps {
  /** Faux en mode Prononciation : la carte n'y est jamais retournée. */
  showFlip: boolean;
}

/** Une touche, dessinée comme une touche. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-paper">
      {children}
    </kbd>
  );
}

/**
 * Affiche la liste des raccourcis.
 * @param showFlip inclut ou non le raccourci de retournement
 */
export function ShortcutHints({ showFlip }: ShortcutHintsProps) {
  return (
    <p className="mt-4 hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-dim lg:flex">
      {showFlip && (
        <span className="inline-flex items-center gap-1.5">
          <Key>Espace</Key> retourner
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Key>1</Key>
        <Key>2</Key>
        <Key>3</Key> noter
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Key>Échap</Key> quitter
      </span>
    </p>
  );
}
