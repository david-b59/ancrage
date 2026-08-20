/**
 * La carte elle-même : le rectangle de papier clair posé sur le fond sombre.
 * C'est la signature visuelle de l'application — elle porte le contenu, jamais de
 * logique.
 *
 * Quand la carte est retournable, la zone de retournement est un vrai bouton posé
 * en couverture plutôt qu'un `div` cliquable : il est atteignable au clavier, il
 * est annoncé, et il n'imbrique aucun bouton dans un autre — ce que l'écoute, avec
 * son bouton de réécoute au centre, exigerait sinon.
 */
import type { ReactNode } from 'react';

interface FlashCardProps {
  tag: string; // intitulé en haut à gauche : le mode, ou « Réponse »
  children: ReactNode; // contenu de la face affichée
  onFlip?: (() => void) | undefined; // retourne la carte ; absent quand elle l'est déjà
  flipLabel?: string; // libellé accessible de la zone de retournement
  hint?: string | undefined; // rappel discret en bas de carte
}

/** Surface commune aux deux faces. */
const SHELL =
  'relative flex min-h-[270px] w-full animate-card-in flex-col items-center justify-center rounded-[20px] bg-paper px-5 py-8 text-center text-ink shadow-[0_18px_40px_-22px_#000]';

/**
 * Encadre le contenu d'une face de carte.
 * @param tag intitulé de la face
 * @param children contenu affiché ; les éléments interactifs qu'il contient
 *        doivent porter `pointer-events-auto` pour rester cliquables au-dessus de
 *        la zone de retournement
 * @param onFlip action de retournement, facultative
 * @param flipLabel libellé accessible du retournement
 * @param hint texte d'invite affiché en bas
 */
export function FlashCard({ tag, children, onFlip, flipLabel = 'Voir la réponse', hint }: FlashCardProps) {
  return (
    <div className={SHELL}>
      {onFlip && (
        <button
          type="button"
          onClick={onFlip}
          aria-label={flipLabel}
          className="absolute inset-0 z-0 rounded-[20px]"
        />
      )}
      <span className="absolute top-3.5 left-[18px] font-mono text-[10px] tracking-[0.18em] text-[#7A908D] uppercase">
        {tag}
      </span>
      <div
        className={`relative z-10 flex w-full flex-col items-center ${onFlip ? 'pointer-events-none' : ''}`}
      >
        {children}
      </div>
      {hint && (
        <span className="absolute bottom-3.5 font-mono text-[10.5px] tracking-wide text-[#94A8A5]">
          {hint}
        </span>
      )}
    </div>
  );
}
