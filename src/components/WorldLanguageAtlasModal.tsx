import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Globe, PenTool, ArrowRight } from 'lucide-react';
import { FontEntry, IsoWorldLanguage } from '../types/font';
import {
  ISO_LANGUAGE_STATUS_COUNTS,
  ISO_LANGUAGE_STATUS_LABELS,
  searchIsoLanguages,
} from '../data/worldLanguages';

interface WorldLanguageAtlasModalProps {
  open: boolean;
  onClose: () => void;
  fonts: FontEntry[];
  onSelectIsoLanguage: (lang: IsoWorldLanguage) => void;
  onOpenStudio: () => void;
}

type StatusTab = 'all' | 'L' | 'E' | 'H' | 'C';

export const WorldLanguageAtlasModal: React.FC<WorldLanguageAtlasModalProps> = ({
  open,
  onClose,
  fonts,
  onSelectIsoLanguage,
  onOpenStudio,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');

  useEffect(() => {
    if (open) {
      setStatusFilter('all');
      setQuery('');
    }
  }, [open]);

  const scriptCountMap = useMemo(() => {
    const byIso: Record<string, number> = {};
    const byApp: Record<string, number> = {};
    for (const f of fonts) {
      if (f.isoScripts) {
        for (const iso of f.isoScripts) {
          byIso[iso] = (byIso[iso] || 0) + 1;
        }
      }
      for (const app of f.scripts) {
        byApp[app] = (byApp[app] || 0) + 1;
      }
    }
    return { byIso, byApp };
  }, [fonts]);

  const results = useMemo(
    () => searchIsoLanguages(query, statusFilter, 80),
    [query, statusFilter]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="All 7,928 ISO 639-3 World Languages Directory"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#FAF9F6] border border-stone-200 rounded-xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[#6E6A63] flex items-center gap-1.5 tabular-nums">
              <Globe className="w-3.5 h-3.5 text-[#B43E22]" />
              SIL ISO 639-3 &amp; Unicode CLDR Registry · {ISO_LANGUAGE_STATUS_COUNTS.total.toLocaleString()} World Languages
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#141413] mt-0.5">
              Complete World Language &amp; Script Index
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close World Language Index"
            className="p-2 text-[#57534E] hover:text-[#141413] hover:bg-stone-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 bg-white border-b border-stone-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#6E6A63] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search all 7,928 ISO 639-3 languages"
                placeholder="Search any language or ISO code (e.g. Armenian, xcl, Sumerian, sux, Gothic, got, Navajo)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF9F6] border border-stone-300 rounded-lg text-[#141413] focus:outline-none focus:border-[#B43E22]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStudio();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#B43E22] text-white rounded-lg hover:bg-[#993219] cursor-pointer whitespace-nowrap shrink-0"
            >
              <PenTool className="w-3.5 h-3.5" />
              Craft Custom .OTF in Studio
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 text-xs tabular-nums">
              {(
                [
                  ['all', `All (${ISO_LANGUAGE_STATUS_COUNTS.total.toLocaleString()})`],
                  ['L', `Living (${ISO_LANGUAGE_STATUS_COUNTS.living.toLocaleString()})`],
                  ['E', `Extinct (${ISO_LANGUAGE_STATUS_COUNTS.extinct.toLocaleString()})`],
                  ['H', `Historical (${ISO_LANGUAGE_STATUS_COUNTS.historical.toLocaleString()})`],
                  ['C', `Constructed (${ISO_LANGUAGE_STATUS_COUNTS.constructed.toLocaleString()})`],
                ] as [StatusTab, string][]
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-md font-medium cursor-pointer whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-[#141413] text-white'
                      : 'bg-stone-100 text-[#57534E] hover:text-[#141413]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#6E6A63]">
              Counts reflect strictly deduplicated real fonts (zero fakes or duplicates).
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {results.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6E6A63]">
              No ISO 639-3 languages matched &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="divide-y divide-stone-200 bg-white border border-stone-200 rounded-xl overflow-hidden">
              {results.map((lang) => {
                const count =
                  scriptCountMap.byIso[lang.isoScript] ??
                  scriptCountMap.byApp[lang.appScript] ??
                  0;
                return (
                  <div
                    key={lang.id}
                    className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#141413]">
                        {lang.name}
                      </div>
                      <div className="text-xs text-[#6E6A63] mt-0.5 font-mono tabular-nums">
                        ISO 639-3: {lang.id}
                        {lang.part1 ? ` (${lang.part1})` : ''} · {ISO_LANGUAGE_STATUS_LABELS[lang.status]} · Script: {lang.isoScript} · {lang.dir.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[#57534E] tabular-nums">
                        {count.toLocaleString()} verified {count === 1 ? 'font' : 'fonts'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectIsoLanguage(lang);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#B43E22] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Filter Library
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
