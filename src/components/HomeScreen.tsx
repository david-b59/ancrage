/**
 * Écran d'accueil : compteur global, choix du mode, les trois paquets, puis les
 * encadrés d'explication et de réglage.
 * Composant de présentation : il reçoit tout ce qu'il affiche et ne calcule que
 * des pourcentages d'affichage.
 */
import { CARDS, DECKS, DECK_ORDER } from '../data/cards';
import type { DeckId, ModeId } from '../data/types';
import { cardId, dueCount, isArchived, isMature, maturePct } from '../lib/srs';
import type { Progress } from '../lib/storage';
import { BackupPanel } from './BackupPanel';
import { DeckButton } from './DeckButton';
import { Legend } from './Legend';
import { ModeTabs } from './ModeTabs';
import { Panel } from './Panel';

interface HomeScreenProps {
  progress: Progress; // progression courante
  today: number; // minuit UTC du jour courant
  modes: ModeId[]; // modes disponibles sur ce navigateur
  voices: SpeechSynthesisVoice[]; // voix anglaises détectées
  currentVoiceUri: string | null; // `voiceURI` de la voix effectivement utilisée
  exportText: string; // progression sérialisée, pour la sauvegarde
  onSelectMode: (mode: ModeId) => void;
  onStartDeck: (deck: DeckId) => void;
  onSelectVoice: (voiceUri: string) => void;
  onUnarchive: () => void;
  onImport: (text: string) => boolean;
}

/**
 * Affiche l'accueil.
 * @param props toutes les données affichées et les actions déclenchables
 */
export function HomeScreen({
  progress,
  today,
  modes,
  voices,
  currentVoiceUri,
  exportText,
  onSelectMode,
  onStartDeck,
  onSelectVoice,
  onUnarchive,
  onImport,
}: HomeScreenProps) {
  const anchored = CARDS.filter((c) => isMature(progress.cards[cardId(c)])).length;
  const archived = CARDS.filter((c) => isArchived(progress.cards[cardId(c)])).length;
  const total = CARDS.length;
  const pct = Math.round((anchored / total) * 100);

  return (
    // Une seule colonne jusqu'à 1024 px, deux au-delà : à gauche ce qui sert à
    // lancer une session, à droite ce qui s'explique et se règle. L'ordre du DOM
    // est celui de la colonne unique, donc celui de la lecture au clavier.
    <div className="lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <div className="lg:sticky lg:top-10">
        <header>
          <div className="mb-0.5 flex items-baseline gap-2.5">
            <span className="h-[7px] w-[7px] self-center rounded-full bg-amber" aria-hidden="true" />
            <h1 className="m-0 text-[29px] font-semibold tracking-tight md:text-[34px]">Ancrage</h1>
          </div>
          <p className="mt-0.5 mb-[18px] font-mono text-[11px] tracking-[0.14em] text-dim uppercase md:text-xs">
            Révision espacée
          </p>
        </header>

        <div
          className="h-[7px] overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={anchored}
          aria-label="Cartes ancrées"
        >
          <i
            className="block h-full rounded-full bg-gradient-to-r from-mint to-amber transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-dim md:text-[13px]">
          <span>
            {anchored}/{total} ancrées
          </span>
          <span>jour {progress.day}</span>
        </div>

        <div className="my-6 flex items-center gap-2.5">
          <span className="font-mono text-[11px] tracking-[0.18em] text-dim uppercase md:text-xs">
            Anglais · Lot 1
          </span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>

        <ModeTabs modes={modes} current={progress.mode} onSelect={onSelectMode} />

        {DECK_ORDER.map((deck) => {
          const inDeck = CARDS.filter((c) => c.d === deck);
          return (
            <DeckButton
              key={deck}
              deck={DECKS[deck]}
              due={dueCount(CARDS, progress.cards, deck, today)}
              pct={maturePct(CARDS, progress.cards, deck)}
              disabled={inDeck.every((c) => isArchived(progress.cards[cardId(c)]))}
              onStart={() => onStartDeck(deck)}
            />
          );
        })}
      </div>

      <div>
        <Legend />

        <Panel title="Cartes archivées">
          <p className="mb-3 text-[13px] leading-relaxed text-muted md:text-sm">
            {archived
              ? `${archived} carte${archived > 1 ? 's ont' : ' a'} dépassé un an d'intervalle. Elles ne reviennent plus dans le cycle.`
              : "Une carte qui atteint un an d'intervalle sort du cycle : tu n'as plus besoin de la revoir. Tu peux la rappeler quand tu veux."}
          </p>
          {archived > 0 && (
            <button
              type="button"
              onClick={onUnarchive}
              className="min-h-11 rounded-full border border-mint px-4 py-2 text-[13px] text-mint"
            >
              Remettre en circulation
            </button>
          )}
        </Panel>

        <Panel title="Voix">
          <label htmlFor="voice" className="sr-only">
            Voix de la synthèse vocale
          </label>
          <select
            id="voice"
            value={currentVoiceUri ?? ''}
            disabled={voices.length === 0}
            onChange={(e) => onSelectVoice(e.target.value)}
            className="min-h-11 w-full rounded-[10px] border border-line bg-field p-2.5 text-[13px] text-paper disabled:opacity-60"
          >
            {voices.length === 0 ? (
              <option value="">Aucune voix anglaise détectée</option>
            ) : (
              voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} · {v.lang}
                </option>
              ))
            )}
          </select>
        </Panel>

        <BackupPanel exportText={exportText} onImport={onImport} />
      </div>
    </div>
  );
}
