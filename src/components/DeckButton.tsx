/**
 * Bouton d'entrée dans un paquet, sur l'accueil.
 * Porte le nom du paquet, son sous-titre et son anneau de progression. Désactivé
 * quand toutes ses cartes sont archivées : il n'y aurait rien à réviser.
 */
import type { Deck } from '../data/types';
import { ProgressRing } from './ProgressRing';

interface DeckButtonProps {
  deck: Deck; // libellés du paquet
  due: number; // cartes à revoir aujourd'hui
  pct: number; // part ancrée du paquet, entre 0 et 1
  disabled: boolean; // vrai si le paquet est entièrement archivé
  onStart: () => void;
}

/**
 * Affiche un paquet et lance sa session au clic.
 * @param deck libellés du paquet
 * @param due nombre de cartes dues, repris dans le libellé accessible
 * @param pct part ancrée
 * @param disabled paquet entièrement archivé
 * @param onStart appelé pour démarrer la session
 */
export function DeckButton({ deck, due, pct, disabled, onStart }: DeckButtonProps) {
  const label = due > 0 ? `${deck.name}, ${due} carte${due > 1 ? 's' : ''} à revoir` : `${deck.name}, à jour`;

  return (
    <button
      type="button"
      onClick={onStart}
      disabled={disabled}
      aria-label={label}
      className="mb-2.5 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-transform active:scale-[0.985] disabled:opacity-50 disabled:active:scale-100 md:mb-3 md:p-5"
    >
      <span className="min-w-0 flex-1">
        <span className="mb-0.5 block text-base font-semibold md:text-lg">{deck.name}</span>
        <span className="block text-xs text-dim md:text-[13px]">{deck.sub}</span>
      </span>
      <ProgressRing pct={pct} due={due} />
    </button>
  );
}
