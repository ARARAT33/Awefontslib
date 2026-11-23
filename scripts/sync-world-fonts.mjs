import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('public/fonts');
const INDEX_OUT = path.resolve('src/data/worldFontsGenerated.json');
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FULL_CJK_FAMILIES = new Set([
  'Noto Sans JP',
  'Noto Sans KR',
  'Noto Sans SC',
  'Noto Sans TC',
  'Noto Serif SC',
  'Shippori Mincho',
  'Klee One',
  'DotGothic16',
  'Nanum Myeongjo',
  'Black Han Sans',
]);

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapSubsetsToScripts(subsets = [], familyName = '') {
  const scripts = new Set();
  const lower = familyName.toLowerCase();

  for (const s of subsets) {
    if (s === 'latin' || s === 'latin-ext' || s === 'vietnamese') scripts.add('latin');
    else if (s === 'armenian') scripts.add('armenian');
    else if (s === 'georgian') scripts.add('georgian');
    else if (s === 'cyrillic' || s === 'cyrillic-ext') scripts.add('cyrillic');
    else if (s === 'greek' || s === 'greek-ext') scripts.add('greek');
    else if (s === 'arabic') {
      scripts.add('arabic');
      if (lower.includes('vazir') || lower.includes('lalezar') || lower.includes('noto') || lower.includes('amiri') || lower.includes('scheherazade')) {
        scripts.add('persian');
      }
    } else if (s === 'hebrew') scripts.add('hebrew');
    else if (s === 'devanagari') scripts.add('devanagari');
    else if (s === 'bengali') scripts.add('bengali');
    else if (s === 'tamil') scripts.add('tamil');
    else if (s === 'chinese-simplified') scripts.add('cjk-sc');
    else if (s === 'chinese-traditional') scripts.add('cjk-tc');
    else if (s === 'japanese') scripts.add('japanese');
    else if (s === 'korean') scripts.add('korean');
    else if (s === 'thai') scripts.add('thai');
    else if (s === 'ethiopic') scripts.add('ethiopic');
    else if (s === 'math' || s === 'symbols' || s === 'symbols2' || s === 'braille') scripts.add('symbolic');
    else if (
      ['telugu', 'kannada', 'malayalam', 'gujarati', 'gurmukhi', 'oriya', 'sinhala'].includes(s)
    ) {
      scripts.add('indic-other');
    } else if (['khmer', 'lao', 'myanmar', 'tibetan', 'cherokee', 'syriac', 'adlam', 'canadian-aboriginal', 'tifinagh', 'javanese', 'sundanese', 'balinese'].includes(s)) {
      scripts.add('global-other');
    }
  }

  if (scripts.size === 0) scripts.add('latin');
  return Array.from(scripts);
}

function mapCategory(gfCategory, familyName) {
  const lower = familyName.toLowerCase();
  if (lower.includes('pixel') || lower.includes('dot') || lower.includes('press start') || lower.includes('silkscreen') || lower.includes('vt323')) {
    return 'Pixel & Grid';
  }
  if (gfCategory === 'Serif') return 'Serif';
  if (gfCategory === 'Sans Serif') return 'Sans';
  if (gfCategory === 'Monospace') return 'Monospace';
  if (gfCategory === 'Handwriting') return 'Handwriting';
  if (gfCategory === 'Display') return 'Display';
  return 'Sans';
}

async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (attempt === retries) return res;
    } catch (err) {
      if (attempt === retries) throw err;
    }
    await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
  }
}

