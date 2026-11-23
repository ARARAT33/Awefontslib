import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, ArrowLeftRight } from 'lucide-react';
import { FONTS_CATALOG } from '../data/fontsCatalog';
import { getScriptMeta } from '../data/scripts';
import { generatePairingCss } from '../utils/fontEmbedder';
import { loadFontStylesheet } from '../utils/fontLoader';
import { EmbedHostConfig } from '../types/font';

const PRESET_PAIRINGS: {
  label: string;
  primaryId: string;
  secondaryId: string;
  headline: string;
  body: string;
}[] = [
  {
    label: 'Armenian Editorial + Latin Display',
    primaryId: 'fraunces',
    secondaryId: 'noto-sans-armenian',
    headline: 'Yerevan & Geneva Type Dialogues',
    body: 'Բնության գեղեցկությունը և մարդկային միտքը ստեղծում են հավերժական գրեր։ Multilingual publishing balances x-height and stroke contrast across scripts.',
  },
  {
    label: 'Arabic Classical + Modern UI Sans',
    primaryId: 'amiri',
    secondaryId: 'plus-jakarta-sans',
    headline: 'جمال الخط العربي المعاصر',
    body: 'Pairing Bulaq Press Naskh elegance with clean geometric Latin prose for bilingual cultural journals and interfaces.',
  },
  {
    label: 'Japanese Mincho + Swiss Grotesque',
    primaryId: 'shippori-mincho',
    secondaryId: 'satoshi',
    headline: '明朝体とモダンサンセリフの調和',
    body: 'Tokyo literary Mincho paired with crisp grotesque body copy for bilingual architecture monographs and catalogs.',
  },
  {
    label: 'Cyrillic Editorial + Technical Mono',
    primaryId: 'playfair-display',
    secondaryId: 'jetbrains-mono',
    headline: 'Типографика без границ',
    body: 'High-contrast transitional serif headings anchored by tabular monospace specifications and numeric schedules.',
  },
];

interface PairingViewProps {
  hostConfig: EmbedHostConfig;
}

export const PairingView: React.FC<PairingViewProps> = ({ hostConfig }) => {
  const [primaryId, setPrimaryId] = useState('fraunces');
  const [secondaryId, setSecondaryId] = useState('noto-sans-armenian');
  const [headline, setHeadline] = useState(PRESET_PAIRINGS[0].headline);
  const [body, setBody] = useState(PRESET_PAIRINGS[0].body);
  const [headingSize, setHeadingSize] = useState(44);
  const [bodySize, setBodySize] = useState(18);
  const [scaleAdjust, setScaleAdjust] = useState(1);
  const [copied, setCopied] = useState(false);

  const primaryFont = useMemo(
    () => FONTS_CATALOG.find((f) => f.id === primaryId) || FONTS_CATALOG[0],
    [primaryId]
  );
  const secondaryFont = useMemo(
    () => FONTS_CATALOG.find((f) => f.id === secondaryId) || FONTS_CATALOG[1],
    [secondaryId]
  );

  useEffect(() => {
    loadFontStylesheet(primaryFont.cssImportUrl);
    loadFontStylesheet(secondaryFont.cssImportUrl);
  }, [primaryFont, secondaryFont]);

  const combinedCss = useMemo(
    () => generatePairingCss(primaryFont, secondaryFont, hostConfig),
    [primaryFont, secondaryFont, hostConfig]
  );

  const handleSwap = () => {
    setPrimaryId(secondaryId);
    setSecondaryId(primaryId);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedCss);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="space-y-8">
      <section className="border-b border-stone-200 pb-6">
        <div className="text-xs font-medium tracking-wide text-[#6E6A63]">
          Multiscript Harmonizer · Optical Size &amp; Rhythm Calibration
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#141413] mt-2 [text-wrap:balance]">
          Cross-Script Typeface Pairing Workbench
        </h1>
        <p className="text-sm sm:text-base text-[#57534E] max-w-3xl mt-2 leading-relaxed">
          Combine display and body fonts across any two world scripts—such as Armenian and Latin, Arabic and English, or Japanese and Cyrillic—calibrate their optical scale, and export ready CSS variables.
        </p>
      </section>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESET_PAIRINGS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setPrimaryId(preset.primaryId);
              setSecondaryId(preset.secondaryId);
              setHeadline(preset.headline);
              setBody(preset.body);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-stone-200 rounded-md hover:border-[#B43E22] hover:text-[#B43E22] transition-colors cursor-pointer whitespace-nowrap"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Controls & Live Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 p-5 bg-white border border-stone-200 rounded-xl space-y-4">
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-[#57534E]">
                Display / Primary Font
              </span>
              <select
                value={primaryId}
                onChange={(e) => setPrimaryId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg text-[#141413]"
              >
                {FONTS_CATALOG.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.scripts.map((s) => getScriptMeta(s).name).join(', ')})
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#57534E] hover:text-[#B43E22] cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Swap Fonts
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-[#57534E]">
                Body / Secondary Script Font
              </span>
              <select
                value={secondaryId}
                onChange={(e) => setSecondaryId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg text-[#141413]"
              >
                {FONTS_CATALOG.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.scripts.map((s) => getScriptMeta(s).name).join(', ')})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3 pt-3 border-t border-stone-100">
            <label className="block">
              <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                <span>Display Size</span>
                <span>{headingSize}px</span>
              </span>
              <input
                type="range"
                min={24}
                max={72}
                value={headingSize}
                onChange={(e) => setHeadingSize(Number(e.target.value))}
                className="w-full mt-1 accent-[#B43E22]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                <span>Body Size</span>
                <span>{bodySize}px</span>
              </span>
              <input
                type="range"
                min={14}
                max={28}
                value={bodySize}
                onChange={(e) => setBodySize(Number(e.target.value))}
                className="w-full mt-1 accent-[#B43E22]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[#57534E] flex justify-between tabular-nums">
                <span>Secondary Optical Scale</span>
                <span>{scaleAdjust.toFixed(2)}×</span>
              </span>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.02}
                value={scaleAdjust}
                onChange={(e) => setScaleAdjust(Number(e.target.value))}
                className="w-full mt-1 accent-[#B43E22]"
              />
            </label>
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#57534E]">Combined CSS</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#B43E22] hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy CSS'}
                </button>
              </div>
            </div>
            <pre className="p-3 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto max-h-44 leading-relaxed">
              {combinedCss}
            </pre>
          </div>
        </div>

        {/* Right: Editable Editorial Specimen */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-6 sm:p-10 space-y-6">
          <div className="text-xs text-[#6E6A63] pb-3 border-b border-stone-100 flex flex-wrap justify-between gap-2">
            <span>
              Heading: {primaryFont.name} · Body: {secondaryFont.name}
            </span>
            <span className="font-mono tabular-nums">
              Ratio {(headingSize / (bodySize * scaleAdjust)).toFixed(2)}:1
            </span>
          </div>

          <textarea
            aria-label="Editable pairing headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            rows={2}
            style={{
              fontFamily: `${primaryFont.familyCss}, ${primaryFont.fallbackStack}`,
              fontSize: `${headingSize}px`,
              lineHeight: 1.15,
            }}
            className="w-full bg-transparent text-[#141413] resize-none focus:outline-none"
          />

          <textarea
            aria-label="Editable pairing body prose"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            style={{
              fontFamily: `${secondaryFont.familyCss}, ${secondaryFont.fallbackStack}`,
              fontSize: `${Math.round(bodySize * scaleAdjust)}px`,
              lineHeight: 1.65,
            }}
            className="w-full bg-transparent text-[#3D3A36] resize-y focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
