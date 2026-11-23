import { FontCategory, FontEntry, FontSource, ScriptCode, SourceCategory } from '../types/font';

export interface FontFilterState {
  query: string;
  script: ScriptCode | 'all';
  isoScript?: string | 'all';
  category: FontCategory | 'all';
  variableOnly: boolean;
  sourceId: string | 'all';
  sortBy: 'name' | 'glyphs' | 'newest';
}

export function filterFonts(fonts: FontEntry[], state: FontFilterState): FontEntry[] {
  const q = state.query.trim().toLowerCase();
  const isoFilter = state.isoScript && state.isoScript !== 'all' ? state.isoScript : null;

  const filtered = fonts.filter((font) => {
    if (isoFilter) {
      if (font.isoScripts && !font.isoScripts.includes(isoFilter)) {
        return false;
      }
      if (!font.isoScripts && state.script !== 'all' && !font.scripts.includes(state.script)) {
        return false;
      }
    } else if (state.script !== 'all' && !font.scripts.includes(state.script)) {
      return false;
    }
    if (state.category !== 'all' && font.category !== state.category) {
      return false;
    }
    if (state.variableOnly && !font.variable) {
      return false;
    }
    if (state.sourceId !== 'all' && font.sourceId !== state.sourceId) {
      return false;
    }
    if (q.length > 0) {
      const haystack = [
        font.name,
        font.foundry,
        font.designer,
        font.sourceName,
        font.category,
        font.description,
        ...font.scripts,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (state.sortBy === 'glyphs') {
      return b.glyphCount - a.glyphCount;
    }
    if (state.sortBy === 'newest') {
      return b.year - a.year;
    }
    return a.name.localeCompare(b.name);
  });
}

export interface SourceFilterState {
  query: string;
  category: SourceCategory | 'all';
  script: ScriptCode | 'all';
}

export function filterSources(sources: FontSource[], state: SourceFilterState): FontSource[] {
  const q = state.query.trim().toLowerCase();

  return sources.filter((source) => {
    if (state.category !== 'all' && source.category !== state.category) {
      return false;
    }
    if (state.script !== 'all' && !source.scripts.includes(state.script)) {
      return false;
    }
    if (q.length > 0) {
      const haystack = [
        source.name,
        source.region,
        source.category,
        source.licenseModel,
        source.description,
        ...source.scripts,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export function countFontsByScript(fonts: FontEntry[]): Record<string, number> {
  const counts: Record<string, number> = { all: fonts.length };
  for (const font of fonts) {
    for (const s of font.scripts) {
      counts[s] = (counts[s] || 0) + 1;
    }
  }
  return counts;
}
