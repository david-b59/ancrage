/**
 * Les cartes et les paquets, repris tels quels depuis `index.html`.
 * Aucune reformulation, aucun tri : l'identifiant de progression d'une carte est
 * `paquet|anglais`, donc toute retouche du champ `en` détacherait la carte de son
 * historique de révisions. Ajouter des cartes est sans risque ; en modifier non.
 */
import type { Card, Deck, DeckId, ModeId } from './types';

/** Les trois paquets, dans l'ordre d'affichage sur l'accueil. */
export const DECKS: Record<DeckId, Deck> = {
  m: { name: 'Réunion & visio', sub: 'phrases toutes faites' },
  t: { name: 'Data & tech', sub: 'ton métier au quotidien' },
  e: { name: 'Ce que ton oreille rate', sub: 'formes réduites, liaisons' },
};

/** Ordre d'affichage des paquets. `Object.keys` ne garantit rien de lisible :
 *  on fixe l'ordre explicitement. */
export const DECK_ORDER: DeckId[] = ['m', 't', 'e'];

/** Libellés des modes. `pronounce` n'apparaît que si le navigateur expose
 *  `SpeechRecognition` — le filtrage se fait à l'affichage, pas ici. */
export const MODES: Record<ModeId, string> = {
  fr_en: 'FR → EN',
  en_fr: 'EN → FR',
  listen: 'Écoute',
  pronounce: 'Prononciation',
};

/** Ordre d'affichage des modes. */
export const MODE_ORDER: ModeId[] = ['fr_en', 'en_fr', 'listen', 'pronounce'];

