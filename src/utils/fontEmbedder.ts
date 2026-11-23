import { EmbedHostConfig, FontEntry, StudioFontMeta } from '../types/font';

const STORAGE_KEY = 'pangloss_embed_host_config_v1';

export function getDefaultEmbedHostConfig(): EmbedHostConfig {
  const origin =
    typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'https://your-fonts-site.com';
  return {
    baseUrl: origin,
    fontsPath: '/fonts',
    customFontOverrides: {},
  };
}

export function loadEmbedHostConfig(): EmbedHostConfig {
  const fallback = getDefaultEmbedHostConfig();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<EmbedHostConfig>;
    return {
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : fallback.baseUrl,
      fontsPath: typeof parsed.fontsPath === 'string' ? parsed.fontsPath : fallback.fontsPath,
      customFontOverrides:
        parsed.customFontOverrides && typeof parsed.customFontOverrides === 'object'
          ? parsed.customFontOverrides
          : {},
    };
  } catch {
    return fallback;
  }
}

export function saveEmbedHostConfig(config: EmbedHostConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota / private mode failures
  }
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

export function normalizeFontsPath(fontsPath: string): string {
  const cleaned = fontsPath.trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

export function resolveFontCssUrl(font: FontEntry, hostConfig: EmbedHostConfig): string {
  const custom = hostConfig.customFontOverrides?.[font.id]?.trim();
  if (custom) {
    return custom;
  }
  const base = normalizeBaseUrl(hostConfig.baseUrl);
  const path = normalizeFontsPath(hostConfig.fontsPath);
  const cssFile = font.localCssFile || `${font.id}.css`;
  return `${base}${path}/${cssFile}`;
}

export function resolveFontBinaryUrl(font: FontEntry, hostConfig: EmbedHostConfig): string {
  const base = normalizeBaseUrl(hostConfig.baseUrl);
  const path = normalizeFontsPath(hostConfig.fontsPath);
  const binFile = font.localFontFile || `${font.id}-0.woff2`;
  return `${base}${path}/${binFile}`;
}

export function generateHtmlLinkEmbed(font: FontEntry, hostConfig: EmbedHostConfig): string {
  const cssUrl = resolveFontCssUrl(font, hostConfig);
  const sriAttr =
    font.sriSha384 && !hostConfig.customFontOverrides?.[font.id]
      ? `\n      integrity="${font.sriSha384}"\n      crossorigin="anonymous"`
      : '';
  return `<!-- Self-hosted on your configured domain (with Subresource Integrity) -->\n<link rel="stylesheet" href="${cssUrl}"${sriAttr}>`;
}

export function generatePreloadHtmlEmbed(font: FontEntry, hostConfig: EmbedHostConfig): string {
  const cssUrl = resolveFontCssUrl(font, hostConfig);
  const binUrl = resolveFontBinaryUrl(font, hostConfig);
  const ext = binUrl.split('.').pop()?.toLowerCase() || 'woff2';
  const mime = ext === 'otf' ? 'font/otf' : ext === 'ttf' ? 'font/ttf' : 'font/woff2';
  return `<!-- Zero-FOUT Preload + Self-Hosted Stylesheet -->
<link rel="preload" href="${binUrl}" as="font" type="${mime}" crossorigin>
<link rel="stylesheet" href="${cssUrl}">`;
}

export function generateWebComponentEmbed(
  font: FontEntry,
  hostConfig: EmbedHostConfig,
  sampleText = 'Այբուբեն · Typography'
): string {
  const root = resolveRootHostUrl(hostConfig);
  const fontsPath = normalizeFontsPath(hostConfig.fontsPath) || '/fonts';
  const safeSample = sampleText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!-- Declarative Web Component via Your Static Host -->
<script src="${root}/pangloss-loader.js" data-host="${root || ''}" data-path="${fontsPath}"></script>

<pangloss-type font="${font.id}" family="${font.name}" weight="${font.weights[0] || 400}">
  ${safeSample}
</pangloss-type>`;
}

export function generateFrameworkAdapterEmbed(
  font: FontEntry,
  hostConfig: EmbedHostConfig,
  framework: 'react' | 'vue' | 'svelte' | 'wordpress' | 'shopify' | 'svg'
): string {
  const cssUrl = resolveFontCssUrl(font, hostConfig);
  const binUrl = resolveFontBinaryUrl(font, hostConfig);

  if (framework === 'react') {
    return `// React / Next.js Self-Hosted Font Component
import { useEffect } from 'react';

export function use${font.id.replace(/[^a-zA-Z0-9]/g, '')}Font() {
  useEffect(() => {
    const id = 'pangloss-${font.id}';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = '${cssUrl}';
    document.head.appendChild(link);
  }, []);
}

// Style usage: style={{ fontFamily: '${font.familyCss.replace(/"/g, '')}, ${font.fallbackStack}' }}`;
  }

  if (framework === 'vue') {
    return `<!-- Vue 3 / Nuxt Self-Hosted Head Embed -->
<script setup>
import { onMounted } from 'vue';
onMounted(() => {
  if (!document.querySelector('link[data-font="${font.id}"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '${cssUrl}';
    l.setAttribute('data-font', '${font.id}');
    document.head.appendChild(l);
  }
});
</script>`;
  }

  if (framework === 'svelte') {
    return `<!-- Svelte / SvelteKit Head Embed -->
<svelte:head>
  <link rel="stylesheet" href="${cssUrl}" />
</svelte:head>

<p style="font-family: ${font.familyCss}, ${font.fallbackStack};">
  Typography from your own static host
</p>`;
  }

  if (framework === 'wordpress') {
    return `<?php
// WordPress functions.php enqueue from your static host
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'pangloss-${font.id}',
    '${cssUrl}',
    array(),
    null
  );
});`;
  }

  if (framework === 'shopify') {
    return `{% comment %} Shopify theme.liquid <head> snippet {% endcomment %}
{{ '${cssUrl}' | stylesheet_tag }}
<style>
  :root { --font-custom: ${font.familyCss}, ${font.fallbackStack}; }
</style>`;
  }

  return `<!-- Self-Hosted SVG Graphic Vector Embed -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 180">
  <defs>
    <style>
      @import url('${cssUrl}');
      .type-layer { font-family: ${font.familyCss}, ${font.fallbackStack}; font-size: 42px; fill: #141413; }
    </style>
  </defs>
  <text x="24" y="108" class="type-layer">${font.name}</text>
</svg>
<!-- Primary binary: ${binUrl} -->`;
}

