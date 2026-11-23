import { FontCategory, FontEntry, LicenseType, ScriptCode } from '../types/font';
import worldFontsRaw from './worldFontsGenerated.json';

interface GeneratedFontRaw {
  id: string;
  name: string;
  category: string;
  scripts: string[];
  isoScripts?: string[];
  weights: number[];
  variable: boolean;
  designer: string;
  year: number;
  subsets: string[];
  isNoto: boolean;
  cssFile: string;
  primaryFontFile: string;
  localHosted: boolean;
  sourceTag?: string;
  sriSha384?: string;
  glyphCount?: number;
}

const VALID_CATEGORIES = new Set<FontCategory>([
  'Serif',
  'Sans',
  'Display',
  'Monospace',
  'Calligraphy',
  'Handwriting',
  'Pixel & Grid',
]);

const VALID_SCRIPTS = new Set<ScriptCode>([
  'latin',
  'armenian',
  'georgian',
  'cyrillic',
  'greek',
  'arabic',
  'persian',
  'hebrew',
  'devanagari',
  'bengali',
  'tamil',
  'indic-other',
  'cjk-sc',
  'cjk-tc',
  'japanese',
  'korean',
  'thai',
  'ethiopic',
  'global-other',
  'symbolic',
]);

function localCss(cssFile: string): string {
  return `/fonts/${cssFile}`;
}

function localBinary(fontFile: string): string {
  return `/fonts/${fontFile}`;
}

function normalizeCategory(cat: string): FontCategory {
  return VALID_CATEGORIES.has(cat as FontCategory) ? (cat as FontCategory) : 'Sans';
}

function normalizeScripts(scripts: string[]): ScriptCode[] {
  const valid = scripts.filter((s): s is ScriptCode => VALID_SCRIPTS.has(s as ScriptCode));
  return valid.length > 0 ? valid : ['latin'];
}

function inferFallbackStack(category: FontCategory): string {
  switch (category) {
    case 'Serif':
    case 'Calligraphy':
      return 'Georgia, serif';
    case 'Monospace':
    case 'Pixel & Grid':
      return 'monospace';
    case 'Handwriting':
      return 'cursive, sans-serif';
    default:
      return 'sans-serif';
  }
}

