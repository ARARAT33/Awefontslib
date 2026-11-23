import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('public/fonts');
const INDEX_OUT = path.resolve('src/data/worldFontsGenerated.json');
const API_DIR = path.resolve('public/api');
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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
    else if (s === 'math' || s === 'symbols' || s === 'symbols2' || s === 'braille' || s === 'music') scripts.add('symbolic');
    else if (['telugu', 'kannada', 'malayalam', 'gujarati', 'gurmukhi', 'oriya', 'sinhala'].includes(s)) {
      scripts.add('indic-other');
    } else {
      scripts.add('global-other');
    }
  }

  if (scripts.size === 0) scripts.add('latin');
  return Array.from(scripts);
}

function mapCategory(rawCategory, familyName) {
  const lower = (familyName || '').toLowerCase();
  const cat = (rawCategory || '').toLowerCase();
  if (lower.includes('pixel') || lower.includes('dot') || lower.includes('press start') || lower.includes('silkscreen') || lower.includes('vt323')) {
    return 'Pixel & Grid';
  }
  if (cat.includes('serif') && !cat.includes('sans')) return 'Serif';
  if (cat.includes('sans')) return 'Sans';
  if (cat.includes('mono')) return 'Monospace';
  if (cat.includes('hand') || cat.includes('script')) return 'Handwriting';
  if (cat.includes('display') || cat.includes('slab')) return 'Display';
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
    await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
  }
}

async function syncFontshareExtra(existingMap) {
  console.log('Fetching full Fontshare catalog...');
  const res = await fetchWithRetry('https://api.fontshare.com/v2/fonts?limit=200');
  if (!res || !res.ok) return [];
  const data = await res.json();
  const list = data.fonts || [];
  const added = [];

  const CONCURRENCY = 12;
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const chunk = list.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (f) => {
        const id = slugify(f.slug || f.name);
        if (existingMap.has(id)) return null;
        const cssPath = path.join(OUT_DIR, `${id}.css`);
        const weights = Array.isArray(f.styles)
          ? Array.from(
              new Set(
                f.styles
                  .map((s) => Number(s.weight?.weight || s.weight || 400))
                  .filter((n) => Number.isFinite(n) && n >= 100 && n <= 900)
              )
            ).sort((a, b) => a - b)
          : [400, 700];

        try {
          const cssRes = await fetchWithRetry(
            `https://api.fontshare.com/v2/css?f[]=${f.slug}@400,700&display=swap`,
            { headers: { 'User-Agent': CHROME_UA } }
          );
          if (!cssRes || !cssRes.ok) return null;
          const cssText = await cssRes.text();
          const blocks = cssText.match(/@font-face\s*\{[^}]+\}/g) || [];
          const cleanBlocks = [];
          let fileIdx = 0;

          for (const block of blocks.slice(0, 3)) {
            const urlMatch = block.match(/url\(['"]?(https?:\/\/[^)'"]+\.woff2|\/\/[^)'"]+\.woff2)['"]?\)/);
            if (!urlMatch) continue;
            let remoteUrl = urlMatch[1];
            if (remoteUrl.startsWith('//')) remoteUrl = `https:${remoteUrl}`;
            const localName = `${id}-${fileIdx}.woff2`;
            const localPath = path.join(OUT_DIR, localName);
            if (!fs.existsSync(localPath)) {
              const binRes = await fetchWithRetry(remoteUrl);
              if (!binRes || !binRes.ok) continue;
              fs.writeFileSync(localPath, Buffer.from(await binRes.arrayBuffer()));
            }
            const weightMatch = block.match(/font-weight:\s*(\d+)/);
            const styleMatch = block.match(/font-style:\s*([a-z]+)/);
            cleanBlocks.push(
              `@font-face {\n  font-family: '${f.name}';\n  src: url('./${localName}') format('woff2');\n  font-weight: ${weightMatch ? weightMatch[1] : 400};\n  font-style: ${styleMatch ? styleMatch[1] : 'normal'};\n  font-display: swap;\n}`
            );
            fileIdx++;
          }

          if (cleanBlocks.length === 0) return null;
          fs.writeFileSync(cssPath, cleanBlocks.join('\n') + '\n');

          return {
            id,
            name: f.name,
            category: mapCategory((f.categories && f.categories[0]) || 'Sans', f.name),
            scripts: ['latin'],
            weights: weights.length ? weights : [400],
            variable: Boolean(f.is_variable),
            designer: (f.designers && f.designers.map((d) => d.name).join(', ')) || 'Indian Type Foundry / Fontshare',
            year: 2022,
            subsets: ['latin'],
            isNoto: false,
            cssFile: `${id}.css`,
            primaryFontFile: `${id}-0.woff2`,
            localHosted: true,
            sourceTag: 'fontshare',
          };
        } catch {
          return null;
        }
      })
    );
    for (const r of results) if (r) added.push(r);
  }
  console.log(`Fontshare added ${added.length} extra fonts.`);
  return added;
}