export function generateSecurityHeadersSnippet(
  hostConfig: EmbedHostConfig,
  font?: FontEntry
): string {
  const root = resolveRootHostUrl(hostConfig);
  const originRule = root ? `'self' ${root}` : `'self'`;
  const sriLine =
    font?.sriSha384
      ? `\n# Subresource Integrity (<link> attribute for ${font.name}):\n# integrity="${font.sriSha384}" crossorigin="anonymous"`
      : '';
  return `# Strict Static Font Security Headers (CSP + CORS)
Content-Security-Policy: default-src 'self'; style-src ${originRule}; font-src ${originRule} data:;
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=31536000, immutable${sriLine}`;
}

export async function buildSelfContainedDataUriCss(font: FontEntry): Promise<string> {
  const binPath = font.downloadUrl || `/fonts/${font.localFontFile || `${font.id}-0.woff2`}`;
  const res = await fetch(binPath);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  const ext = binPath.split('.').pop()?.toLowerCase() || 'woff2';
  const mime = ext === 'otf' ? 'font/otf' : ext === 'ttf' ? 'font/ttf' : 'font/woff2';
  const format = ext === 'otf' ? 'opentype' : ext === 'ttf' ? 'truetype' : 'woff2';
  return `/* Self-Contained Offline Base64 CSS for ${font.name} (Zero External Network Calls) */
@font-face {
  font-family: ${font.familyCss};
  src: url('data:${mime};base64,${base64}') format('${format}');
  font-weight: ${font.weights[0] || 400};
  font-style: normal;
  font-display: swap;
}`;
}

export function generateCssImportEmbed(font: FontEntry, hostConfig: EmbedHostConfig): string {
  const cssUrl = resolveFontCssUrl(font, hostConfig);
  return `@import url('${cssUrl}');\n\n:root {\n  --font-${font.id}: ${font.familyCss}, ${font.fallbackStack};\n}\n\nbody {\n  font-family: var(--font-${font.id});\n}`;
}

