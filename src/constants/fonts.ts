import { LocalFontEntry } from '../types/studio';

export interface GoogleFontOption {
  family: string;
  category: 'Display & Brutalista' | 'Serifa Editorial' | 'Máquina & Mono' | 'Gestual & Caligráfica';
  weights: number[];
}

export const GOOGLE_FONTS_CATALOG: GoogleFontOption[] = [
  // Display & Brutalista
  { family: 'Syne', category: 'Display & Brutalista', weights: [400, 600, 700, 800] },
  { family: 'Archivo Black', category: 'Display & Brutalista', weights: [400] },
  { family: 'Bebas Neue', category: 'Display & Brutalista', weights: [400] },
  { family: 'Oswald', category: 'Display & Brutalista', weights: [400, 500, 700] },
  { family: 'Bricolage Grotesque', category: 'Display & Brutalista', weights: [400, 600, 800] },
  { family: 'Rubik Glitch', category: 'Display & Brutalista', weights: [400] },
  { family: 'Anton', category: 'Display & Brutalista', weights: [400] },
  { family: 'Big Shoulders Display', category: 'Display & Brutalista', weights: [400, 700, 900] },
  { family: 'Unbounded', category: 'Display & Brutalista', weights: [400, 700, 900] },

  // Serifa Editorial
  { family: 'Playfair Display', category: 'Serifa Editorial', weights: [400, 600, 700, 900] },
  { family: 'Fraunces', category: 'Serifa Editorial', weights: [400, 600, 800] },
  { family: 'Cormorant Garamond', category: 'Serifa Editorial', weights: [400, 600, 700] },
  { family: 'Bodoni Moda', category: 'Serifa Editorial', weights: [400, 600, 800] },
  { family: 'Libre Baskerville', category: 'Serifa Editorial', weights: [400, 700] },
  { family: 'DM Serif Display', category: 'Serifa Editorial', weights: [400] },

  // Máquina & Mono
  { family: 'Courier Prime', category: 'Máquina & Mono', weights: [400, 700] },
  { family: 'Special Elite', category: 'Máquina & Mono', weights: [400] },
  { family: 'IBM Plex Mono', category: 'Máquina & Mono', weights: [400, 500, 700] },
  { family: 'Space Mono', category: 'Máquina & Mono', weights: [400, 700] },
  { family: 'JetBrains Mono', category: 'Máquina & Mono', weights: [400, 600, 800] },
  { family: 'Silkscreen', category: 'Máquina & Mono', weights: [400, 700] },

  // Gestual & Caligráfica
  { family: 'Reenie Beanie', category: 'Gestual & Caligráfica', weights: [400] },
  { family: 'Caveat', category: 'Gestual & Caligráfica', weights: [400, 600, 700] },
  { family: 'Permanent Marker', category: 'Gestual & Caligráfica', weights: [400] },
  { family: 'Rock Salt', category: 'Gestual & Caligráfica', weights: [400] },
  { family: 'Mrs Saint Delafield', category: 'Gestual & Caligráfica', weights: [400] },
  { family: 'UnifrakturMaguntia', category: 'Gestual & Caligráfica', weights: [400] },
];

const loadedFontCache = new Set<string>([
  'Syne',
  'Archivo Black',
  'Bebas Neue',
  'Oswald',
  'Bricolage Grotesque',
  'Rubik Glitch',
  'Playfair Display',
  'Fraunces',
  'Cormorant Garamond',
  'Bodoni Moda',
  'Courier Prime',
  'Special Elite',
  'IBM Plex Mono',
  'Space Mono',
  'Caveat',
  'Reenie Beanie',
  'Plus Jakarta Sans',
]);

export async function loadGoogleFont(family: string, weight = 400): Promise<void> {
  const cleanFamily = family.trim();
  if (!cleanFamily) return;

  if (!loadedFontCache.has(cleanFamily)) {
    const encoded = encodeURIComponent(cleanFamily).replace(/%20/g, '+');
    const id = `gf-${cleanFamily.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
      document.head.appendChild(link);
    }
    loadedFontCache.add(cleanFamily);
  }

  try {
    await document.fonts.load(`${weight} 48px "${cleanFamily}"`);
    await document.fonts.ready;
  } catch {
    try {
      await document.fonts.load(`400 48px "${cleanFamily}"`);
    } catch {
      // Ignore if custom/local font fails weight match
    }
  }
}

export async function loadLocalFontFile(file: File): Promise<LocalFontEntry> {
  const rawName = file.name.replace(/\.(ttf|otf|woff2?|eot)$/i, '').trim();
  // Create a clean unique family identifier safe for CSS / Canvas font strings
  const cleanBase = rawName.replace(/[^a-zA-Z0-9À-ÿ _-]/g, '').trim() || 'Fonte Local';
  const family = cleanBase;

  const buffer = await file.arrayBuffer();
  const fontFace = new FontFace(family, buffer);
  const loadedFace = await fontFace.load();
  document.fonts.add(loadedFace);
  loadedFontCache.add(family);

  try {
    await document.fonts.load(`400 48px "${family}"`);
    await document.fonts.ready;
  } catch {
    // Ignore
  }

  return {
    family,
    fileName: file.name,
  };
}
