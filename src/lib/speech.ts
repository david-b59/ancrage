/**
 * Tout ce qui touche à la voix : synthèse (Web Speech API), reconnaissance
 * (`SpeechRecognition`), et comparaison d'une transcription à la phrase attendue.
 * Les fonctions de normalisation et de score sont pures et testées ; le reste
 * enveloppe des API du navigateur qui peuvent être absentes ou muettes.
 */

/** Vitesse de la lecture ralentie, reprise de `index.html`. */
export const SLOW_RATE = 0.6;

/**
 * Les voix anglaises disponibles.
 * La liste des voix est peuplée de façon asynchrone par le navigateur : au premier
 * appel elle est souvent vide, d'où l'écoute de `voiceschanged` côté hook.
 * @returns les voix dont la langue commence par `en`, dans l'ordre du navigateur
 */
export function listEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  try {
    return (window.speechSynthesis.getVoices() ?? []).filter((v) => /^en([-_]|$)/i.test(v.lang));
  } catch {
    return [];
  }
}

/**
 * Choisit la voix à utiliser.
 * Priorité au choix explicite de l'utilisateur, puis à une voix américaine de
 * qualité (les moteurs « google / natural / neural / enhanced » articulent les
 * formes réduites, l'enjeu du troisième paquet), puis à n'importe quelle voix.
 * @param voices liste des voix anglaises
 * @param preferredUri `voiceURI` mémorisé, ou `null`
 * @returns la voix retenue, ou `null` si aucune voix anglaise n'existe
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  preferredUri: string | null,
): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.voiceURI === preferredUri) ??
    voices.find((v) => /en[-_]US/i.test(v.lang) && /google|natural|neural|enhanced/i.test(v.name)) ??
    voices.find((v) => /en[-_]US/i.test(v.lang)) ??
    voices[0] ??
    null
  );
}

/**
 * Prononce un texte. Silencieuse en cas d'échec : une voix qui ne part pas ne doit
 * jamais interrompre une session de révision.
 * @param text le texte à lire
 * @param voice la voix à utiliser, ou `null` pour laisser le navigateur choisir
 * @param rate vitesse de lecture
 */
export function speak(text: string, voice: SpeechSynthesisVoice | null, rate: number): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = 'en-US';
    }
    u.rate = rate;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* synthèse indisponible : on continue sans son */
  }
}

/** Coupe la lecture en cours (sortie de paquet, changement de carte). */
export function cancelSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* rien à faire */
  }
}

/**
 * Lien Youglish pour entendre l'expression dite par de vrais locuteurs.
 * Seul appel réseau de l'application, et il part dans un onglet séparé : rien
 * n'est chargé depuis le réseau au démarrage.
 * @param text l'expression anglaise
 */
export function youglishUrl(text: string): string {
  return `https://youglish.com/pronounce/${encodeURIComponent(text)}/english`;
}

/* ---------- reconnaissance vocale ---------- */

/** Constructeur de `SpeechRecognition`. Chrome, y compris sur Android, n'expose
 *  encore que la version préfixée `webkitSpeechRecognition` : la spécification
 *  n'est pas stabilisée, le préfixe date de l'implémentation d'origine et n'a
 *  jamais été retiré. On tente donc les deux noms. */
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Surface minimale de `SpeechRecognition` réellement utilisée ici. La déclarer
 *  évite de dépendre de types DOM qui varient d'une version de TypeScript à l'autre. */
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

/** Forme du résultat de reconnaissance, réduite à ce qui est lu. */
export interface SpeechRecognitionResultLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

/**
 * Renvoie le constructeur `SpeechRecognition` du navigateur.
 * @returns le constructeur, ou `null` si l'API est absente — l'appelant doit
 *          alors masquer le mode Prononciation, sans afficher d'erreur
 */
export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof ctor === 'function' ? (ctor as SpeechRecognitionCtor) : null;
}

/**
 * Le mode Prononciation est-il disponible sur ce navigateur ?
 * @returns `false` sur Firefox et sur iOS, où l'API n'existe pas
 */
export function isRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

/* ---------- comparaison transcription / phrase attendue ---------- */

/** Formes réduites dépliées en entier, traitées comme des mots complets.
 *  Le moteur de reconnaissance écrit tantôt « gonna », tantôt « going to », tantôt
 *  « I'm », tantôt « I am » : sans ce dépliage, une prononciation correcte serait
 *  comptée fausse à cause d'un simple choix de transcription.
 *  Les irrégulières (`can't`, `won't`) doivent figurer ici, car la règle générale
 *  sur `n't` en ferait « ca not » et « wo not ». */