async function syncFontsourceExtra(existingMap) {
  console.log('Fetching Fontsource catalog...');
  const res = await fetchWithRetry('https://api.fontsource.org/v1/fonts');
  if (!res || !res.ok) return [];
  const list = await res.json();
  const candidates = list.filter((f) => !existingMap.has(f.id) && !existingMap.has(slugify(f.family)));
  console.log(`Found ${candidates.length} Fontsource extra families to sync...`);
  const added = [];

  const CONCURRENCY = 16;
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const chunk = candidates.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (f) => {
        const id = f.id;
        const cssPath = path.join(OUT_DIR, `${id}.css`);
        try {
          const detailRes = await fetchWithRetry(`https://api.fontsource.org/v1/fonts/${id}`);
          if (!detailRes || !detailRes.ok) return null;
          const detail = await detailRes.json();
          const defaultWeight = detail.weights?.includes(400) ? '400' : String(detail.weights?.[0] || 400);
          const variants = detail.variants?.[defaultWeight]?.normal || {};
          const subsetEntries = Object.entries(variants);
          if (subsetEntries.length === 0) return null;

          const blocks = [];
          let fileIdx = 0;
          for (const [subsetName, urls] of subsetEntries.slice(0, 6)) {
            const woff2Url = urls?.url?.woff2 || urls?.woff2;
            if (!woff2Url) continue;
            const localName = `${id}-${fileIdx}.woff2`;
            const localPath = path.join(OUT_DIR, localName);
            if (!fs.existsSync(localPath)) {
              const binRes = await fetchWithRetry(woff2Url);
              if (!binRes || !binRes.ok) continue;
              fs.writeFileSync(localPath, Buffer.from(await binRes.arrayBuffer()));
            }
            const unicodeRange = detail.unicodeRange?.[subsetName];
            blocks.push(
              `/* ${subsetName} */\n@font-face {\n  font-family: '${detail.family}';\n  font-style: normal;\n  font-weight: ${defaultWeight};\n  font-display: swap;\n  src: url('./${localName}') format('woff2');${unicodeRange ? `\n  unicode-range: ${unicodeRange};` : ''}\n}`
            );
            fileIdx++;
          }

          if (blocks.length === 0) return null;
          fs.writeFileSync(cssPath, blocks.join('\n') + '\n');

          return {
            id,
            name: detail.family,
            category: mapCategory(detail.category, detail.family),
            scripts: mapSubsetsToScripts(detail.subsets || [], detail.family),
            weights: detail.weights || [Number(defaultWeight)],
            variable: Boolean(detail.variable),
            designer: 'Fontsource Open Archive',
            year: 2023,
            subsets: detail.subsets || ['latin'],
            isNoto: id.startsWith('noto-'),
            cssFile: `${id}.css`,
            primaryFontFile: `${id}-0.woff2`,
            localHosted: true,
            sourceTag: 'fontsource',
          };
        } catch {
          return null;
        }
      })
    );
    for (const r of results) if (r) added.push(r);
  }
  console.log(`Fontsource added ${added.length} extra fonts.`);
  return added;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(API_DIR, { recursive: true });

  const existing = JSON.parse(fs.readFileSync(INDEX_OUT, 'utf8'));
  const existingMap = new Map(existing.map((e) => [e.id, e]));

  const extraFontshare = await syncFontshareExtra(existingMap);
  for (const item of extraFontshare) existingMap.set(item.id, item);

  const extraFontsource = await syncFontsourceExtra(existingMap);
  for (const item of extraFontsource) existingMap.set(item.id, item);

  const merged = Array.from(existingMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(INDEX_OUT, JSON.stringify(merged));

  const apiFontsPayload = {
    apiVersion: '1.0',
    generatedAt: new Date().toISOString(),
    totalFonts: merged.length,
    fonts: merged.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      scripts: r.scripts,
      weights: r.weights,
      variable: r.variable,
      designer: r.designer,
      subsets: r.subsets,
      cssPath: `/fonts/${r.cssFile}`,
      woff2Path: `/fonts/${r.primaryFontFile}`,
    })),
  };

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(apiFontsPayload));
  fs.writeFileSync(path.join(API_DIR, 'fonts.json'), JSON.stringify(apiFontsPayload));

  console.log(`Updated total self-hosted repository count: ${merged.length} font families!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
