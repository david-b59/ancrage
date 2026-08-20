/**
 * Encadré « Sauvegarde » : copie de la progression au format JSON, et champ de
 * restauration. Le remplacement passe obligatoirement par une confirmation
 * explicite — c'est la seule action de l'application qui puisse effacer des mois
 * de révisions.
 */
import { useState } from 'react';
import { Panel } from './Panel';

interface BackupPanelProps {
  /** Le JSON de la progression courante, déjà sérialisé par l'appelant. */
  exportText: string;
  /** Tente la restauration. Renvoie `false` si le texte collé est inexploitable ;
   *  dans ce cas rien n'a été remplacé. */
  onImport: (text: string) => boolean;
}

/** Messages affichés sous les boutons, selon le résultat de la dernière action. */
type Feedback = null | 'copied' | 'copy-failed' | 'imported' | 'invalid';

/**
 * Affiche les commandes de sauvegarde et de restauration.
 * @param exportText JSON de la progression courante
 * @param onImport fonction de restauration, appelée seulement après confirmation
 */
export function BackupPanel({ exportText, onImport }: BackupPanelProps) {
  const [pasted, setPasted] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  /** Copie le JSON. L'API presse-papiers échoue en contexte non sécurisé ou sans
   *  geste utilisateur reconnu : on le dit, et le texte reste sélectionnable. */
  async function copy() {
    try {
      await navigator.clipboard.writeText(exportText);
      setFeedback('copied');
    } catch {
      setFeedback('copy-failed');
    }
  }

  function requestImport() {
    setFeedback(null);
    setConfirming(true);
  }

  function confirmImport() {
    const ok = onImport(pasted);
    setConfirming(false);
    setFeedback(ok ? 'imported' : 'invalid');
    if (ok) setPasted('');
  }

  return (
    <Panel title="Sauvegarde">
      <p className="mb-3 text-[13px] leading-relaxed text-muted">
        La progression ne vit qu'ici, dans ce navigateur. Copie-la avant de changer de téléphone ou de vider
        les données du site.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="min-h-11 rounded-full border border-mint px-4 py-2 text-[13px] text-mint"
        >
          Copier la progression
        </button>
      </div>

      <label htmlFor="restore" className="mt-4 mb-2 block text-[13px] text-muted">
        Coller une sauvegarde pour la restaurer
      </label>
      <textarea
        id="restore"
        value={pasted}
        onChange={(e) => {
          setPasted(e.target.value);
          setConfirming(false);
          setFeedback(null);
        }}
        rows={3}
        spellCheck={false}
        placeholder='{"cards":{…}}'
        className="w-full resize-y rounded-[10px] border border-line bg-field p-3 font-mono text-xs text-paper placeholder:text-dim"
      />

      {!confirming ? (
        <button
          type="button"
          onClick={requestImport}
          disabled={!pasted.trim()}
          className="mt-2 min-h-11 rounded-full border border-line px-4 py-2 text-[13px] text-paper disabled:opacity-40"
        >
          Restaurer
        </button>
      ) : (
        <div className="mt-2 rounded-[10px] border border-brick p-3">
          <p className="mb-2 text-[13px] leading-relaxed text-muted">
            La progression actuelle sera remplacée. Cette action est définitive.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmImport}
              className="min-h-11 rounded-full bg-brick px-4 py-2 text-[13px] font-semibold text-white"
            >
              Remplacer
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-full border border-line px-4 py-2 text-[13px] text-dim"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-dim">
        {feedback === 'copied' && 'Progression copiée dans le presse-papiers.'}
        {feedback === 'copy-failed' && 'Copie refusée par le navigateur. Sélectionne le texte à la main.'}
        {feedback === 'imported' && 'Progression restaurée.'}
        {feedback === 'invalid' && "Ce texte n'est pas une sauvegarde valide. Rien n'a été remplacé."}
      </p>

      {feedback === 'copy-failed' && (
        <textarea
          readOnly
          value={exportText}
          rows={4}
          aria-label="Progression à copier"
          className="mt-2 w-full rounded-[10px] border border-line bg-field p-3 font-mono text-xs text-paper"
        />
      )}
    </Panel>
  );
}
