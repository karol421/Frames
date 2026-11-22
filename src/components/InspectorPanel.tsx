import React from 'react';
import { InspectorTab, LocalFontEntry, StudioParams } from '../types/studio';
import { MediaTab } from './MediaTab';
import { MotionTab } from './MotionTab';
import { PaperTab } from './PaperTab';
import { TypographyTab } from './TypographyTab';

interface InspectorPanelProps {
  activeTab: InspectorTab;
  onSelectTab: (tab: InspectorTab) => void;
  params: StudioParams;
  localFonts: LocalFontEntry[];
  onAddLocalFont: (entry: LocalFontEntry) => void;
  onChange: (patch: Partial<StudioParams>) => void;
  onUploadFile: (file: File) => void;
  onClearMedia: () => void;
  onOpenReferences: () => void;
}

const TABS: { id: InspectorTab; label: string }[] = [
  { id: 'media', label: 'Mídia' },
  { id: 'typography', label: 'Tipografia' },
  { id: 'paper', label: 'Papel' },
  { id: 'motion', label: 'Motion' },
];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  activeTab,
  onSelectTab,
  params,
  localFonts,
  onAddLocalFont,
  onChange,
  onUploadFile,
  onClearMedia,
  onOpenReferences,
}) => {
  return (
    <aside className="w-full lg:w-[372px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#242429] bg-[#101014] flex flex-col lg:h-full overflow-hidden">
      {/* Segmented Control Tabs */}
      <div className="p-3 border-b border-[#242429] shrink-0">
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#18181E] rounded-md border border-[#25252D]">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#282831] text-[#F4F4F0]'
                    : 'text-[#8E8E99] hover:text-[#E4E4EA]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto studio-scroll">
        {activeTab === 'media' && (
          <MediaTab
            params={params}
            onChange={onChange}
            onUploadFile={onUploadFile}
            onClearMedia={onClearMedia}
            onOpenReferences={onOpenReferences}
          />
        )}
        {activeTab === 'typography' && (
          <TypographyTab
            params={params}
            localFonts={localFonts}
            onAddLocalFont={onAddLocalFont}
            onChange={onChange}
          />
        )}
        {activeTab === 'paper' && <PaperTab params={params} onChange={onChange} />}
        {activeTab === 'motion' && <MotionTab params={params} onChange={onChange} />}
      </div>
    </aside>
  );
};
