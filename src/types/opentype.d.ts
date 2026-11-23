declare module 'opentype.js' {
  export interface PathCommand {
    type: 'M' | 'L' | 'C' | 'Q' | 'Z';
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }

  export class Path {
    commands: PathCommand[];
    fill: string | null;
    stroke: string | null;
    strokeWidth: number;
    constructor();
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
    quadraticCurveTo(x1: number, y1: number, x: number, y: number): void;
    close(): void;
    toSVG(decimalPlaces?: number): string;
    toPathData(decimalPlaces?: number): string;
    getBoundingBox(): { x1: number; y1: number; x2: number; y2: number };
  }

  export interface GlyphOptions {
    name: string;
    unicode?: number;
    unicodes?: number[];
    advanceWidth: number;
    leftSideBearing?: number;
    path: Path;
  }

  export class Glyph {
    name: string;
    unicode?: number;
    unicodes: number[];
    advanceWidth: number;
    path: Path;
    constructor(options: GlyphOptions);
  }

  export interface FontOptions {
    familyName: string;
    styleName: string;
    unitsPerEm: number;
    ascender: number;
    descender: number;
    glyphs: Glyph[];
    copyright?: string;
    description?: string;
    designer?: string;
    license?: string;
    version?: string;
  }

  export class Font {
    familyName: string;
    styleName: string;
    unitsPerEm: number;
    ascender: number;
    descender: number;
    names: {
      fontFamily?: Record<string, string>;
      fontSubfamily?: Record<string, string>;
      designer?: Record<string, string>;
      license?: Record<string, string>;
    };
    glyphs: { length: number; get(index: number): Glyph };
    constructor(options: FontOptions);
    getEnglishName(name: string): string;
    toArrayBuffer(): ArrayBuffer;
    download(fileName?: string): void;
    charToGlyph(c: string): Glyph;
  }

  export function parse(buffer: ArrayBuffer): Font;
}
