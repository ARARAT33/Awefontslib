import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Upload, Plus, Check, Download, Code2, PenTool, Globe, Languages } from 'lucide-react';
import { EmbedHostConfig, FontCategory, FontEntry, IsoWorldLanguage, ScriptCode } from '../types/font';
import { WORLD_SCRIPTS, getScriptMeta } from '../data/scripts';
import { ISO_WORLD_LANGUAGES, ISO_LANGUAGE_STATUS_LABELS, WORLD_LANGUAGES, getWorldLanguage } from '../data/worldLanguages';
import { FONT_SOURCES } from '../data/sources';
import { countFontsByScript, filterFonts } from '../utils/fontFilters';
import { loadFontStylesheet } from '../utils/fontLoader';
import { normalizeBaseUrl, normalizeFontsPath } from '../utils/fontEmbedder';
import { WorldLanguageAtlasModal } from './WorldLanguageAtlasModal';

interface LibraryViewProps {
  fonts: FontEntry[];
  kitFontIds: Set<string>;
  onToggleKit: (font: FontEntry) => void;
  onInspectFont: (font: FontEntry) => void;
  onOpenLocalInspector: () => void;
  onOpenStudio: () => void;
  onOpenSources: () => void;
  onOpenHostManager: () => void;
  hostConfig: EmbedHostConfig;
  initialSourceId?: string;
}

const CATEGORIES: (FontCategory | 'all')[] = [
  'all',
  'Serif',
  'Sans',
  'Display',
  'Monospace',
  'Calligraphy',
  'Handwriting',
  'Pixel & Grid',
];

