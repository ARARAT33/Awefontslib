import test from 'node:test';
import assert from 'node:assert/strict';
import opentype from 'opentype.js';
import { FONTS_CATALOG } from '../data/fontsCatalog';
import { FONT_SOURCES } from '../data/sources';
import { WORLD_SCRIPTS, UNICODE_BLOCKS } from '../data/scripts';
import {
  WORLD_LANGUAGES,
  STUDIO_WORLD_CHARSETS,
  ISO_WORLD_LANGUAGES,
  searchIsoLanguages,
  getFontsForIsoLanguage,
} from '../data/worldLanguages';
import { filterFonts, filterSources, countFontsByScript } from './fontFilters';
import {
  generateHtmlLinkEmbed,
  generatePreloadHtmlEmbed,
  generateWebComponentEmbed,
  generateFrameworkAdapterEmbed,
  generateSecurityHeadersSnippet,
  generateCssImportEmbed,
  generateDirectFontFaceEmbed,
  generateLoaderSdkEmbed,
  generateParametricFontCss,
  generateStaticApiSnippet,
  generatePairingCss,
  generateStudioEmbedSnippet,
  generateProjectKitBundleFiles,
  resolveFontCssUrl,
} from './fontEmbedder';
import {
  applyParametricGridTransform,
  compileParametricStudioFont,
  extractGridContours,
  contoursToOpenTypePath,
  compileStudioFont,
  polygonSignedArea,
} from './otfCompiler';
import { EmbedHostConfig, StudioGlyphData } from '../types/font';

test('sources directory includes all major world collections and regional hubs', () => {
  const names = new Set(FONT_SOURCES.map((s) => s.name));
  const mustHave = [
    'Google Fonts',
    'Google Noto Fonts',
    'SIL International Fonts',
    'Fontshare',
    'Fontsource',
    'Velvetyne Type Foundry',
    'The League of Moveable Type',
    'FontSpace',
    'DaFont',
    'MyFonts',
    'Adobe Fonts',
    'Monotype',
    'Fonter.am (Armenian)',
    'Tarumian.am (Armenian)',
    'Armenian Fonts',
    'Fonts.ge (Georgian)',
    'ParaType (Cyrillic)',
    'Arfonts (Arabic)',
    'Fontyab (Persian)',
    'FounderType (Chinese)',
    'Morisawa (Japanese)',
    'SandollCloud (Korean)',
    'Indian Type Foundry (Indic)',
    'Ek Type (Indic)',
    'AlefAlefAlef (Hebrew)',
    'FontForge',
    'Glyphr Studio',
    'Unicode Charts',
  ];
  for (const name of mustHave) {
    assert.ok(names.has(name), `Expected source "${name}" to be present`);
  }
  assert.ok(FONT_SOURCES.length >= 85, `Expected 85+ sources, got ${FONT_SOURCES.length}`);
});

