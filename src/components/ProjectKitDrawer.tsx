import React, { useState } from 'react';
import JSZip from 'jszip';
import { X, Download, Trash2, Copy, Check, Globe } from 'lucide-react';
import { EmbedHostConfig, FontEntry } from '../types/font';
import {
  generateProjectKitBundleFiles,
  normalizeBaseUrl,
  normalizeFontsPath,
} from '../utils/fontEmbedder';
import { triggerBinaryDownload } from '../utils/fontLoader';

interface ProjectKitDrawerProps {
  open: boolean;
  onClose: () => void;
  fonts: FontEntry[];
  onRemoveFont: (id: string) => void;
  onClearKit: () => void;
  hostConfig: EmbedHostConfig;
  onOpenHostManager: () => void;
}

export const ProjectKitDrawer: React.FC<ProjectKitDrawerProps> = ({
  open,
  onClose,
  fonts,
  onRemoveFont,
  onClearKit,
  hostConfig,
  onOpenHostManager,
}) => {
  const [copiedCss, setCopiedCss] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const bundle = generateProjectKitBundleFiles(fonts, hostConfig);
  const hostDisplay =
    (normalizeBaseUrl(hostConfig.baseUrl) || '(relative)') +
    normalizeFontsPath(hostConfig.fontsPath);

  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(bundle.css);
      setCopiedCss(true);
      setTimeout(() => setCopiedCss(false), 1800);
    } catch {
      // Clipboard fallback ignored in restricted frames
    }
  };

  const handleDownloadZip = async () => {
    if (fonts.length === 0) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      zip.file('fonts.css', bundle.css);
      zip.file('tokens.json', bundle.tokensJson);
      zip.file('demo.html', bundle.demoHtml);
      zip.file('README.md', bundle.readme);
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerBinaryDownload(blob, 'pangloss-font-kit.zip', 'application/zip');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Project Font Kit"
    >
      <div className="w-full max-w-lg bg-[#FAF9F6] border-l border-stone-200 h-full flex flex-col">
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#141413]">
              Project Kit ({fonts.length})
            </h2>
            <p className="text-xs text-[#6E6A63] mt-0.5">
              Static multi-script CSS variables, HTML specimen, and JSON tokens.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Project Kit"
            className="p-2 text-[#57534E] hover:text-[#141413] hover:bg-stone-200/70 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {fonts.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-stone-300 rounded-xl px-6">
              <p className="text-sm font-medium text-[#141413]">Your Project Kit is empty</p>
              <p className="text-xs text-[#6E6A63] mt-1.5 max-w-xs mx-auto">
                Add any font from the Library to bundle its CSS imports, variables, and static demo HTML into one ZIP archive.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl bg-white">
                {fonts.map((font) => (
                  <div
                    key={font.id}
                    className="px-4 py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-[#141413] truncate">
                        {font.name}
                      </div>
                      <div className="text-xs text-[#6E6A63] mt-0.5 truncate">
                        {font.scripts.join(', ')} · {font.license}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveFont(font.id)}
                      aria-label={`Remove ${font.name} from kit`}
                      className="p-1.5 text-[#6E6A63] hover:text-[#B43E22] rounded-md cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2 text-xs text-[#6E6A63]">
                  <span className="inline-flex items-center gap-1.5 font-mono truncate">
                    <Globe className="w-3.5 h-3.5 text-[#B43E22] shrink-0" />
                    Host: {hostDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenHostManager}
                    className="font-sans font-medium text-[#B43E22] hover:underline cursor-pointer shrink-0"
                  >
                    Change Host
                  </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#57534E]">
                    Generated fonts.css
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCss}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B43E22] hover:underline cursor-pointer"
                  >
                    {copiedCss ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCss ? 'Copied' : 'Copy CSS'}
                  </button>
                </div>
                <pre className="p-3.5 bg-[#141413] text-[#FAF9F6] text-xs font-mono rounded-xl overflow-x-auto max-h-56 leading-relaxed">
                  {bundle.css}
                </pre>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-200 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClearKit}
            disabled={fonts.length === 0}
            className="px-3.5 py-2 text-sm font-medium text-[#57534E] hover:text-[#141413] disabled:opacity-40 cursor-pointer"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={fonts.length === 0 || exporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#B43E22] text-white rounded-lg hover:bg-[#993219] disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Packaging ZIP...' : 'Download Static Kit (.zip)'}
          </button>
        </div>
      </div>
    </div>
  );
};
