/**
 * Hooks vocaux : `useSpeech` pour la synthèse (liste des voix, lecture, lecture
 * ralentie), `useRecognition` pour le micro du mode Prononciation.
 * Ils enveloppent les fonctions de `lib/speech.ts` et gèrent le cycle de vie des
 * API du navigateur — abonnement à `voiceschanged`, arrêt du micro au démontage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SLOW_RATE,
  cancelSpeech,
  getSpeechRecognition,
  listEnglishVoices,
  pickVoice,
  speak,
  type SpeechRecognitionLike,
  type SpeechRecognitionResultLike,
} from '../lib/speech';

/** Ce que `useSpeech` rend à l'application. */
export interface UseSpeech {
  voices: SpeechSynthesisVoice[]; // voix anglaises détectées, pour le sélecteur
  voice: SpeechSynthesisVoice | null; // voix effectivement utilisée
  say: (text: string) => void; // lecture à la vitesse enregistrée
  saySlow: (text: string) => void; // lecture ralentie
  stop: () => void; // coupe la lecture en cours
}

/**
 * Expose la synthèse vocale du navigateur.
 * @param preferredUri `voiceURI` mémorisé dans la progression, ou `null`
 * @param rate vitesse de lecture enregistrée
 * @returns les voix disponibles et les commandes de lecture
 */
export function useSpeech(preferredUri: string | null, rate: number): UseSpeech {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => listEnglishVoices());

  // Les voix arrivent de façon asynchrone : au premier rendu la liste est
  // souvent vide, et le navigateur émet `voiceschanged` une fois qu'elle est prête.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const refresh = () => setVoices(listEnglishVoices());
    refresh();
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh);
  }, []);

  const voice = useMemo(() => pickVoice(voices, preferredUri), [voices, preferredUri]);

  const say = useCallback((text: string) => speak(text, voice, rate), [voice, rate]);
  const saySlow = useCallback((text: string) => speak(text, voice, SLOW_RATE), [voice]);

  // Une lecture qui continue après la fermeture de l'onglet de révision est
  // désagréable et déroutante : on coupe au démontage.
  useEffect(() => cancelSpeech, []);

  return { voices, voice, say, saySlow, stop: cancelSpeech };
}

/** État du micro dans le mode Prononciation. */
export type RecognitionStatus = 'idle' | 'listening' | 'error';

/** Ce que `useRecognition` rend à l'application. */
export interface UseRecognition {
  supported: boolean; // `false` si l'API est absente : le mode ne doit pas s'afficher
  status: RecognitionStatus; // état courant du micro
  transcript: string; // dernière transcription obtenue, chaîne vide si aucune
  start: () => void; // démarre l'écoute et vide la transcription précédente
  stop: () => void; // arrête l'écoute en cours
  reset: () => void; // remet à zéro pour la carte suivante
}

/**
 * Enveloppe `SpeechRecognition`.
 * L'objet de reconnaissance est recréé à chaque écoute : sur Chrome Android, un
 * même objet réutilisé après un `stop()` refuse souvent de redémarrer.
 * @returns l'état du micro et les commandes d'écoute ; `supported` à `false`
 *          quand le navigateur n'expose pas l'API, sans erreur affichée
 */
export function useRecognition(): UseRecognition {
  const ctor = useMemo(() => getSpeechRecognition(), []);
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* déjà arrêtée */
    }
  }, []);

  const start = useCallback(() => {
    if (!ctor) return;
    try {
      recognitionRef.current?.abort();
    } catch {
      /* rien en cours */
    }
    setTranscript('');
    try {
      const recognition = new ctor();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      // Une seule alternative : les suivantes sont des variantes de moins en
      // moins probables, les retenir gonflerait artificiellement le score.
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionResultLike) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          const alternative = event.results[i]?.[0];
          if (alternative) text += ` ${alternative.transcript}`;
        }
        setTranscript(text.trim());
      };
      // Micro refusé, silence, ou réseau absent : on retombe sur un état lisible,
      // l'écran affiche une invitation à réessayer, jamais un message technique.
      recognition.onerror = () => setStatus('error');
      recognition.onend = () => setStatus((s) => (s === 'error' ? s : 'idle'));

      recognitionRef.current = recognition;
      recognition.start();
      setStatus('listening');
    } catch {
      setStatus('error');
    }
  }, [ctor]);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setStatus('idle');
  }, [stop]);

  // Le micro reste allumé tant que la reconnaissance n'est pas interrompue :
  // on l'abandonne explicitement quand l'écran disparaît.
  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* rien en cours */
      }
    },
    [],
  );

  return { supported: ctor !== null, status, transcript, start, stop, reset };
}