export function generateDirectFontFaceEmbed(font: FontEntry, hostConfig: EmbedHostConfig): string {
  const binaryUrl = resolveFontBinaryUrl(font, hostConfig);
  const ext = binaryUrl.split('.').pop()?.toLowerCase() || 'woff2';
  const format = ext === 'otf' ? 'opentype' : ext === 'ttf' ? 'truetype' : 'woff2';
  return `@font-face {\n  font-family: ${font.familyCss};\n  src: url('${binaryUrl}') format('${format}');\n  font-weight: ${font.weights[0] || 400};\n  font-style: normal;\n  font-display: swap;\n}\n\n:root {\n  --font-${font.id}: ${font.familyCss}, ${font.fallbackStack};\n}`;
}

export function generateTailwindThemeEmbed(font: FontEntry, hostConfig: EmbedHostConfig): string {
  const cssUrl = resolveFontCssUrl(font, hostConfig);
  return `@import url('${cssUrl}');\n@import "tailwindcss";\n\n@theme {\n  --font-custom: ${font.familyCss}, ${font.fallbackStack};\n}`;
}

export function generateStudioEmbedSnippet(
  meta: StudioFontMeta,
  base64Otf: string,
  sampleText: string
): string {
  const safeFamily = meta.familyName.replace(/["'\\]/g, '').trim() || 'PanglossCustom';
  const safeSample = sampleText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!-- Pangloss Font Studio: Self-Contained Embed (Zero Backend Required) -->
<style>
  @font-face {
    font-family: '${safeFamily}';
    src: url('data:font/otf;base64,${base64Otf}') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  .pangloss-studio-type {
    font-family: '${safeFamily}', sans-serif;
  }
</style>

<!-- Drop this anywhere in your HTML -->
<div class="pangloss-studio-type" style="font-size: 32px; line-height: 1.35;">
  ${safeSample}
</div>`;
}

export function generateStudioScriptEmbed(
  meta: StudioFontMeta,
  base64Otf: string
): string {
  const safeFamily = meta.familyName.replace(/["'\\]/g, '').trim() || 'PanglossCustom';
  return `<script>
  (function() {
    var style = document.createElement('style');
    style.textContent = "@font-face { font-family: '${safeFamily}'; src: url('data:font/otf;base64,${base64Otf}') format('opentype'); font-display: swap; }";
    document.head.appendChild(style);
  })();
</script>`;
}

export function generatePairingCss(
  primary: FontEntry,
  secondary: FontEntry,
  hostConfig: EmbedHostConfig
): string {
  const primaryUrl = resolveFontCssUrl(primary, hostConfig);
  const secondaryUrl = resolveFontCssUrl(secondary, hostConfig);
  const lines: string[] = [`@import url('${primaryUrl}');`];
  if (secondaryUrl !== primaryUrl) {
    lines.push(`@import url('${secondaryUrl}');`);
  }
  lines.push('');
  lines.push(':root {');
  lines.push(`  --font-display: ${primary.familyCss}, ${primary.fallbackStack};`);
  lines.push(`  --font-body: ${secondary.familyCss}, ${secondary.fallbackStack};`);
  lines.push('}');
  lines.push('');
  lines.push('h1, h2, h3 { font-family: var(--font-display); }');
  lines.push('body, p { font-family: var(--font-body); }');
  return lines.join('\n');
}

export function generateProjectKitBundleFiles(
  fonts: FontEntry[],
  hostConfig: EmbedHostConfig
): {
  css: string;
  tokensJson: string;
  demoHtml: string;
  readme: string;
} {
  const imports = Array.from(new Set(fonts.map((f) => resolveFontCssUrl(f, hostConfig))));
  const cssLines = [
    ...imports.map((url) => `@import url('${url}');`),
    '',
    ':root {',
    ...fonts.map((f) => `  --font-${f.id}: ${f.familyCss}, ${f.fallbackStack};`),
    '}',
  ];

  const tokens = {
    generatedAt: new Date().toISOString(),
    configuredHost: normalizeBaseUrl(hostConfig.baseUrl) + normalizeFontsPath(hostConfig.fontsPath),
    fontCount: fonts.length,
    fonts: fonts.map((f) => ({
      id: f.id,
      name: f.name,
      cssVariable: `--font-${f.id}`,
      fontFamily: `${f.familyCss}, ${f.fallbackStack}`,
      embedCssUrl: resolveFontCssUrl(f, hostConfig),
      binaryUrl: resolveFontBinaryUrl(f, hostConfig),
      scripts: f.scripts,
      isoScripts: f.isoScripts,
      sriSha384: f.sriSha384,
      license: f.license,
      source: f.sourceName,
    })),
  };

  const linksHtml = imports.map((url) => `  <link rel="stylesheet" href="${url}">`).join('\n');
  const cardsHtml = fonts
    .map(
      (f) => `  <section style="margin: 24px 0; padding: 20px; border: 1px solid #e5e5e0;">
    <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${f.name} · ${f.scripts.join(', ')} · ${f.license}</div>
    <div style="font-family: ${f.familyCss}, ${f.fallbackStack}; font-size: 28px;">
      Typography across every human script — Այբուբեն · ქართული · Кириллица · العربية · 日本語
    </div>
  </section>`
    )
    .join('\n');

  const demoHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pangloss Project Kit Specimen</title>
${linksHtml}
</head>
<body style="max-width: 960px; margin: 40px auto; font-family: sans-serif; color: #141413; background: #faf9f6;">
  <h1>Pangloss Type — Project Kit (${fonts.length} Fonts)</h1>
${cardsHtml}
</body>
</html>`;

  const readme = `# Pangloss Type — Self-Hosted Static Font Kit

Configured Embed Host: ${normalizeBaseUrl(hostConfig.baseUrl) || '(relative)'}${normalizeFontsPath(hostConfig.fontsPath)}
Included fonts (${fonts.length}):
${fonts.map((f) => `- ${f.name} (${f.foundry}) — ${resolveFontCssUrl(f, hostConfig)}`).join('\n')}

Usage:
1. All font CSS and binary files are served statically from \`${normalizeFontsPath(hostConfig.fontsPath) || '/fonts'}\` in your deployment.
2. Include \`fonts.css\` in your project stylesheet or copy the \`<link>\` tags from \`demo.html\`.
3. Reference variables such as \`var(--font-${fonts[0]?.id || 'example'})\`.
`;

  return {
    css: cssLines.join('\n'),
    tokensJson: JSON.stringify(tokens, null, 2),
    demoHtml,
    readme,
  };
}

export interface ParametricStyleParams {
  weight: number;
  widthPercent: number;
  obliqueDeg: number;
  trackingEm: number;
  lineHeight: number;
  ligatures: boolean;
  tabularNums: boolean;
}

export function resolveRootHostUrl(hostConfig: EmbedHostConfig): string {
  return normalizeBaseUrl(hostConfig.baseUrl);
}

export function generateLoaderSdkEmbed(
  fontIds: string[],
  hostConfig: EmbedHostConfig
): string {
  const root = resolveRootHostUrl(hostConfig);
  const fontsPath = normalizeFontsPath(hostConfig.fontsPath) || '/fonts';
  const scriptSrc = `${root}/pangloss-loader.js`;
  const list = fontIds.length > 0 ? fontIds.join(',') : 'noto-sans-armenian,fraunces';
  return `<!-- Pangloss Self-Hosted Drop-In JS SDK v2.0 (Zero Backend) -->
<script
  src="${scriptSrc}"
  data-host="${root || ''}"
  data-path="${fontsPath}"
  data-fonts="${list}"
></script>

<!-- Runtime API: resolve any of 7,928 ISO 639-3 languages or preload -->
<script>
  window.PanglossFonts?.load(['${fontIds[0] || 'noto-sans-armenian'}'], {
    host: '${root || ''}',
    fontsPath: '${fontsPath}'
  });
</script>`;
}

export function generateBatchLinksEmbed(
  fonts: FontEntry[],
  hostConfig: EmbedHostConfig
): string {
  const urls = Array.from(new Set(fonts.map((f) => resolveFontCssUrl(f, hostConfig))));
  return `<!-- Batch Self-Hosted Stylesheets (${fonts.length} Fonts via Your Host) -->\n${urls
    .map((u) => `<link rel="stylesheet" href="${u}">`)
    .join('\n')}`;
}

export function generateBatchCssEmbed(
  fonts: FontEntry[],
  hostConfig: EmbedHostConfig
): string {
  const urls = Array.from(new Set(fonts.map((f) => resolveFontCssUrl(f, hostConfig))));
  return [
    ...urls.map((u) => `@import url('${u}');`),
    '',
    ':root {',
    ...fonts.map((f) => `  --font-${f.id}: ${f.familyCss}, ${f.fallbackStack};`),
    '}',
  ].join('\n');
}

export function generateParametricFontCss(
  font: FontEntry,
  params: ParametricStyleParams,
  hostConfig: EmbedHostConfig
): string {
  const cssUrl = resolveFontCssUrl(font, hostConfig);
  const features = [
    params.ligatures ? '"liga" 1, "kern" 1' : '"liga" 0',
    params.tabularNums ? '"tnum" 1' : '"tnum" 0',
  ].join(', ');
  const transforms: string[] = [];
  if (params.widthPercent !== 100) {
    transforms.push(`scaleX(${(params.widthPercent / 100).toFixed(2)})`);
  }
  if (params.obliqueDeg !== 0) {
    transforms.push(`skewX(${params.obliqueDeg}deg)`);
  }
  const transformLine =
    transforms.length > 0
      ? `\n  display: inline-block;\n  transform: ${transforms.join(' ')};\n  transform-origin: left baseline;`
      : '';

  return `@import url('${cssUrl}');

.pangloss-parametric-${font.id} {
  font-family: ${font.familyCss}, ${font.fallbackStack};
  font-weight: ${params.weight};
  letter-spacing: ${params.trackingEm}em;
  line-height: ${params.lineHeight};
  font-feature-settings: ${features};${transformLine}
}`;
}

export function generateStaticApiSnippet(
  hostConfig: EmbedHostConfig,
  endpoint: 'fonts' | 'languages' | 'scripts' | 'stats' | 'integrity' | 'manifest'
): string {
  const root = resolveRootHostUrl(hostConfig);
  const fontsPath = normalizeFontsPath(hostConfig.fontsPath) || '/fonts';
  const url =
    endpoint === 'fonts'
      ? `${root}/api/fonts.json`
      : endpoint === 'languages'
        ? `${root}/api/languages.json`
        : endpoint === 'scripts'
          ? `${root}/api/v1/scripts.json`
          : endpoint === 'stats'
            ? `${root}/api/v1/stats.json`
            : endpoint === 'integrity'
              ? `${root}/api/integrity.json`
              : `${root}${fontsPath}/manifest.json`;

  if (endpoint === 'languages') {
    return `// Static ISO 639-3 World Languages API (7,928+ Languages, Zero Backend)
const res = await fetch('${url}');
const { totalLanguages, statusBreakdown, languages } = await res.json();

// Lookup any living, extinct, or historical language (e.g. Classical Armenian 'xcl', Sumerian 'sux'):
const matches = languages.filter(l => l.isoScript === 'Armn' || l.status === 'E');
console.log(totalLanguages, statusBreakdown, matches.slice(0, 10));`;
  }

  if (endpoint === 'scripts') {
    return `// Static ISO 15924 Script Coverage API (140 World Scripts)
const res = await fetch('${url}');
const { scriptCounts } = await res.json();
console.log('Armenian:', scriptCounts.Armn, 'Cyrillic:', scriptCounts.Cyrl, 'Cuneiform:', scriptCounts.Xsux);`;
  }

  if (endpoint === 'stats' || endpoint === 'integrity') {
    return `// Static Repository Diagnostics & SHA-384 Subresource Integrity API
const res = await fetch('${url}');
const payload = await res.json();
console.log(payload);`;
  }

  return `// Static Type Archive REST API — 100% Serverless JSON Endpoint
const res = await fetch('${url}');
const { totalFonts, fonts } = await res.json();

// Filter real verified non-duplicate fonts supporting Armenian (Armn):
const matching = fonts.filter(f => f.isoScripts?.includes('Armn'));
console.log('Total Unique Fonts:', totalFonts, 'Armenian:', matching.length);`;
}
