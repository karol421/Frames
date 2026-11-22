import React from 'react';
import { InspectorTab } from '../types/studio';

interface HeaderProps {
  onOpenPresets: () => void;
  onOpenReferences: () => void;
  onSelectTab: (tab: InspectorTab) => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPresets,
  onOpenReferences,
  onSelectTab,
  onOpenExport,
}) => {
  return (
    <header className="h-14 shrink-0 border-b border-[#242429] bg-[#0E0E11] px-5 flex items-center justify-between gap-8">
      {/* Zone 1: Brand wordmark */}
      <a
        href="#top"
        onClick={(e) => e.preventDefault()}
        className="font-display text-lg font-bold tracking-tight text-[#F4F4F0] whitespace-nowrap shrink-0"
      >
        Termoflux Studio
      </a>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#A0A0AB]">
        <button
          type="button"
          onClick={onOpenPresets}
          className="hover:text-[#F4F4F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Presets
        </button>
        <button
          type="button"
          onClick={onOpenReferences}
          className="hover:text-[#F4F4F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Referências
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('typography')}
          className="hover:text-[#F4F4F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Tipografia
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('paper')}
          className="hover:text-[#F4F4F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Papel & Textura
        </button>
      </nav>

      {/* Zone 3: Single primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenExport}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#FF4D2E] hover:bg-[#E84326] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Exportar Mídia
        </button>
      </div>
    </header>
  );
};
