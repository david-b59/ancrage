/**
 * Configuration Vite et Vitest.
 * Branche React et Tailwind v4 (plugin natif, pas de chaîne PostCSS séparée).
 * `defineConfig` vient de `vitest/config` pour que la clé `test` soit typée.
 * Le dossier publié sur Netlify est `dist`, valeur par défaut conservée.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    // jsdom parce que `storage.ts` et `speech.ts` lisent des API du navigateur.
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
