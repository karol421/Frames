import React from 'react';
import { BlurMode, StudioParams } from '../types/studio';
import { RangeSlider } from './RangeSlider';

interface MotionTabProps {
  params: StudioParams;
  onChange: (patch: Partial<StudioParams>) => void;
}

const BLUR_MODES: { value: BlurMode; label: string }[] = [
  { value: 'directional', label: 'Direcional' },
  { value: 'radial', label: 'Radial' },
  { value: 'spin', label: 'Rotacional' },
  { value: 'shutter', label: 'Obturador' },
];

export const MotionTab: React.FC<MotionTabProps> = ({ params, onChange }) => {
  return (
    <div className="divide-y divide-[#242429]">
      {/* Blur Mode & Core Sliders */}
      <div className="p-4 space-y-3.5">
        <h3 className="text-xs font-semibold text-[#F4F4F0]">Motor de Motion Blur</h3>

        <div className="grid grid-cols-4 gap-1 bg-[#17171C] p-1 rounded-md border border-[#2B2B33]">
          {BLUR_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange({ blurMode: m.value })}
              className={`py-1.5 text-[11px] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                params.blurMode === m.value
                  ? 'bg-[#FF4D2E] text-white font-medium'
                  : 'text-[#9898A4] hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <RangeSlider
          label="Intensidade do Blur"
          value={params.blurAmount}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ blurAmount: v })}
        />

        {(params.blurMode === 'directional' || params.blurMode === 'shutter') && (
          <RangeSlider
            label="Ângulo do Movimento"
            value={params.blurAngle}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={(v) => onChange({ blurAngle: v })}
          />
        )}

        {(params.blurMode === 'radial' || params.blurMode === 'spin') && (
          <div className="grid grid-cols-2 gap-3">
            <RangeSlider
              label="Centro X"
              value={params.blurCenterX}
              min={0}
              max={1}
              step={0.01}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onChange({ blurCenterX: v })}
            />
            <RangeSlider
              label="Centro Y"
              value={params.blurCenterY}
              min={0}
              max={1}
              step={0.01}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onChange({ blurCenterY: v })}
            />
          </div>
        )}

        <RangeSlider
          label="Amostras (Suavidade)"
          value={params.blurSamples}
          min={8}
          max={48}
          step={2}
          formatValue={(v) => `${Math.round(v)} taps`}
          onChange={(v) => onChange({ blurSamples: v })}
        />
      </div>

      {/* Optical Trails & Prism */}
      <div className="p-4 space-y-3.5">
        <h3 className="text-xs font-semibold text-[#F4F4F0]">Rastro Temporal & Prisma</h3>

        <RangeSlider
          label="Persistência do Rastro (Shutter)"
          value={params.shutterTrail}
          min={0}
          max={0.94}
          step={0.01}
          formatValue={(v) => `${Math.round((v / 0.94) * 100)}%`}
          onChange={(v) => onChange({ shutterTrail: v })}
        />

        <RangeSlider
          label="Dispersão Cromática RGB"
          value={params.chromaticSplit}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ chromaticSplit: v })}
        />
      </div>

      {/* Live Kinetic Loop (used in preview & video export) */}
      <div className="p-4 space-y-3.5">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-semibold text-[#F4F4F0]">Animação Cinética (Vídeo)</span>
          <input
            type="checkbox"
            checked={params.motionPlaying}
            onChange={(e) => onChange({ motionPlaying: e.target.checked })}
            className="accent-[#FF4D2E] w-4 h-4 cursor-pointer"
          />
        </label>

        <RangeSlider
          label="Velocidade do Fluxo"
          value={params.motionSpeed}
          min={0.1}
          max={3.0}
          step={0.05}
          unit="×"
          onChange={(v) => onChange({ motionSpeed: v })}
        />
        <RangeSlider
          label="Deriva da Composição"
          value={params.motionDrift}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ motionDrift: v })}
        />
        <RangeSlider
          label="Respiração Orgânica da Fibra"
          value={params.paperShimmer}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ paperShimmer: v })}
        />
      </div>
    </div>
  );
};
