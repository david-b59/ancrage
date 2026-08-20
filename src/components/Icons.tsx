/**
 * Les quatre icônes de l'interface, en SVG inline.
 * Inline plutôt qu'en fichiers : elles pèsent quelques centaines d'octets, héritent
 * de la couleur du texte, et l'application doit se charger sans aucune requête.
 * Toutes sont décoratives (`aria-hidden`) — le libellé est porté par le bouton.
 */

/** Propriétés communes : seule la taille varie d'un emploi à l'autre. */
interface IconProps {
  className?: string; // classes Tailwind de dimension et de couleur
}

/** Haut-parleur : lecture de la phrase. */
export function SpeakerIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 2v2a8 8 0 0 1 0 16v2A10 10 0 0 0 14 2z" />
    </svg>
  );
}

/** Horloge : lecture ralentie. */
export function SlowIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v6l5 3 1-1.6-4-2.4V7z" />
    </svg>
  );
}

/** Silhouette : lien vers de vrais locuteurs (Youglish). */
export function HumanIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 5v3h18v-3c0-2.5-4-5-9-5z" />
    </svg>
  );
}

/** Micro : mode Prononciation. */
export function MicIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
    </svg>
  );
}
