import React from 'react';
import { X } from 'lucide-react';
import { PAPER_STOCKS, REFERENCE_GALLERY, STUDIO_PRESETS } from '../constants/presets';
import { PaperStock, StudioPreset } from '../types/studio';

interface PresetsModalProps {
  isOpen: boolean;
  initialView: 'presets' | 'references';
  onChangeView: (view: 'presets' | 'references') => void;
  onClose: () => void;
  onSelectPreset: (preset: StudioPreset) => void;
  onLoadReferenceImage: (url: string, title: string, stock: PaperStock) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  initialView,
  onChangeView,
  onClose,
  onSelectPreset,
  onLoadReferenceImage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-[#121216] border border-[#2A2A33] rounded-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#242429] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-base font-bold text-[#F4F4F0]">
              Biblioteca do Estúdio
            </h2>
            <div className="flex items-center p-0.5 bg-[#191920] border border-[#282832] rounded-md">
              <button
                type="button"
                onClick={() => onChangeView('presets')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  initialView === 'presets'
                    ? 'bg-[#FF4D2E] text-white'
                    : 'text-[#9898A4] hover:text-white'
                }`}
              >
                Presets Generativos
              </button>
              <button
                type="button"
                onClick={() => onChangeView('references')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  initialView === 'references'
                    ? 'bg-[#FF4D2E] text-white'
                    : 'text-[#9898A4] hover:text-white'
                }`}
              >
                Suas Referências (5)
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8E8E99] hover:text-white rounded cursor-pointer"
            aria-label="Fechar biblioteca"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto studio-scroll">
          {initialView === 'presets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STUDIO_PRESETS.map((preset) => {
                const stock = PAPER_STOCKS.find((s) => s.id === preset.params.paperStock);
                const bgSwatch = preset.params.backgroundColor || stock?.swatchColor || '#F2EFE6';
                const inkSwatch = preset.params.textColor || '#141416';
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className="text-left p-4 bg-[#17171C] hover:bg-[#1E1E25] border border-[#282832] hover:border-[#FF4D2E]/60 rounded-md transition-colors flex flex-col gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 flex-1 rounded-sm border border-white/10"
                        style={{ backgroundColor: bgSwatch }}
                      />
                      <span
                        className="h-3 w-8 rounded-sm border border-white/10"
                        style={{ backgroundColor: inkSwatch }}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#F4F4F0]">{preset.name}</h3>
                      <p className="text-xs text-[#9898A4] mt-1 leading-relaxed">
                        {preset.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#9898A4]">
                Clique em qualquer imagem de referência para carregá-la como camada de mídia e
                combinar texturas de papel, motion blur e novas camadas tipográficas por cima.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {REFERENCE_GALLERY.map((ref) => (
                  <button
                    key={ref.id}
                    type="button"
                    onClick={() => {
                      onLoadReferenceImage(ref.url, ref.title, ref.recommendedStock);
                      onClose();
                    }}
                    className="text-left bg-[#17171C] hover:bg-[#1E1E25] border border-[#282832] hover:border-[#FF4D2E]/60 rounded-md overflow-hidden transition-colors flex flex-col cursor-pointer"
                  >
                    <div className="aspect-[4/5] w-full bg-[#0E0E11] overflow-hidden">
                      <img
                        src={ref.url}
                        alt={ref.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs font-semibold text-[#F4F4F0] truncate">{ref.title}</h3>
                      <p className="text-[11px] text-[#8E8E99] mt-0.5 line-clamp-2">
                        {ref.caption}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
