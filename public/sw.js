/**
 * Service worker : rend l'application utilisable sans réseau et installable sur
 * l'écran d'accueil.
 *
 * Il ne connaît pas la liste des fichiers produits par Vite — leurs noms portent
 * une empreinte qui change à chaque build. Il précharge donc seulement la coquille,
 * puis met en cache les ressources de même origine au fil de leur premier chargement.
 * Rien de ce qu'il stocke n'est de la progression : celle-ci vit dans `localStorage`,
 * qu'un service worker ne touche jamais. Vider ce cache ne perd aucune révision.
 */

/* Nom versionné : changer ce numéro suffit à évincer l'ancien cache au déploiement
   suivant. Sans rapport avec la clé de progression, qui, elle, ne bouge jamais. */
const CACHE = 'ancrage-v1';

/** La coquille minimale, mise en cache dès l'installation. */
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // `addAll` échoue en bloc si une seule URL manque : on tolère les absences
      // pour qu'un fichier d'icône renommé n'empêche pas l'installation.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Youglish et toute autre origine passent sans interception : rien d'extérieur
  // n'est mis en cache, et rien ne part du cache vers l'extérieur.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Navigation : réseau d'abord, pour prendre la dernière version publiée ;
  // repli sur la coquille en cache quand il n'y a pas de réseau.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then((hit) => hit ?? caches.match('/'))),
    );
    return;
  }

  // Ressources : cache d'abord. Les noms produits par Vite portent une empreinte,
  // une réponse mise en cache ne peut donc jamais être périmée.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
