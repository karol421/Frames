import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { ASPECT_RATIOS } from '../constants/presets';
import { AspectRatioKey, BlendModeOption, StudioParams } from '../types/studio';
import { RangeSlider } from './RangeSlider';

interface MediaTabProps {
  params: StudioParams;
  onChange: (patch: Partial<StudioParams>) => void;
  onUploadFile: (file: File) => void;
  onClearMedia: () => void;
  onOpenReferences: () => void;
}

const BLEND_MODES: { value: BlendModeOption; label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiplicar' },
  { value: 'screen', label: 'Tela (Screen)' },
  { value: 'overlay', label: 'Sobrepor (Overlay)' },
  { value: 'difference', label: 'Diferença' },
  { value: 'exclusion', label: 'Exclusão' },
  { value: 'hard-light', label: 'Luz Dura' },
];

export const MediaTab: React.FC<MediaTabProps> = ({
  params,
  onChange,
  onUploadFile,
  onClearMedia,
  onOpenReferences,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUploadFile(file);
  };

  return (
    <div className="divide-y divide-[#242429]">
      {/* Upload Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#F4F4F0]">Mídia de Base</h3>
          <button
            type="button"
            onClick={onOpenReferences}
            className="text-xs text-[#FF4D2E] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Usar referências
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadFile(file);
            e.target.value = '';
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#FF4D2E] bg-[#FF4D2E]/10'
              : 'border-[#33333C] hover:border-[#555562] bg-[#141418]'
          }`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="w-4 h-4 text-[#A0A0AB]" />
            <p className="text-xs font-medium text-[#E4E4EA]">Solte imagem ou vídeo aqui</p>
            <p className="text-[11px] text-[#80808C]">PNG, JPG, WebP, MP4 ou WebM</p>
          </div>
        </div>

        {params.mediaType !== 'none' ? (
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <ImagePlus className="w-3.5 h-3.5 text-[#FF4D2E] shrink-0" />
              <span className="truncate text-[#D4D4DC]">
                {params.mediaName || 'Mídia carregada'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearMedia}
              className="flex items-center gap-1 text-xs text-[#9898A4] hover:text-white shrink-0 cursor-pointer"
              title="Remover mídia"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Media Transform Controls */}
      {params.mediaType !== 'none' && (
        <div className="p-4 space-y-3.5">
          <h3 className="text-xs font-semibold text-[#F4F4F0]">Ajuste da Mídia</h3>
          <RangeSlider
            label="Escala"
            value={params.mediaScale}
            min={0.2}
            max={3.0}
            step={0.02}
            unit="×"
            onChange={(v) => onChange({ mediaScale: v })}
          />
          <RangeSlider
            label="Opacidade"
            value={params.mediaOpacity}
            min={0}
            max={1}
            step={0.01}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => onChange({ mediaOpacity: v })}
          />
          <RangeSlider
            label="Contraste"
            value={params.mediaContrast}
            min={0.4}
            max={2.4}
            step={0.02}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => onChange({ mediaContrast: v })}
          />
          <RangeSlider
            label="Rotação"
            value={params.mediaRotation}
            min={-180}
            max={180}
            step={1}
            unit="°"
            onChange={(v) => onChange({ mediaRotation: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <RangeSlider
              label="Posição X"
              value={params.mediaX}
              min={-0.2}
              max={1.2}
              step={0.01}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onChange({ mediaX: v })}
            />
            <RangeSlider
              label="Posição Y"
              value={params.mediaY}
              min={-0.2}
              max={1.2}
              step={0.01}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onChange({ mediaY: v })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B8B8C2] block">Modo de Mesclagem</label>
            <select
              value={params.mediaBlendMode}
              onChange={(e) => onChange({ mediaBlendMode: e.target.value as BlendModeOption })}
              className="w-full h-9 px-2.5 text-xs bg-[#17171C] border border-[#2B2B33] rounded-md text-[#F4F4F0] focus:outline-none focus:border-[#FF4D2E]"
            >
              {BLEND_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center justify-between cursor-pointer pt-1">
            <span className="text-xs font-medium text-[#B8B8C2]">Inverter Cores da Mídia</span>
            <input
              type="checkbox"
              checked={params.mediaInvert}
              onChange={(e) => onChange({ mediaInvert: e.target.checked })}
              className="accent-[#FF4D2E] w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      )}

      {/* Format & Base Background */}
      <div className="p-4 space-y-3.5">
        <h3 className="text-xs font-semibold text-[#F4F4F0]">Formato & Cor Base</h3>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#B8B8C2] block">Proporção do Quadro</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((key) => {
              const spec = ASPECT_RATIOS[key];
              const active = params.aspectRatio === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ aspectRatio: key })}
                  className={`px-2 py-1.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#FF4D2E] text-white border-[#FF4D2E]'
                      : 'bg-[#17171C] text-[#A8A8B3] border-[#282830] hover:text-white'
                  }`}
                >
                  {spec.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-medium text-[#B8B8C2]">Cor Base da Folha</label>
          <div className="flex items-center gap-2">
            {['#F2EFE6', '#EAE4D0', '#FFFFFF', '#DFDDD6', '#141418'].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onChange({ backgroundColor: hex })}
                className={`w-5 h-5 rounded border cursor-pointer ${
                  params.backgroundColor.toLowerCase() === hex.toLowerCase()
                    ? 'border-[#FF4D2E] scale-110'
                    : 'border-[#3A3A44]'
                }`}
                style={{ backgroundColor: hex }}
                aria-label={`Selecionar fundo ${hex}`}
              />
            ))}
            <input
              type="color"
              value={params.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="w-7 h-6 bg-transparent border border-[#32323A] rounded cursor-pointer"
              aria-label="Cor personalizada de fundo"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
