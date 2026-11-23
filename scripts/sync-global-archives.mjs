import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import opentype from 'opentype.js';

const OUT_DIR = path.resolve('public/fonts');
const API_DIR = path.resolve('public/api');
const API_V1_DIR = path.resolve('public/api/v1');
const INDEX_OUT = path.resolve('src/data/worldFontsGenerated.json');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha384Sri(buf) {
  return 'sha384-' + crypto.createHash('sha384').update(buf).digest('base64');
}

function cssFormatFromExt(file) {
  const lower = file.toLowerCase();
  if (lower.endsWith('.woff2')) return 'woff2';
  if (lower.endsWith('.woff')) return 'woff';
  if (lower.endsWith('.otf')) return 'opentype';
  return 'truetype';
}

const NAME_TO_ISO_SCRIPT = [
  [/\barmenian\b|grapalat|mariam|bokonique|yerevan|gyumri|arian\s*amu|mardoto|grqalir|nortar|arnamu|artsnk|gitunik|hypix|gayane|atyan\s*dsegh/i, 'Armn'],
  [/\bgeorgian\b|glaho/i, 'Geor'],
  [/cuneiform/i, 'Xsux'],
  [/anatolian\s*hieroglyph/i, 'Hluw'],
  [/egyptian\s*hieroglyph/i, 'Egyp'],
  [/caucasian\s*albanian/i, 'Aghb'],
  [/old\s*persian/i, 'Xpeo'],
  [/old\s*italic/i, 'Ital'],
  [/old\s*turkic/i, 'Orkh'],
  [/old\s*hungarian/i, 'Hung'],
  [/old\s*permic/i, 'Perm'],
  [/old\s*north\s*arabian/i, 'Narb'],
  [/old\s*south\s*arabian/i, 'Sarb'],
  [/old\s*sogdian/i, 'Sogo'],
  [/\bsogdian\b/i, 'Sogd'],
  [/\bavestan\b/i, 'Avst'],
  [/^noto\s+(?:sans|serif)\s+gothic\b/i, 'Goth'],
  [/glagolitic/i, 'Glag'],
  [/^noto\s+(?:sans|serif)\s+runic\b|\brunic\b/i, 'Runr'],
  [/\bogham\b/i, 'Ogam'],
  [/phoenician/i, 'Phnx'],
  [/ugaritic/i, 'Ugar'],
  [/linear\s*b\b/i, 'Linb'],
  [/linear\s*a\b/i, 'Lina'],
  [/\btangut\b/i, 'Tang'],
  [/\bcoptic\b/i, 'Copt'],
  [/\bsyriac\b/i, 'Syrc'],
  [/\bsamaritan\b/i, 'Samr'],
  [/\bmandaic\b/i, 'Mand'],
  [/manichaean/i, 'Mani'],
  [/nabataean/i, 'Nbat'],
  [/palmyrene/i, 'Palm'],
  [/imperial\s*aramaic/i, 'Armi'],
  [/inscriptional\s*pahlavi/i, 'Phli'],
  [/psalter\s*pahlavi/i, 'Phlp'],
  [/inscriptional\s*parthian/i, 'Prti'],
  [/elymaic/i, 'Elym'],
  [/hatran/i, 'Hatr'],
  [/\blycian\b/i, 'Lyci'],
  [/\blydian\b/i, 'Lydi'],
  [/\bcarian\b/i, 'Cari'],
  [/\bcypriot\b/i, 'Cprt'],
  [/meroitic/i, 'Mero'],
  [/\bdeseret\b/i, 'Dsrt'],
  [/\bshavian\b/i, 'Shaw'],
  [/\bosage\b/i, 'Osge'],
  [/\bosmanya\b/i, 'Osma'],
  [/\bcherokee\b/i, 'Cher'],
  [/canadian\s*aboriginal|canadian\s*syllabics/i, 'Cans'],
  [/\btifinagh\b/i, 'Tfng'],
  [/\badlam\b|alkalami/i, 'Adlm'],
  [/\bnko\b|\bn'ko\b/i, 'Nkoo'],
  [/^noto\s+(?:sans|serif)\s+vai\b|\bvai\b/i, 'Vaii'],
  [/\bbamum\b/i, 'Bamu'],
  [/bassa\s*vah/i, 'Bass'],
  [/mende\s*kikakui/i, 'Mend'],
  [/medefaidrin/i, 'Medf'],
  [/\bahom\b/i, 'Ahom'],
  [/\bbalinese\b/i, 'Bali'],
  [/\bbatak\b/i, 'Batk'],
  [/bhaiksuki/i, 'Bhks'],
  [/\bbrahmi\b/i, 'Brah'],
  [/\bbuginese\b/i, 'Bugi'],
  [/\bbuhid\b/i, 'Buhd'],
  [/\bchakma\b/i, 'Cakm'],
  [/^noto\s+(?:sans|serif)\s+cham\b|\bcham\b/i, 'Cham'],
  [/\bdogra\b/i, 'Dogr'],
  [/\bgrantha\b/i, 'Gran'],
  [/\bhanunoo\b/i, 'Hano'],
  [/\bjavanese\b/i, 'Java'],
  [/\bkaithi\b/i, 'Kthi'],
  [/kayah\s*li/i, 'Kali'],
  [/kharoshthi/i, 'Khar'],
  [/\bkhmer\b|mondulkiri/i, 'Khmr'],
  [/\bkhojki\b/i, 'Khoj'],
  [/khudawadi/i, 'Sind'],
  [/^noto\s+(?:sans|serif)\s+lao\b|\blao\b/i, 'Laoo'],
  [/\blepcha\b/i, 'Lepc'],
  [/\blimbu\b/i, 'Limb'],
  [/\blisu\b/i, 'Lisu'],
  [/mahajani/i, 'Mahj'],
  [/\bmarchen\b/i, 'Marc'],
  [/meetei\s*mayek/i, 'Mtei'],
  [/^noto\s+(?:sans|serif)\s+modi\b|\bmodi\b/i, 'Modi'],
  [/\bmongolian\b/i, 'Mong'],
  [/^noto\s+(?:sans|serif)\s+mro\b|\bmro\b/i, 'Mroo'],
  [/\bmultani\b/i, 'Mult'],
  [/\bmyanmar\b|padauk|kyebogyi/i, 'Mymr'],
  [/new\s*tai\s*lue|daibanna/i, 'Talu'],
  [/\bnewa\b/i, 'Newa'],
  [/\bnushu\b/i, 'Nshu'],
  [/ol\s*chiki/i, 'Olck'],
  [/pahawh\s*hmong|np\s*hmong|nyiakeng/i, 'Hmng'],
  [/pau\s*cin\s*hau/i, 'Pauc'],
  [/phags\s*pa/i, 'Phag'],
  [/\brejang\b/i, 'Rjng'],
  [/\brohingya\b/i, 'Rohg'],
  [/saurashtra/i, 'Saur'],
  [/\bsharada\b/i, 'Shrd'],
  [/\bsiddham\b/i, 'Sidd'],
  [/sora\s*sompeng/i, 'Sora'],
  [/\bsoyombo\b/i, 'Soyo'],
  [/\bsundanese\b/i, 'Sund'],
  [/syloti\s*nagri/i, 'Sylo'],
  [/\btagalog\b/i, 'Tglg'],
  [/\btagbanwa\b/i, 'Tagb'],
  [/tai\s*le/i, 'Tale'],
  [/tai\s*tham/i, 'Lana'],
  [/tai\s*viet|tai\s*heritage/i, 'Tavt'],
  [/\btakri\b/i, 'Takr'],
  [/\bthaana\b/i, 'Thaa'],
  [/\btibetan\b/i, 'Tibt'],
  [/\btirhuta\b/i, 'Tirh'],
  [/warang\s*citi/i, 'Wara'],
  [/^noto\s+(?:sans|serif)\s+yi\b|\bnuosu\b/i, 'Yiii'],
  [/zanabazar/i, 'Zanb'],
  [/\bethiopic\b|abyssinica/i, 'Ethi'],
  [/\barabic\b|naskh|nastaliq|awami|harmattan|lateef|scheherazade|amiri|vazirmatn/i, 'Arab'],
  [/\bhebrew\b|\bezra\b/i, 'Hebr'],
  [/\bdevanagari\b|annapurna/i, 'Deva'],
  [/\bbengali\b/i, 'Beng'],
  [/\btamil\b/i, 'Taml'],
  [/\btelugu\b/i, 'Telu'],
  [/\bkannada\b/i, 'Knda'],
  [/\bmalayalam\b/i, 'Mlym'],
  [/\bgujarati\b/i, 'Gujr'],
  [/\bgurmukhi\b/i, 'Guru'],
  [/\boriya\b|\bodia\b/i, 'Orya'],
  [/\bsinhala\b/i, 'Sinh'],
  [/\bthai\b/i, 'Thai'],
  [/\bgreek\b|galatia/i, 'Grek'],
  [/\bcyrillic\b/i, 'Cyrl'],
  [/sign\s*writing/i, 'Sgnw'],
  [/\bbraille\b/i, 'Brai'],
  [/\bmath\b|\bsymbols\b/i, 'Zsym'],
];

const SUBSET_TO_ISO = {
  latin: 'Latn',
  'latin-ext': 'Latn',
  vietnamese: 'Latn',
  armenian: 'Armn',
  georgian: 'Geor',
  cyrillic: 'Cyrl',
  'cyrillic-ext': 'Cyrl',
  greek: 'Grek',
  'greek-ext': 'Grek',
  arabic: 'Arab',
  hebrew: 'Hebr',
  devanagari: 'Deva',
  bengali: 'Beng',
  tamil: 'Taml',
  telugu: 'Telu',
  kannada: 'Knda',
  malayalam: 'Mlym',
  gujarati: 'Gujr',
  gurmukhi: 'Guru',
  oriya: 'Orya',
  sinhala: 'Sinh',
  'chinese-simplified': 'Hans',
  'chinese-traditional': 'Hant',
  japanese: 'Jpan',
  korean: 'Kore',
  thai: 'Thai',
  ethiopic: 'Ethi',
  khmer: 'Khmr',
  lao: 'Laoo',
  myanmar: 'Mymr',
  tibetan: 'Tibt',
  cherokee: 'Cher',
  syriac: 'Syrc',
  adlam: 'Adlm',
  'canadian-aboriginal': 'Cans',
  tifinagh: 'Tfng',
  javanese: 'Java',
  sundanese: 'Sund',
  balinese: 'Bali',
  math: 'Zsym',
  symbols: 'Zsym',
  symbols2: 'Zsym',
  braille: 'Brai',
};

function inferIsoScripts(item) {
  const set = new Set();
  for (const s of item.subsets || []) {
    if (SUBSET_TO_ISO[s]) set.add(SUBSET_TO_ISO[s]);
  }
  for (const [regex, iso] of NAME_TO_ISO_SCRIPT) {
    if (regex.test(item.name || '')) {
      set.add(iso);
    }
  }
  if (set.size === 0) set.add('Latn');
  return Array.from(set);
}

function inferAppScriptsFromIso(isoScripts, existingScripts = []) {
  const set = new Set(existingScripts);
  for (const iso of isoScripts) {
    if (iso === 'Armn') set.add('armenian');
    else if (iso === 'Geor') set.add('georgian');
    else if (iso === 'Cyrl') set.add('cyrillic');
    else if (iso === 'Grek' || iso === 'Copt') set.add('greek');
    else if (iso === 'Arab') set.add('arabic');
    else if (iso === 'Hebr') set.add('hebrew');
    else if (iso === 'Deva') set.add('devanagari');
    else if (iso === 'Beng') set.add('bengali');
    else if (iso === 'Taml') set.add('tamil');
    else if (iso === 'Hans') set.add('cjk-sc');
    else if (iso === 'Hant') set.add('cjk-tc');
    else if (iso === 'Jpan') set.add('japanese');
    else if (iso === 'Kore') set.add('korean');
    else if (iso === 'Thai') set.add('thai');
    else if (iso === 'Ethi') set.add('ethiopic');
    else if (iso === 'Brai' || iso === 'Zsym' || iso === 'Sgnw') set.add('symbolic');
    else if (['Telu', 'Knda', 'Mlym', 'Gujr', 'Guru', 'Orya', 'Sinh', 'Brah', 'Khar', 'Shrd', 'Sidd', 'Gran', 'Modi', 'Kthi', 'Tirh', 'Takr', 'Dogr', 'Mahj', 'Khoj', 'Sind', 'Mult', 'Saur', 'Newa', 'Bhks', 'Marc', 'Sylo', 'Lepc', 'Limb'].includes(iso)) {
      set.add('indic-other');
    } else if (iso !== 'Latn') {
      set.add('global-other');
    } else {
      set.add('latin');
    }
  }
  if (set.size === 0) set.add('latin');
  return Array.from(set);
}

function inspectFontBinary(buf, fallbackName) {
  try {
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const font = opentype.parse(ab);
    const numGlyphs = font.numGlyphs || 0;
    const family =
      font.getEnglishName('preferredFamily') ||
      font.getEnglishName('fontFamily') ||
      fallbackName;

    // Probe real Unicode codepoints to verify which scripts this font binary genuinely encodes!
    const detectedScripts = new Set();
    const detectedIso = new Set();
    const probes = [
      [0x0041, 'latin', 'Latn'],
      [0x0531, 'armenian', 'Armn'],
      [0x0561, 'armenian', 'Armn'],
      [0x10d0, 'georgian', 'Geor'],
      [0x0410, 'cyrillic', 'Cyrl'],
      [0x0391, 'greek', 'Grek'],
      [0x0627, 'arabic', 'Arab'],
      [0x05d0, 'hebrew', 'Hebr'],
      [0x0915, 'devanagari', 'Deva'],
      [0x1200, 'ethiopic', 'Ethi'],
    ];
    for (const [cp, appScript, iso] of probes) {
      const idx = font.charToGlyphIndex(String.fromCodePoint(cp));
      if (idx > 0) {
        detectedScripts.add(appScript);
        detectedIso.add(iso);
      }
    }
    const weightClass = font.tables?.os2?.usWeightClass || 400;
    return {
      valid: true,
      family: (family || fallbackName).trim(),
      numGlyphs,
      weightClass,
      detectedScripts: Array.from(detectedScripts),
      detectedIso: Array.from(detectedIso),
    };
  } catch {
    return {
      valid: false,
      family: fallbackName,
      numGlyphs: 0,
      weightClass: 400,
      detectedScripts: [],
      detectedIso: [],
    };
  }
}

async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 404 || i === retries) return res;
    } catch (e) {
      if (i === retries) throw e;
    }
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
}