export const WORD_FORMS: Record<string, string> = {
  gonna: 'going to',
  wanna: 'want to',
  gotta: 'got to',
  kinda: 'kind of',
  sorta: 'sort of',
  outta: 'out of',
  lemme: 'let me',
  gimme: 'give me',
  dunno: 'do not know',
  cannot: 'can not',
  "can't": 'can not',
  "won't": 'will not',
  "shan't": 'shall not',
  "ain't": 'is not',
  "let's": 'let us',
};

/** Suffixes contractés, dépliés après les formes irrégulières. L'ordre des deux
 *  passes est ce qui garantit que « can't » ne tombe pas dans la règle `n't`. */
export const SUFFIX_FORMS: Record<string, string> = {
  "n't": ' not',
  "'m": ' am',
  "'re": ' are',
  "'ve": ' have',
  "'ll": ' will',
  "'d": ' would',
};

/** Échappe les caractères spéciaux d'une chaîne insérée dans une expression
 *  régulière. Les clés sont connues, mais la règle évite un piège si la table grandit. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalise un texte anglais en une liste de mots comparables.
 * Passe en minuscules, uniformise les apostrophes typographiques, déplie les
 * contractions, retire la ponctuation, puis découpe sur les espaces.
 * @param text texte brut (phrase de la carte ou transcription du micro)
 * @returns les mots normalisés, sans entrée vide
 */
export function normalizeWords(text: string): string[] {
  let s = text.toLowerCase().replace(/[’‘`´]/g, "'");

  for (const [from, to] of Object.entries(WORD_FORMS)) {
    s = s.replace(new RegExp(`(^|[^a-z'])${escapeRegExp(from)}(?![a-z'])`, 'g'), `$1${to}`);
  }
  for (const [from, to] of Object.entries(SUFFIX_FORMS)) {
    s = s.replace(new RegExp(`${escapeRegExp(from)}(?![a-z])`, 'g'), to);
  }

  return s
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Un mot attendu et le verdict de la comparaison. */
export interface WordMatch {
  word: string; // le mot tel qu'il apparaît dans la phrase attendue, non normalisé
  ok: boolean; // reconnu dans la transcription
}

/** Résultat complet d'une tentative de prononciation. */
export interface PronunciationScore {
  score: number; // part de mots reconnus, entre 0 et 1
  words: WordMatch[]; // détail mot à mot, dans l'ordre de la phrase attendue
  matched: number; // nombre de mots reconnus
  expected: number; // nombre de mots attendus après normalisation
}

/** Seuil au-dessus duquel la phrase est jugée intelligible et la notation
 *  « Je savais » proposée. 80 % : au-delà, un interlocuteur suit sans effort. */
export const INTELLIGIBLE_AT = 0.8;

/**
 * Compare une transcription à la phrase attendue, mot à mot.
 *
 * La comparaison consomme les mots de la transcription sans tenir compte de leur
 * position : un mot avalé au début ne doit pas faire échouer tous les suivants,
 * ce qui donnerait un score sans rapport avec l'intelligibilité réelle.
 * Ce score mesure ce qu'un interlocuteur comprend, pas la qualité de l'accent.
 *
 * @param target la phrase anglaise de la carte
 * @param transcript ce que la reconnaissance vocale a entendu
 * @returns le score et le détail mot à mot ; score de 0 si la phrase attendue est vide
 */
export function scorePronunciation(target: string, transcript: string): PronunciationScore {
  const expectedWords = normalizeWords(target);
  const heard = normalizeWords(transcript);

  // Multi-ensemble des mots entendus : chaque occurrence ne peut valider qu'un
  // seul mot attendu, sinon un « the » répété validerait tous les « the ».
  const pool = new Map<string, number>();
  for (const w of heard) pool.set(w, (pool.get(w) ?? 0) + 1);

  let matched = 0;
  const words: WordMatch[] = expectedWords.map((w) => {
    const left = pool.get(w) ?? 0;
    if (left > 0) {
      pool.set(w, left - 1);
      matched += 1;
      return { word: w, ok: true };
    }
    return { word: w, ok: false };
  });

  return {
    score: expectedWords.length ? matched / expectedWords.length : 0,
    words,
    matched,
    expected: expectedWords.length,
  };
}