test('FONTS_CATALOG bundles 2220+ strictly unique non-duplicate fonts and 7900+ ISO 639-3 languages', () => {
  assert.ok(FONTS_CATALOG.length >= 2220, `Expected 2220+ unique fonts, got ${FONTS_CATALOG.length}`);
  assert.ok(WORLD_LANGUAGES.length >= 140, `Expected 140+ curated languages, got ${WORLD_LANGUAGES.length}`);
  assert.ok(ISO_WORLD_LANGUAGES.length >= 7900, `Expected 7900+ ISO languages, got ${ISO_WORLD_LANGUAGES.length}`);
  assert.ok(STUDIO_WORLD_CHARSETS.length >= 35, `Expected 35+ studio charsets, got ${STUDIO_WORLD_CHARSETS.length}`);
  assert.ok(UNICODE_BLOCKS.length >= 34, `Expected 34+ unicode blocks, got ${UNICODE_BLOCKS.length}`);

  const seenIds = new Set<string>();
  const seenBinaries = new Set<string>();
  for (const font of FONTS_CATALOG) {
    assert.ok(!seenIds.has(font.id), `Duplicate catalog font id: ${font.id}`);
    seenIds.add(font.id);
    assert.ok(!seenBinaries.has(font.downloadUrl), `Duplicate binary url: ${font.downloadUrl} on ${font.id}`);
    seenBinaries.add(font.downloadUrl);
    assert.equal(font.localHosted, true, `${font.id} must be self-hosted`);
    assert.ok(font.cssImportUrl?.startsWith('/fonts/'), `${font.id} cssImportUrl must be local /fonts/`);
    assert.ok(font.downloadUrl.startsWith('/fonts/'), `${font.id} downloadUrl must be local /fonts/`);
    assert.ok(!font.cssImportUrl?.includes('fonts.googleapis.com'));
  }

  // Verify real Armenian font collection expanded authentically without duplicates
  const armFonts = filterFonts(FONTS_CATALOG, {
    query: '',
    script: 'armenian',
    isoScript: 'Armn',
    category: 'all',
    variableOnly: false,
    sourceId: 'all',
    sortBy: 'name',
  });
  assert.ok(armFonts.length >= 50, `Expected 50+ unique Armenian fonts, got ${armFonts.length}`);

  // Verify ISO 639-3 lookup across Living + Extinct + Historical languages
  const xcl = searchIsoLanguages('xcl', 'all', 5);
  assert.ok(xcl.some((l) => l.id === 'xcl' && l.isoScript === 'Armn'));
  const sumerian = searchIsoLanguages('sux', 'H', 5);
  assert.ok(sumerian.some((l) => l.id === 'sux' && l.isoScript === 'Xsux'));
  const suxFonts = getFontsForIsoLanguage(sumerian[0], FONTS_CATALOG);
  assert.ok(suxFonts.some((f) => f.id === 'noto-sans-cuneiform'));
  const extinctSamples = searchIsoLanguages('', 'E', 5);
  assert.equal(extinctSamples.length, 5);
  assert.ok(extinctSamples.every((l) => l.status === 'E'));
});

test('filterFonts accurately filters by script, category, and search query', () => {
  const armenianFonts = filterFonts(FONTS_CATALOG, {
    query: '',
    script: 'armenian',
    category: 'all',
    variableOnly: false,
    sourceId: 'all',
    sortBy: 'name',
  });
  assert.ok(armenianFonts.length >= 50, 'Should include 50+ unique Armenian fonts');
  assert.ok(armenianFonts.every((f) => f.scripts.includes('armenian')));

  const notoQuery = filterFonts(FONTS_CATALOG, {
    query: 'Noto',
    script: 'all',
    category: 'all',
    variableOnly: false,
    sourceId: 'all',
    sortBy: 'glyphs',
  });
  assert.ok(notoQuery.length >= 5);
  assert.ok(notoQuery[0].glyphCount >= notoQuery[notoQuery.length - 1].glyphCount);

  const counts = countFontsByScript(FONTS_CATALOG);
  assert.equal(counts.all, FONTS_CATALOG.length);
  for (const script of WORLD_SCRIPTS) {
    assert.ok((counts[script.code] || 0) >= 1, `Script ${script.code} should have at least 1 font`);
  }
});

test('filterSources filters by category and script', () => {
  const regionalArmenian = filterSources(FONT_SOURCES, {
    query: '',
    category: 'Armenian & Regional',
    script: 'armenian',
  });
  assert.ok(regionalArmenian.length >= 3);
  assert.ok(regionalArmenian.every((s) => s.category === 'Armenian & Regional' && s.scripts.includes('armenian')));
});

