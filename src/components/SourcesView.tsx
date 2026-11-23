import React, { useMemo, useState } from 'react';
import { Search, ExternalLink, ArrowRight } from 'lucide-react';
import { FONT_SOURCES } from '../data/sources';
import { FONTS_CATALOG } from '../data/fontsCatalog';
import { WORLD_SCRIPTS, getScriptMeta } from '../data/scripts';
import { ScriptCode, SourceCategory } from '../types/font';
import { filterSources } from '../utils/fontFilters';

interface SourcesViewProps {
  onBrowseSourceInLibrary: (sourceId: string) => void;
}

const SOURCE_CATEGORIES: (SourceCategory | 'all')[] = [
  'all',
  'Global Open Source',
  'Online Archives',
  'Commercial Foundries',
  'Armenian & Regional',
  'Discovery & Tools',
];

export const SourcesView: React.FC<SourcesViewProps> = ({ onBrowseSourceInLibrary }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SourceCategory | 'all'>('all');
  const [selectedScript, setSelectedScript] = useState<ScriptCode | 'all'>('all');

  const filteredSources = useMemo(
    () =>
      filterSources(FONT_SOURCES, {
        query,
        category: selectedCategory,
        script: selectedScript,
      }),
    [query, selectedCategory, selectedScript]
  );

  const catalogCountBySource = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of FONTS_CATALOG) {
      map[f.sourceId] = (map[f.sourceId] || 0) + 1;
    }
    return map;
  }, []);

  return (
    <div className="space-y-8">
      <section className="border-b border-stone-200 pb-6">
        <div className="text-xs font-medium tracking-wide text-[#6E6A63]">
          Global Type Ecosystem · {FONT_SOURCES.length} Verified Repositories, Foundries &amp; Tools
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#141413] mt-2 [text-wrap:balance]">
          World Font Foundries, Archives &amp; Regional Collections
        </h1>
        <p className="text-sm sm:text-base text-[#57534E] max-w-3xl mt-2 leading-relaxed">
          Complete directory covering global open-source libraries, mega TTF/OTF archives, commercial type foundries, Armenian, Georgian, Cyrillic, Arabic, Persian, Hebrew, Indic, and East Asian repositories, plus glyph identification and font creation utilities.
        </p>
      </section>

      {/* Filter Toolbar */}
      <section className="p-4 bg-white border border-stone-200 rounded-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 text-[#6E6A63] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search font sources"
              placeholder="Search sources (e.g. Fonter.am, Google Noto, Velvetyne, DaFont, ParaType, Morisawa)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg text-[#141413] focus:outline-none focus:border-[#B43E22]"
            />
          </div>

          <div className="md:col-span-5">
            <select
              aria-label="Filter sources by writing system"
              value={selectedScript}
              onChange={(e) => setSelectedScript(e.target.value as ScriptCode | 'all')}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg text-[#141413]"
            >
              <option value="all">All Writing Systems</option>
              {WORLD_SCRIPTS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100">
          {SOURCE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#B43E22] text-white border-[#B43E22]'
                  : 'bg-[#FAF9F6] text-[#57534E] border-stone-200 hover:text-[#141413]'
              }`}
            >
              {cat === 'all' ? `All Categories (${FONT_SOURCES.length})` : cat}
            </button>
          ))}
        </div>
      </section>

      <div className="text-xs text-[#6E6A63] tabular-nums">
        Showing <strong className="text-[#141413] font-semibold">{filteredSources.length}</strong> repositories
      </div>

      {/* Sources Directory Grid */}
      <div
        data-testid="sources-directory-grid"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {filteredSources.map((source) => {
          const inCatalogCount = catalogCountBySource[source.id] || 0;
          return (
            <article
              key={source.id}
              className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-stone-400 transition-colors"
            >
              <div className="space-y-2">
                <div className="text-xs text-[#6E6A63] flex items-center justify-between gap-2">
                  <span className="truncate">{source.category} · {source.region}</span>
                  <span className="font-mono shrink-0 tabular-nums">{source.featuredFontsCount}</span>
                </div>

                <h2 className="text-lg font-semibold text-[#141413] tracking-tight">
                  {source.name}
                </h2>

                <p className="text-xs text-[#57534E] leading-relaxed">
                  {source.description}
                </p>

                <div className="text-xs text-[#6E6A63] pt-1">
                  Scripts: {source.scripts.slice(0, 5).map((s) => getScriptMeta(s).name).join(', ')}
                  {source.scripts.length > 5 ? ` +${source.scripts.length - 5} more` : ''}
                  {' · '}
                  {source.licenseModel}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                {inCatalogCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => onBrowseSourceInLibrary(source.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#B43E22] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Preview {inCatalogCount} in Library
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-[#8A857D]">External Repository</span>
                )}

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#141413] text-white rounded-md hover:bg-[#B43E22] transition-colors whitespace-nowrap"
                >
                  Visit Source
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