async function processGoogleFamily(f) {
  const id = slugify(f.family);
  const cssPath = path.join(OUT_DIR, `${id}.css`);
  const weights = Object.keys(f.fonts || {})
    .filter((k) => !k.endsWith('i'))
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  const defaultWeight = weights.includes(400) ? 400 : (weights[0] || 400);
  const queryFamily = encodeURIComponent(f.family).replace(/%20/g, '+');
  const gfUrl =
    defaultWeight === 400
      ? `https://fonts.googleapis.com/css2?family=${queryFamily}&display=swap`
      : `https://fonts.googleapis.com/css2?family=${queryFamily}:wght@${defaultWeight}&display=swap`;

  const scripts = mapSubsetsToScripts(f.subsets, f.family);
  const isCjk =
    scripts.includes('japanese') ||
    scripts.includes('korean') ||
    scripts.includes('cjk-sc') ||
    scripts.includes('cjk-tc');

  // Skip re-downloading if already synced on disk
  let primaryFile = `${id}-0.woff2`;
  if (fs.existsSync(cssPath)) {
    const existingCss = fs.readFileSync(cssPath, 'utf8');
    const firstMatch = existingCss.match(/url\('\.\/([^']+\.woff2)'\)/);
    if (firstMatch) primaryFile = firstMatch[1];
    return {
      id,
      name: f.family,
      category: mapCategory(f.category, f.family),
      scripts,
      weights: weights.length ? weights : [defaultWeight],
      variable: Array.isArray(f.axes) && f.axes.length > 0,
      designer: (f.designers && f.designers.join(', ')) || 'Google Fonts Contributor',
      year: f.dateAdded ? Number(f.dateAdded.slice(0, 4)) : 2022,
      subsets: (f.subsets || []).filter((s) => s !== 'menu'),
      isNoto: Boolean(f.isNoto),
      cssFile: `${id}.css`,
      primaryFontFile: primaryFile,
      localHosted: true,
    };
  }

  try {
    const cssRes = await fetchWithRetry(gfUrl, { headers: { 'User-Agent': CHROME_UA } });
    if (!cssRes || !cssRes.ok) {
      return null;
    }
    let cssText = await cssRes.text();

    // Parse @font-face blocks
    const blockRegex = /(?:\/\*[^*]*\*\/\s*)?@font-face\s*\{[^}]+\}/g;
    let blocks = cssText.match(blockRegex) || [];
    if (blocks.length === 0) return null;

    // For very large CJK fonts outside our top 10 list, keep the primary 12 subsets (incl. latin + common glyphs)
    if (isCjk && !FULL_CJK_FAMILIES.has(f.family) && blocks.length > 16) {
      blocks = blocks.slice(-16);
    }

    const rewrittenBlocks = [];
    let fileIdx = 0;

    for (const block of blocks) {
      const urlMatch = block.match(/url\((https:\/\/[^)]+\.woff2)\)/);
      if (!urlMatch) continue;
      const remoteUrl = urlMatch[1];
      const localName = `${id}-${fileIdx}.woff2`;
      const localPath = path.join(OUT_DIR, localName);

      if (!fs.existsSync(localPath)) {
        const binRes = await fetchWithRetry(remoteUrl);
        if (!binRes || !binRes.ok) continue;
        const buf = Buffer.from(await binRes.arrayBuffer());
        fs.writeFileSync(localPath, buf);
      }

      if (fileIdx === 0) primaryFile = localName;
      rewrittenBlocks.push(block.replace(remoteUrl, `'./${localName}'`));
      fileIdx++;
    }

    if (rewrittenBlocks.length === 0) return null;
    fs.writeFileSync(cssPath, rewrittenBlocks.join('\n') + '\n');

    return {
      id,
      name: f.family,
      category: mapCategory(f.category, f.family),
      scripts,
      weights: weights.length ? weights : [defaultWeight],
      variable: Array.isArray(f.axes) && f.axes.length > 0,
      designer: (f.designers && f.designers.join(', ')) || 'Google Fonts Contributor',
      year: f.dateAdded ? Number(f.dateAdded.slice(0, 4)) : 2022,
      subsets: (f.subsets || []).filter((s) => s !== 'menu'),
      isNoto: Boolean(f.isNoto),
      cssFile: `${id}.css`,
      primaryFontFile: primaryFile,
      localHosted: true,
    };
  } catch {
    return null;
  }
}

