export type ScriptCode =
  | 'latin'
  | 'armenian'
  | 'georgian'
  | 'cyrillic'
  | 'greek'
  | 'arabic'
  | 'persian'
  | 'hebrew'
  | 'devanagari'
  | 'bengali'
  | 'tamil'
  | 'indic-other'
  | 'cjk-sc'
  | 'cjk-tc'
  | 'japanese'
  | 'korean'
  | 'thai'
  | 'ethiopic'
  | 'global-other'
  | 'symbolic';

export type FontCategory =
  | 'Serif'
  | 'Sans'
  | 'Display'
  | 'Monospace'
  | 'Calligraphy'
  | 'Handwriting'
  | 'Pixel & Grid';

export type LicenseType =
  | 'OFL-1.1'
  | 'Apache-2.0'
  | 'MIT / GPL'
  | 'Freeware'
  | 'Commercial / Trial';

export type SourceCategory =
  | 'Global Open Source'
  | 'Online Archives'
  | 'Commercial Foundries'
  | 'Armenian & Regional'
  | 'Discovery & Tools';

export interface ScriptMeta {
  code: ScriptCode;
  name: string;
  nativeName: string;
  region: string;
  direction: 'ltr' | 'rtl';
  sampleSentence: string;
  alphabetPreview: string;
  unicodeRange: string;
}

export interface FontSource {
  id: string;
  name: string;
  url: string;
  category: SourceCategory;
  region: string;
  scripts: ScriptCode[];
  licenseModel: string;
  description: string;
  featuredFontsCount: string;
}

export interface FontEntry {
  id: string;
  name: string;
  familyCss: string;
  foundry: string;
  sourceId: string;
  sourceName: string;
  category: FontCategory;
  scripts: ScriptCode[];
  weights: number[];
  variable: boolean;
  license: LicenseType;
  year: number;
  designer: string;
  description: string;
  cssImportUrl?: string;
  downloadUrl: string;
  cdnFontFaceUrl?: string;
  localCssFile?: string;
  localFontFile?: string;
  localHosted?: boolean;
  subsets?: string[];
  isoScripts?: string[];
  sriSha384?: string;
  opentypeFeatures: string[];
  glyphCount: number;
  sampleOverride?: string;
  fallbackStack: string;
}

export interface IsoWorldLanguage {
  id: string;
  part1?: string;
  status: 'L' | 'E' | 'H' | 'A' | 'C' | 'S';
  isoScript: string;
  appScript: ScriptCode;
  dir: 'ltr' | 'rtl';
  name: string;
  confidence: 'curated' | 'cldr' | 'historical-rule' | 'latin-fallback';
}

export interface EmbedHostConfig {
  baseUrl: string;
  fontsPath: string;
  customFontOverrides: Record<string, string>;
}

export interface UnicodeBlockInfo {
  id: string;
  name: string;
  script: ScriptCode;
  start: number;
  end: number;
  description: string;
}

export interface StudioStroke {
  id: string;
  points: { x: number; y: number }[];
  brushWidth: number;
  tool: 'pen' | 'calligraphy' | 'line' | 'rect' | 'circle' | 'eraser';
  calligraphyAngle?: number;
}

export interface StudioGlyphData {
  char: string;
  unicode: number;
  strokes: StudioStroke[];
  tracedMask?: number[]; // 0 or 1 flat bitmap of size gridSize * gridSize from image tracing
  gridSize?: number;
  advanceWidth: number;
}

export interface StudioFontMeta {
  familyName: string;
  styleName: string;
  designer: string;
  license: string;
  description: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
}

export interface CompiledStudioFont {
  familyName: string;
  buffer: ArrayBuffer;
  base64: string;
  glyphCount: number;
  compiledAt: number;
}
