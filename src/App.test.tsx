/**
 * Test de fumée de l'application complète, et tests des raccourcis clavier.
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

/**
 * Remplace `matchMedia`, que jsdom n'implémente pas, pour simuler un palier.
 * @param matches vrai pour se placer au-delà de 1024 px, là où le clavier est branché
 */
function stubMatchMedia(matches: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/** Envoie une frappe, éventuellement depuis un élément précis. */
async function press(key: string, from: EventTarget = window): Promise<void> {
  await act(async () => {
    from.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

/** Ouvre une session sur le premier paquet et renvoie le bouton de retournement. */
async function startFirstDeck(): Promise<void> {
  const deck = [...container.querySelectorAll('button')].find((b) =>
    b.getAttribute('aria-label')?.startsWith('Réunion & visio'),
  );
  await act(async () => {
    deck?.click();
  });
}

beforeEach(() => {
  localStorage.clear();
  stubMatchMedia(false); // téléphone par défaut : les raccourcis ne doivent pas exister
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

describe('raccourcis clavier', () => {
  it('n’existent pas sous le palier ordinateur', async () => {
    stubMatchMedia(false);
    await mount();
    await startFirstDeck();

    await press(' ');
    // La carte n'est pas retournée : la notation reste fermée.
    expect(container.textContent).not.toContain('Je savais');
    // Et l'aide qui les annonce n'est pas rendue.
    expect(container.textContent).not.toContain('retourner');
  });

  it('annoncent les touches sous la carte au-delà de 1024 px', async () => {
    stubMatchMedia(true);
    await mount();
    await startFirstDeck();
    expect(container.textContent).toContain('retourner');
    expect(container.textContent).toContain('quitter');
  });

  it('Espace retourne la carte', async () => {
    stubMatchMedia(true);
    await mount();
    await startFirstDeck();
    expect(container.textContent).not.toContain('Je savais');

    await press(' ');
    expect(container.textContent).toContain('Je savais');
  });

  it('1, 2 et 3 notent la carte', async () => {
    stubMatchMedia(true);
    await mount();
    await startFirstDeck();
    await press(' ');

    await press('2'); // « Difficile »
    expect(container.textContent).toContain('2 / 15');
    const cards = loadProgress().cards;
    const only = Object.values(cards)[0];
    expect(Object.keys(cards)).toHaveLength(1);
    // « Difficile » à la première révision : 1 jour, facilité 2,5 − 0,15.
    expect(only?.iv).toBe(1);
    expect(only?.ease).toBeCloseTo(2.35, 5);
  });

  it('ne notent pas tant que la carte n’est pas retournée', async () => {
    stubMatchMedia(true);
    await mount();
    await startFirstDeck();

    await press('3');
    expect(container.textContent).toContain('1 / 15');
    expect(Object.keys(loadProgress().cards)).toHaveLength(0);
  });

  it('Échap quitte le paquet', async () => {
    stubMatchMedia(true);
    await mount();
    await startFirstDeck();
    expect(container.textContent).toContain('1 / 15');

    await press('Escape');
    expect(container.textContent).toContain('Révision espacée');
  });

  it('restent inactifs quand le focus est dans un champ de saisie', async () => {
    stubMatchMedia(true);
    await mount();
    await startFirstDeck();
    await press(' ');

    // Un champ de saisie posé dans la page : la frappe part de lui et remonte
    // jusqu'à la fenêtre, exactement comme le champ de restauration de sauvegarde.
    const field = document.createElement('textarea');
    container.appendChild(field);
    field.focus();

    await press('1', field);
    expect(container.textContent).toContain('1 / 15');
    expect(Object.keys(loadProgress().cards)).toHaveLength(0);
    field.remove();
  });

  it('laissent les combinaisons au navigateur', async () => {
    stubMatchMedia(true);
    await mount();
    await startFirstDeck();
    await press(' ');

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true, bubbles: true }));
    });
    expect(container.textContent).toContain('1 / 15');
    expect(Object.keys(loadProgress().cards)).toHaveLength(0);
  });
});
