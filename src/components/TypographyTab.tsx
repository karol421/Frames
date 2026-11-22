import React, { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { GOOGLE_FONTS_CATALOG, loadGoogleFont, loadLocalFontFile } from '../constants/fonts';
import { BlendModeOption, EchoMode, LocalFontEntry, StudioParams } from '../types/studio';
import { RangeSlider } from './RangeSlider';

interface TypographyTabProps {
  params: StudioParams;
  localFonts: LocalFontEntry[];
  onAddLocalFont: (entry: LocalFontEntry) => void;
  onChange: (patch: Partial<StudioParams>) => void;
}

const ECHO_MODES: { value: EchoMode; label: string }[] = [
  { value: 'single', label: 'Único' },
  { value: 'stack', label: 'Pilha' },
  { value: 'cascade', label: 'Cascata' },
  { value: 'scatter', label: 'Disperso' },
  { value: 'wave', label: 'Onda' },
];

const BLEND_MODES: { value: BlendModeOption; label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiplicar' },
  { value: 'screen', label: 'Tela (Screen)' },
  { value: 'overlay', label: 'Sobrepor' },
  { value: 'difference', label: 'Diferença' },
  { value: 'exclusion', label: 'Exclusão' },
];

export const TypographyTab: React.FC<TypographyTabProps> = ({
  params,
  localFonts,
  onAddLocalFont,
  onChange,
}) => {
  const [customFontInput, setCustomFontInput] = useState('');
  const [fontLoading, setFontLoading] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  const selectedFontMeta = GOOGLE_FONTS_CATALOG.find((f) => f.family === params.fontFamily);
  const isLocalFont = localFonts.some((f) => f.family === params.fontFamily);
  const availableWeights = selectedFontMeta?.weights ?? [400, 500, 600, 700, 800];

  const handleSelectFont = async (family: string) => {
    setFontError(null);
    setFontLoading(true);
    const meta = GOOGLE_FONTS_CATALOG.find((f) => f.family === family);
    const nextWeight =
      meta && !meta.weights.includes(params.fontWeight) ? meta.weights[0] : params.fontWeight;
    await loadGoogleFont(family, nextWeight);
    onChange({ fontFamily: family, fontWeight: nextWeight });
    setFontLoading(false);
  };

  const handleLoadCustomFont = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customFontInput.trim();
    if (!cleaned) return;
    setFontError(null);
    setFontLoading(true);
    await loadGoogleFont(cleaned, params.fontWeight);
    onChange({ fontFamily: cleaned });
    setFontLoading(false);
  };

  const handleUploadFontFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFontError(null);
    setFontLoading(true);
    try {
      const entry = await loadLocalFontFile(file);
      onAddLocalFont(entry);
      onChange({ fontFamily: entry.family, fontWeight: 400 });
    } catch {
      setFontError('Não foi possível carregar este arquivo de fonte (.ttf, .otf, .woff, .woff2).');
    } finally {
      setFontLoading(false);
    }
  };

  const categories = Array.from(new Set(GOOGLE_FONTS_CATALOG.map((f) => f.category)));

  return (
    <div className="divide-y divide-[#242429]">
      {/* Text & Toggle */}
      <div className="p-4 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-semibold text-[#F4F4F0]">Camada Tipográfica</span>
          <input
            type="checkbox"
            checked={params.textEnabled}
            onChange={(e) => onChange({ textEnabled: e.target.checked })}
            className="accent-[#FF4D2E] w-4 h-4 cursor-pointer"
          />
        </label>

        <textarea
          rows={3}
          value={params.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Digite o texto experimental..."
          className="w-full p-2.5 text-xs bg-[#16161B] border border-[#2B2B34] rounded-md text-[#F4F4F0] placeholder:text-[#666672] focus:outline-none focus:border-[#FF4D2E] resize-y"
        />
      </div>

      {/* Font Family: Local Computer Upload + Google Fonts */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#F4F4F0]">Tipografia & Fontes</h3>
          {fontLoading && <span className="text-[11px] text-[#FF4D2E]">Carregando...</span>}
        </div>

        {/* Upload local font from computer */}
        <input
          ref={fontFileInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
          className="hidden"
          onChange={handleUploadFontFile}
        />
        <button
          type="button"
          onClick={() => fontFileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium bg-[#18181F] hover:bg-[#22222B] text-[#F4F4F0] border border-dashed border-[#383844] hover:border-[#FF4D2E] rounded-md transition-colors cursor-pointer"
        >
          <FileUp className="w-3.5 h-3.5 text-[#FF4D2E]" />
          <span>Adicionar fonte do computador (.ttf, .otf, .woff2)</span>
        </button>

        {fontError && <p className="text-[11px] text-[#FF6B52]">{fontError}</p>}

        <select
          value={params.fontFamily}
          onChange={(e) => handleSelectFont(e.target.value)}
          className="w-full h-9 px-2.5 text-xs bg-[#17171C] border border-[#2B2B33] rounded-md text-[#F4F4F0] focus:outline-none focus:border-[#FF4D2E]"
        >
          {localFonts.length > 0 && (
            <optgroup label="Fontes do Computador">
              {localFonts.map((lf) => (
                <option key={lf.family} value={lf.family}>
                  {lf.family} ({lf.fileName})
                </option>
              ))}
            </optgroup>
          )}
          {!selectedFontMeta && !isLocalFont && (
            <option value={params.fontFamily}>{params.fontFamily} (Google Font)</option>
          )}
          {categories.map((cat) => (
            <optgroup key={cat} label={cat}>
              {GOOGLE_FONTS_CATALOG.filter((f) => f.category === cat).map((f) => (
                <option key={f.family} value={f.family}>
                  {f.family}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Custom Google Font Name */}
        <form onSubmit={handleLoadCustomFont} className="flex gap-1.5">
          <input
            type="text"
            value={customFontInput}
            onChange={(e) => setCustomFontInput(e.target.value)}
            placeholder="Nome de outra Google Font (ex: Bodoni Moda)"
            className="flex-1 min-w-0 h-8 px-2.5 text-xs bg-[#16161B] border border-[#2B2B34] rounded-md text-[#F4F4F0] placeholder:text-[#666672] focus:outline-none focus:border-[#FF4D2E]"
          />
          <button
            type="submit"
            className="px-3 h-8 text-xs font-medium bg-[#24242B] hover:bg-[#32323B] text-[#F4F4F0] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Aplicar
          </button>
        </form>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B8B8C2] block">Peso</label>
            <select
              value={params.fontWeight}
              onChange={(e) => onChange({ fontWeight: Number(e.target.value) })}
              className="w-full h-8 px-2 text-xs font-mono-tabular bg-[#17171C] border border-[#2B2B33] rounded-md text-[#F4F4F0] focus:outline-none focus:border-[#FF4D2E]"
            >
              {availableWeights.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B8B8C2] block">Alinhamento</label>
            <div className="grid grid-cols-3 gap-1 bg-[#17171C] p-0.5 rounded-md border border-[#2B2B33]">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => onChange({ textAlign: align })}
                  className={`h-7 text-[11px] rounded transition-colors cursor-pointer ${
                    params.textAlign === align
                      ? 'bg-[#2C2C35] text-white font-medium'
                      : 'text-[#8E8E99] hover:text-white'
                  }`}
                >
                  {align === 'left' ? 'Esq' : align === 'center' ? 'Cen' : 'Dir'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics & Style */}
      <div className="p-4 space-y-3.5">
        <RangeSlider
          label="Tamanho"
          value={params.fontSize}
          min={20}
          max={280}
          step={1}
          unit="px"
          onChange={(v) => onChange({ fontSize: v })}
        />
        <RangeSlider
          label="Entrelinha"
          value={params.lineHeight}
          min={0.68}
          max={2.1}
          step={0.02}
          onChange={(v) => onChange({ lineHeight: v })}
        />
        <RangeSlider
          label="Espaçamento (Tracking)"
          value={params.letterSpacing}
          min={-0.15}
          max={0.45}
          step={0.01}
          unit="em"
          onChange={(v) => onChange({ letterSpacing: v })}
        />
        <RangeSlider
          label="Rotação"
          value={params.textRotation}
          min={-45}
          max={45}
          step={0.5}
          unit="°"
          onChange={(v) => onChange({ textRotation: v })}
        />
        <RangeSlider
          label="Desfoque Óptico de Tinta"
          value={params.textBlur}
          min={0}
          max={24}
          step={0.2}
          unit="px"
          onChange={(v) => onChange({ textBlur: v })}
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <label className="text-xs font-medium text-[#B8B8C2]">Cor da Tinta</label>
          <div className="flex items-center gap-2">
            {['#141416', '#FFFFFF', '#1F36F2', '#6E1111', '#FF4D2E'].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onChange({ textColor: hex })}
                className={`w-5 h-5 rounded border cursor-pointer ${
                  params.textColor.toLowerCase() === hex.toLowerCase()
                    ? 'border-[#FF4D2E] scale-110'
                    : 'border-[#3A3A44]'
                }`}
                style={{ backgroundColor: hex }}
                aria-label={`Cor de tinta ${hex}`}
              />
            ))}
            <input
              type="color"
              value={params.textColor}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="w-7 h-6 bg-transparent border border-[#32323A] rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#B8B8C2] block">Mesclagem do Texto</label>
          <select
            value={params.textBlendMode}
            onChange={(e) => onChange({ textBlendMode: e.target.value as BlendModeOption })}
            className="w-full h-9 px-2.5 text-xs bg-[#17171C] border border-[#2B2B33] rounded-md text-[#F4F4F0] focus:outline-none focus:border-[#FF4D2E]"
          >
            {BLEND_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Concrete Echoes */}
      <div className="p-4 space-y-3.5">
        <h3 className="text-xs font-semibold text-[#F4F4F0]">Ecos & Repetições Concretas</h3>

        <div className="grid grid-cols-5 gap-1 bg-[#17171C] p-1 rounded-md border border-[#2B2B33]">
          {ECHO_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange({ echoMode: m.value })}
              className={`py-1.5 text-[11px] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                params.echoMode === m.value
                  ? 'bg-[#FF4D2E] text-white font-medium'
                  : 'text-[#9898A4] hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {params.echoMode !== 'single' && (
          <>
            <RangeSlider
              label="Cópias"
              value={params.echoCount}
              min={2}
              max={36}
              step={1}
              onChange={(v) => onChange({ echoCount: v })}
            />
            <div className="grid grid-cols-2 gap-3">
              <RangeSlider
                label="Desloc. X"
                value={params.echoOffsetX}
                min={-120}
                max={120}
                step={1}
                unit="px"
                onChange={(v) => onChange({ echoOffsetX: v })}
              />
              <RangeSlider
                label="Desloc. Y"
                value={params.echoOffsetY}
                min={-120}
                max={120}
                step={1}
                unit="px"
                onChange={(v) => onChange({ echoOffsetY: v })}
              />
            </div>
            <RangeSlider
              label="Caos / Jitter"
              value={params.echoJitter}
              min={0}
              max={1}
              step={0.01}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onChange({ echoJitter: v })}
            />
            <RangeSlider
              label="Decaimento de Opacidade"
              value={params.echoDecay}
              min={0}
              max={1}
              step={0.01}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onChange({ echoDecay: v })}
            />
          </>
        )}
      </div>

      {/* Archival Colophon */}
      <div className="p-4 space-y-2.5">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-semibold text-[#F4F4F0]">Colofão de Arquivo</span>
          <input
            type="checkbox"
            checked={params.subtextEnabled}
            onChange={(e) => onChange({ subtextEnabled: e.target.checked })}
            className="accent-[#FF4D2E] w-4 h-4 cursor-pointer"
          />
        </label>
        {params.subtextEnabled && (
          <input
            type="text"
            value={params.subtext}
            onChange={(e) => onChange({ subtext: e.target.value })}
            placeholder="Nota editorial no rodapé..."
            className="w-full h-8 px-2.5 text-xs font-mono-tabular bg-[#16161B] border border-[#2B2B34] rounded-md text-[#F4F4F0] focus:outline-none focus:border-[#FF4D2E]"
          />
        )}
      </div>
    </div>
  );
};
