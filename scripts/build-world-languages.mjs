import fs from 'node:fs';
import path from 'node:path';

const API_DIR = path.resolve('public/api');
const API_V1_DIR = path.resolve('public/api/v1');
const SRC_OUT = path.resolve('src/data/isoWorldLanguages.json');

// Map ISO 15924 4-letter script codes to Pangloss catalog ScriptCode + ISO metadata
const ISO_TO_APP_SCRIPT = {
  Latn: { app: 'latin', name: 'Latin', dir: 'ltr' },
  Armn: { app: 'armenian', name: 'Armenian', dir: 'ltr' },
  Geor: { app: 'georgian', name: 'Georgian', dir: 'ltr' },
  Geok: { app: 'georgian', name: 'Georgian Khutsuri', dir: 'ltr' },
  Cyrl: { app: 'cyrillic', name: 'Cyrillic', dir: 'ltr' },
  Grek: { app: 'greek', name: 'Greek', dir: 'ltr' },
  Copt: { app: 'greek', name: 'Coptic', dir: 'ltr' },
  Arab: { app: 'arabic', name: 'Arabic', dir: 'rtl' },
  Hebr: { app: 'hebrew', name: 'Hebrew', dir: 'rtl' },
  Deva: { app: 'devanagari', name: 'Devanagari', dir: 'ltr' },
  Beng: { app: 'bengali', name: 'Bengali', dir: 'ltr' },
  Taml: { app: 'tamil', name: 'Tamil', dir: 'ltr' },
  Telu: { app: 'indic-other', name: 'Telugu', dir: 'ltr' },
  Knda: { app: 'indic-other', name: 'Kannada', dir: 'ltr' },
  Mlym: { app: 'indic-other', name: 'Malayalam', dir: 'ltr' },
  Gujr: { app: 'indic-other', name: 'Gujarati', dir: 'ltr' },
  Guru: { app: 'indic-other', name: 'Gurmukhi', dir: 'ltr' },
  Orya: { app: 'indic-other', name: 'Odia', dir: 'ltr' },
  Sinh: { app: 'indic-other', name: 'Sinhala', dir: 'ltr' },
  Hans: { app: 'cjk-sc', name: 'Han (Simplified)', dir: 'ltr' },
  Hant: { app: 'cjk-tc', name: 'Han (Traditional)', dir: 'ltr' },
  Hani: { app: 'cjk-tc', name: 'Han (CJK)', dir: 'ltr' },
  Jpan: { app: 'japanese', name: 'Japanese', dir: 'ltr' },
  Hira: { app: 'japanese', name: 'Hiragana', dir: 'ltr' },
  Kana: { app: 'japanese', name: 'Katakana', dir: 'ltr' },
  Kore: { app: 'korean', name: 'Korean Hangul', dir: 'ltr' },
  Hang: { app: 'korean', name: 'Hangul', dir: 'ltr' },
  Thai: { app: 'thai', name: 'Thai', dir: 'ltr' },
  Ethi: { app: 'ethiopic', name: 'Ethiopic (Geʽez)', dir: 'ltr' },
  Brai: { app: 'symbolic', name: 'Braille', dir: 'ltr' },
  Zsym: { app: 'symbolic', name: 'Symbols', dir: 'ltr' },
};

const RTL_ISO_SCRIPTS = new Set([
  'Arab', 'Hebr', 'Syrc', 'Thaa', 'Nkoo', 'Adlm', 'Avst', 'Armi',
  'Chrs', 'Elym', 'Hatr', 'Mand', 'Mani', 'Mend', 'Merc', 'Mero',
  'Nbat', 'Narb', 'Orkh', 'Hung', 'Palm', 'Phli', 'Phlp', 'Phnx',
  'Prti', 'Rohg', 'Samr', 'Sarb', 'Sogd', 'Sogo', 'Ugar', 'Yezi',
]);

