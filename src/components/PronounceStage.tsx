/**
 * Face de carte du mode Prononciation : la phrase anglaise, un bouton micro, et
 * le résultat de la comparaison mot à mot.
 * Ce que l'écran mesure est l'intelligibilité — la part de la phrase qu'un
 * interlocuteur comprendrait. Ce n'est pas une note d'accent, et le texte d'aide
 * le dit explicitement.
 */
import { INTELLIGIBLE_AT, type PronunciationScore } from '../lib/speech';
import type { RecognitionStatus } from '../hooks/useSpeech';
import { MicIcon } from './Icons';

interface PronounceStageProps {
  sentence: string; // la phrase anglaise à prononcer
  status: RecognitionStatus; // état du micro
  transcript: string; // ce que la reconnaissance a entendu
  result: PronunciationScore | null; // résultat de la comparaison, `null` avant tout essai
  onStart: () => void; // démarre l'écoute
  onStop: () => void; // arrête l'écoute en cours
}

/**
 * Affiche la phrase à prononcer et le retour de la reconnaissance vocale.
 * @param props phrase, état du micro et résultat
 */
export function PronounceStage({
  sentence,
  status,
  transcript,
  result,
  onStart,
  onStop,
}: PronounceStageProps) {
  const listening = status === 'listening';
  const pct = result ? Math.round(result.score * 100) : 0;

  return (
    <>
      <p className="font-mono text-[21px] leading-tight font-medium">{sentence}</p>

      {result && (
        <>
          <p className="mt-4 flex items-baseline justify-center gap-2">
            <span
              className={`font-mono text-[28px] font-bold ${
                result.score >= INTELLIGIBLE_AT ? 'text-[#2E7D5B]' : 'text-[#B4432F]'
              }`}
            >
              {pct} %
            </span>
            <span className="text-xs text-ink-soft">
              {result.matched}/{result.expected} mots reconnus
            </span>
          </p>
          <p className="mt-2 flex flex-wrap justify-center gap-x-1.5 gap-y-1 font-mono text-[15px]">
            {result.words.map((w, i) => (
              <span
                key={`${w.word}-${i}`}
                className={w.ok ? 'text-[#2E7D5B]' : 'text-[#B4432F] line-through decoration-1'}
              >
                {w.word}
              </span>
            ))}
          </p>
          {transcript && (
            <p className="mt-3 max-w-[36ch] text-[13px] text-ink-soft italic">Entendu : « {transcript} »</p>
          )}
        </>
      )}

      <button
        type="button"
        onClick={listening ? onStop : onStart}
        aria-label={listening ? "Arrêter l'écoute" : 'Prononcer la phrase'}
        className={`pointer-events-auto mt-5 grid h-16 w-16 place-items-center rounded-full bg-ink text-paper ${
          listening ? 'animate-listening' : ''
        }`}
      >
        <MicIcon className="h-7 w-7" />
      </button>

      <p className="mt-3 max-w-[38ch] text-[12.5px] leading-relaxed text-ink-soft">
        {status === 'error'
          ? "Le micro n'a rien renvoyé. Vérifie l'autorisation du navigateur et réessaie."
          : listening
            ? 'Parle maintenant…'
            : result
              ? 'Recommence autant de fois que tu veux, puis note-toi.'
              : "Appuie et prononce la phrase. On mesure ce qu'un interlocuteur comprendrait, pas ton accent : l'objectif est d'être compris, pas de sonner américain."}
      </p>
    </>
  );
}
