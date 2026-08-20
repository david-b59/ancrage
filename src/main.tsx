/**
 * Point d'entrée : monte l'application dans `#root`, sous le filet de sécurité,
 * et enregistre le service worker qui rend l'application utilisable hors ligne.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error("L'élément #root est absent de la page.");

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Enregistrement après `load` : le service worker met en cache le paquet livré,
// et cette mise en cache ne doit pas concurrencer le premier affichage.
// Aucune conséquence s'il échoue — l'application fonctionne, simplement sans
// installation sur l'écran d'accueil.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* hors ligne indisponible : rien à signaler à l'utilisateur */
    });
  });
}
