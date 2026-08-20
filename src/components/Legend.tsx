/**
 * Encadré « Comment lire cet écran ».
 * Explique l'anneau et le code couleur des trois notations. Texte figé, repris
 * mot pour mot de `index.html` : ces libellés font partie de l'application.
 */

/** Les trois notations et leur effet, dans l'ordre des boutons de révision. */
const KEYS = [
  { color: 'bg-brick', label: 'À revoir', effect: 'repart à 1 jour' },
  { color: 'bg-amber', label: 'Difficile', effect: 'allonge à peine' },
  { color: 'bg-mint', label: 'Je savais', effect: "l'écart ×2,5" },
];

/** Affiche la légende de l'accueil. */
export function Legend() {
  return (
    <section className="mt-5 rounded-xl border border-edge border-l-4 border-l-amber bg-elevated px-4 py-4">
      <h3 className="mb-2.5 font-mono text-[10.5px] font-semibold tracking-[0.18em] text-amber uppercase">
        Comment lire cet écran
      </h3>
      <p className="mb-2.5 text-[13px] leading-relaxed text-muted">
        Le chiffre dans l'anneau = cartes à revoir aujourd'hui. L'anneau qui se remplit = part du paquet déjà
        ancrée.
      </p>
      <ul className="flex flex-col gap-1.5">
        {KEYS.map((key) => (
          <li key={key.label} className="flex items-center gap-2.5 text-[12.5px] text-muted">
            <span className={`h-3 w-3 shrink-0 rounded ${key.color}`} aria-hidden="true" />
            <span>
              <b className="font-mono text-[11.5px] font-semibold text-paper">{key.label}</b> — {key.effect}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