/** Le lot 1 : anglais professionnel pour la tech. */
export const CARDS: Card[] = [
  {
    d: 'm',
    en: 'Can you hear me?',
    fr: "Vous m'entendez ?",
    ex: 'Sorry, can you hear me? My mic was muted.',
  },
  { d: 'm', en: "Let's get started.", fr: 'On commence.', ex: "Everyone's here, so let's get started." },
  {
    d: 'm',
    en: 'Can you repeat that, please?',
    fr: "Peux-tu répéter, s'il te plaît ?",
    ex: 'Sorry, can you repeat that? You broke up a bit.',
  },
  {
    d: 'm',
    en: 'Could you speak more slowly?',
    fr: 'Peux-tu parler plus lentement ?',
    ex: 'Could you speak a bit more slowly, please?',
  },
  {
    d: 'm',
    en: "I didn't catch that.",
    fr: "Je n'ai pas saisi.",
    ex: "Sorry, I didn't catch the last part.",
  },
  {
    d: 'm',
    en: 'Just to make sure I understood…',
    fr: "Juste pour être sûr d'avoir compris…",
    ex: 'Just to make sure I understood: you want the report by Friday?',
  },
  {
    d: 'm',
    en: "I'll get back to you.",
    fr: 'Je reviens vers toi.',
    ex: "I'll check the data and get back to you tomorrow.",
  },
  { d: 'm', en: "I'm working on it.", fr: "J'y travaille.", ex: "It's not finished yet, I'm working on it." },
  {
    d: 'm',
    en: "It's on my plate.",
    fr: "C'est à ma charge.",
    ex: 'The refresh issue is on my plate this week.',
  },
  {
    d: 'm',
    en: 'Let me share my screen.',
    fr: 'Je partage mon écran.',
    ex: 'Let me share my screen and walk you through it.',
  },
  {
    d: 'm',
    en: 'to walk you through it',
    fr: 'vous expliquer étape par étape',
    ex: "I'll walk you through the model quickly.",
  },
  {
    d: 'm',
    en: 'Does that make sense?',
    fr: "C'est clair pour vous ?",
    ex: "That's the logic behind the KPI. Does that make sense?",
  },
  {
    d: 'm',
    en: "I'm not sure I follow.",
    fr: 'Je ne suis pas sûr de suivre.',
    ex: "Sorry, I'm not sure I follow — which table do you mean?",
  },
  {
    d: 'm',
    en: "Let's take it offline.",
    fr: 'On en reparle hors réunion.',
    ex: "Good point, but let's take it offline.",
  },
  {
    d: 'm',
    en: 'Can we circle back to this?',
    fr: 'Peut-on y revenir plus tard ?',
    ex: 'Can we circle back to this next week?',
  },
  {
    d: 'm',
    en: 'Any blockers?',
    fr: 'Des points bloquants ?',
    ex: 'Quick round: any blockers on your side?',
  },
  {
    d: 'm',
    en: "I'll keep you posted.",
    fr: 'Je te tiens au courant.',
    ex: "I'll keep you posted once the load is finished.",
  },
  { d: 'm', en: 'That works for me.', fr: 'Ça me va.', ex: 'Thursday at two? That works for me.' },

  {
    d: 't',
    en: 'a requirement',
    fr: 'un besoin, une exigence',
    ex: 'The business gave us new requirements for the report.',
  },
  { d: 't', en: 'the scope', fr: 'le périmètre', ex: 'That KPI is out of scope for this release.' },
  {
    d: 't',
    en: 'a stakeholder',
    fr: 'une partie prenante',
    ex: 'I need to align with the stakeholders first.',
  },
  {
    d: 't',
    en: 'the business',
    fr: 'le métier, les utilisateurs métier',
    ex: 'The business asked for a monthly view.',
  },
  { d: 't', en: 'a dataset', fr: 'un jeu de données', ex: 'The dataset comes from the Fabric warehouse.' },
  {
    d: 't',
    en: 'to refresh',
    fr: 'actualiser (les données)',
    ex: 'The dataset refreshes every morning at six.',
  },
  { d: 't', en: 'a query', fr: 'une requête', ex: 'This query is too slow, we need to optimise it.' },
  {
    d: 't',
    en: 'a row / a column',
    fr: 'une ligne / une colonne',
    ex: 'Add a column to flag cancelled orders.',
  },
  { d: 't', en: 'a measure', fr: 'une mesure (DAX)', ex: 'I wrote a measure to compute the average delay.' },
  { d: 't', en: 'to compute', fr: 'calculer', ex: 'The measure computes the total on the fly.' },
  { d: 't', en: 'accurate', fr: 'exact, fiable', ex: 'The numbers are not accurate, we have duplicates.' },
  { d: 't', en: 'a duplicate', fr: 'un doublon', ex: 'We had duplicates after the last load.' },
  { d: 't', en: 'to filter out', fr: 'écarter, exclure', ex: 'We filter out the test invoices.' },
  {
    d: 't',
    en: 'a workaround',
    fr: 'une solution de contournement',
    ex: "It's not clean, it's just a workaround.",
  },
  { d: 't', en: 'an issue', fr: 'un problème', ex: "There's a known issue with the date table." },
  {
    d: 't',
    en: 'to troubleshoot',
    fr: 'diagnostiquer un problème',
    ex: 'I spent the morning troubleshooting the pipeline.',
  },
  {
    d: 't',
    en: 'to deploy',
    fr: 'déployer, mettre en production',
    ex: 'We deploy to production on Thursday.',
  },
  { d: 't', en: 'a deadline', fr: 'une échéance', ex: 'The deadline is the end of the month.' },
  { d: 't', en: 'a follow-up', fr: 'un suivi, une relance', ex: "Let's do a follow-up next Monday." },
  { d: 't', en: 'to be in charge of', fr: 'être responsable de', ex: "I'm in charge of the billing report." },

  { d: 'e', en: 'gonna', fr: 'going to — aller (futur)', ex: "I'm gonna check that." },
  { d: 'e', en: 'wanna', fr: 'want to — vouloir', ex: 'Do you wanna join?' },
  { d: 'e', en: 'kinda', fr: 'kind of — un peu, plutôt', ex: "It's kinda slow." },
  { d: 'e', en: 'lemme', fr: 'let me — laisse-moi', ex: 'Lemme check.' },
  { d: 'e', en: 'dunno', fr: "don't know — je ne sais pas", ex: 'I dunno yet.' },
  { d: 'e', en: 'gotta', fr: 'have to — devoir', ex: 'We gotta fix it.' },
  {
    d: 'e',
    en: "We've done it, I'll send it.",
    fr: 'have et will contractés, presque inaudibles',
    ex: 'We have done it, I will send it.',
  },
  {
    d: 'e',
    en: "I can't do it.",
    fr: "can't appuyé, can faible : le piège classique",
    ex: "I can do it. I can't do it.",
  },
  { d: 'e', en: 'check it out', fr: 'liaison : les mots se collent', ex: 'Check it out, an issue came up.' },
  { d: 'e', en: 'I finished it.', fr: 'le -ed final est presque muet', ex: 'I finished it and pushed it.' },
];
