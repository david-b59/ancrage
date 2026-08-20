/**
 * Les trois boutons de notation, en bas de l'écran de révision.
 * Chacun annonce le délai qu'il déclenche, calculé par le moteur : le libellé est
 * donc exactement ce qui se produira. Placés dans la moitié basse de l'écran, à
 * portée du pouce.
 */
import { AGAIN, GOOD, HARD, type Grade } from '../lib/srs';

interface GradeBarProps {
  /** Libellés de délai, dans l'ordre « À revoir », « Difficile », « Je savais ». */
  delays: [string, string, string];
  /** Note mise en avant par le mode Prononciation. L'utilisateur garde le dernier
   *  mot : la suggestion se voit, elle ne présélectionne rien. */
  suggested?: Grade | null;
  onGrade: (grade: Grade) => void;
}

/** Description statique des trois boutons. */
const BUTTONS: { grade: Grade; label: string; className: string }[] = [
  { grade: AGAIN, label: 'À revoir', className: 'bg-brick text-white' },
  { grade: HARD, label: 'Difficile', className: 'bg-amber text-ink' },
  { grade: GOOD, label: 'Je savais', className: 'bg-mint text-ink' },
];

/**
 * Affiche la barre de notation.
 * @param delays les trois délais à annoncer
 * @param suggested note suggérée, mise en relief par un liseré
 * @param onGrade appelé avec la note choisie
 */
export function GradeBar({ delays, suggested = null, onGrade }: GradeBarProps) {
  return (
    <div className="mt-4 flex gap-2.5">
      {BUTTONS.map((b, i) => (
        <button
          key={b.grade}
          type="button"
          onClick={() => onGrade(b.grade)}
          className={`flex min-h-14 flex-1 flex-col items-center gap-0.5 rounded-[13px] px-1.5 py-4 text-sm font-semibold active:translate-y-px ${b.className} ${
            suggested === b.grade ? 'ring-2 ring-paper ring-offset-2 ring-offset-bg' : ''
          }`}
        >
          {b.label}
          <small className="font-mono text-[10px] font-medium opacity-65">{delays[i] ?? ''}</small>
        </button>
      ))}
    </div>
  );
}
