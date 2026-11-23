import { useState } from 'react';
import { FONTS_CATALOG } from './data/fontsCatalog';
import { EmbedHostConfig, FontEntry } from './types/font';
import { Header, AppTab } from './components/Header';
import { LibraryView } from './components/LibraryView';
import { SourcesView } from './components/SourcesView';
import { FontStudioView } from './components/FontStudioView';
import { UnicodeExplorerView } from './components/UnicodeExplorerView';
import { PairingView } from './components/PairingView';
import { FontDetailModal } from './components/FontDetailModal';
import { ProjectKitDrawer } from './components/ProjectKitDrawer';
import { LocalFontInspectorModal } from './components/LocalFontInspectorModal';
import { EmbedHostModal } from './components/EmbedHostModal';
import { loadEmbedHostConfig, saveEmbedHostConfig } from './utils/fontEmbedder';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('library');
  const [sourceFilterFromDirectory, setSourceFilterFromDirectory] = useState<string>('all');
  const [inspectedFont, setInspectedFont] = useState<FontEntry | null>(null);
  const [kitOpen, setKitOpen] = useState(false);
  const [localInspectorOpen, setLocalInspectorOpen] = useState(false);
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [hostConfig, setHostConfig] = useState<EmbedHostConfig>(() => loadEmbedHostConfig());
  const [kitIds, setKitIds] = useState<string[]>(['noto-sans-armenian', 'fraunces']);
  const [studioExternalChar, setStudioExternalChar] = useState<string | null>(null);

  const kitIdSet = new Set(kitIds);
  const kitFonts = FONTS_CATALOG.filter((f) => kitIdSet.has(f.id));

  const handleToggleKit = (font: FontEntry) => {
    setKitIds((prev) =>
      prev.includes(font.id) ? prev.filter((id) => id !== font.id) : [...prev, font.id]
    );
  };

  const handleBrowseSourceInLibrary = (sourceId: string) => {
    setSourceFilterFromDirectory(sourceId);
    setActiveTab('library');
  };

  const handleSendCharToStudio = (char: string) => {
    setStudioExternalChar(char);
    setActiveTab('studio');
  };

  const handleSaveHostConfig = (next: EmbedHostConfig) => {
    setHostConfig(next);
    saveEmbedHostConfig(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#141413]">
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'library') setSourceFilterFromDirectory('all');
          setActiveTab(tab);
        }}
        kitCount={kitFonts.length}
        onOpenKit={() => setKitOpen(true)}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        {activeTab === 'library' && (
          <LibraryView
            fonts={FONTS_CATALOG}
            kitFontIds={kitIdSet}
            onToggleKit={handleToggleKit}
            onInspectFont={(font) => setInspectedFont(font)}
            onOpenLocalInspector={() => setLocalInspectorOpen(true)}
            onOpenStudio={() => setActiveTab('studio')}
            onOpenSources={() => setActiveTab('sources')}
            onOpenHostManager={() => setHostModalOpen(true)}
            hostConfig={hostConfig}
            initialSourceId={sourceFilterFromDirectory}
          />
        )}

        {activeTab === 'sources' && (
          <SourcesView onBrowseSourceInLibrary={handleBrowseSourceInLibrary} />
        )}

        {activeTab === 'studio' && (
          <FontStudioView
            externalChar={studioExternalChar}
            onConsumeExternalChar={() => setStudioExternalChar(null)}
          />
        )}

        {activeTab === 'unicode' && (
          <UnicodeExplorerView onSendCharToStudio={handleSendCharToStudio} />
        )}

        {activeTab === 'pairings' && (
          <PairingView
            hostConfig={hostConfig}
            onOpenHostManager={() => setHostModalOpen(true)}
          />
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#6E6A63]">
          <div>
            Pangloss Type · 100% Static Self-Hosted Archive ({FONTS_CATALOG.length.toLocaleString()} Fonts) &amp; Local OpenType Studio
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setHostModalOpen(true)}
              className="text-[#B43E22] font-medium hover:underline cursor-pointer"
            >
              Manage Embed Host
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className="hover:text-[#141413] cursor-pointer"
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sources')}
              className="hover:text-[#141413] cursor-pointer"
            >
              Global Sources
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className="hover:text-[#141413] cursor-pointer"
            >
              Font Studio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unicode')}
              className="hover:text-[#141413] cursor-pointer"
            >
              Unicode Atlas
            </button>
          </div>
        </div>
      </footer>

      <FontDetailModal
        font={inspectedFont}
        onClose={() => setInspectedFont(null)}
        inKit={inspectedFont ? kitIdSet.has(inspectedFont.id) : false}
        onToggleKit={handleToggleKit}
        hostConfig={hostConfig}
        onOpenHostManager={() => setHostModalOpen(true)}
      />

      <ProjectKitDrawer
        open={kitOpen}
        onClose={() => setKitOpen(false)}
        fonts={kitFonts}
        onRemoveFont={(id) => setKitIds((prev) => prev.filter((item) => item !== id))}
        onClearKit={() => setKitIds([])}
        hostConfig={hostConfig}
        onOpenHostManager={() => setHostModalOpen(true)}
      />

      <LocalFontInspectorModal
        open={localInspectorOpen}
        onClose={() => setLocalInspectorOpen(false)}
        onSendCharToStudio={handleSendCharToStudio}
      />

      <EmbedHostModal
        open={hostModalOpen}
        onClose={() => setHostModalOpen(false)}
        config={hostConfig}
        onSaveConfig={handleSaveHostConfig}
        fonts={FONTS_CATALOG}
      />
    </div>
  );
}
