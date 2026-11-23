import React, { useEffect, useMemo, useState } from 'react';
import { X, Globe, RotateCcw, Plus, Trash2, Check, Copy, Code2, Server } from 'lucide-react';
import { EmbedHostConfig, FontEntry } from '../types/font';
import {
  generateBatchCssEmbed,
  generateBatchLinksEmbed,
  generateLoaderSdkEmbed,
  generateSecurityHeadersSnippet,
  generateStaticApiSnippet,
  getDefaultEmbedHostConfig,
  normalizeBaseUrl,
  normalizeFontsPath,
  resolveFontCssUrl,
  resolveRootHostUrl,
} from '../utils/fontEmbedder';
import { ISO_WORLD_LANGUAGES } from '../data/worldLanguages';

interface EmbedHostModalProps {
  open: boolean;
  onClose: () => void;
  config: EmbedHostConfig;
  onSaveConfig: (next: EmbedHostConfig) => void;
  fonts: FontEntry[];
}

type ModalTab = 'routing' | 'api-sdk' | 'batch';

export const EmbedHostModal: React.FC<EmbedHostModalProps> = ({
  open,
  onClose,
  config,
  onSaveConfig,
  fonts,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('routing');
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [fontsPath, setFontsPath] = useState(config.fontsPath);
  const [overrides, setOverrides] = useState<Record<string, string>>(
    config.customFontOverrides || {}
  );
  const [overrideSearch, setOverrideSearch] = useState('');
  const [selectedOverrideFontId, setSelectedOverrideFontId] = useState('noto-sans-armenian');
  const [selectedOverrideUrl, setSelectedOverrideUrl] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  // API & Batch SDK tab state
  const [apiEndpoint, setApiEndpoint] = useState<'fonts' | 'languages' | 'scripts' | 'stats' | 'integrity' | 'manifest'>('fonts');
  const [batchSearch, setBatchSearch] = useState('');
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([
    'noto-sans-armenian',
    'noto-serif-armenian',
    'fraunces',
    'satoshi',
  ]);
  const [batchFormat, setBatchFormat] = useState<'sdk' | 'links' | 'css'>('sdk');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBaseUrl(config.baseUrl);
    setFontsPath(config.fontsPath);
    setOverrides(config.customFontOverrides || {});
    setSavedNotice(false);
  }, [open, config]);

  const draftConfig: EmbedHostConfig = useMemo(
    () => ({
      baseUrl,
      fontsPath,
      customFontOverrides: overrides,
    }),
    [baseUrl, fontsPath, overrides]
  );

  const matchingOverrideFonts = useMemo(() => {
    const q = overrideSearch.trim().toLowerCase();
    const list = q
      ? fonts.filter((f) => f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q))
      : fonts.slice(0, 60);
    return list.slice(0, 40);
  }, [fonts, overrideSearch]);

  const matchingBatchFonts = useMemo(() => {
    const q = batchSearch.trim().toLowerCase();
    const list = q
      ? fonts.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.id.toLowerCase().includes(q) ||
            f.scripts.some((s) => s.includes(q))
        )
      : fonts.slice(0, 36);
    return list.slice(0, 24);
  }, [fonts, batchSearch]);

  const batchSelectedFonts = useMemo(() => {
    const idSet = new Set(batchSelectedIds);
    return fonts.filter((f) => idSet.has(f.id));
  }, [fonts, batchSelectedIds]);

  if (!open) return null;

  const sampleFont = fonts.find((f) => f.id === 'noto-sans-armenian') || fonts[0];
  const samplePreviewCssUrl = sampleFont
    ? resolveFontCssUrl(sampleFont, draftConfig)
    : `${normalizeBaseUrl(baseUrl)}${normalizeFontsPath(fontsPath)}/noto-sans-armenian.css`;

  const rootHost = resolveRootHostUrl(draftConfig);
  const fontsDir = normalizeFontsPath(fontsPath) || '/fonts';
  const fontsApiUrl = `${rootHost}/api/fonts.json`;
  const langsApiUrl = `${rootHost}/api/languages.json`;
  const scriptsApiUrl = `${rootHost}/api/v1/scripts.json`;
  const statsApiUrl = `${rootHost}/api/v1/stats.json`;
  const integrityApiUrl = `${rootHost}/api/integrity.json`;
  const manifestUrl = `${rootHost}${fontsDir}/manifest.json`;
  const sdkScriptSnippet = generateLoaderSdkEmbed(batchSelectedIds, draftConfig);
  const apiFetchSnippet = generateStaticApiSnippet(draftConfig, apiEndpoint);
  const securityHeadersSnippet = generateSecurityHeadersSnippet(draftConfig, sampleFont);

  const batchCode =
    batchFormat === 'sdk'
      ? sdkScriptSnippet
      : batchFormat === 'links'
        ? generateBatchLinksEmbed(batchSelectedFonts, draftConfig)
        : generateBatchCssEmbed(batchSelectedFonts, draftConfig);

  const currentOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://your-fonts-site.com';

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleAddOverride = () => {
    const trimmed = selectedOverrideUrl.trim();
    if (!selectedOverrideFontId || !trimmed) return;
    setOverrides((prev) => ({
      ...prev,
      [selectedOverrideFontId]: trimmed,
    }));
    setSelectedOverrideUrl('');
  };

  const handleRemoveOverride = (fontId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[fontId];
      return next;
    });
  };

  const handleResetDefault = () => {
    const def = getDefaultEmbedHostConfig();
    setBaseUrl(def.baseUrl);
    setFontsPath(def.fontsPath);
    setOverrides({});
  };

  const handleApply = () => {
    onSaveConfig({
      baseUrl: normalizeBaseUrl(baseUrl),
      fontsPath: normalizeFontsPath(fontsPath) || '/fonts',
      customFontOverrides: overrides,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 350);
  };

  const toggleBatchFont = (id: string) => {
    setBatchSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const applyBatchPreset = (preset: 'armenian' | 'multiscript' | 'editorial') => {
    if (preset === 'armenian') {
      const ids = fonts.filter((f) => f.scripts.includes('armenian')).slice(0, 8).map((f) => f.id);
      setBatchSelectedIds(ids);
    } else if (preset === 'multiscript') {
      setBatchSelectedIds([
        'noto-sans-armenian',
        'noto-sans-georgian',
        'amiri',
        'vazirmatn',
        'poppins',
        'noto-sans-jp',
        'noto-sans-kr',
        'jetbrains-mono',
      ].filter((id) => fonts.some((f) => f.id === id)));
    } else {
      setBatchSelectedIds([
        'fraunces',
        'playfair-display',
        'satoshi',
        'clash-display',
        'plus-jakarta-sans',
      ].filter((id) => fonts.some((f) => f.id === id)));
    }
  };

  const overrideEntries = Object.entries(overrides);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Embed Host, Static API & SDK Manager"
    >
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#FAF9F6] border border-stone-200 rounded-xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[#6E6A63] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#B43E22]" />
              Self-Hosted Embed Routing, Static REST API &amp; JS SDK · {fonts.length.toLocaleString()} Repository Fonts
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#141413] mt-0.5">
              Embed Host, Static API &amp; Multi-Font SDK
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Embed Host Manager"
            className="p-2 text-[#57534E] hover:text-[#141413] hover:bg-stone-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-white border-b border-stone-200 flex flex-wrap gap-1.5">
          {[
            { id: 'routing', label: '1. Your Host & Link Routing', icon: Globe },
            { id: 'api-sdk', label: '2. Static REST API & Loader SDK', icon: Server },
            { id: 'batch', label: `3. Batch Multi-Font Builder (${batchSelectedFonts.length})`, icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ModalTab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#141413] text-white'
                    : 'bg-stone-100 text-[#57534E] hover:text-[#141413]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'routing' && (
            <>
              <p className="text-sm text-[#57534E] leading-relaxed">
                Every stylesheet, <code className="font-mono text-xs bg-stone-200/70 px-1 py-0.5 rounded">.woff2</code> binary, static JSON endpoint, and JS loader script lives statically inside this site. Configure your own domain or host prefix below so every embed URL resolves strictly from your site.
              </p>

              {/* Base URL & Directory */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="sm:col-span-2 block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                      Your Site Base URL
                    </span>
                    <input
                      type="url"
                      aria-label="Embed base URL"
                      placeholder="https://fonts.yourdomain.com"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-stone-300 rounded-lg text-[#141413] focus:outline-none focus:border-[#B43E22]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                      Fonts Path Prefix
                    </span>
                    <input
                      type="text"
                      aria-label="Fonts path prefix"
                      placeholder="/fonts"
                      value={fontsPath}
                      onChange={(e) => setFontsPath(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-stone-300 rounded-lg text-[#141413] focus:outline-none focus:border-[#B43E22]"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[#6E6A63]">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBaseUrl(currentOrigin);
                      setFontsPath('/fonts');
                    }}
                    className="px-2.5 py-1 border border-stone-200 rounded-md hover:border-[#141413] text-[#141413] cursor-pointer"
                  >
                    Current Site Origin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBaseUrl('');
                      setFontsPath('/fonts');
                    }}
                    className="px-2.5 py-1 border border-stone-200 rounded-md hover:border-[#141413] text-[#141413] cursor-pointer"
                  >
                    Relative (/fonts)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBaseUrl('https://cdn.example.com');
                      setFontsPath('/fonts');
                    }}
                    className="px-2.5 py-1 border border-stone-200 rounded-md hover:border-[#141413] text-[#141413] cursor-pointer"
                  >
                    Custom Domain Example
                  </button>
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-1.5">
                  <div className="text-xs font-medium text-[#57534E]">
                    Live Embed Link Preview
                  </div>
                  <pre className="p-3 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto">
                    {`<link rel="stylesheet" href="${samplePreviewCssUrl}">`}
                  </pre>
                </div>
              </div>

              {/* Per-Font Custom URL Overrides */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#141413]">
                    Per-Font Link Overrides (Optional)
                  </h3>
                  <p className="text-xs text-[#6E6A63] mt-0.5">
                    Route any specific font to an exact custom URL instead of the global host pattern above.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-5 space-y-1.5">
                    <input
                      type="search"
                      aria-label="Search font to override"
                      placeholder="Find font (e.g. Fraunces, Noto)..."
                      value={overrideSearch}
                      onChange={(e) => {
                        setOverrideSearch(e.target.value);
                        const q = e.target.value.trim().toLowerCase();
                        const first = fonts.find(
                          (f) => f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)
                        );
                        if (first) setSelectedOverrideFontId(first.id);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
                    />
                    <select
                      aria-label="Select font for custom override"
                      value={selectedOverrideFontId}
                      onChange={(e) => setSelectedOverrideFontId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
                    >
                      {matchingOverrideFonts.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <input
                      type="url"
                      aria-label="Custom CSS override URL"
                      placeholder="https://my-cdn.com/custom/font.css"
                      value={selectedOverrideUrl}
                      onChange={(e) => setSelectedOverrideUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddOverride}
                      disabled={!selectedOverrideUrl.trim()}
                      className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#B43E22] disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Set
                    </button>
                  </div>
                </div>

                {overrideEntries.length > 0 && (
                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg">
                    {overrideEntries.map(([fontId, url]) => (
                      <div
                        key={fontId}
                        className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-[#141413]">{fontId}</span>
                          <span className="text-[#6E6A63] mx-1.5">→</span>
                          <span className="font-mono text-[#57534E] break-all">{url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOverride(fontId)}
                          aria-label={`Remove override for ${fontId}`}
                          className="p-1 text-[#6E6A63] hover:text-[#B43E22] cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'api-sdk' && (
            <div className="space-y-5">
              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#141413]">
                      Static Serverless JSON Endpoints (Live in Repository)
                    </h3>
                    <p className="text-xs text-[#6E6A63]">
                      All 6 endpoints are pure static JSON files served from your configured host with zero backend or worker functions.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg text-xs">
                  {[
                    {
                      id: 'fonts' as const,
                      label: `Catalog API (${fonts.length.toLocaleString()} unique deduplicated fonts)`,
                      url: fontsApiUrl,
                      localHref: '/api/fonts.json',
                    },
                    {
                      id: 'languages' as const,
                      label: `ISO 639-3 World Languages API (${ISO_WORLD_LANGUAGES.length.toLocaleString()} languages)`,
                      url: langsApiUrl,
                      localHref: '/api/languages.json',
                    },
                    {
                      id: 'scripts' as const,
                      label: 'ISO 15924 Scripts Coverage API (140 scripts)',
                      url: scriptsApiUrl,
                      localHref: '/api/v1/scripts.json',
                    },
                    {
                      id: 'stats' as const,
                      label: 'Archive Telemetry & Coverage Stats API',
                      url: statsApiUrl,
                      localHref: '/api/v1/stats.json',
                    },
                    {
                      id: 'integrity' as const,
                      label: 'SHA-384 Subresource Integrity (SRI) Hashes API',
                      url: integrityApiUrl,
                      localHref: '/api/integrity.json',
                    },
                    {
                      id: 'manifest' as const,
                      label: 'Fonts Binary Manifest API',
                      url: manifestUrl,
                      localHref: '/fonts/manifest.json',
                    },
                  ].map((ep) => (
                    <div
                      key={ep.id}
                      className="p-3 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-[#141413]">{ep.label}</div>
                        <div className="font-mono text-[#57534E] break-all mt-0.5">
                          GET {ep.url}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(ep.id, ep.url)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 border border-stone-200 rounded-md hover:border-[#141413] cursor-pointer"
                        >
                          {copiedId === ep.id ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          Copy URL
                        </button>
                        <a
                          href={ep.localHref}
                          download={`${ep.id}.json`}
                          className="px-2.5 py-1 bg-[#141413] text-white rounded-md hover:bg-[#B43E22]"
                        >
                          Download JSON
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['fonts', 'languages', 'scripts', 'stats', 'integrity', 'manifest'] as const).map((ep) => (
                      <button
                        key={ep}
                        type="button"
                        onClick={() => setApiEndpoint(ep)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                          apiEndpoint === ep
                            ? 'bg-[#B43E22] text-white'
                            : 'bg-stone-100 text-[#57534E]'
                        }`}
                      >
                        {ep}.json
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('api-snippet', apiFetchSnippet)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-stone-300 rounded-md hover:border-[#141413] cursor-pointer"
                  >
                    {copiedId === 'api-snippet' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy Fetch Code
                  </button>
                </div>
                <pre className="p-3.5 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto leading-relaxed">
                  {apiFetchSnippet}
                </pre>
              </div>

              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#141413]">
                      Drop-In Client Loader SDK v2.0 &amp; Web Component (<code className="font-mono text-xs">/pangloss-loader.js</code>)
                    </h3>
                    <p className="text-xs text-[#6E6A63]">
                      Supports auto-loading, CacheStorage offline caching, lazy IntersectionObserver, &lt;pangloss-type&gt; HTML elements, and ISO 639-3 forLanguage().
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('sdk-snippet', sdkScriptSnippet)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-md hover:border-[#141413] cursor-pointer shrink-0"
                  >
                    {copiedId === 'sdk-snippet' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy SDK Tag
                  </button>
                </div>
                <pre className="p-3.5 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto leading-relaxed">
                  {sdkScriptSnippet}
                </pre>
              </div>

              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#141413]">
                      Security &amp; Subresource Integrity (CSP + CORS + SRI)
                    </h3>
                    <p className="text-xs text-[#6E6A63]">
                      Lock font loading strictly to your origin with immutable caching and SHA-384 stylesheet verification.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('security-snippet', securityHeadersSnippet)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-md hover:border-[#141413] cursor-pointer shrink-0"
                  >
                    {copiedId === 'security-snippet' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy Security Policy
                  </button>
                </div>
                <pre className="p-3.5 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto leading-relaxed">
                  {securityHeadersSnippet}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#141413]">
                    Select Fonts to Bundle ({batchSelectedFonts.length} selected)
                  </h3>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => applyBatchPreset('armenian')}
                      className="px-2.5 py-1 border border-stone-200 rounded-md hover:border-[#141413] cursor-pointer"
                    >
                      Armenian Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => applyBatchPreset('multiscript')}
                      className="px-2.5 py-1 border border-stone-200 rounded-md hover:border-[#141413] cursor-pointer"
                    >
                      World Scripts Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => applyBatchPreset('editorial')}
                      className="px-2.5 py-1 border border-stone-200 rounded-md hover:border-[#141413] cursor-pointer"
                    >
                      Editorial Serif + Sans
                    </button>
                  </div>
                </div>

                <input
                  type="search"
                  aria-label="Search fonts for batch embed"
                  placeholder="Search by font name or script (e.g. armenian, arabic, noto, satoshi)..."
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-stone-200 rounded-lg text-[#141413]"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {matchingBatchFonts.map((f) => {
                    const selected = batchSelectedIds.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleBatchFont(f.id)}
                        className={`px-2.5 py-1.5 text-xs text-left rounded-md border truncate cursor-pointer ${
                          selected
                            ? 'bg-[#B43E22] text-white border-[#B43E22]'
                            : 'bg-[#FAF9F6] text-[#141413] border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">
                    {[
                      { id: 'sdk' as const, label: 'JS Loader SDK' },
                      { id: 'links' as const, label: 'HTML <link> Bundle' },
                      { id: 'css' as const, label: 'CSS @import + Vars' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setBatchFormat(fmt.id)}
                        className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                          batchFormat === fmt.id
                            ? 'bg-white text-[#141413] shadow-xs'
                            : 'text-[#57534E]'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy('batch-code', batchCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#B43E22] cursor-pointer"
                  >
                    {copiedId === 'batch-code' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedId === 'batch-code' ? 'Copied Bundle' : 'Copy Batch Embed'}
                  </button>
                </div>

                <pre className="p-3.5 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto max-h-56 leading-relaxed">
                  {batchCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#57534E] hover:text-[#141413] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Site Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium border border-stone-300 rounded-lg text-[#141413] hover:border-[#141413] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#B43E22] text-white rounded-lg hover:bg-[#993219] transition-colors cursor-pointer"
            >
              {savedNotice && <Check className="w-3.5 h-3.5" />}
              {savedNotice ? 'Applied!' : 'Save Embed Host'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
