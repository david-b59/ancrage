/**
 * Encadré de réglage sur l'accueil : un titre en petites capitales, du contenu.
 * Purement visuel, il porte la surface commune aux blocs « Cartes archivées »,
 * « Voix » et « Sauvegarde ».
 */
import type { ReactNode } from 'react';

interface PanelProps {
  title: string; // intitulé affiché en capitales
  children: ReactNode;
}

/**
 * Encadre un bloc de réglage.
 * @param title intitulé du bloc
 * @param children contenu du bloc
 */
export function Panel({ title, children }: PanelProps) {
  return (
    <section className="mt-3 rounded-xl border border-line bg-surface px-4 py-4">
      <h3 className="mb-2 font-mono text-[10.5px] font-semibold tracking-[0.18em] text-dim uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
