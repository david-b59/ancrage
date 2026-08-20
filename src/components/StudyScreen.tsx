/**
 * Écran de révision : en-tête de progression, carte, notation, sortie du paquet.
 * Il choisit la face à afficher selon le mode et l'état retourné, mais ne décide
 * de rien : la file, l'avancement et la notation appartiennent à `App`.
 *
 * La colonne reste centrée aux trois paliers — 600 px au téléphone, 720 px à la
 * tablette, 760 px à l'ordinateur. La carte ne s'étale pas sur toute la largeur
 * disponible : au-delà, une phrase de six mots se perdrait dans le vide.
 */
import type { Card, ModeId } from '../data/types';
import type { RecognitionStatus } from '../hooks/useSpeech';
import type { PronunciationScore } from '../lib/speech';
import type { Grade } from '../lib/srs';
import { CardTools } from './CardTools';
import { FlashCard } from './FlashCard';
import { GradeBar } from './GradeBar';
import { SpeakerIcon } from './Icons';
import { PronounceStage } from './PronounceStage';
import { ShortcutHints } from './ShortcutHints';

interface StudyScreenProps {
  deckName: string; // nom du paquet en cours
  card: Card; // carte affichée
  index: number; // position dans la file, à partir de 0
  total: number; // taille de la file
  mode: ModeId; // mode de révision
  flipped: boolean; // la réponse est-elle visible ? toujours `false` en Prononciation
  showGrades: boolean; // la notation est-elle ouverte ? calculée par `App`, qui la partage avec les raccourcis
  showShortcuts: boolean; // vrai au palier « ordinateur », où le clavier est branché
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
  showGrades,
  showShortcuts,
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

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col md:max-w-[720px] lg:max-w-[760px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] text-dim uppercase md:text-xs">
          {deckName}
        </span>
        <span className="font-mono text-[11px] tracking-[0.18em] text-dim uppercase md:text-xs">
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
              className="pointer-events-auto grid h-24 w-24 animate-listening place-items-center rounded-full bg-ink text-paper md:h-28 md:w-28"
            >
              <SpeakerIcon className="h-8 w-8 md:h-9 md:w-9" />
            </button>
          ) : mode === 'fr_en' ? (
            <p className="text-[25px] leading-tight font-semibold md:text-[29px]">{card.fr}</p>
          ) : (
            <p className="font-mono text-[21px] leading-tight font-medium md:text-[24px]">{card.en}</p>
          )}
        </FlashCard>

        {showGrades && <GradeBar delays={delays} suggested={suggested} onGrade={onGrade} />}
        {showShortcuts && <ShortcutHints showFlip={!isPronounce} />}
      </div>

      <button
        type="button"
        onClick={onQuit}
        className="mx-auto block min-h-11 py-3.5 text-[13px] text-dim underline"
      >
        Quitter le paquet
      </button>
    </div>
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
        <p className="text-[23px] leading-tight font-semibold md:text-[27px]">{card.fr}</p>
      ) : (
        <>
          <p className="font-mono text-[21px] leading-tight font-medium md:text-[24px]">{card.en}</p>
          {mode === 'listen' && <p className="mt-2 text-base text-ink-soft md:text-lg">{card.fr}</p>}
        </>
      )}
      <p className="mt-4 max-w-[36ch] border-t border-rule pt-3.5 text-sm leading-relaxed text-ink-soft italic md:text-[15px]">
        {card.ex}
      </p>
      <CardTools youglishText={card.en} onSpeak={onSpeak} onSlow={onSlow} />
    </>
  );
}
