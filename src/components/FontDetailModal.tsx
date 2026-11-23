import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { X, Copy, Check, Download, Plus, Globe } from 'lucide-react';
import { EmbedHostConfig, FontEntry } from '../types/font';
import { getScriptMeta } from '../data/scripts';
import { loadFontStylesheet, triggerBinaryDownload } from '../utils/fontLoader';
import {
  buildSelfContainedDataUriCss,
  generateCssImportEmbed,
  generateDirectFontFaceEmbed,
  generateFrameworkAdapterEmbed,
  generateHtmlLinkEmbed,
  generateLoaderSdkEmbed,
  generateParametricFontCss,
  generatePreloadHtmlEmbed,
  generateTailwindThemeEmbed,
  generateWebComponentEmbed,
  resolveFontCssUrl,
} from '../utils/fontEmbedder';

interface FontDetailModalProps {
  font: FontEntry | null;
  onClose: () => void;
  inKit: boolean;
  onToggleKit: (font: FontEntry) => void;
  hostConfig: EmbedHostConfig;
  onOpenHostManager: () => void;
}

type EmbedTab =
  | 'html'
  | 'preload'
  | 'parametric'
  | 'sdk'
  | 'webcomponent'
  | 'react'
  | 'vue'
  | 'svelte'
  | 'wordpress'
  | 'shopify'
  | 'svg'
  | 'base64'
  | 'css'
  | 'fontface'
  | 'tailwind';