function cleanArmenianFamilyName(filename) {
  const base = path.basename(filename, path.extname(filename));
  const map = [
    [/^GHEAGr?palat/i, 'GHEA Grapalat'],
    [/^GHEAMariam/i, 'GHEA Mariam'],
    [/^arnamu/i, 'Arian AMU'],
    [/^Arian/i, 'Arian AMU Serif'],
    [/^artsnk/i, 'ArTarumian Tsnk'],
    [/^arti$/i, 'ArTarumian Arti'],
    [/^CAAGayane|^GAAGayane|^GAA_/i, 'GAA Gayane'],
    [/^Montserratarm/i, 'Montserrat Armenian'],
    [/^Yerevanyan/i, 'Yerevanyan'],
    [/^Bokonique/i, 'Bokonique'],
    [/^GaliverSans/i, 'Galiver Sans'],
    [/^Nicolo/i, 'Nicolo Armenian'],
    [/^SGALS/i, 'SGALS Armenian'],
    [/^OpenGOSTtypeA/i, 'Open GOST Type A'],
    [/^OpenGOSTtypeB/i, 'Open GOST Type B'],
    [/^Braind Republic/i, 'Braind Republic'],
    [/^Braind Zbans/i, 'Braind Zbans'],
    [/^BraindAmanor/i, 'Braind Amanor'],
    [/^BraindGyumri/i, 'Braind Gyumri'],
    [/^BraindYerevan/i, 'Braind Yerevan'],
    [/^Atyan Dsegh/i, 'Atyan Dsegh'],
    [/^ARM HMK/i, 'HMK Armenian Display'],
    [/^Arm Hmk/i, 'HMK Bebas Neue Armenian'],
    [/^FreeSerif_ArmLiga/i, 'FreeSerif ArmLiga'],
    [/^Handjet/i, 'Handjet Armenian'],
  ];
  for (const [re, target] of map) {
    if (re.test(base)) return target;
  }
  return base
    .replace(/[-_]+(Regular|Bold|Italic|Light|Medium|SemiBold|ExtraBold|Black|Reg|Bld|Rit|Blit|BlIt).*$/i, '')
    .replace(/(Regular|Bold|Italic)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function detectStyleFromName(filename) {
  const lower = filename.toLowerCase();
  const isItalic = /italic|oblique|rit|blit/.test(lower);
  let weight = 400;
  if (/thin|100/.test(lower)) weight = 100;
  else if (/extralight|200/.test(lower)) weight = 200;
  else if (/light|300/.test(lower)) weight = 300;
  else if (/medium|500/.test(lower)) weight = 500;
  else if (/semibold|600/.test(lower)) weight = 600;
  else if (/extrabold|800/.test(lower)) weight = 800;
  else if (/black|900/.test(lower)) weight = 900;
  else if (/bold|bld|700/.test(lower)) weight = 700;
  return { weight, style: isItalic ? 'italic' : 'normal' };
}

async function syncMissingNoto(seenNames, seenHashes) {
  console.log('Checking notofonts.github.io for missing historic & global Noto families...');
  const res = await fetchWithRetry('https://notofonts.github.io/noto.json');
  if (!res || !res.ok) return [];
  const noto = await res.json();
  const added = [];

  for (const [repoSlug, repoData] of Object.entries(noto)) {
    for (const [familyName, famData] of Object.entries(repoData.families || {})) {
      if (/test$/i.test(familyName)) continue;
      if (seenNames.has(normKey(familyName))) continue;

      const files = famData.files?.full || famData.files?.hinted || famData.files?.unhinted || [];
      const ttfFile =
        files.find((f) => /Regular\.ttf$/i.test(f)) ||
        files.find((f) => /Regular\.otf$/i.test(f)) ||
        files.find((f) => /\.ttf$/i.test(f));
      if (!ttfFile) continue;

      const cdnUrl = `https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io@main/${ttfFile}`;
      const binRes = await fetchWithRetry(cdnUrl);
      if (!binRes || !binRes.ok) continue;
      const buf = Buffer.from(await binRes.arrayBuffer());
      const hash = sha256(buf);
      if (seenHashes.has(hash)) continue;

      const id = slugify(familyName);
      const ext = path.extname(ttfFile).toLowerCase() || '.ttf';
      const localBin = `${id}-0${ext}`;
      fs.writeFileSync(path.join(OUT_DIR, localBin), buf);
      const cssContent = `@font-face {\n  font-family: '${familyName}';\n  src: url('./${localBin}') format('${cssFormatFromExt(localBin)}');\n  font-weight: 400;\n  font-style: normal;\n  font-display: swap;\n}\n`;
      fs.writeFileSync(path.join(OUT_DIR, `${id}.css`), cssContent);

      const inspected = inspectFontBinary(buf, familyName);
      const isoScripts = inferIsoScripts({ name: familyName, subsets: [repoSlug] });
      for (const dIso of inspected.detectedIso) {
        if (!isoScripts.includes(dIso)) isoScripts.push(dIso);
      }
      const appScripts = inferAppScriptsFromIso(isoScripts, []);

      seenNames.add(normKey(familyName));
      seenHashes.add(hash);

      added.push({
        id,
        name: familyName,
        category: familyName.includes('Serif') ? 'Serif' : 'Sans',
        scripts: appScripts,
        isoScripts,
        weights: [400],
        variable: false,
        designer: 'Google Noto / SIL',
        year: 2024,
        subsets: [repoSlug],
        isNoto: true,
        cssFile: `${id}.css`,
        primaryFontFile: localBin,
        localHosted: true,
        sourceTag: 'google-noto',
        glyphCount: inspected.numGlyphs || undefined,
      });
    }
  }
  console.log(`Added ${added.length} missing Noto GitHub families.`);
  return added;
}

async function syncGitHubFontCollection(repos, seenNames, seenHashes, opts) {
  const grouped = new Map(); // familyName -> { files: [{ url, path, sourceRepo }], sourceTag, designer }

  for (const repo of repos) {
    try {
      const treeRes = await fetchWithRetry(
        `https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`,
        { headers: { 'User-Agent': 'pangloss-sync' } }
      );
      if (!treeRes || !treeRes.ok) continue;
      const treeJson = await treeRes.json();
      const fontPaths = (treeJson.tree || [])
        .filter((item) => item.type === 'blob' && /\.(woff2|otf|ttf)$/i.test(item.path))
        .filter((item) => !/subset|unhinted|test|specimen|doc|src\/|instances/i.test(item.path) || opts.allowAnyPath);

      for (const item of fontPaths) {
        const filename = path.basename(item.path);
        const famName = opts.getFamilyName(filename, repo);
        if (!famName || famName.length < 2) continue;
        if (!grouped.has(famName)) {
          grouped.set(famName, {
            name: famName,
            repo,
            files: [],
          });
        }
        grouped.get(famName).files.push({
          filePath: item.path,
          filename,
          url: `https://cdn.jsdelivr.net/gh/${repo}@HEAD/${encodeURI(item.path).replace(/#/g, '%23')}`,
        });
      }
    } catch {
      // Skip unreachable repo
    }
  }

  const added = [];
  for (const [famName, group] of grouped.entries()) {
    const key = normKey(famName);
    if (seenNames.has(key)) continue;

    // Prefer woff2 -> otf -> ttf and cap up to 4 primary styles per family
    const sortedFiles = [...group.files].sort((a, b) => {
      const scoreExt = (f) => (f.endsWith('.woff2') ? 0 : f.endsWith('.otf') ? 1 : 2);
      const extDiff = scoreExt(a.filename.toLowerCase()) - scoreExt(b.filename.toLowerCase());
      if (extDiff !== 0) return extDiff;
      const aReg = /regular|reg\./i.test(a.filename) ? 0 : 1;
      const bReg = /regular|reg\./i.test(b.filename) ? 0 : 1;
      return aReg - bReg;
    });

    const picked = [];
    const pickedStyles = new Set();
    for (const f of sortedFiles) {
      const { weight, style } = detectStyleFromName(f.filename);
      const stKey = `${weight}-${style}`;
      if (pickedStyles.has(stKey)) continue;
      pickedStyles.add(stKey);
      picked.push({ ...f, weight, style });
      if (picked.length >= 4) break;
    }

    const cssBlocks = [];
    let primaryLocalFile = null;
    let firstInspected = null;
    const weightsSet = new Set();
    const id = slugify(famName);
    let idx = 0;

    for (const f of picked) {
      try {
        const binRes = await fetchWithRetry(f.url);
        if (!binRes || !binRes.ok) continue;
        const buf = Buffer.from(await binRes.arrayBuffer());
        if (buf.length < 1500) continue;
        const hash = sha256(buf);
        if (idx === 0 && seenHashes.has(hash)) {
          // Binary is byte-for-byte identical to an existing font in repo: skip!
          break;
        }
        seenHashes.add(hash);

        const ext = path.extname(f.filename).toLowerCase() || '.ttf';
        const localName = `${id}-${idx}${ext}`;
        fs.writeFileSync(path.join(OUT_DIR, localName), buf);
        if (!primaryLocalFile) primaryLocalFile = localName;

        const insp = inspectFontBinary(buf, famName);
        if (!firstInspected) firstInspected = insp;
        const finalWeight = insp.weightClass || f.weight || 400;
        weightsSet.add(finalWeight);

        cssBlocks.push(
          `@font-face {\n  font-family: '${famName}';\n  src: url('./${localName}') format('${cssFormatFromExt(localName)}');\n  font-weight: ${finalWeight};\n  font-style: ${f.style};\n  font-display: swap;\n}`
        );
        idx++;
      } catch {
        // Ignore single file error
      }
    }

    if (cssBlocks.length === 0 || !primaryLocalFile) continue;
    seenNames.add(key);

    const cssPath = path.join(OUT_DIR, `${id}.css`);
    fs.writeFileSync(cssPath, cssBlocks.join('\n') + '\n');

    const isoScripts = Array.from(
      new Set([
        ...inferIsoScripts({ name: famName, subsets: opts.defaultSubsets }),
        ...(firstInspected?.detectedIso || []),
      ])
    );
    const appScripts = inferAppScriptsFromIso(isoScripts, firstInspected?.detectedScripts || opts.defaultAppScripts);
    const lowerName = famName.toLowerCase();
    const category = lowerName.includes('mono')
      ? 'Monospace'
      : lowerName.includes('serif')
        ? 'Serif'
        : lowerName.includes('script') || lowerName.includes('hand')
          ? 'Handwriting'
          : lowerName.includes('display') || lowerName.includes('black') || lowerName.includes('poster')
            ? 'Display'
            : 'Sans';

    added.push({
      id,
      name: famName,
      category,
      scripts: appScripts,
      isoScripts,
      weights: Array.from(weightsSet).sort((a, b) => a - b),
      variable: false,
      designer: opts.designer,
      year: 2024,
      subsets: opts.defaultSubsets,
      isNoto: false,
      cssFile: `${id}.css`,
      primaryFontFile: primaryLocalFile,
      localHosted: true,
      sourceTag: opts.sourceTag,
      glyphCount: firstInspected?.numGlyphs || undefined,
    });
  }

  console.log(`Synced ${added.length} unique real fonts from ${opts.sourceTag}.`);
  return added;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(API_DIR, { recursive: true });
  fs.mkdirSync(API_V1_DIR, { recursive: true });

  const existing = JSON.parse(fs.readFileSync(INDEX_OUT, 'utf8'));
  const dedupedExisting = [];
  const seenNames = new Set();
  const seenHashes = new Set();

  // Strictly audit & deduplicate existing catalog by normalized name & binary SHA-256 hash
  for (const item of existing) {
    const binPath = path.join(OUT_DIR, item.primaryFontFile);
    const cssPath = path.join(OUT_DIR, item.cssFile);
    if (!fs.existsSync(binPath) || !fs.existsSync(cssPath)) continue;
    const key = normKey(item.name);
    if (seenNames.has(key)) continue;
    const hash = sha256(fs.readFileSync(binPath));
    if (seenHashes.has(hash)) continue;
    seenNames.add(key);
    seenHashes.add(hash);

    const isoScripts = inferIsoScripts(item);
    const appScripts = inferAppScriptsFromIso(isoScripts, item.scripts || []);
    dedupedExisting.push({
      ...item,
      scripts: appScripts,
      isoScripts,
    });
  }

  console.log(`Verified ${dedupedExisting.length} deduplicated existing fonts.`);

  // 1. Missing Noto GitHub script families
  const notoAdded = await syncMissingNoto(seenNames, seenHashes);

  // 2. Real Armenian Open-Source Font Archives (GitHub)
  const armenianAdded = await syncGitHubFontCollection(
    [
      'lecramyajiv/fonts-armenian-extra',
      'gagik/gitunik',
      'sourencho/hy8',
      'avmonte/armliga',
    ],
    seenNames,
    seenHashes,
    {
      allowAnyPath: true,
      getFamilyName: (filename) => cleanArmenianFamilyName(filename),
      defaultSubsets: ['armenian', 'latin'],
      defaultAppScripts: ['armenian', 'latin'],
      designer: 'Armenian Open Type Archive',
      sourceTag: 'armenian-open',
    }
  );

  // 3. The League of Moveable Type open-source repos
  const leagueReposRes = await fetchWithRetry('https://api.github.com/orgs/theleagueof/repos?per_page=100', {
    headers: { 'User-Agent': 'pangloss-sync' },
  });
  const leagueRepos = leagueReposRes && leagueReposRes.ok ? await leagueReposRes.json() : [];
  const leagueAdded = await syncGitHubFontCollection(
    leagueRepos.filter((r) => !['licenses', 'fontship'].includes(r.name)).map((r) => r.full_name),
    seenNames,
    seenHashes,
    {
      allowAnyPath: false,
      getFamilyName: (_f, repo) =>
        repo.split('/')[1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      defaultSubsets: ['latin'],
      defaultAppScripts: ['latin'],
      designer: 'The League of Moveable Type',
      sourceTag: 'the-league',
    }
  );

  // 4. Velvetyne Type Foundry open-source repos
  const velvReposRes = await fetchWithRetry('https://api.github.com/orgs/velvetyne/repos?per_page=100', {
    headers: { 'User-Agent': 'pangloss-sync' },
  });
  const velvRepos = velvReposRes && velvReposRes.ok ? await velvReposRes.json() : [];
  const velvAdded = await syncGitHubFontCollection(
    velvRepos
      .filter((r) => !/notdef|standard-character-set/i.test(r.name))
      .slice(0, 18)
      .map((r) => r.full_name),
    seenNames,
    seenHashes,
    {
      allowAnyPath: true,
      getFamilyName: (_f, repo) =>
        repo.split('/')[1]
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      defaultSubsets: ['latin'],
      defaultAppScripts: ['latin'],
      designer: 'Velvetyne Type Foundry',
      sourceTag: 'velvetyne',
    }
  );

  // 5. SIL International Minority/Endangered Scripts
  const silReposRes = await fetchWithRetry('https://api.github.com/orgs/silnrsi/repos?per_page=100', {
    headers: { 'User-Agent': 'pangloss-sync' },
  });
  const silRepos = silReposRes && silReposRes.ok ? await silReposRes.json() : [];
  const silFontRepos = silRepos
    .filter((r) => /^font-(?!ttf$|ttf-scripts|arabic$|stroke-test|keymanweb)/i.test(r.name))
    .slice(0, 24)
    .map((r) => r.full_name);

  const silAdded = await syncGitHubFontCollection(silFontRepos, seenNames, seenHashes, {
    allowAnyPath: true,
    getFamilyName: (_f, repo) => {
      const slug = repo.split('/')[1].replace(/^font-/, '');
      return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' SIL';
    },
    defaultSubsets: ['latin'],
    defaultAppScripts: ['latin'],
    designer: 'SIL International',
    sourceTag: 'sil-fonts',
  });

  const allFonts = [...dedupedExisting, ...notoAdded, ...armenianAdded, ...leagueAdded, ...velvAdded, ...silAdded]
    .sort((a, b) => a.name.localeCompare(b.name));

  // Compute SHA-384 SRI hashes for every CSS stylesheet + loader script
  const sriMap = {};
  const loaderPath = path.resolve('public/pangloss-loader.js');
  if (fs.existsSync(loaderPath)) {
    sriMap['/pangloss-loader.js'] = sha384Sri(fs.readFileSync(loaderPath));
  }

  for (const font of allFonts) {
    const cssPath = path.join(OUT_DIR, font.cssFile);
    if (fs.existsSync(cssPath)) {
      font.sriSha384 = sha384Sri(fs.readFileSync(cssPath));
      sriMap[`/fonts/${font.cssFile}`] = font.sriSha384;
    }
  }

  fs.writeFileSync(INDEX_OUT, JSON.stringify(allFonts));

  // Build sharded script breakdown
  const scriptBuckets = {};
  for (const f of allFonts) {
    for (const iso of f.isoScripts || ['Latn']) {
      scriptBuckets[iso] = (scriptBuckets[iso] || 0) + 1;
    }
  }

  const apiFontsPayload = {
    apiVersion: '2.0',
    generatedAt: new Date().toISOString(),
    deduplicated: true,
    totalFonts: allFonts.length,
    fonts: allFonts.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      scripts: r.scripts,
      isoScripts: r.isoScripts,
      weights: r.weights,
      variable: r.variable,
      designer: r.designer,
      subsets: r.subsets,
      glyphCount: r.glyphCount || undefined,
      cssPath: `/fonts/${r.cssFile}`,
      woff2Path: `/fonts/${r.primaryFontFile}`,
      sriSha384: r.sriSha384,
      source: r.sourceTag || (r.isNoto ? 'google-noto' : 'google-fonts'),
    })),
  };

  const statsPayload = {
    apiVersion: '2.0',
    generatedAt: new Date().toISOString(),
    totalUniqueFonts: allFonts.length,
    armenianFontsCount: allFonts.filter((f) => f.scripts.includes('armenian') || (f.isoScripts || []).includes('Armn')).length,
    uniqueIsoScriptsCovered: Object.keys(scriptBuckets).length,
    scriptCounts: scriptBuckets,
    newlyAddedBySource: {
      notoGithub: notoAdded.length,
      armenianOpenArchive: armenianAdded.length,
      theLeague: leagueAdded.length,
      velvetyne: velvAdded.length,
      silInternational: silAdded.length,
    },
  };

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(apiFontsPayload));
  fs.writeFileSync(path.join(API_DIR, 'fonts.json'), JSON.stringify(apiFontsPayload));
  fs.writeFileSync(path.join(API_V1_DIR, 'fonts.json'), JSON.stringify(apiFontsPayload));
  fs.writeFileSync(path.join(API_V1_DIR, 'scripts.json'), JSON.stringify({ generatedAt: new Date().toISOString(), scriptCounts: scriptBuckets }));
  fs.writeFileSync(path.join(API_V1_DIR, 'stats.json'), JSON.stringify(statsPayload));
  fs.writeFileSync(path.join(API_DIR, 'integrity.json'), JSON.stringify({ algorithm: 'sha384', assets: sriMap }));

  console.log('FINAL STATS:', JSON.stringify(statsPayload, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
