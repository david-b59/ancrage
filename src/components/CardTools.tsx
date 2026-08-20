/**
 * Rangée d'outils au bas d'une carte : réécouter, écouter lentement, ouvrir
 * Youglish. Le lien Youglish est le seul accès réseau de l'application, et il part
 * dans un onglet séparé — la révision en cours n'est jamais interrompue.
 */
import { youglishUrl } from '../lib/speech';
import { HumanIcon, SlowIcon, SpeakerIcon } from './Icons';

interface CardToolsProps {
  youglishText: string; // expression recherchée sur Youglish (la carte, pas l'exemple)
  onSpeak: () => void; // lecture à la vitesse enregistrée ; le texte lu est choisi par l'appelant
  onSlow: () => void; // lecture ralentie du même texte
}

/** Style commun aux trois pastilles. */
const PILL = 'inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px]';

/**
 * Affiche les trois outils audio d'une carte.
 * @param youglishText expression ouverte sur Youglish
 * @param onSpeak lecture à vitesse normale
 * @param onSlow lecture ralentie
 */
export function CardTools({ youglishText, onSpeak, onSlow }: CardToolsProps) {
  return (
    <div className="pointer-events-auto mt-4 flex flex-wrap justify-center gap-2">
      <button type="button" onClick={onSpeak} className={`${PILL} bg-ink text-paper`}>
        <SpeakerIcon />
        Réécouter
      </button>
      <button type="button" onClick={onSlow} className={`${PILL} border border-[#C9CCC2] text-ink`}>
        <SlowIcon />
        Lent
      </button>
      <a
        href={youglishUrl(youglishText)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${PILL} border border-[#C9CCC2] text-ink`}
      >
        <HumanIcon />
        Voix réelle
      </a>
    </div>
  );
}