test('fontEmbedder routes all embed links through user-controlled host config', () => {
  const sampleFont = FONTS_CATALOG[0];
  const secondFont = FONTS_CATALOG[1];
  const hostConfig: EmbedHostConfig = {
    baseUrl: 'https://cdn.armeniatype.am/',
    fontsPath: 'static-fonts/',
    customFontOverrides: {
      [secondFont.id]: 'https://custom.armeniatype.am/special.css',
    },
  };

  assert.equal(
    resolveFontCssUrl(sampleFont, hostConfig),
    `https://cdn.armeniatype.am/static-fonts/${sampleFont.localCssFile}`
  );
  assert.equal(
    resolveFontCssUrl(secondFont, hostConfig),
    'https://custom.armeniatype.am/special.css'
  );

  const html = generateHtmlLinkEmbed(sampleFont, hostConfig);
  assert.match(html, new RegExp(`https://cdn\\.armeniatype\\.am/static-fonts/${sampleFont.localCssFile}`));
  if (sampleFont.sriSha384) {
    assert.match(html, /integrity="sha384-/);
  }
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);

  const preload = generatePreloadHtmlEmbed(sampleFont, hostConfig);
  assert.match(preload, /rel="preload"/);
  assert.match(preload, /https:\/\/cdn\.armeniatype\.am\/static-fonts\//);

  const wc = generateWebComponentEmbed(sampleFont, hostConfig, 'Բարև');
  assert.match(wc, /<pangloss-type/);
  assert.match(wc, /https:\/\/cdn\.armeniatype\.am\/pangloss-loader\.js/);

  const reactCode = generateFrameworkAdapterEmbed(sampleFont, hostConfig, 'react');
  assert.match(reactCode, /useEffect/);
  const wpCode = generateFrameworkAdapterEmbed(sampleFont, hostConfig, 'wordpress');
  assert.match(wpCode, /wp_enqueue_style/);
  const svgCode = generateFrameworkAdapterEmbed(sampleFont, hostConfig, 'svg');
  assert.match(svgCode, /<svg/);

  const sec = generateSecurityHeadersSnippet(hostConfig, sampleFont);
  assert.match(sec, /Content-Security-Policy/);
  assert.match(sec, /https:\/\/cdn\.armeniatype\.am/);

  const css = generateCssImportEmbed(sampleFont, hostConfig);
  assert.match(css, /@import url\('https:\/\/cdn\.armeniatype\.am\/static-fonts\//);
  assert.match(css, new RegExp(`--font-${sampleFont.id}`));

  const fontFace = generateDirectFontFaceEmbed(sampleFont, hostConfig);
  assert.match(fontFace, /@font-face/);
  assert.match(fontFace, /https:\/\/cdn\.armeniatype\.am\/static-fonts\//);

  const pairing = generatePairingCss(sampleFont, secondFont, hostConfig);
  assert.match(pairing, /https:\/\/cdn\.armeniatype\.am\/static-fonts\//);
  assert.match(pairing, /https:\/\/custom\.armeniatype\.am\/special\.css/);

  const studioHtml = generateStudioEmbedSnippet(
    {
      familyName: 'YerevanDisplay',
      styleName: 'Regular',
      designer: 'Test Designer',
      license: 'OFL-1.1',
      description: 'Test',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
    },
    'AAAA',
    'ԱԲԳ ABC'
  );
  assert.match(studioHtml, /data:font\/otf;base64,AAAA/);
  assert.match(studioHtml, /YerevanDisplay/);

  const kit = generateProjectKitBundleFiles(FONTS_CATALOG.slice(0, 3), hostConfig);
  assert.match(kit.css, /https:\/\/cdn\.armeniatype\.am\/static-fonts\//);
  assert.doesNotMatch(kit.css, /fonts\.googleapis\.com/);
  const parsedTokens = JSON.parse(kit.tokensJson);
  assert.equal(parsedTokens.fontCount, 3);
  assert.equal(parsedTokens.configuredHost, 'https://cdn.armeniatype.am/static-fonts');
  assert.match(kit.demoHtml, /Pangloss Project Kit/);
});

test('otfCompiler extracts outer + inner hole contours and compiles a valid parseable OTF binary', () => {
  const size = 10;
  const grid = new Uint8Array(size * size);
  for (let y = 2; y <= 7; y++) {
    for (let x = 2; x <= 7; x++) {
      const isBorder = x === 2 || x === 7 || y === 2 || y === 7;
      if (isBorder) grid[y * size + x] = 1;
    }
  }

  const contours = extractGridContours(grid, size, size);
  assert.equal(contours.length, 2, 'Hollow square should extract 1 outer contour and 1 inner hole contour');

  const path = contoursToOpenTypePath(contours, size, 1000, 800, 0.1);
  assert.ok(path.commands.length >= 8, 'Compiled OpenType path should have commands');

  const area0 = polygonSignedArea(contours[0]);
  const area1 = polygonSignedArea(contours[1]);
  assert.ok(area0 * area1 < 0, 'Outer contour and inner hole must have opposite winding signs');

  const glyphMap: Record<string, StudioGlyphData> = {
    A: {
      char: 'A',
      unicode: 65,
      advanceWidth: 680,
      strokes: [
        {
          id: 's1',
          tool: 'pen',
          brushWidth: 28,
          points: [
            { x: 100, y: 340 },
            { x: 200, y: 80 },
            { x: 300, y: 340 },
          ],
        },
        {
          id: 's2',
          tool: 'line',
          brushWidth: 24,
          points: [
            { x: 140, y: 230 },
            { x: 260, y: 230 },
          ],
        },
      ],
    },
    Ա: {
      char: 'Ա',
      unicode: 0x0531,
      advanceWidth: 740,
      strokes: [
        {
          id: 's3',
          tool: 'pen',
          brushWidth: 26,
          points: [
            { x: 110, y: 120 },
            { x: 110, y: 320 },
            { x: 200, y: 320 },
            { x: 200, y: 160 },
            { x: 290, y: 320 },
          ],
        },
      ],
    },
  };

  const compiled = compileStudioFont(
    {
      familyName: 'PanglossTestArmenian',
      styleName: 'Regular',
      designer: 'UnitTest',
      license: 'OFL-1.1',
      description: 'Test compiled font',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
    },
    glyphMap,
    400
  );

  assert.equal(compiled.glyphCount, 2);
  assert.ok(compiled.buffer.byteLength > 200, 'OTF buffer should be non-empty');
  assert.ok(compiled.base64.length > 100, 'Base64 string should be non-empty');

  const parsedFont = opentype.parse(compiled.buffer);
  assert.equal(parsedFont.getEnglishName('fontFamily'), 'PanglossTestArmenian');
  const armGlyph = parsedFont.charToGlyph('Ա');
  assert.equal(armGlyph.unicode, 0x0531);
  assert.ok(armGlyph.path.commands.length > 4, 'Armenian Ա glyph must have vector outline commands');
});

test('Parametric CSS, Loader SDK, Static API snippets, and Parametric OTF synthesis work cleanly', () => {
  const sampleFont = FONTS_CATALOG[0];
  const hostConfig: EmbedHostConfig = {
    baseUrl: 'https://type.mysite.org',
    fontsPath: '/fonts',
    customFontOverrides: {},
  };

  const sdkHtml = generateLoaderSdkEmbed(['fraunces', 'noto-sans-armenian'], hostConfig);
  assert.match(sdkHtml, /https:\/\/type\.mysite\.org\/pangloss-loader\.js/);
  assert.match(sdkHtml, /data-fonts="fraunces,noto-sans-armenian"/);

  const apiJs = generateStaticApiSnippet(hostConfig, 'languages');
  assert.match(apiJs, /https:\/\/type\.mysite\.org\/api\/languages\.json/);

  const statsJs = generateStaticApiSnippet(hostConfig, 'stats');
  assert.match(statsJs, /https:\/\/type\.mysite\.org\/api\/v1\/stats\.json/);

  const paramCss = generateParametricFontCss(
    sampleFont,
    {
      weight: 650,
      widthPercent: 112,
      obliqueDeg: -8,
      trackingEm: 0.04,
      lineHeight: 1.4,
      ligatures: true,
      tabularNums: true,
    },
    hostConfig
  );
  assert.match(paramCss, /scaleX\(1\.12\)/);
  assert.match(paramCss, /skewX\(-8deg\)/);
  assert.match(paramCss, /font-weight: 650;/);

  const dot = new Uint8Array(24 * 24);
  dot[12 * 24 + 12] = 1;
  const dilated = applyParametricGridTransform(dot, 24, {
    boldness: 1,
    slantDeg: 0,
    widthScale: 1,
  });
  const count = dilated.reduce((acc, v) => acc + v, 0);
  assert.ok(count > 1, 'Boldness dilation should increase filled ink cells');

  const glyphMap: Record<string, StudioGlyphData> = {
    A: {
      char: 'A',
      unicode: 65,
      advanceWidth: 680,
      strokes: [
        {
          id: 'p1',
          tool: 'pen',
          brushWidth: 28,
          points: [
            { x: 100, y: 320 },
            { x: 200, y: 80 },
            { x: 300, y: 320 },
          ],
        },
      ],
    },
  };
  const boldItalic = compileParametricStudioFont(
    {
      familyName: 'ParamStudioBoldItalic',
      styleName: 'Bold Italic',
      designer: 'Test',
      license: 'OFL-1.1',
      description: 'Test',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
    },
    glyphMap,
    { boldness: 1, slantDeg: 10, widthScale: 1.1 },
    400
  );
  assert.equal(boldItalic.glyphCount, 1);
  assert.ok(boldItalic.buffer.byteLength > 200);
});

