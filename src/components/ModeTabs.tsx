/**
 * Sélecteur de mode de révision.
 * Reçoit la liste des modes réellement disponibles : le mode Prononciation en est
 * absent quand le navigateur n'expose pas la reconnaissance vocale, ce qui évite
 * d'annoncer une fonction qui échouerait.
 */
import { MODES } from '../data/cards';
import type { ModeId } from '../data/types';

interface ModeTabsProps {
  modes: ModeId[]; // modes affichables, dans l'ordre
  current: ModeId; // mode actif
  onSelect: (mode: ModeId) => void;
}

/**
 * Affiche une rangée de boutons de mode.
 * @param modes modes affichables
 * @param current mode actif, mis en évidence et annoncé par `aria-pressed`
 * @param onSelect appelé au choix d'un mode
 */
export function ModeTabs({ modes, current, onSelect }: ModeTabsProps) {
  return (
    <div className="my-4 flex gap-1.5" role="group" aria-label="Mode de révision">
      {modes.map((mode) => {
        const active = mode === current;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(mode)}
            className={`min-h-11 flex-1 rounded-[10px] border px-1 py-2.5 text-[13px] transition-colors ${
              active
                ? 'border-paper bg-paper font-semibold text-ink'
                : 'border-line bg-transparent text-dim hover:text-paper'
            }`}
          >
            {MODES[mode]}
          </button>
        );
      })}
    </div>
  );
}
