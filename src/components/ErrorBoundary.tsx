/**
 * Filet de sécurité d'affichage.
 * Si un composant lève, l'écran de repli propose d'abord de copier la sauvegarde,
 * avant toute autre action : la progression n'existe qu'à un seul endroit, et une
 * erreur d'affichage ne doit jamais pousser l'utilisateur à vider les données du
 * site pour « réparer » l'application.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { readRaw } from '../lib/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null; // erreur capturée, `null` tant que tout va bien
  copied: boolean; // la sauvegarde a-t-elle été copiée ?
}

/** Écran de repli affiché à la place de l'application en cas d'erreur de rendu. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Pas de service de télémétrie : rien ne sort de l'appareil. La console suffit
    // à diagnostiquer depuis les outils de développement du téléphone.
    console.error('Ancrage — erreur de rendu', error, info.componentStack);
  }

  /** Copie la progression brute, telle qu'elle est dans le stockage. On ne
   *  repasse pas par la validation : en situation d'erreur, la donnée d'origine
   *  est plus précieuse qu'une version nettoyée. */
  private copyBackup = async (): Promise<void> => {
    const raw = readRaw() ?? '';
    try {
      await navigator.clipboard.writeText(raw);
      this.setState({ copied: true });
    } catch {
      // Presse-papiers refusé : le texte reste affiché dans le champ ci-dessous.
      this.setState({ copied: false });
    }
  };

  override render(): ReactNode {
    const { error, copied } = this.state;
    if (!error) return this.props.children;

    const raw = readRaw() ?? '';

    return (
      <div className="mx-auto flex min-h-dvh max-w-[600px] flex-col justify-center px-4 py-6">
        <h1 className="mb-2 text-2xl font-semibold">L'affichage a échoué</h1>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Ta progression est intacte dans ce navigateur. Mets-la en sécurité avant tout autre geste : ne vide
          pas les données du site, ne désinstalle rien.
        </p>

        <button
          type="button"
          onClick={this.copyBackup}
          className="min-h-11 rounded-full bg-mint px-4 py-3 text-sm font-semibold text-ink"
        >
          Copier ma sauvegarde
        </button>
        <p aria-live="polite" className="mt-2 min-h-5 text-xs text-dim">
          {copied ? 'Sauvegarde copiée dans le presse-papiers.' : ''}
        </p>

        <label htmlFor="raw-backup" className="mt-3 mb-1 block text-xs text-dim">
          Ou sélectionne et copie ce texte à la main
        </label>
        <textarea
          id="raw-backup"
          readOnly
          value={raw}
          rows={6}
          className="w-full rounded-[10px] border border-line bg-field p-3 font-mono text-xs text-paper"
        />

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mx-auto mt-4 min-h-11 py-3 text-[13px] text-dim underline"
        >
          Recharger l'application
        </button>

        <p className="mt-4 font-mono text-[11px] break-words text-dim">{error.message}</p>
      </div>
    );
  }
}
