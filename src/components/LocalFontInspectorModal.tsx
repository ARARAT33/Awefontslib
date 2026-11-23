import React, { useState } from 'react';
import opentype from 'opentype.js';
import { X, Upload, Copy, Check, ArrowRight } from 'lucide-react';
import { arrayBufferToBase64 } from '../utils/otfCompiler';
import { registerStudioFontFace } from '../utils/fontLoader';

interface LocalFontInspectorModalProps {
  open: boolean;
  onClose: () => void;
  onSendCharToStudio: (char: string) => void;
}

interface ParsedFontInfo {
  familyName: string;
  styleName: string;
  designer: string;
  license: string;
  glyphCount: number;
  unitsPerEm: number;
  sampleChars: string[];
  base64: string;
  format: 'opentype' | 'truetype' | 'woff';
}

export const LocalFontInspectorModal: React.FC<LocalFontInspectorModalProps> = ({
  open,
  onClose,
  onSendCharToStudio,
}) => {
  const [info, setInfo] = useState<ParsedFontInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testText, setTestText] = useState(
    'Typography across all world scripts — Այբուբեն · ქართული · Кириллица · العربية · 日本語'
  );
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!open) return null;

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const font = opentype.parse(buffer);
      const familyRaw = font.getEnglishName('fontFamily') || file.name.replace(/\.[^.]+$/, '');
      const familyName = `Local_${familyRaw.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      await registerStudioFontFace(familyName, buffer);

      const sampleChars: string[] = [];
      const total = Math.min(font.glyphs.length, 350);
      for (let i = 0; i < total; i++) {
        const g = font.glyphs.get(i);
        if (g.unicode && g.unicode >= 33) {
          sampleChars.push(String.fromCodePoint(g.unicode));
        }
        if (sampleChars.length >= 96) break;
      }

      const ext = file.name.toLowerCase();
      const format = ext.endsWith('.woff')
        ? 'woff'
        : ext.endsWith('.ttf')
          ? 'truetype'
          : 'opentype';

      setInfo({
        familyName,
        styleName: font.getEnglishName('fontSubfamily') || 'Regular',
        designer: font.getEnglishName('designer') || 'External Foundry',
        license: font.getEnglishName('license') || 'See original font package',
        glyphCount: font.glyphs.length,
        unitsPerEm: font.unitsPerEm,
        sampleChars,
        base64: arrayBufferToBase64(buffer),
        format,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not parse font binary: ${err.message}. Please drop a valid .ttf, .otf, or .woff file.`
          : 'Could not parse font binary.'
      );
    }
  };

  const embedCode = info
    ? `<style>
  @font-face {
    font-family: '${info.familyName}';
    src: url('data:font/${info.format === 'truetype' ? 'ttf' : info.format === 'woff' ? 'woff' : 'otf'};base64,${info.base64.slice(0, 64)}...') format('${info.format}');
    font-display: swap;
  }
</style>`
    : '';

  const fullEmbedCode = info
    ? `<style>
  @font-face {
    font-family: '${info.familyName}';
    src: url('data:font/${info.format === 'truetype' ? 'ttf' : info.format === 'woff' ? 'woff' : 'otf'};base64,${info.base64}') format('${info.format}');
    font-display: swap;
  }
</style>`
    : '';

  const handleCopyFullEmbed = async () => {
    if (!fullEmbedCode) return;
    try {
      await navigator.clipboard.writeText(fullEmbedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Local Font Binary Inspector"
    >
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#FAF9F6] border border-stone-200 rounded-xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#141413]">
              Local Font Inspector &amp; Base64 Embedder
            </h2>
            <p className="text-xs text-[#6E6A63] mt-0.5">
              Drop any .TTF, .OTF, or .WOFF downloaded from Fonter.am, DaFont, FontSpace, or any foundry—processed 100% locally.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close local font inspector"
            className="p-2 text-[#57534E] hover:text-[#141413] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <label className="block border-2 border-dashed border-stone-300 hover:border-[#B43E22] rounded-xl p-6 text-center bg-white transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mx-auto text-[#B43E22] mb-2" />
            <span className="block text-sm font-medium text-[#141413]">
              Click to select a local .TTF, .OTF, or .WOFF file
            </span>
            <span className="block text-xs text-[#6E6A63] mt-1">
              Never leaves your browser. Parsed via opentype.js and registered with FontFace API.
            </span>
            <input
              type="file"
              accept=".ttf,.otf,.woff"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          {info && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-stone-200 rounded-xl p-4 text-xs">
                <div>
                  <div className="text-[#6E6A63]">Family</div>
                  <div className="font-medium text-[#141413] mt-0.5 truncate">{info.familyName.replace(/^Local_/, '')}</div>
                </div>
                <div>
                  <div className="text-[#6E6A63]">Glyphs</div>
                  <div className="font-medium text-[#141413] mt-0.5 tabular-nums">{info.glyphCount}</div>
                </div>
                <div>
                  <div className="text-[#6E6A63]">Units / Em</div>
                  <div className="font-medium text-[#141413] mt-0.5 tabular-nums">{info.unitsPerEm}</div>
                </div>
                <div>
                  <div className="text-[#6E6A63]">Designer</div>
                  <div className="font-medium text-[#141413] mt-0.5 truncate">{info.designer}</div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2">
                <label className="text-xs font-medium text-[#57534E] block">
                  Live Test Render
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={2}
                  style={{ fontFamily: `"${info.familyName}", sans-serif` }}
                  className="w-full text-2xl bg-[#FAF9F6] border border-stone-200 rounded-lg p-3 text-[#141413] focus:outline-none"
                />
              </div>

              {info.sampleChars.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#57534E]">
                      Extracted Glyph Map (click any glyph to edit/remix in Font Studio)
                    </span>
                  </div>
                  <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
                    {info.sampleChars.map((ch, idx) => (
                      <button
                        key={`${ch}-${idx}`}
                        type="button"
                        onClick={() => {
                          onSendCharToStudio(ch);
                          onClose();
                        }}
                        title={`Send ${ch} to Font Studio`}
                        style={{ fontFamily: `"${info.familyName}", sans-serif` }}
                        className="h-10 border border-stone-200 rounded-md flex items-center justify-center text-lg hover:border-[#B43E22] hover:text-[#B43E22] transition-colors cursor-pointer"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#57534E]">
                    Self-Contained Base64 @font-face Embed
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyFullEmbed}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B43E22] hover:underline cursor-pointer"
                  >
                    {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedEmbed ? 'Copied Full Base64 CSS' : 'Copy Full Base64 Embed'}
                  </button>
                </div>
                <pre className="p-3 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-lg overflow-x-auto">
                  {embedCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-200 bg-white flex justify-between items-center">
          <span className="text-xs text-[#6E6A63]">
            Supports OpenType, TrueType, and WOFF binaries locally.
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#141413] text-white rounded-lg hover:bg-[#B43E22] cursor-pointer"
          >
            Done
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
