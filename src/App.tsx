/**
 * Composition de l'application : elle tient l'état de la session en cours et
 * relie les hooks (progression, voix, micro) aux écrans.
 * Aucun routeur, aucun gestionnaire d'état global — une session vit dans un
 * `useState`, la progression dans une clé de stockage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CARDS, DECKS, MODE_ORDER } from './data/cards';
import type { Card, DeckId, ModeId } from './data/types';
import { useProgress } from './hooks/useProgress';
import { useRecognition, useSpeech } from './hooks/useSpeech';
import { INTELLIGIBLE_AT, scorePronunciation } from './lib/speech';
import { AGAIN, GOOD, HARD, buildSession, cardId, previewDelay, type Grade } from './lib/srs';
import { exportProgress, importProgress } from './lib/storage';
import { DoneScreen } from './components/DoneScreen';
import { HomeScreen } from './components/HomeScreen';
import { StudyScreen } from './components/StudyScreen';

/** État d'une session de révision. `null` signifie « écran d'accueil ». */
interface Session {
  deck: DeckId; // paquet en cours
  queue: Card[]; // cartes tirées pour cette session
  index: number; // position courante ; égale à `queue.length` quand la session est finie
  flipped: boolean; // la réponse est-elle affichée ?
  reviewed: number; // cartes notées, pour le récapitulatif de fin
}

/** Délai avant la lecture automatique en mode Écoute, repris de `index.html` :
 *  assez pour que la carte soit à l'écran quand le son démarre. */
const LISTEN_DELAY_MS = 300;
/** Même chose au passage à la carte suivante, un peu plus court. */
const NEXT_DELAY_MS = 260;

/** Écran principal. */
export default function App() {
  const { progress, today, gradeCard, setMode, setVoice, unarchive, replaceProgress } = useProgress();
  const { voices, voice, say, saySlow, stop } = useSpeech(progress.voice, progress.rate);
  // Déstructuré plutôt que gardé en objet : chaque commande du micro est stable
  // d'un rendu à l'autre, ce que l'objet qui les porte n'est pas.
  const {
    supported: micSupported,
    status: micStatus,
    transcript,
    start: startMic,
    stop: stopMic,
    reset: resetMic,
  } = useRecognition();
  const [session, setSession] = useState<Session | null>(null);

  // Les lectures différées doivent être annulées si l'utilisateur change d'écran
  // avant leur échéance, sinon une phrase part dans le vide.
  const timerRef = useRef<number | null>(null);
  const speakLater = useCallback(
    (text: string, delay: number) => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => say(text), delay);
    },
    [say],
  );
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  // Le mode Prononciation n'apparaît pas si le navigateur n'expose pas la
  // reconnaissance vocale : rien à annoncer, donc rien à afficher, et aucune erreur.
  const availableModes = useMemo(
    () => MODE_ORDER.filter((m) => m !== 'pronounce' || micSupported),
    [micSupported],
  );
  // Une progression enregistrée sur un téléphone compatible peut désigner un mode
  // que ce navigateur-ci ne sait pas rendre : on retombe alors sur FR → EN.
  const mode: ModeId = availableModes.includes(progress.mode) ? progress.mode : 'fr_en';

  const card: Card | null = session ? (session.queue[session.index] ?? null) : null;

  const result = useMemo(
    () => (card && transcript ? scorePronunciation(card.en, transcript) : null),
    [card, transcript],
  );
  const suggested: Grade | null = result ? (result.score >= INTELLIGIBLE_AT ? GOOD : AGAIN) : null;

  const startDeck = useCallback(
    (deck: DeckId) => {
      const queue = buildSession(CARDS, progress.cards, deck, today);
      if (!queue.length) return;
      resetMic();
      setSession({ deck, queue, index: 0, flipped: false, reviewed: 0 });
      const first = queue[0];
      if (mode === 'listen' && first) speakLater(first.en, LISTEN_DELAY_MS);
    },
    [progress.cards, today, mode, resetMic, speakLater],
  );

  const flip = useCallback(() => {
    if (!card) return;
    setSession((s) => (s ? { ...s, flipped: true } : s));
    // En Écoute la phrase vient d'être jouée : la relancer couperait l'écoute en cours.
    if (mode !== 'listen') say(`${card.en}. ${card.ex}`);
  }, [card, mode, say]);

  const grade = useCallback(
    (g: Grade) => {
      if (!card || !session) return;
      gradeCard(card, g);
      resetMic();
      const index = session.index + 1;
      setSession({ ...session, index, flipped: false, reviewed: session.reviewed + 1 });
      const upcoming = session.queue[index];
      if (mode === 'listen' && upcoming) speakLater(upcoming.en, NEXT_DELAY_MS);
    },
    [card, session, gradeCard, mode, resetMic, speakLater],
  );

  const quit = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    stop();
    resetMic();
    setSession(null);
  }, [stop, resetMic]);

  const onImport = useCallback(
    (text: string): boolean => {
      const imported = importProgress(text);
      if (!imported) return false;
      replaceProgress(imported);
      return true;
    },
    [replaceProgress],
  );

  const shell =
    'mx-auto flex min-h-dvh w-full max-w-[600px] flex-col px-[18px] pt-5 pb-[calc(28px+env(safe-area-inset-bottom))]';

  if (!session) {
    return (
      <main className={shell}>
        <HomeScreen
          progress={{ ...progress, mode }}
          today={today}
          modes={availableModes}
          voices={voices}
          currentVoiceUri={voice?.voiceURI ?? null}
          exportText={exportProgress(progress)}
          onSelectMode={setMode}
          onStartDeck={startDeck}
          onSelectVoice={(uri) => {
            setVoice(uri);
            say('Ready when you are.');
          }}
          onUnarchive={unarchive}
          onImport={onImport}
        />
      </main>
    );
  }

  if (!card) {
    return (
      <main className={shell}>
        <DoneScreen reviewed={session.reviewed} onBack={quit} />
      </main>
    );
  }

  const state = progress.cards[cardId(card)] ?? null;

  return (
    <main className={shell}>
      <StudyScreen
        deckName={DECKS[session.deck].name}
        card={card}
        index={session.index}
        total={session.queue.length}
        mode={mode}
        flipped={session.flipped}
        delays={[
          previewDelay(state, AGAIN, today),
          previewDelay(state, HARD, today),
          previewDelay(state, GOOD, today),
        ]}
        suggested={suggested}
        recognition={{
          status: micStatus,
          transcript,
          result,
          onStart: startMic,
          onStop: stopMic,
        }}
        onFlip={flip}
        onGrade={grade}
        onSpeak={() => say(session.flipped ? `${card.en}. ${card.ex}` : card.en)}
        onSlow={() => saySlow(session.flipped ? `${card.en}. ${card.ex}` : card.en)}
        onReplay={() => say(card.en)}
        onQuit={quit}
      />
    </main>
  );
}
