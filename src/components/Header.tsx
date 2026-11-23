import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type AppTab = 'library' | 'sources' | 'studio' | 'unicode' | 'pairings';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  kitCount: number;
  onOpenKit: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'sources', label: 'Sources' },
  { id: 'studio', label: 'Font Studio' },
  { id: 'unicode', label: 'Unicode' },
  { id: 'pairings', label: 'Pairings' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  kitCount,
  onOpenKit,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (tab: AppTab) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('library')}
          className="font-display text-xl font-semibold tracking-tight text-[#141413] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B43E22]"
        >
          Pangloss Type
        </button>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B43E22] ${
                  isActive
                    ? 'text-[#B43E22]'
                    : 'text-[#57534E] hover:text-[#141413]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#B43E22]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenKit}
            className="px-4 py-2 text-sm font-medium bg-[#141413] text-[#FAF9F6] rounded-lg hover:bg-[#B43E22] transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B43E22]"
          >
            Project Kit ({kitCount})
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 text-[#141413] hover:bg-stone-200/70 rounded-lg cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-stone-200 bg-[#FAF9F6] px-4 py-3 flex flex-wrap gap-2"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#B43E22] text-white'
                    : 'text-[#57534E] hover:bg-stone-200/70 hover:text-[#141413]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
