/**
 * Écran de fin de session.
 * Volontairement sobre : pas de série de jours, pas de badge, pas de statistique.
 * Une seule invitation — replacer les expressions à l'oral dans la journée.
 */

interface DoneScreenProps {
  reviewed: number; // nombre de cartes revues dans la session
  onBack: () => void;
}

/**
 * Affiche le récapitulatif de fin de paquet.
 * @param reviewed nombre de cartes revues
 * @param onBack retour à l'accueil
 */
export function DoneScreen({ reviewed, onBack }: DoneScreenProps) {
  return (
    <div className="mx-auto my-auto w-full max-w-[600px] p-5 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-mint text-3xl text-ink">
        ✓
      </div>
      <h1 className="mb-1.5 text-2xl font-semibold">Paquet terminé</h1>
      <p className="text-sm leading-relaxed text-dim">
        {reviewed} carte{reviewed > 1 ? 's revues' : ' revue'}.
        <br />
        Va replacer cinq de ces expressions à l'oral aujourd'hui.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mx-auto mt-2 block min-h-11 py-3.5 text-[13px] text-dim underline"
      >
        Retour aux paquets
      </button>
    </div>
  );
}
