/**
 * Génère les icônes PNG de l'application dans `public/`.
 * Écrit le PNG à la main (zlib + CRC32) plutôt que d'ajouter une dépendance
 * d'images : le projet n'a besoin que de quelques disques concentriques, et une
 * dépendance de moins est une surface d'attaque de moins.
 *
 * Usage : `node scripts/generate-icons.mjs`. À relancer seulement si la palette
 * ou le dessin de l'icône change ; les PNG produits sont versionnés.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Palette, identique à celle de `src/index.css`. */
const BG = [0x0a, 0x1f, 0x21];
const TRACK = [0x12, 0x38, 0x3a];
const MINT = [0x7f, 0xd1, 0xb9];
const AMBER = [0xf5, 0xc5, 0x42];

/**
 * Couleur d'un pixel de l'icône.
 * Reproduit `public/icon.svg` : un anneau menthe aux trois quarts rempli, et le
 * point ambre au centre.
 * @param {number} x abscisse dans l'image
 * @param {number} y ordonnée dans l'image
 * @param {number} size côté de l'image en pixels
 * @param {number} scale facteur de réduction du dessin (marge des icônes maskable)
 * @returns {number[]} triplet RVB
 */
function pixel(x, y, size, scale) {
  const c = size / 2;
  const dx = (x + 0.5 - c) / scale;
  const dy = (y + 0.5 - c) / scale;
  const r = Math.hypot(dx, dy);
  const unit = size / 512;

  if (r <= 62 * unit) return AMBER;

  const ringOuter = 164 * unit;
  const ringInner = 136 * unit;
  if (r <= ringOuter && r >= ringInner) {
    // Angle mesuré depuis le haut, sens horaire : l'arc menthe couvre 65 % du tour,
    // comme le `stroke-dashoffset` du SVG.
    const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI);
    return angle <= 2 * Math.PI * 0.65 ? MINT : TRACK;
  }
  return BG;
}

/**
 * Construit le contenu binaire d'un PNG opaque.
 * @param {number} size côté de l'image
 * @param {number} scale facteur de réduction du dessin
 * @returns {Buffer} le fichier PNG complet
 */
function png(size, scale) {
  // Une ligne = un octet de filtre (0 = aucun) suivi de size pixels RVB.
  const raw = Buffer.alloc(size * (1 + size * 3));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y, size, scale);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits par canal
  ihdr[9] = 2; // couleur vraie, sans canal alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Table CRC32 du format PNG, calculée une fois. */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

/**
 * Encapsule des données dans un bloc PNG (longueur, type, données, CRC).
 * @param {string} type type du bloc, quatre lettres ASCII
 * @param {Buffer} data contenu du bloc
 * @returns {Buffer} le bloc complet
 */
function chunk(type, data) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  let crc = 0xffffffff;
  for (const byte of body) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
  return Buffer.concat([head, body, tail]);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'icon-192.png'), png(192, 1));
writeFileSync(join(OUT_DIR, 'icon-512.png'), png(512, 1));
// Icône maskable : Android rogne jusqu'à 20 % de chaque bord, le dessin est donc
// réduit pour tenir dans la zone sûre quelle que soit la forme du masque.
writeFileSync(join(OUT_DIR, 'icon-maskable-512.png'), png(512, 0.7));
console.log('Icônes écrites dans public/.');