export const FontDetailModal: React.FC<FontDetailModalProps> = ({
  font,
  onClose,
  inKit,
  onToggleKit,
  hostConfig,
  onOpenHostManager,
}) => {
  const [embedTab, setEmbedTab] = useState<EmbedTab>('html');
  const [copied, setCopied] = useState(false);
  const [weight, setWeight] = useState(400);
  const [size, setSize] = useState(36);
  const [tracking, setTracking] = useState(0);
  const [widthPercent, setWidthPercent] = useState(100);
  const [obliqueDeg, setObliqueDeg] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.35);
  const [activeScript, setActiveScript] = useState<string>('latin');
  const [customText, setCustomText] = useState('');
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [enableLigatures, setEnableLigatures] = useState(true);
  const [enableTabularNums, setEnableTabularNums] = useState(false);
  const [packagingZip, setPackagingZip] = useState(false);
  const [packageMessage, setPackageMessage] = useState<string | null>(null);
  const [base64Css, setBase64Css] = useState<string>('');
  const [base64Loading, setBase64Loading] = useState(false);

  useEffect(() => {
    if (!font) return;
    loadFontStylesheet(font.cssImportUrl);
    setWeight(font.weights.includes(400) ? 400 : font.weights[0] || 400);
    setWidthPercent(100);
    setObliqueDeg(0);
    setLineHeight(1.35);
    setBase64Css('');
    const primaryScript = font.scripts[0] || 'latin';
    setActiveScript(primaryScript);
    setCustomText(getScriptMeta(primaryScript).sampleSentence);
  }, [font]);

  useEffect(() => {
    if (!font || embedTab !== 'base64' || base64Css) return;
    let active = true;
    setBase64Loading(true);
    buildSelfContainedDataUriCss(font)
      .then((css) => {
        if (active) setBase64Css(css);
      })
      .catch(() => {
        if (active) setBase64Css('/* Unable to inline binary font data in this browser session. */');
      })
      .finally(() => {
        if (active) setBase64Loading(false);
      });
    return () => {
      active = false;
    };
  }, [embedTab, font, base64Css]);

  if (!font) return null;

  const scriptMeta = getScriptMeta(activeScript);
  const resolvedCssUrl = resolveFontCssUrl(font, hostConfig);
  const embedCode =
    embedTab === 'html'
      ? generateHtmlLinkEmbed(font, hostConfig)
      : embedTab === 'preload'
        ? generatePreloadHtmlEmbed(font, hostConfig)
        : embedTab === 'parametric'
          ? generateParametricFontCss(
              font,
              {
                weight,
                widthPercent,
                obliqueDeg,
                trackingEm: tracking,
                lineHeight,
                ligatures: enableLigatures,
                tabularNums: enableTabularNums,
              },
              hostConfig
            )
          : embedTab === 'sdk'
            ? generateLoaderSdkEmbed([font.id], hostConfig)
            : embedTab === 'webcomponent'
              ? generateWebComponentEmbed(font, hostConfig, customText)
              : embedTab === 'react' ||
                  embedTab === 'vue' ||
                  embedTab === 'svelte' ||
                  embedTab === 'wordpress' ||
                  embedTab === 'shopify' ||
                  embedTab === 'svg'
                ? generateFrameworkAdapterEmbed(font, hostConfig, embedTab)
                : embedTab === 'base64'
                  ? base64Loading
                    ? '/* Encoding local font binary into Base64 Data URI... */'
                    : base64Css
                  : embedTab === 'css'
                    ? generateCssImportEmbed(font, hostConfig)
                    : embedTab === 'fontface'
                      ? generateDirectFontFaceEmbed(font, hostConfig)
                      : generateTailwindThemeEmbed(font, hostConfig);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure in restricted context
    }
  };

  const handleScriptSwitch = (code: string) => {
    setActiveScript(code);
    setCustomText(getScriptMeta(code).sampleSentence);
  };

  const handleDownloadCssBundle = () => {
    const css = generateCssImportEmbed(font, hostConfig);
    const blob = new Blob([css], { type: 'text/css;charset=utf-8' });
    triggerBinaryDownload(blob, `${font.id}.css`, 'text/css;charset=utf-8');
  };

  const handleDownloadStaticWebfontZip = async () => {
    setPackagingZip(true);
    setPackageMessage(null);
    try {
      const zip = new JSZip();
      let downloadedBinaryCount = 0;

      const localStylesheetPath = font.cssImportUrl || `/fonts/${font.localCssFile || `${font.id}.css`}`;
      const res = await fetch(localStylesheetPath);
      if (res.ok) {
        const cssText = await res.text();
        const urlMatches = Array.from(cssText.matchAll(/url\(['"]?([^)'"]+\.(?:woff2|woff|ttf|otf))['"]?\)/g));
        const uniqueUrls = Array.from(new Set(urlMatches.map((m) => m[1])));
        let rewrittenCss = cssText;

        for (let i = 0; i < uniqueUrls.length; i++) {
          const rawUrl = uniqueUrls[i];
          const fetchUrl = rawUrl.startsWith('./')
            ? `/fonts/${rawUrl.slice(2)}`
            : rawUrl;
          try {
            const binRes = await fetch(fetchUrl);
            if (binRes.ok) {
              const buf = await binRes.arrayBuffer();
              const cleanName = rawUrl.split('/').pop()?.split('?')[0] || `${font.id}-${i}.woff2`;
              const zipRelPath = `fonts/${cleanName}`;
              zip.file(zipRelPath, buf);
              rewrittenCss = rewrittenCss.split(rawUrl).join(`./${zipRelPath}`);
              downloadedBinaryCount++;
            }
          } catch {
            // Skip individual missing subset file
          }
        }
        zip.file('font-face.css', rewrittenCss);
      }

      zip.file('embed.css', generateCssImportEmbed(font, hostConfig));
      zip.file(
        'README.txt',
        `${font.name} (${font.foundry})\nLicense: ${font.license}\nConfigured Embed URL: ${resolvedCssUrl}\nBundled local binary files: ${downloadedBinaryCount}\n`
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerBinaryDownload(blob, `${font.id}-static-kit.zip`, 'application/zip');
      setPackageMessage(
        downloadedBinaryCount > 0
          ? `Packaged ${downloadedBinaryCount} local .woff2 files + CSS into ZIP.`
          : 'Packaged CSS embed kit into ZIP.'
      );
    } catch {
      setPackageMessage('Could not package font files; try direct .WOFF2 download.');
    } finally {
      setPackagingZip(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${font.name} specimen and embed inspector`}
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#FAF9F6] border border-stone-200 rounded-xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-[#6E6A63]">
              {font.foundry} · {font.sourceName} · {font.license} · {font.year}
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#141413] mt-0.5">
              {font.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleKit(font)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                inKit
                  ? 'bg-[#B43E22] text-white border-[#B43E22]'
                  : 'bg-white text-[#141413] border-stone-300 hover:border-[#141413]'
              }`}
            >
              {inKit ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {inKit ? 'In Project Kit' : 'Add to Kit'}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close font detail modal"
              className="p-2 text-[#57534E] hover:text-[#141413] hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm text-[#57534E] leading-relaxed max-w-3xl">
            {font.description} Designed by {font.designer}. Supports{' '}
            <span className="text-[#141413] font-medium">
              {font.scripts.map((s) => getScriptMeta(s).name).join(', ')}
            </span>{' '}
            {font.isoScripts && font.isoScripts.length > 0 ? `[ISO 15924: ${font.isoScripts.join(', ')}] ` : ''}
            ({font.glyphCount.toLocaleString()} glyphs).
          </p>

          {/* Interactive Specimen Controls */}
          <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {font.scripts.map((code) => {
                  const meta = getScriptMeta(code);
                  const active = activeScript === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleScriptSwitch(code)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#141413] text-white'
                          : 'bg-stone-100 text-[#57534E] hover:text-[#141413]'
                      }`}
                    >
                      {meta.name} ({meta.nativeName})
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setDarkCanvas((d) => !d)}
                className="px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-md text-[#141413] hover:bg-stone-100 cursor-pointer whitespace-nowrap"
              >
                {darkCanvas ? 'Paper Background' : 'Dark Ink Background'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
              <label className="block">
                <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                  <span>Size</span>
                  <span>{size}px</span>
                </span>
                <input
                  type="range"
                  min={16}
                  max={72}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full mt-1.5 accent-[#B43E22]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                  <span>Tracking</span>
                  <span>{tracking}em</span>
                </span>
                <input
                  type="range"
                  min={-0.05}
                  max={0.2}
                  step={0.01}
                  value={tracking}
                  onChange={(e) => setTracking(Number(e.target.value))}
                  className="w-full mt-1.5 accent-[#B43E22]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                  <span>Weight Axis</span>
                  <span>{weight}</span>
                </span>
                <input
                  type="range"
                  min={100}
                  max={900}
                  step={25}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full mt-1.5 accent-[#B43E22]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                  <span>Optical Width</span>
                  <span>{widthPercent}%</span>
                </span>
                <input
                  type="range"
                  min={75}
                  max={130}
                  step={1}
                  value={widthPercent}
                  onChange={(e) => setWidthPercent(Number(e.target.value))}
                  className="w-full mt-1.5 accent-[#B43E22]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                  <span>Oblique Slant</span>
                  <span>{obliqueDeg}°</span>
                </span>
                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={1}
                  value={obliqueDeg}
                  onChange={(e) => setObliqueDeg(Number(e.target.value))}
                  className="w-full mt-1.5 accent-[#B43E22]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                  <span>Line Height</span>
                  <span>{lineHeight}</span>
                </span>
                <input
                  type="range"
                  min={1.0}
                  max={2.0}
                  step={0.05}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full mt-1.5 accent-[#B43E22]"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#57534E]">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLigatures}
                  onChange={(e) => setEnableLigatures(e.target.checked)}
                  className="accent-[#B43E22]"
                />
                <span>Standard Ligatures (liga)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTabularNums}
                  onChange={(e) => setEnableTabularNums(e.target.checked)}
                  className="accent-[#B43E22]"
                />
                <span>Tabular Numerals (tnum)</span>
              </label>
              <span className="text-[#6E6A63] ml-auto font-mono">
                {scriptMeta.unicodeRange}
              </span>
            </div>

            <div
              className={`p-5 rounded-lg border transition-colors ${
                darkCanvas
                  ? 'bg-[#141413] text-[#FAF9F6] border-stone-800'
                  : 'bg-[#FAF9F6] text-[#141413] border-stone-200'
              }`}
            >
              <textarea
                aria-label="Live specimen editor"
                dir={scriptMeta.direction}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                style={{
                  fontFamily: `${font.familyCss}, ${font.fallbackStack}`,
                  fontSize: `${size}px`,
                  fontWeight: weight,
                  letterSpacing: `${tracking}em`,
                  lineHeight,
                  transform:
                    widthPercent !== 100 || obliqueDeg !== 0
                      ? `scaleX(${(widthPercent / 100).toFixed(2)}) skewX(${obliqueDeg}deg)`
                      : undefined,
                  transformOrigin: 'left center',
                  fontVariantLigatures: enableLigatures ? 'normal' : 'none',
                  fontVariantNumeric: enableTabularNums ? 'tabular-nums' : 'normal',
                }}
                className="w-full bg-transparent resize-y focus:outline-none"
              />
              <div
                dir={scriptMeta.direction}
                style={{
                  fontFamily: `${font.familyCss}, ${font.fallbackStack}`,
                  fontWeight: weight,
                }}
                className="mt-3 pt-3 border-t border-stone-300/40 text-sm opacity-75 break-words"
              >
                {scriptMeta.alphabetPreview}
              </div>
            </div>
          </div>

          {/* Embed & Download Section */}
          <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100 text-xs">
              <div className="flex items-center gap-2 text-[#57534E] min-w-0">
                <Globe className="w-3.5 h-3.5 text-[#B43E22] shrink-0" />
                <span className="truncate font-mono">Active Embed Link: {resolvedCssUrl}</span>
              </div>
              <button
                type="button"
                onClick={onOpenHostManager}
                className="text-xs font-medium text-[#B43E22] hover:underline cursor-pointer shrink-0"
              >
                Change Embed Host
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
                {(
                  [
                    ['html', 'HTML + SRI'],
                    ['preload', 'Preload (0-FOUT)'],
                    ['parametric', 'Parametric CSS'],
                    ['sdk', 'JS SDK v2'],
                    ['webcomponent', '<pangloss-type>'],
                    ['react', 'React / Next'],
                    ['vue', 'Vue / Nuxt'],
                    ['svelte', 'Svelte'],
                    ['wordpress', 'WordPress'],
                    ['shopify', 'Shopify'],
                    ['svg', 'SVG Vector'],
                    ['base64', 'Offline Base64'],
                    ['css', 'CSS @import'],
                    ['fontface', '@font-face'],
                    ['tailwind', 'Tailwind v4'],
                  ] as [EmbedTab, string][]
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setEmbedTab(tab)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      embedTab === tab
                        ? 'bg-white text-[#141413] shadow-xs'
                        : 'text-[#57534E] hover:text-[#141413]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-md hover:border-[#141413] cursor-pointer whitespace-nowrap"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied Code' : 'Copy Embed'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCssBundle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-md hover:border-[#141413] cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  .CSS
                </button>

                <button
                  type="button"
                  onClick={handleDownloadStaticWebfontZip}
                  disabled={packagingZip}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-md hover:border-[#141413] cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {packagingZip ? 'Packaging...' : 'Static .ZIP'}
                </button>

                <a
                  href={font.downloadUrl}
                  download={font.localFontFile || `${font.id}.woff2`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#B43E22] text-white rounded-md hover:bg-[#993219] transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .WOFF2
                </a>
              </div>
            </div>

            {packageMessage && (
              <div className="text-xs text-[#57534E]">{packageMessage}</div>
            )}

            <pre className="p-3.5 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto leading-relaxed">
              {embedCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