export const LibraryView: React.FC<LibraryViewProps> = ({
  fonts,
  kitFontIds,
  onToggleKit,
  onInspectFont,
  onOpenLocalInspector,
  onOpenStudio,
  onOpenSources,
  onOpenHostManager,
  hostConfig,
  initialSourceId = 'all',
}) => {
  const [query, setQuery] = useState('');
  const [selectedScript, setSelectedScript] = useState<ScriptCode | 'all'>('all');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('all');
  const [selectedIsoLanguage, setSelectedIsoLanguage] = useState<IsoWorldLanguage | null>(null);
  const [isoAtlasOpen, setIsoAtlasOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FontCategory | 'all'>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(initialSourceId);
  const [variableOnly, setVariableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'glyphs' | 'newest'>('name');
  const [previewSize, setPreviewSize] = useState(30);
  const [customSpecimen, setCustomSpecimen] = useState('');
  const [specimenDark, setSpecimenDark] = useState(false);
  const [visibleCount, setVisibleCount] = useState(36);

  useEffect(() => {
    setSelectedSourceId(initialSourceId);
  }, [initialSourceId]);

  useEffect(() => {
    setVisibleCount(36);
  }, [query, selectedScript, selectedLanguageCode, selectedIsoLanguage, selectedCategory, selectedSourceId, variableOnly, sortBy]);

  const scriptCounts = useMemo(() => countFontsByScript(fonts), [fonts]);

  const filteredFonts = useMemo(
    () =>
      filterFonts(fonts, {
        query,
        script: selectedScript,
        isoScript: selectedIsoLanguage ? selectedIsoLanguage.isoScript : 'all',
        category: selectedCategory,
        variableOnly,
        sourceId: selectedSourceId,
        sortBy,
      }),
    [fonts, query, selectedScript, selectedIsoLanguage, selectedCategory, variableOnly, selectedSourceId, sortBy]
  );

  const visibleFonts = useMemo(
    () => filteredFonts.slice(0, visibleCount),
    [filteredFonts, visibleCount]
  );

  // Dynamically inject local stylesheets for currently visible fonts
  useEffect(() => {
    visibleFonts.forEach((font) => {
      loadFontStylesheet(font.cssImportUrl);
    });
  }, [visibleFonts]);

  const activeHostDisplay =
    (normalizeBaseUrl(hostConfig.baseUrl) || '(relative)') +
    normalizeFontsPath(hostConfig.fontsPath);

  const activeScriptMeta =
    selectedScript === 'all' ? null : getScriptMeta(selectedScript);

  const activeLanguage =
    selectedLanguageCode === 'all' ? null : getWorldLanguage(selectedLanguageCode);

  const handleScriptClick = (code: ScriptCode | 'all') => {
    setSelectedScript(code);
    setSelectedLanguageCode('all');
    setSelectedIsoLanguage(null);
    if (code === 'all') {
      setCustomSpecimen('');
    } else {
      setCustomSpecimen(getScriptMeta(code).sampleSentence);
    }
  };

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguageCode(langCode);
    setSelectedIsoLanguage(null);
    if (langCode === 'all') {
      setSelectedScript('all');
      setCustomSpecimen('');
      return;
    }
    const lang = getWorldLanguage(langCode);
    if (lang) {
      setSelectedScript(lang.script);
      setCustomSpecimen(lang.sampleSentence);
    }
  };

  const handleSelectIsoLanguage = (isoLang: IsoWorldLanguage) => {
    setSelectedIsoLanguage(isoLang);
    setSelectedLanguageCode('all');
    setSelectedScript(isoLang.appScript);
    const curated = WORLD_LANGUAGES.find(
      (l) => l.code === isoLang.part1 || l.code === isoLang.id
    );
    const ISO_SCRIPT_SAMPLES: Record<string, string> = {
      Xsux: '𒀀 𒁀 𒆠 𒀭 𒈗 — Sumerian & Akkadian Cuneiform',
      Goth: '𐌲𐌿𐍄𐌹𐍃𐌺 𐌰𐌻𐍆𐌰𐌱𐌴𐍄 — Wulfila Gothic',
      Egyp: '𓂀 𓃭 𓅓 𓆣 𓇳 — Ancient Egyptian Hieroglyphs',
      Runr: 'ᚠᚢᚦᚨᚱᚲ ᚷᚹ — Elder Futhark Runic',
      Ogam: '᚛ᚑᚌᚐᚋ᚜ — Primitive Irish Ogham',
      Linb: '𐀀 𐀁 𐀂 𐀃 𐀄 — Mycenaean Linear B',
      Phnx: '𐤀 𐤁 𐤂 𐤃 𐤄 — Phoenician Abjad',
      Armi: '𐡀 𐡁 𐡂 𐡃 — Imperial Aramaic',
      Avst: '𐬀 𐬁 𐬂 𐬃 — Avestan Script',
      Glag: 'Ⰰ Ⰱ Ⰲ Ⰳ Ⰴ — Glagolitic Alphabet',
      Orkh: '𐰀 𐰃 𐰆 𐰉 — Old Turkic Orkhon',
      Armn: 'Այբ Բեն Գիմ Դա — Հայկական գրչություն',
      Geor: 'ან ბან გან დონ — ქართული დამწერლობა',
      Copt: 'Ⲁ Ⲃ Ⲅ Ⲇ — Coptic Script',
    };
    const nativeSample = ISO_SCRIPT_SAMPLES[isoLang.isoScript];
    setCustomSpecimen(
      curated
        ? curated.sampleSentence
        : nativeSample
        ? `${isoLang.name} (${isoLang.id}): ${nativeSample}`
        : `${isoLang.name} (${isoLang.id} · ${isoLang.isoScript}) — ${getScriptMeta(isoLang.appScript).sampleSentence}`
    );
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedScript('all');
    setSelectedLanguageCode('all');
    setSelectedIsoLanguage(null);
    setSelectedCategory('all');
    setSelectedSourceId('all');
    setVariableOnly(false);
    setCustomSpecimen('');
  };

  return (
    <div className="space-y-8">
      {/* Editorial Hero Band */}
      <section className="border-b border-stone-200 pb-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-medium tracking-wide text-[#6E6A63] tabular-nums">
              Self-Hosted World Type Archive · {fonts.length.toLocaleString()} Unique Local Typefaces · {ISO_WORLD_LANGUAGES.length.toLocaleString()} ISO 639-3 Languages · 140 Scripts
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#141413] leading-[1.08] [text-wrap:balance]">
              Every World Script. Every Language. Pure Browser Craft.
            </h1>
            <p className="text-base text-[#57534E] max-w-2xl leading-relaxed">
              Test, parametrically restyle, download, and embed {fonts.length.toLocaleString()} SHA-256 deduplicated self-hosted typefaces from your own site host or JS SDK—indexed across all {ISO_WORLD_LANGUAGES.length.toLocaleString()} living, extinct, historical, and constructed languages.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-2.5">
            <button
              type="button"
              onClick={onOpenHostManager}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium bg-white border border-stone-300 text-[#141413] rounded-lg hover:border-[#B43E22] hover:text-[#B43E22] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-4 h-4" />
              Embed Host &amp; API
            </button>
            <button
              type="button"
              onClick={onOpenStudio}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#B43E22] text-white rounded-lg hover:bg-[#993219] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <PenTool className="w-4 h-4" />
              Font Studio
            </button>
            <button
              type="button"
              onClick={onOpenLocalInspector}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium bg-white border border-stone-300 text-[#141413] rounded-lg hover:border-[#141413] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Upload className="w-4 h-4" />
              Inspect .TTF/.OTF
            </button>
          </div>
        </div>
      </section>

      {/* Script Navigation Strip */}
      <section aria-label="Filter by writing system" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
              Writing Systems &amp; {ISO_WORLD_LANGUAGES.length.toLocaleString()} Languages
            </h2>
            <select
              aria-label="Filter by world language"
              value={selectedLanguageCode}
              onChange={(e) => handleLanguageSelect(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-stone-300 rounded-md text-[#141413] max-w-[340px]"
            >
              <option value="all">Featured Languages ({WORLD_LANGUAGES.length} curated)...</option>
              {WORLD_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName}) — {lang.region}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsoAtlasOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#B43E22] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Languages className="w-3.5 h-3.5" />
              Search All {ISO_WORLD_LANGUAGES.length.toLocaleString()} Languages
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenSources}
            className="text-xs font-medium text-[#B43E22] hover:underline cursor-pointer whitespace-nowrap"
          >
            Browse All {FONT_SOURCES.length} Global Sources →
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleScriptClick('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
              selectedScript === 'all'
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#57534E] border-stone-200 hover:border-stone-400 hover:text-[#141413]'
            }`}
          >
            All Scripts ({scriptCounts.all || 0})
          </button>

          {WORLD_SCRIPTS.map((script) => {
            const count = scriptCounts[script.code] || 0;
            const active = selectedScript === script.code;
            return (
              <button
                key={script.code}
                type="button"
                onClick={() => handleScriptClick(script.code)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  active
                    ? 'bg-[#B43E22] text-white border-[#B43E22]'
                    : 'bg-white text-[#57534E] border-stone-200 hover:border-stone-400 hover:text-[#141413]'
                }`}
              >
                {script.name === script.nativeName ? (
                  <span>{script.name}</span>
                ) : (
                  <>
                    <span>{script.name} · </span>
                    <bdi dir={script.direction}>{script.nativeName}</bdi>
                  </>
                )}{' '}
                <span>({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Specimen Control Bar */}
      <section
        aria-label="Live specimen and filter controls"
        className="p-4 sm:p-5 bg-white border border-stone-200 rounded-xl space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-[#6E6A63] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search fonts by name, foundry, or script"
              placeholder="Search fonts, designers, foundries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg text-[#141413] placeholder:text-[#8A857D] focus:outline-none focus:border-[#B43E22]"
            />
          </div>

          <div className="md:col-span-5">
            <input
              type="text"
              aria-label="Custom live preview specimen text"
              placeholder={
                activeScriptMeta
                  ? activeScriptMeta.sampleSentence
                  : 'Type any text across scripts (e.g. Բարև · Hello · مرحبا · 日本語)...'
              }
              value={customSpecimen}
              onChange={(e) => setCustomSpecimen(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg text-[#141413] placeholder:text-[#8A857D] focus:outline-none focus:border-[#B43E22]"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-3">
            <label className="flex-1 flex items-center gap-2 text-xs text-[#57534E] tabular-nums">
              <span className="shrink-0">{previewSize}px</span>
              <input
                type="range"
                aria-label="Specimen font size"
                min={18}
                max={64}
                value={previewSize}
                onChange={(e) => setPreviewSize(Number(e.target.value))}
                className="w-full accent-[#B43E22]"
              />
            </label>

            <button
              type="button"
              onClick={() => setSpecimenDark((d) => !d)}
              className="px-2.5 py-1.5 text-xs font-medium border border-stone-200 rounded-md text-[#141413] hover:bg-stone-100 cursor-pointer whitespace-nowrap shrink-0"
            >
              {specimenDark ? 'Light Paper' : 'Dark Ink'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#141413] text-white'
                    : 'text-[#57534E] hover:bg-stone-100 hover:text-[#141413]'
                }`}
              >
                {cat === 'all' ? 'All Styles' : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 text-[#57534E] cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={variableOnly}
                onChange={(e) => setVariableOnly(e.target.checked)}
                className="accent-[#B43E22]"
              />
              <span>Variable Fonts Only</span>
            </label>

            <select
              aria-label="Filter by font source"
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413] max-w-[190px]"
            >
              <option value="all">All Repositories</option>
              {FONT_SOURCES.filter((s) => fonts.some((f) => f.sourceId === s.id)).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center gap-1.5 text-[#57534E]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <select
                aria-label="Sort fonts"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'glyphs' | 'newest')}
                className="px-2 py-1.5 bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
              >
                <option value="name">Sort: A–Z</option>
                <option value="glyphs">Sort: Most Glyphs</option>
                <option value="newest">Sort: Newest</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results & Active Embed Host Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E6A63]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="tabular-nums">
            Showing <strong className="text-[#141413] font-semibold">{visibleFonts.length.toLocaleString()}</strong> of{' '}
            <strong className="text-[#141413] font-semibold">{filteredFonts.length.toLocaleString()}</strong> verified unique fonts ({fonts.length.toLocaleString()} total in repo)
            {selectedIsoLanguage
              ? ` · ${selectedIsoLanguage.name} (${selectedIsoLanguage.id} · ${ISO_LANGUAGE_STATUS_LABELS[selectedIsoLanguage.status]} · ${selectedIsoLanguage.isoScript})`
              : activeLanguage
                ? ` · ${activeLanguage.name} (${activeLanguage.nativeName})`
                : activeScriptMeta
                  ? ` · ${activeScriptMeta.name} (${activeScriptMeta.unicodeRange})`
                  : ''}
          </span>
          {(query || selectedScript !== 'all' || selectedLanguageCode !== 'all' || selectedIsoLanguage || selectedCategory !== 'all' || selectedSourceId !== 'all' || variableOnly) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#B43E22] font-medium hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenHostManager}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#57534E] hover:text-[#B43E22] cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>Embeds route via: {activeHostDisplay}</span>
          <span className="underline font-sans font-medium text-[#B43E22]">Edit</span>
        </button>
      </div>

      {/* Specimen Grid */}
      {filteredFonts.length === 0 ? (
        <div className="py-16 text-center bg-white border border-stone-200 rounded-xl px-6">
          <p className="text-base font-medium text-[#141413]">
            No typefaces match your current filters
          </p>
          <p className="text-sm text-[#6E6A63] mt-1">
            Try clearing your search or exploring all 90+ external world repositories in Sources.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-medium bg-[#141413] text-white rounded-lg cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={onOpenSources}
              className="px-4 py-2 text-xs font-medium border border-stone-300 text-[#141413] rounded-lg cursor-pointer"
            >
              Explore All Sources
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            data-testid="font-specimen-grid"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {visibleFonts.map((font) => {
              const primaryScript =
                selectedScript !== 'all' && font.scripts.includes(selectedScript)
                  ? selectedScript
                  : font.scripts[0] || 'latin';
              const meta = getScriptMeta(primaryScript);
              const displaySample =
                customSpecimen.trim().length > 0
                  ? customSpecimen
                  : font.sampleOverride || meta.sampleSentence;
              const inKit = kitFontIds.has(font.id);

              return (
                <article
                  key={font.id}
                  className={`border rounded-xl p-5 transition-colors flex flex-col justify-between gap-4 ${
                    specimenDark
                      ? 'bg-[#141413] border-stone-800 text-[#FAF9F6]'
                      : 'bg-white border-stone-200 text-[#141413] hover:border-stone-400'
                  }`}
                >
                  {/* Top Metadata Line (Zero-Pill Rule) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight truncate">
                        {font.name}
                      </h3>
                      <div
                        className={`text-xs mt-0.5 truncate tabular-nums ${
                          specimenDark ? 'text-stone-400' : 'text-[#6E6A63]'
                        }`}
                      >
                        {font.foundry} · {font.scripts.map((s) => getScriptMeta(s).name).join(', ')} ·{' '}
                        {font.weights.length} {font.weights.length === 1 ? 'style' : 'styles'}
                        {font.variable ? ' (Variable)' : ''} · {font.license}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono shrink-0 tabular-nums ${
                        specimenDark ? 'text-stone-400' : 'text-[#6E6A63]'
                      }`}
                    >
                      {font.glyphCount.toLocaleString()} glyphs
                    </span>
                  </div>

                  {/* Live Rendered Specimen */}
                  <div
                    dir={selectedIsoLanguage ? selectedIsoLanguage.dir : activeLanguage ? activeLanguage.direction : meta.direction}
                    onClick={() => onInspectFont(font)}
                    className="py-3 min-h-[84px] flex items-center cursor-pointer overflow-hidden"
                  >
                    <p
                      style={{
                        fontFamily: `${font.familyCss}, ${font.fallbackStack}`,
                        fontSize: `${previewSize}px`,
                        lineHeight: 1.32,
                      }}
                      className="w-full break-words"
                    >
                      {displaySample}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div
                    className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
                      specimenDark ? 'border-stone-800' : 'border-stone-100'
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        specimenDark ? 'text-stone-400' : 'text-[#6E6A63]'
                      }`}
                    >
                      Source: {font.sourceName} · Local
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleKit(font)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                          inKit
                            ? 'bg-[#B43E22] text-white border-[#B43E22]'
                            : specimenDark
                              ? 'border-stone-700 text-stone-200 hover:border-stone-400'
                              : 'border-stone-200 text-[#141413] hover:border-[#141413]'
                        }`}
                      >
                        {inKit ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {inKit ? 'In Kit' : 'Kit'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onInspectFont(font)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                          specimenDark
                            ? 'border-stone-700 text-stone-200 hover:border-stone-400'
                            : 'border-stone-200 text-[#141413] hover:border-[#141413]'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        Embed
                      </button>

                      <a
                        href={font.downloadUrl}
                        download={font.localFontFile || `${font.id}.woff2`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#B43E22] transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        .WOFF2
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleCount < filteredFonts.length && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 48)}
                className="px-6 py-2.5 text-sm font-medium bg-white border border-stone-300 text-[#141413] rounded-lg hover:border-[#141413] transition-colors cursor-pointer tabular-nums"
              >
                Load More Typefaces ({(filteredFonts.length - visibleCount).toLocaleString()} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      <WorldLanguageAtlasModal
        open={isoAtlasOpen}
        onClose={() => setIsoAtlasOpen(false)}
        fonts={fonts}
        onSelectIsoLanguage={handleSelectIsoLanguage}
        onOpenStudio={onOpenStudio}
      />
    </div>
  );
};
