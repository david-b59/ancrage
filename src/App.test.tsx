/**
 * Test de fumée de l'application complète.
 * Monte l'écran d'accueil dans jsdom, où ni la synthèse vocale ni la
 * reconnaissance n'existent : c'est exactement la situation d'un navigateur sans
 * `SpeechRecognition`, et elle doit se traduire par un mode en moins, jamais par
 * une erreur.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { STORAGE_KEY, loadProgress } from './lib/storage';

let container: HTMLDivElement;
let root: Root;

/** Monte l'application et laisse les effets se déclencher. */
async function mount(): Promise<void> {
  await act(async () => {
    root.render(<App />);
  });
}

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('App', () => {
  it('affiche l’accueil, ses trois paquets et son compteur', async () => {
    await mount();
    expect(container.textContent).toContain('Ancrage');
    expect(container.textContent).toContain('Réunion & visio');
    expect(container.textContent).toContain('Data & tech');
    expect(container.textContent).toContain('Ce que ton oreille rate');
    expect(container.textContent).toContain('0/48 ancrées');
    expect(container.textContent).toContain('jour 1');
  });

  it('masque le mode Prononciation quand la reconnaissance vocale est absente', async () => {
    await mount();
    const modes = [...container.querySelectorAll('[aria-pressed]')].map((b) => b.textContent);
    expect(modes).toEqual(['FR → EN', 'EN → FR', 'Écoute']);
  });

  it('enregistre le jour courant au premier lancement', async () => {
    await mount();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(loadProgress().lastDay).not.toBeNull();
  });

  it('démarre une session de quinze cartes et note la première', async () => {
    await mount();
    const decks = [...container.querySelectorAll('button')].filter((b) =>
      b.getAttribute('aria-label')?.startsWith('Réunion & visio'),
    );
    await act(async () => {
      decks[0]?.click();
    });
    expect(container.textContent).toContain('1 / 15');

    // Retourner la carte, puis choisir « Je savais ».
    const flip = container.querySelector<HTMLButtonElement>('button[aria-label="Voir la réponse"]');
    await act(async () => {
      flip?.click();
    });
    const good = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.startsWith('Je savais'),
    );
    expect(good?.textContent).toContain('1 j');
    await act(async () => {
      good?.click();
    });

    expect(container.textContent).toContain('2 / 15');
    expect(Object.keys(loadProgress().cards)).toHaveLength(1);
  });
});
