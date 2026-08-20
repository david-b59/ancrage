/**
 * Types du domaine : cartes, paquets, modes de révision.
 * Ce fichier ne contient aucune logique — seulement le vocabulaire partagé par
 * les données (`cards.ts`), le moteur (`lib/srs.ts`) et l'interface.
 */

/** Identifiant de paquet. Reprend les clés courtes de `index.html` (`d`), car
 *  elles entrent dans l'identifiant de carte stocké : les changer perdrait la
 *  progression de l'utilisateur. */
export type DeckId = 'm' | 't' | 'e';

/** Les quatre modes de révision. `pronounce` est le seul ajout de cette version ;
 *  les trois autres portent les mêmes valeurs que dans `index.html`, car le mode
 *  courant est persisté dans la progression. */
export type ModeId = 'fr_en' | 'en_fr' | 'listen' | 'pronounce';

/** Une carte : une expression anglaise, sa traduction, un exemple en contexte. */
export interface Card {
  d: DeckId; // paquet d'appartenance ; première moitié de l'identifiant stocké
  en: string; // face anglaise ; seconde moitié de l'identifiant stocké
  fr: string; // face française (traduction ou explication)
  ex: string; // phrase d'exemple, affichée au verso et lue par la synthèse vocale
}

/** Un paquet, tel qu'affiché sur l'accueil. */
export interface Deck {
  name: string; // libellé principal
  sub: string; // sous-titre
}
