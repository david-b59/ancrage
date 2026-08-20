/**
 * Hook d'observation d'une media query.
 * Sert à conditionner un comportement, jamais une mise en forme : tout ce qui est
 * purement visuel passe par les classes Tailwind, qui n'ont pas besoin de JavaScript
 * et s'appliquent dès le premier rendu.
 */
import { useEffect, useState } from 'react';

/** Palier « ordinateur » du projet. Doit rester aligné sur le `lg:` de Tailwind,
 *  faute de quoi les raccourcis clavier s'activeraient à une largeur où l'aide
 *  qui les annonce est encore masquée. */
export const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * Indique si une media query est satisfaite, et suit ses changements.
 * @param query la requête CSS, par exemple `(min-width: 1024px)`
 * @returns `true` tant que la requête est satisfaite ; `false` si `matchMedia`
 *          n'existe pas — c'est le cas sous jsdom, et l'absence de raccourcis
 *          clavier y est le repli sûr
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    // Relu au montage : entre le premier rendu et l'effet, la fenêtre a pu être
    // redimensionnée, ou l'hydratation avoir eu lieu à une autre largeur.
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}