async function processFontshareSlug(slug, name, designer) {
  const id = slugify(name);
  const cssPath = path.join(OUT_DIR, `${id}.css`);
  if (fs.existsSync(cssPath)) {
    return {
      id,
      name,
      category: name.includes('Display') || name.includes('Cabinet') ? 'Display' : 'Sans',
      scripts: ['latin'],
      weights: [400, 500, 700],
      variable: true,
      designer,
      year: 2021,
      subsets: ['latin'],
      isNoto: false,
      cssFile: `${id}.css`,
      primaryFontFile: `${id}-0.woff2`,
      localHosted: true,
      sourceTag: 'Fontshare',
    };
  }

  try {
    const res = await fetchWithRetry(`https://api.fontshare.com/v2/css?f[]=${slug}@400,700&display=swap`, {
      headers: { 'User-Agent': CHROME_UA },
    });
    if (!res || !res.ok) return null;
    const cssText = await res.text();
    const blocks = cssText.match(/@font-face\s*\{[^}]+\}/g) || [];
    const rewrittenBlocks = [];
    let fileIdx = 0;

    for (const block of blocks.slice(0, 2)) {
      const urlMatch = block.match(/url\(['"]?(https?:\/\/[^)'"]+\.woff2|\/\/[^)'"]+\.woff2)['"]?\)/);
      if (!urlMatch) continue;
      let remoteUrl = urlMatch[1];
      if (remoteUrl.startsWith('//')) remoteUrl = `https:${remoteUrl}`;
      const localName = `${id}-${fileIdx}.woff2`;
      const localPath = path.join(OUT_DIR, localName);
      const binRes = await fetchWithRetry(remoteUrl);
      if (!binRes || !binRes.ok) continue;
      fs.writeFileSync(localPath, Buffer.from(await binRes.arrayBuffer()));
      rewrittenBlocks.push(block.replace(urlMatch[1], `./${localName}`));
      fileIdx++;
    }

    if (rewrittenBlocks.length === 0) return null;
    fs.writeFileSync(cssPath, rewrittenBlocks.join('\n') + '\n');

    return {
      id,
      name,
      category: name.includes('Display') || name.includes('Cabinet') ? 'Display' : 'Sans',
      scripts: ['latin'],
      weights: [400, 500, 700],
      variable: true,
      designer,
      year: 2021,
      subsets: ['latin'],
      isNoto: false,
      cssFile: `${id}.css`,
      primaryFontFile: `${id}-0.woff2`,
      localHosted: true,
      sourceTag: 'Fontshare',
    };
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Fetching global font metadata...');
  const metaRes = await fetchWithRetry('https://fonts.google.com/metadata/fonts');
  const metaJson = JSON.parse((await metaRes.text()).replace(/^\)\]\}'\n?/, ''));
  const families = metaJson.familyMetadataList;
  console.log(`Found ${families.length} global font families. Downloading self-hosted .woff2 & .css files...`);

  const results = [];
  const CONCURRENCY = 20;

  for (let i = 0; i < families.length; i += CONCURRENCY) {
    const chunk = families.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map(processGoogleFamily));
    for (const item of chunkResults) {
      if (item) results.push(item);
    }
    if ((i + CONCURRENCY) % 200 === 0 || i + CONCURRENCY >= families.length) {
      console.log(`Processed ${Math.min(i + CONCURRENCY, families.length)} / ${families.length} (saved ${results.length})`);
    }
  }

  // Also bundle key Fontshare families locally
  const fontshareEntries = [
    ['satoshi', 'Satoshi', 'Deni Anggara / ITF'],
    ['clash-display', 'Clash Display', 'Indian Type Foundry'],
    ['cabinet-grotesk', 'Cabinet Grotesk', 'Frodo Type / ITF'],
    ['switzer', 'Switzer', 'Jérémie Hornus / ITF'],
    ['general-sans', 'General Sans', 'Frodo Type / ITF'],
    ['zodiak', 'Zodiak', 'Jérémie Hornus / ITF'],
  ];

  for (const [slug, name, designer] of fontshareEntries) {
    const existing = results.find((r) => r.id === slugify(name));
    if (!existing) {
      const fsItem = await processFontshareSlug(slug, name, designer);
      if (fsItem) results.push(fsItem);
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(INDEX_OUT, JSON.stringify(results));

  // Generate an all-in-one manifest JSON in public/fonts
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalFonts: results.length,
      fonts: results.map((r) => ({ id: r.id, name: r.name, css: r.cssFile, woff2: r.primaryFontFile, scripts: r.scripts })),
    })
  );

  console.log(`Done! Saved ${results.length} self-hosted fonts into ${OUT_DIR} and ${INDEX_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
