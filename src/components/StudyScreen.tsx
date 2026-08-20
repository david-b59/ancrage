/**
 * Écran de révision : en-tête de progression, carte, notation, sortie du paquet.
 * Il choisit la face à afficher selon le mode et l'état retourné, mais ne décide
 * de rien : la file, l'avancement et la notation appartiennent à `App`.
 */
import type { Card } from '../data/types';
import type { ModeId } from '../data/types';
import type { RecognitionStatus } from '../hooks/useSpeech';
import type { PronunciationScore } from '../lib/speech';
import type { Grade } from '../lib/srs';
import { CardTools } from './CardTools';
import { FlashCard } from './FlashCard';
import { GradeBar } from './GradeBar';
import { SpeakerIcon } from './Icons';
import { PronounceStage } from './PronounceStage';

interface StudyScreenProps {
  deckName: string; // nom du paquet en cours
  card: Card; // carte affichée
  index: number; // position dans la file, à partir de 0
  total: number; // taille de la file
  mode: ModeId; // mode de révision
  flipped: boolean; // la réponse est-elle visible ? toujours `false` en Prononciation
  delays: [string, string, string]; // délais annoncés par les trois boutons
  suggested: Grade | null; // note suggérée par le score de prononciation
  recognition: {
    status: RecognitionStatus;
    transcript: string;
    result: PronunciationScore | null;
    onStart: () => void;
    onStop: () => void;
  };
  onFlip: () => void;
  onGrade: (grade: Grade) => void;
  onSpeak: () => void;
  onSlow: () => void;
  onReplay: () => void; // relit la seule phrase de la carte, en mode Écoute
  onQuit: () => void;
}

/** Intitulé affiché en haut de la carte, par mode. */
const TAGS: Record<ModeId, string> = {
  fr_en: 'Français → anglais',
  en_fr: 'Anglais → français',
  listen: 'Écoute',
  pronounce: 'Prononciation',
};

/**
 * Affiche la carte en cours et les commandes de révision.
 * @param props carte, mode, état de la reconnaissance et actions
 */
export function StudyScreen({
  deckName,
  card,
  index,
  total,
  mode,
  flipped,
  delays,
  suggested,
  recognition,
  onFlip,
  onGrade,
  onSpeak,
  onSlow,
  onReplay,
  onQuit,
}: StudyScreenProps) {
  const isPronounce = mode === 'pronounce';
  // En Prononciation, la notation s'ouvre dès le premier essai : la phrase cible
  // est visible d'emblée, il n'y a rien à retourner.
  const showGrades = isPronounce ? recognition.result !== null : flipped;

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] text-dim uppercase">{deckName}</span>
        <span className="font-mono text-[11px] tracking-[0.18em] text-dim uppercase">
          {index + 1} / {total}
        </span>
      </div>
      <div
        className="h-[7px] overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index}
        aria-label="Avancement de la session"
      >
        <i
          className="block h-full rounded-full bg-gradient-to-r from-mint to-amber transition-[width] duration-500"
          style={{ width: `${Math.round((index / total) * 100)}%` }}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <FlashCard
          tag={flipped ? 'Réponse' : TAGS[mode]}
          onFlip={flipped || isPronounce ? undefined : onFlip}
          hint={
            flipped || isPronounce
              ? undefined
              : mode === 'listen'
                ? 'touche la carte pour la réponse'
                : 'touche la carte'
          }
        >
          {flipped ? (
            <AnswerFace card={card} mode={mode} onSpeak={onSpeak} onSlow={onSlow} />
          ) : isPronounce ? (
            <>
              <PronounceStage
                sentence={card.en}
                status={recognition.status}
                transcript={recognition.transcript}
                result={recognition.result}
                onStart={recognition.onStart}
                onStop={recognition.onStop}
              />
              <CardTools youglishText={card.en} onSpeak={onSpeak} onSlow={onSlow} />
            </>
          ) : mode === 'listen' ? (
            <button
              type="button"
              onClick={onReplay}
              aria-label="Réécouter la phrase"
              className="pointer-events-auto grid h-24 w-24 animate-listening place-items-center rounded-full bg-ink text-paper"
            >
              <SpeakerIcon className="h-8 w-8" />
            </button>
          ) : mode === 'fr_en' ? (
            <p className="text-[25px] leading-tight font-semibold">{card.fr}</p>
          ) : (
            <p className="font-mono text-[21px] leading-tight font-medium">{card.en}</p>
          )}
        </FlashCard>

        {showGrades && <GradeBar delays={delays} suggested={suggested} onGrade={onGrade} />}
      </div>

      <button
        type="button"
        onClick={onQuit}
        className="mx-auto block min-h-11 py-3.5 text-[13px] text-dim underline"
      >
        Quitter le paquet
      </button>
    </>
  );
}

/** Face « réponse » : la traduction, l'exemple, et les outils audio. */
function AnswerFace({
  card,
  mode,
  onSpeak,
  onSlow,
}: {
  card: Card;
  mode: ModeId;
  onSpeak: () => void;
  onSlow: () => void;
}) {
  return (
    <>
      {mode === 'en_fr' ? (
        <p className="text-[23px] leading-tight font-semibold">{card.fr}</p>
      ) : (
        <>
          <p className="font-mono text-[21px] leading-tight font-medium">{card.en}</p>
          {mode === 'listen' && <p className="mt-2 text-base text-ink-soft">{card.fr}</p>}
        </>
      )}
      <p className="mt-4 max-w-[36ch] border-t border-rule pt-3.5 text-sm leading-relaxed text-ink-soft italic">
        {card.ex}
      </p>
      <CardTools youglishText={card.en} onSpeak={onSpeak} onSlow={onSlow} />
    </>
  );
}
