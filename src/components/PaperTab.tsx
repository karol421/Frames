import React from 'react';
import { PAPER_STOCKS } from '../constants/presets';
import { StudioParams } from '../types/studio';
import { RangeSlider } from './RangeSlider';

interface PaperTabProps {
  params: StudioParams;
  onChange: (patch: Partial<StudioParams>) => void;
}

export const PaperTab: React.FC<PaperTabProps> = ({ params, onChange }) => {
  return (
    <div className="divide-y divide-[#242429]">
      {/* Enable Paper Surface */}
      <div className="p-4 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-semibold text-[#F4F4F0]">
            Ativar Textura de Papel & Prensa
          </span>
          <input
            type="checkbox"
            checked={params.paperEnabled}
            onChange={(e) => onChange({ paperEnabled: e.target.checked })}
            className="accent-[#FF4D2E] w-4 h-4 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-medium text-[#B8B8C2]">Moldura Fina de Arquivo</span>
          <input
            type="checkbox"
            checked={params.paperBorder}
            onChange={(e) => onChange({ paperBorder: e.target.checked })}
            className="accent-[#FF4D2E] w-4 h-4 cursor-pointer"
          />
        </label>
      </div>

      {/* Paper Stock Substrates */}
      <div className="p-4 space-y-3">
        <h3 className="text-xs font-semibold text-[#F4F4F0]">Tipo de Papel (Substrato)</h3>
        <div className="space-y-1.5">
          {PAPER_STOCKS.map((stock) => {
            const active = params.paperStock === stock.id;
            return (
              <button
                key={stock.id}
                type="button"
                onClick={() => onChange({ paperStock: stock.id, paperEnabled: true })}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md border text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-[#FF4D2E] bg-[#1E1B1C]'
                    : 'border-[#25252D] bg-[#15151A] hover:border-[#3A3A46]'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#E4E4EA]">{stock.name}</div>
                  <div className="text-[11px] text-[#8E8E99] truncate">{stock.description}</div>
                </div>
                <span
                  className="w-6 h-6 rounded-sm border border-black/20 shrink-0"
                  style={{ backgroundColor: stock.swatchColor }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Surface Relief & Ink Bite */}
      <div className="p-4 space-y-3.5">
        <h3 className="text-xs font-semibold text-[#F4F4F0]">Fibra & Absorção da Tinta</h3>

        <RangeSlider
          label="Relevo da Fibra"
          value={params.paperFiber}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperFiber: v })}
        />
        <RangeSlider
          label="Granulação Mineral"
          value={params.paperGrain}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperGrain: v })}
        />
        <RangeSlider
          label="Desgaste de Carimbo / Prensa"
          value={params.paperInkDistress}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperInkDistress: v })}
        />
        <RangeSlider
          label="Contraste de Impressão (Xerox)"
          value={params.paperContrast}
          min={0.6}
          max={2.2}
          step={0.02}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperContrast: v })}
        />
      </div>

      {/* Aging, Crease & Halftone */}
      <div className="p-4 space-y-3.5">
        <h3 className="text-xs font-semibold text-[#F4F4F0]">Envelhecimento & Acabamento</h3>

        <RangeSlider
          label="Pátina & Manchas de Arquivo"
          value={params.paperAging}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperAging: v })}
        />
        <RangeSlider
          label="Vinco / Dobra da Folha"
          value={params.paperFold}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperFold: v })}
        />
        <RangeSlider
          label="Retícula Halftone (45°)"
          value={params.paperHalftone}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperHalftone: v })}
        />
        <RangeSlider
          label="Queima de Borda (Vinheta)"
          value={params.paperVignette}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperVignette: v })}
        />
      </div>
    </div>
  );
};