const EXTINCT_AND_HISTORICAL_SCRIPT_HINTS = [
  [/armenian/i, 'Armn'],
  [/georgian/i, 'Geor'],
  [/caucasian albanian|aghwan/i, 'Aghb'],
  [/sumerian|akkadian|hittite|elamite|hurrian|urartian|assyr|babylonian|luwian cuneiform|eblaite/i, 'Xsux'],
  [/luwian|anatolian hieroglyph/i, 'Hluw'],
  [/old persian/i, 'Xpeo'],
  [/avestan/i, 'Avst'],
  [/middle persian|pahlavi|parthian/i, 'Phli'],
  [/sogdian/i, 'Sogd'],
  [/manichaean/i, 'Mani'],
  [/egyptian/i, 'Egyp'],
  [/coptic/i, 'Copt'],
  [/meroitic/i, 'Mero'],
  [/gothic/i, 'Goth'],
  [/mycenaean/i, 'Linb'],
  [/minoan/i, 'Lina'],
  [/phoenician|punic/i, 'Phnx'],
  [/ugaritic/i, 'Ugar'],
  [/aramaic|syriac/i, 'Syrc'],
  [/nabataean/i, 'Nbat'],
  [/palmyrene/i, 'Palm'],
  [/samaritan/i, 'Samr'],
  [/mandaic/i, 'Mand'],
  [/phrygian|lycian/i, 'Lyci'],
  [/lydian/i, 'Lydi'],
  [/carian/i, 'Cari'],
  [/etruscan|oscan|umbrian|faliscan|old italic|venetic/i, 'Ital'],
  [/norse|old english|runic/i, 'Runr'],
  [/primitive irish|ogham/i, 'Ogam'],
  [/old church slavonic|glagolitic/i, 'Glag'],
  [/old hungarian/i, 'Hung'],
  [/old permic|komi/i, 'Perm'],
  [/old turkic|orkhon/i, 'Orkh'],
  [/tangut/i, 'Tang'],
  [/khitan/i, 'Kits'],
  [/jurchen/i, 'Hani'],
  [/sanskrit|prakrit|pali/i, 'Deva'],
  [/gandhari|kharoshthi/i, 'Khar'],
  [/tocharian|brahmi/i, 'Brah'],
  [/elamite/i, 'Xsux'],
  [/sabaean|himyaritic|ancient south arabian/i, 'Sarb'],
  [/ancient north arabian|thamudic|safaitic/i, 'Narb'],
  [/geez|ge'ez/i, 'Ethi'],
  [/maya|mayan/i, 'Latn'],
  [/greek|ancient greek|doric|ionic|attic/i, 'Grek'],
  [/hebrew|moabite|ammonite|edomite/i, 'Hebr'],
  [/persian|farsi/i, 'Arab'],
  [/arabic|hassaniya|moorish/i, 'Arab'],
  [/russian|slavic|cyrillic/i, 'Cyrl'],
  [/chinese|hanzi/i, 'Hant'],
  [/japanese/i, 'Jpan'],
  [/korean/i, 'Kore'],
];

const CURATED_OVERRIDES = {
  hy: { app: 'armenian', iso: 'Armn', region: 'Armenia / Caucasus', sample: 'Բնության գեղեցկությունը և մարդկային միտքը ստեղծում են հավերժական գրեր։' },
  hye: { app: 'armenian', iso: 'Armn', region: 'Armenia / Caucasus', sample: 'Բնության գեղեցկությունը և մարդկային միտքը ստեղծում են հավերժական գրեր։' },
  hyw: { app: 'armenian', iso: 'Armn', region: 'Armenian Diaspora', sample: 'Ազատութիւն, լոյս եւ ստեղծագործ միտք հայկական տառարուեստին մէջ։' },
  xcl: { app: 'armenian', iso: 'Armn', region: 'Ancient Armenia (Grabar)', sample: 'Ի սկզբանէ էր Բանն, եւ Բանն էր առ Աստուած։' },
  axm: { app: 'armenian', iso: 'Armn', region: 'Cilician Armenia (Middle Armenian)', sample: 'Հայոց միջնադարեան մատենագրութիւն եւ տառարուեստ։' },
  ka: { app: 'georgian', iso: 'Geor', region: 'Georgia / Caucasus' },
  kat: { app: 'georgian', iso: 'Geor', region: 'Georgia / Caucasus' },
  oge: { app: 'georgian', iso: 'Geor', region: 'Historical Georgia' },
  fa: { app: 'persian', iso: 'Arab', region: 'Iran / Afghanistan / Tajikistan' },
  pes: { app: 'persian', iso: 'Arab', region: 'Iran' },
  prs: { app: 'persian', iso: 'Arab', region: 'Afghanistan' },
  zho: { app: 'cjk-sc', iso: 'Hans', region: 'China' },
  cmn: { app: 'cjk-sc', iso: 'Hans', region: 'Mainland China' },
  yue: { app: 'cjk-tc', iso: 'Hant', region: 'Hong Kong / Guangdong' },
  jpn: { app: 'japanese', iso: 'Jpan', region: 'Japan' },
  kor: { app: 'korean', iso: 'Kore', region: 'Korea' },
  ara: { app: 'arabic', iso: 'Arab', region: 'Middle East / North Africa' },
  heb: { app: 'hebrew', iso: 'Hebr', region: 'Israel / Diaspora' },
  rus: { app: 'cyrillic', iso: 'Cyrl', region: 'Eastern Europe / Eurasia' },
  ell: { app: 'greek', iso: 'Grek', region: 'Greece / Cyprus' },
  hin: { app: 'devanagari', iso: 'Deva', region: 'India' },
  ben: { app: 'bengali', iso: 'Beng', region: 'Bangladesh / India' },
  tam: { app: 'tamil', iso: 'Taml', region: 'South India / Sri Lanka' },
  tha: { app: 'thai', iso: 'Thai', region: 'Thailand' },
  amh: { app: 'ethiopic', iso: 'Ethi', region: 'Ethiopia' },
};

function inferScriptFromCldr(iso3, part1, name, likelySubtags) {
  if (CURATED_OVERRIDES[iso3]) {
    return { isoScript: CURATED_OVERRIDES[iso3].iso, confidence: 'curated' };
  }
  if (part1 && CURATED_OVERRIDES[part1]) {
    return { isoScript: CURATED_OVERRIDES[part1].iso, confidence: 'curated' };
  }

  const candidates = [part1, iso3].filter(Boolean);
  for (const tag of candidates) {
    const mapped = likelySubtags[tag];
    if (mapped) {
      const parts = mapped.split('-');
      const script = parts.find((p) => /^[A-Z][a-z]{3}$/.test(p));
      if (script && script !== 'Zzzz') {
        return { isoScript: script, confidence: 'cldr' };
      }
    }
  }

  for (const [regex, script] of EXTINCT_AND_HISTORICAL_SCRIPT_HINTS) {
    if (regex.test(name)) {
      return { isoScript: script, confidence: 'historical-rule' };
    }
  }

  return { isoScript: 'Latn', confidence: 'latin-fallback' };
}

function isoScriptToAppScript(isoScript, iso3) {
  if (CURATED_OVERRIDES[iso3]) return CURATED_OVERRIDES[iso3].app;
  if (ISO_TO_APP_SCRIPT[isoScript]) return ISO_TO_APP_SCRIPT[isoScript].app;
  if (['Shrd', 'Sidd', 'Gran', 'Modi', 'Kthi', 'Tirh', 'Takr', 'Dogr', 'Mahj', 'Khoj', 'Sind', 'Mult', 'Saur', 'Brah', 'Khar', 'Newa', 'Bhks', 'Marc', 'Sylo', 'Lepc', 'Limb'].includes(isoScript)) {
    return 'indic-other';
  }
  return 'global-other';
}

async function main() {
  fs.mkdirSync(API_DIR, { recursive: true });
  fs.mkdirSync(API_V1_DIR, { recursive: true });

  console.log('Downloading official SIL ISO 639-3 registry (~7,900+ languages)...');
  const isoRes = await fetch('https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3.tab');
  if (!isoRes.ok) throw new Error(`ISO 639-3 fetch failed: ${isoRes.status}`);
  const isoText = await isoRes.text();

  console.log('Downloading official Unicode CLDR likelySubtags...');
  const cldrRes = await fetch('https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-core/supplemental/likelySubtags.json');
  if (!cldrRes.ok) throw new Error(`CLDR fetch failed: ${cldrRes.status}`);
  const cldrJson = await cldrRes.json();
  const likelySubtags = cldrJson.supplemental.likelySubtags || {};

  const lines = isoText.trim().split('\n');
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const id = (cols[0] || '').trim();
    const part1 = (cols[3] || '').trim();
    const scope = (cols[4] || 'I').trim();
    const status = (cols[5] || 'L').trim(); // L=Living, E=Extinct, H=Historical, A=Ancient, C=Constructed, S=Special
    const refName = (cols[6] || '').trim();
    if (!id || !refName) continue;

    const { isoScript, confidence } = inferScriptFromCldr(id, part1, refName, likelySubtags);
    const appScript = isoScriptToAppScript(isoScript, id);
    const dir = RTL_ISO_SCRIPTS.has(isoScript) ? 'rtl' : 'ltr';

    records.push({
      id,
      part1: part1 || undefined,
      name: refName,
      scope,
      status,
      isoScript,
      appScript,
      dir,
      confidence,
    });
  }

  // Also include curated modern diaspora/dialect tags if not already covered (e.g. hyw)
  if (!records.some((r) => r.id === 'hyw')) {
    records.unshift({
      id: 'hyw',
      name: 'Western Armenian',
      scope: 'I',
      status: 'L',
      isoScript: 'Armn',
      appScript: 'armenian',
      dir: 'ltr',
      confidence: 'curated',
    });
  }

  // Compact tuple array for bundled UI lookup: [id, part1, status, isoScript, appScript, dir, name, confidence]
  const compactTuples = records.map((r) => [
    r.id,
    r.part1 || '',
    r.status,
    r.isoScript,
    r.appScript,
    r.dir,
    r.name,
    r.confidence,
  ]);

  fs.writeFileSync(SRC_OUT, JSON.stringify(compactTuples));

  const statusCounts = {};
  const scriptCounts = {};
  for (const r of records) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    scriptCounts[r.isoScript] = (scriptCounts[r.isoScript] || 0) + 1;
  }

  const apiPayload = {
    apiVersion: '2.0',
    source: 'SIL ISO 639-3 + Unicode CLDR likelySubtags',
    generatedAt: new Date().toISOString(),
    totalLanguages: records.length,
    statusBreakdown: {
      living: statusCounts.L || 0,
      extinct: statusCounts.E || 0,
      historical: statusCounts.H || 0,
      ancient: statusCounts.A || 0,
      constructed: statusCounts.C || 0,
      special: statusCounts.S || 0,
    },
    uniqueIsoScripts: Object.keys(scriptCounts).length,
    languages: records,
  };

  fs.writeFileSync(path.join(API_DIR, 'languages.json'), JSON.stringify(apiPayload));
  fs.writeFileSync(path.join(API_V1_DIR, 'languages.json'), JSON.stringify(apiPayload));

  console.log(`Generated ${records.length} ISO 639-3 world languages across ${Object.keys(scriptCounts).length} ISO 15924 scripts!`);
  console.log('Status breakdown:', apiPayload.statusBreakdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
