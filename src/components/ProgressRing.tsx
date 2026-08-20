/**
 * Anneau de progression d'un paquet.
 * L'arc mesure la part de cartes déjà ancrées ; le chiffre au centre donne le
 * nombre de cartes à revoir aujourd'hui, remplacé par une coche quand il n'y en a
 * plus. Composant purement visuel.
 */

/** Rayon de l'anneau, en unités du repère SVG. */
const RADIUS = 19;
/** Circonférence, base du calcul de `stroke-dashoffset`. */
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  pct: number; // part ancrée du paquet, entre 0 et 1
  due: number; // cartes à revoir aujourd'hui ; 0 affiche une coche
}

/**
 * Dessine l'anneau d'un paquet.
 * @param pct part ancrée, entre 0 et 1 (les valeurs hors bornes sont ramenées)
 * @param due nombre de cartes dues aujourd'hui
 */
export function ProgressRing({ pct, due }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, pct));
  const hasDue = due > 0;

  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={RADIUS} fill="none" stroke="var(--color-line)" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          stroke={hasDue ? 'var(--color-amber)' : 'var(--color-mint)'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        />
      </svg>
      <span
        className={`absolute inset-0 grid place-items-center font-mono text-xs font-bold ${
          hasDue ? 'text-amber' : 'text-mint'
        }`}
      >
        {hasDue ? due : '✓'}
      </span>
    </div>
  );
}