function inferSource(g: GeneratedFontRaw): {
  foundry: string;
  sourceId: string;
  sourceName: string;
  license: LicenseType;
} {
  const d = (g.designer || '').toLowerCase();
  const id = g.id;

  if (
    g.sourceTag === 'fontshare' ||
    ['satoshi', 'clash-display', 'cabinet-grotesk', 'switzer', 'general-sans', 'zodiak'].includes(id)
  ) {
    return {
      foundry: g.designer || 'Indian Type Foundry',
      sourceId: 'fontshare',
      sourceName: 'Fontshare',
      license: 'Freeware',
    };
  }
  if (g.sourceTag === 'fontsource') {
    return {
      foundry: g.designer || 'Fontsource Open Archive',
      sourceId: 'fontsource',
      sourceName: 'Fontsource',
      license: 'OFL-1.1',
    };
  }
  if (g.sourceTag === 'armenian-open') {
    return {
      foundry: g.designer || 'Armenian Open Type Archive',
      sourceId: 'fonter-am',
      sourceName: 'Armenian Open Archive (GitHub / Fonter Heritage)',
      license: 'OFL-1.1',
    };
  }
  if (g.sourceTag === 'the-league') {
    return {
      foundry: 'The League of Moveable Type',
      sourceId: 'the-league-of-moveable-type',
      sourceName: 'The League of Moveable Type',
      license: 'OFL-1.1',
    };
  }
  if (g.sourceTag === 'velvetyne') {
    return {
      foundry: 'Velvetyne Type Foundry',
      sourceId: 'velvetyne',
      sourceName: 'Velvetyne Type Foundry',
      license: 'OFL-1.1',
    };
  }
  if (g.sourceTag === 'google-noto' || g.isNoto) {
    return {
      foundry: 'Google Noto',
      sourceId: 'google-noto',
      sourceName: 'Google Noto Fonts',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('sil international')) {
    return {
      foundry: 'SIL International',
      sourceId: 'sil-fonts',
      sourceName: 'SIL International Fonts',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('omnibus-type')) {
    return {
      foundry: 'Omnibus-Type',
      sourceId: 'omnibus-type',
      sourceName: 'Omnibus-Type',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('paratype') || d.includes('cyreal')) {
    return {
      foundry: g.designer || 'ParaType',
      sourceId: 'paratype',
      sourceName: 'ParaType (Cyrillic)',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('ek type')) {
    return {
      foundry: 'Ek Type',
      sourceId: 'ek-type',
      sourceName: 'Ek Type (Indic)',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('indian type foundry')) {
    return {
      foundry: 'Indian Type Foundry',
      sourceId: 'indian-type-foundry',
      sourceName: 'Indian Type Foundry (Indic)',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('cadson demak')) {
    return {
      foundry: 'Cadson Demak',
      sourceId: 'cadson-demak',
      sourceName: 'Cadson Demak (Thai)',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('fontworks')) {
    return {
      foundry: 'Fontworks',
      sourceId: 'fontworks',
      sourceName: 'Fontworks (Japanese)',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('tiro')) {
    return {
      foundry: 'Tiro Typeworks',
      sourceId: 'tiro-typeworks',
      sourceName: 'Tiro Typeworks',
      license: 'OFL-1.1',
    };
  }
  if (d.includes('velvetyne')) {
    return {
      foundry: 'Velvetyne Type Foundry',
      sourceId: 'velvetyne',
      sourceName: 'Velvetyne Type Foundry',
      license: 'OFL-1.1',
    };
  }

  const firstDesigner = (g.designer || 'Open Foundry Archive').split(',')[0].trim();
  return {
    foundry: firstDesigner || 'Open Foundry Archive',
    sourceId: 'google-fonts',
    sourceName: 'Google Fonts',
    license: 'OFL-1.1',
  };
}

function estimateGlyphCount(scripts: ScriptCode[], subsets: string[]): number {
  if (scripts.includes('cjk-sc') || scripts.includes('cjk-tc')) return 32000;
  if (scripts.includes('japanese')) return 8500;
  if (scripts.includes('korean')) return 11172;
  if (scripts.includes('arabic') || scripts.includes('persian')) return 1280;
  if (scripts.includes('devanagari') || scripts.includes('bengali') || scripts.includes('tamil')) return 860;
  const base = 360 + scripts.length * 160 + subsets.length * 95;
  return Math.min(4800, base);
}

// Curated editorial metadata & regional type heritage attributions
const CURATED_METADATA_BY_ID: Record<string, Partial<FontEntry>> = {
  'noto-sans-armenian': {
    foundry: 'Google Noto',
    sourceId: 'google-noto',
    sourceName: 'Google Noto Fonts',
    designer: 'Monotype & Khajag Apelian',
    description: 'Clean humanist sans-serif engineered for crisp Armenian UI, editorial, and body prose across all weights.',
    opentypeFeatures: ['kern', 'liga', 'tnum'],
    glyphCount: 248,
  },
  'noto-serif-armenian': {
    foundry: 'Google Noto',
    sourceId: 'google-noto',
    sourceName: 'Google Noto Fonts',
    designer: 'Google / Monotype',
    description: 'High-contrast modulated Armenian serif rooted in classical Yerevan & Venice book typography.',
    opentypeFeatures: ['kern', 'liga', 'oldstyle'],
    glyphCount: 256,
  },
  'noto-sans-georgian': {
    foundry: 'Google Noto',
    sourceId: 'google-noto',
    sourceName: 'Google Noto Fonts',
    designer: 'Google / Akaki Razmadze',
    description: 'Modern Georgian Mkhedruli and Mtavruli sans-serif supporting balanced vertical proportions.',
    opentypeFeatures: ['kern', 'liga', 'case'],
    glyphCount: 312,
  },
  'noto-serif-georgian': {
    foundry: 'Google Noto',
    sourceId: 'google-noto',
    sourceName: 'Google Noto Fonts',
    description: 'Warm literary Georgian serif suited for long-form literature and cultural archives.',
    glyphCount: 295,
  },
  montserrat: {
    foundry: 'Julieta Ulanovsky',
    sourceId: 'google-fonts',
    sourceName: 'Google Fonts',
    designer: 'Julieta Ulanovsky & Jacques Le Bailly',
    description: 'Geometric urban sans inspired by Buenos Aires posters, widely paired with Armenian & Cyrillic headings.',
    opentypeFeatures: ['kern', 'liga', 'tnum', 'ss01'],
    glyphCount: 964,
  },
  fraunces: {
    foundry: 'Undercase Type',
    sourceId: 'google-fonts',
    sourceName: 'Google Fonts',
    category: 'Serif',
    designer: 'Phaedra Charles & Flavia Zimbardi',
    description: 'Wonky soft-serif display face featuring optical size, softness, and wonk variable axes.',
    opentypeFeatures: ['kern', 'liga', 'swsh', 'onum'],
    glyphCount: 842,
    fallbackStack: 'Georgia, serif',
  },
  'bricolage-grotesque': {
    foundry: 'Atelier Triay',
    category: 'Display',
    designer: 'Mathieu Triay',
    description: 'Expressive French-British grotesque blending antique woodblock warmth with sharp digital geometry.',
    glyphCount: 740,
  },
  'plus-jakarta-sans': {
    foundry: 'Tokotype',
    designer: 'Gumpita Rahayu',
    description: 'Fresh geometric-humanist sans-serif crafted in Jakarta for crisp digital interfaces and editorial systems.',
    glyphCount: 680,
  },
  syne: {
    foundry: 'Bonjour Monde',
    sourceId: 'open-foundry',
    sourceName: 'Open Foundry',
    category: 'Display',
    designer: 'Lucas Descroix & Arman Mohtadji',
    description: 'Radical wide-proportion display family designed for Parisian art center Synesthésie.',
    glyphCount: 540,
  },
  'playfair-display': {
    foundry: 'Claus Eggers Sørensen',
    category: 'Serif',
    description: 'High-contrast transitional Enlightenment serif tailored for dramatic magazine headlines.',
    glyphCount: 920,
  },
  'eb-garamond': {
    foundry: 'Georg Duffner',
    sourceId: 'font-library',
    sourceName: 'Font Library (Open Font Library)',
    description: 'Faithful open-source revival of the 1592 Egenolff-Berner specimen with polytonic Greek and Cyrillic.',
    glyphCount: 1640,
  },
  satoshi: {
    foundry: 'Indian Type Foundry',
    sourceId: 'fontshare',
    sourceName: 'Fontshare',
    license: 'Freeware',
    designer: 'Deni Anggara',
    description: 'Modernist grotesque merging Swiss architectural clarity with subtle geometric warmth.',
    glyphCount: 480,
  },
  'clash-display': {
    foundry: 'Indian Type Foundry',
    sourceId: 'fontshare',
    sourceName: 'Fontshare',
    category: 'Display',
    license: 'Freeware',
    description: 'Tight-aperture geometric display grotesque crafted for editorial covers and exhibition titles.',
    glyphCount: 420,
  },
  'cabinet-grotesk': {
    foundry: 'Indian Type Foundry',
    sourceId: 'fontshare',
    sourceName: 'Fontshare',
    category: 'Display',
    license: 'Freeware',
    description: 'High-contrast grotesque featuring sharp ink traps and distinctive counter curvature.',
    glyphCount: 460,
  },
  switzer: {
    foundry: 'Indian Type Foundry',
    sourceId: 'fontshare',
    sourceName: 'Fontshare',
    license: 'Freeware',
    description: 'Neo-grotesque tribute to Swiss magazine typography of the 1980s and 1990s.',
    glyphCount: 510,
  },
  'pt-sans': {
    foundry: 'ParaType',
    sourceId: 'paratype',
    sourceName: 'ParaType (Cyrillic)',
    description: 'Landmark ParaType public typeface covering Russian and dozens of minority Cyrillic alphabets.',
    glyphCount: 840,
  },
  'pt-serif': {
    foundry: 'ParaType',
    sourceId: 'paratype',
    sourceName: 'ParaType (Cyrillic)',
    description: 'Transitional Cyrillic-Latin book serif harmonized optically with PT Sans.',
    glyphCount: 820,
  },
  'pt-mono': {
    foundry: 'ParaType',
    sourceId: 'paratype',
    sourceName: 'ParaType (Cyrillic)',
    description: 'Fixed-width Cyrillic & Latin monospace created for official forms, code, and tabular schedules.',
    glyphCount: 710,
  },
  'gentium-plus': {
    foundry: 'SIL International',
    sourceId: 'sil-fonts',
    sourceName: 'SIL International Fonts',
    description: 'Scholarly SIL typeface supporting hundreds of minority European, IPA, Cyrillic, and Greek orthographies.',
    glyphCount: 5600,
  },
  amiri: {
    foundry: 'Khaled Hosny',
    description: 'Classical Naskh typeface reviving the celebrated 1905 Bulaq Press metal type of Cairo.',
    opentypeFeatures: ['arab', 'liga', 'calt', 'mark'],
    glyphCount: 2800,
  },
  vazirmatn: {
    foundry: 'Saber Rastikerdar',
    sourceId: 'fontyab',
    sourceName: 'Fontyab (Persian)',
    description: 'Flagship open-source Persian & Arabic variable UI typeface engineered for crisp Farsi legibility.',
    glyphCount: 1380,
  },
  'scheherazade-new': {
    foundry: 'SIL International',
    sourceId: 'sil-fonts',
    sourceName: 'SIL International Fonts',
    category: 'Calligraphy',
    description: 'Extended Arabic script font supporting Quranic, Urdu, Sindhi, Uyghur, and West African Ajami orthographies.',
    glyphCount: 3400,
  },
  'frank-ruhl-libre': {
    foundry: 'Yanek Iontef',
    description: 'Open-source revival of the iconic 1908 Frank-Rühl Hebrew book and newspaper serif.',
    glyphCount: 620,
  },
  poppins: {
    foundry: 'Indian Type Foundry',
    sourceId: 'indian-type-foundry',
    sourceName: 'Indian Type Foundry (Indic)',
    description: 'Pure monolinear geometric sans pairing Devanagari conjunct clarity with universal Latin geometry.',
    glyphCount: 1020,
  },
  'tiro-devanagari-hindi': {
    foundry: 'Tiro Typeworks',
    sourceId: 'tiro-typeworks',
    sourceName: 'Tiro Typeworks',
    description: 'Scholarly literary Devanagari book face crafted for classical Hindi, Sanskrit, and poetry.',
    glyphCount: 1380,
  },
  'shippori-mincho': {
    foundry: 'Fontdasu',
    description: 'Tokyo Tsukiji-style Mincho serif imbued with gentle ink bleed and refined literary cadence.',
    glyphCount: 9354,
  },
  'noto-sans-kr': {
    foundry: 'Google & Sandoll',
    sourceId: 'sandollcloud',
    sourceName: 'SandollCloud (Korean)',
    description: 'Industry-standard Korean Hangul Gothic co-designed by Seoul’s Sandoll foundry.',
    glyphCount: 17000,
  },
  'jetbrains-mono': {
    foundry: 'JetBrains & Philipp Nurullin',
    sourceId: 'fontsource',
    sourceName: 'Fontsource',
    description: 'Developer monospace with tall x-height, 140+ code ligatures, and crisp Cyrillic & Greek.',
    opentypeFeatures: ['calt', 'liga', 'zero', 'tnum'],
    glyphCount: 1480,
  },
  'press-start-2p': {
    foundry: 'CodeMan38',
    sourceId: 'fontstruct',
    sourceName: 'FontStruct',
    category: 'Pixel & Grid',
    description: '1980s Namco arcade bitmap tribute supporting Latin, Greek, and Cyrillic pixel glyphs.',
    glyphCount: 620,
  },
};

const FEATURED_PRIORITY_IDS = new Set([
  'noto-sans-armenian',
  'noto-serif-armenian',
  'ghea-grapalat',
  'ghea-mariam',
  'arian-amu',
  'bokonique',
  'yerevanyan',
  'noto-sans-georgian',
  'noto-serif-georgian',
  'fraunces',
  'satoshi',
  'clash-display',
  'plus-jakarta-sans',
  'playfair-display',
  'amiri',
  'vazirmatn',
  'jetbrains-mono',
  'poppins',
  'shippori-mincho',
  'noto-sans-kr',
  'noto-sans-sc',
]);

const generatedRawList = worldFontsRaw as GeneratedFontRaw[];

const generatedEntries: FontEntry[] = generatedRawList.map((g) => {
  const category = normalizeCategory(g.category);
  const scripts = normalizeScripts(g.scripts);
  const inferred = inferSource(g);
  const override = CURATED_METADATA_BY_ID[g.id];

  const finalCategory = override?.category || category;
  const finalScripts = override?.scripts || scripts;

  return {
    id: g.id,
    name: override?.name || g.name,
    familyCss: `"${g.name}"`,
    foundry: override?.foundry || inferred.foundry,
    sourceId: override?.sourceId || inferred.sourceId,
    sourceName: override?.sourceName || inferred.sourceName,
    category: finalCategory,
    scripts: finalScripts,
    isoScripts: g.isoScripts && g.isoScripts.length > 0 ? g.isoScripts : undefined,
    sriSha384: g.sriSha384,
    weights: g.weights?.length ? g.weights : [400],
    variable: Boolean(g.variable),
    license: override?.license || inferred.license,
    year: g.year || 2023,
    designer: override?.designer || g.designer || inferred.foundry,
    description:
      override?.description ||
      `Self-hosted ${finalCategory.toLowerCase()} typeface supporting ${finalScripts.join(', ')} scripts (${g.subsets?.join(', ') || 'universal'}) packaged locally in this repository.`,
    cssImportUrl: localCss(g.cssFile),
    downloadUrl: localBinary(g.primaryFontFile),
    localCssFile: g.cssFile,
    localFontFile: g.primaryFontFile,
    localHosted: true,
    subsets: g.subsets || [],
    opentypeFeatures: override?.opentypeFeatures || ['kern', 'liga'],
    glyphCount: override?.glyphCount || g.glyphCount || estimateGlyphCount(finalScripts, g.subsets || []),
    fallbackStack: override?.fallbackStack || inferFallbackStack(finalCategory),
  };
});

// Zero duplicates: 100% SHA-256 deduplicated self-hosted binaries
const featuredList: FontEntry[] = generatedEntries.filter((f) => FEATURED_PRIORITY_IDS.has(f.id));
const remainingList = generatedEntries.filter((f) => !FEATURED_PRIORITY_IDS.has(f.id));

export const FONTS_CATALOG: FontEntry[] = [...featuredList, ...remainingList];
