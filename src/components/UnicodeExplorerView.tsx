import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, PenTool } from 'lucide-react';
import { UNICODE_BLOCKS } from '../data/scripts';
import { FONTS_CATALOG } from '../data/fontsCatalog';
import { loadFontStylesheet } from '../utils/fontLoader';

interface UnicodeExplorerViewProps {
  onSendCharToStudio: (char: string) => void;
}

export const UnicodeExplorerView: React.FC<UnicodeExplorerViewProps> = ({
  onSendCharToStudio,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState(UNICODE_BLOCKS[0].id);
  const [selectedFontId, setSelectedFontId] = useState('noto-sans-armenian');
  const [selectedCodepoint, setSelectedCodepoint] = useState<number>(0x0531);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const block = useMemo(
    () => UNICODE_BLOCKS.find((b) => b.id === selectedBlockId) || UNICODE_BLOCKS[0],
    [selectedBlockId]
  );

  const activeFont = useMemo(
    () => FONTS_CATALOG.find((f) => f.id === selectedFontId) || FONTS_CATALOG[0],
    [selectedFontId]
  );

  useEffect(() => {
    loadFontStylesheet(activeFont.cssImportUrl);
  }, [activeFont]);

  const codepoints = useMemo(() => {
    const list: number[] = [];
    const max = Math.min(block.end, block.start + 127);
    for (let cp = block.start; cp <= max; cp++) {
      list.push(cp);
    }
    return list;
  }, [block]);

  const handleSelectBlock = (id: string) => {
    setSelectedBlockId(id);
    const nextBlock = UNICODE_BLOCKS.find((b) => b.id === id);
    if (nextBlock) {
      setSelectedCodepoint(nextBlock.start + (nextBlock.start === 0x0530 ? 1 : 0));
      const matchingFont = FONTS_CATALOG.find((f) => f.scripts.includes(nextBlock.script));
      if (matchingFont) setSelectedFontId(matchingFont.id);
    }
  };

  const selectedChar = String.fromCodePoint(selectedCodepoint);
  const hexCode = `U+${selectedCodepoint.toString(16).toUpperCase().padStart(4, '0')}`;
  const htmlEntity = `&#${selectedCodepoint};`;
  const cssEscape = `\\${selectedCodepoint.toString(16).toUpperCase()}`;

  const utf8Hex = useMemo(() => {
    const bytes = new TextEncoder().encode(selectedChar);
    return Array.from(bytes)
      .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');
  }, [selectedChar]);

  const copyValue = async (key: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="space-y-8">
      <section className="border-b border-stone-200 pb-6">
        <div className="text-xs font-medium tracking-wide text-[#6E6A63]">
          Unicode Standard Atlas · Multilingual Codepoint Inspector
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#141413] mt-2 [text-wrap:balance]">
          World Script Unicode Explorer
        </h1>
        <p className="text-sm sm:text-base text-[#57534E] max-w-3xl mt-2 leading-relaxed">
          Inspect character codepoints across Armenian, Georgian, Cyrillic, Greek, Arabic, Hebrew, Devanagari, Japanese, Thai, Ethiopic, and Latin blocks—or send any character straight into Font Studio to draw or remix its glyph.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Block Selector + Character Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 bg-white border border-stone-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {UNICODE_BLOCKS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBlock(b.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedBlockId === b.id
                      ? 'bg-[#B43E22] text-white border-[#B43E22]'
                      : 'bg-[#FAF9F6] text-[#57534E] border-stone-200 hover:text-[#141413]'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-semibold text-[#141413]">
                  {block.name}{' '}
                  <span className="font-mono text-xs text-[#6E6A63] ml-1.5">
                    U+{block.start.toString(16).toUpperCase().padStart(4, '0')}–
                    {block.end.toString(16).toUpperCase().padStart(4, '0')}
                  </span>
                </h2>
                <p className="text-xs text-[#6E6A63] mt-0.5">{block.description}</p>
              </div>

              <label className="text-xs text-[#57534E] flex items-center gap-2">
                <span>Render Font:</span>
                <select
                  value={selectedFontId}
                  onChange={(e) => setSelectedFontId(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#FAF9F6] border border-stone-200 rounded-md text-[#141413]"
                >
                  {FONTS_CATALOG.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
              {codepoints.map((cp) => {
                const ch = String.fromCodePoint(cp);
                const isSelected = selectedCodepoint === cp;
                return (
                  <button
                    key={cp}
                    type="button"
                    onClick={() => setSelectedCodepoint(cp)}
                    aria-label={`Character ${ch} (${cp.toString(16).toUpperCase()})`}
                    className={`aspect-square border rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#141413] text-white border-[#141413]'
                        : 'bg-[#FAF9F6] text-[#141413] border-stone-200 hover:border-[#B43E22]'
                    }`}
                  >
                    <span
                      style={{
                        fontFamily: `${activeFont.familyCss}, ${activeFont.fallbackStack}`,
                      }}
                      className="text-xl leading-none"
                    >
                      {ch}
                    </span>
                    <span
                      className={`text-[10px] font-mono mt-1 tabular-nums ${
                        isSelected ? 'text-stone-300' : 'text-[#8A857D]'
                      }`}
                    >
                      {cp.toString(16).toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Character Inspector Card */}
        <aside className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 space-y-5 lg:sticky lg:top-24">
          <div className="aspect-square max-h-56 w-full bg-[#FAF9F6] border border-stone-200 rounded-xl flex items-center justify-center">
            <span
              style={{
                fontFamily: `${activeFont.familyCss}, ${activeFont.fallbackStack}`,
              }}
              className="text-8xl text-[#141413] select-all"
            >
              {selectedChar}
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {[
              { label: 'Unicode Codepoint', key: 'hex', value: hexCode },
              { label: 'Decimal', key: 'dec', value: String(selectedCodepoint) },
              { label: 'UTF-8 Bytes', key: 'utf8', value: utf8Hex },
              { label: 'HTML Entity', key: 'html', value: htmlEntity },
              { label: 'CSS Content', key: 'css', value: cssEscape },
            ].map((row) => (
              <div key={row.key} className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-[#6E6A63]">{row.label}</span>
                <button
                  type="button"
                  onClick={() => copyValue(row.key, row.value)}
                  className="inline-flex items-center gap-1.5 font-mono text-[#141413] hover:text-[#B43E22] cursor-pointer tabular-nums"
                >
                  <span>{row.value}</span>
                  {copiedKey === row.key ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#8A857D]" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => copyValue('char', selectedChar)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium border border-stone-300 rounded-lg text-[#141413] hover:border-[#141413] cursor-pointer whitespace-nowrap"
            >
              {copiedKey === 'char' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'char' ? 'Copied' : 'Copy Glyph'}
            </button>

            <button
              type="button"
              onClick={() => onSendCharToStudio(selectedChar)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium bg-[#B43E22] text-white rounded-lg hover:bg-[#993219] cursor-pointer whitespace-nowrap"
            >
              <PenTool className="w-3.5 h-3.5" />
              Draw in Studio
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
