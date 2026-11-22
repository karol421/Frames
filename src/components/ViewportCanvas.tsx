import React, { useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Shuffle, Zap } from 'lucide-react';
import { ASPECT_RATIOS } from '../constants/presets';
import { DragTarget, StudioParams } from '../types/studio';

interface ViewportCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  params: StudioParams;
  dragTarget: DragTarget;
  onChangeDragTarget: (target: DragTarget) => void;
  onChange: (patch: Partial<StudioParams>) => void;
  onRandomizeMild: () => void;
  onRandomizeAggressive: () => void;
  onReset: () => void;
  onDropFile: (file: File) => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  canvasRef,
  params,
  dragTarget,
  onChangeDragTarget,
  onChange,
  onRandomizeMild,
  onRandomizeAggressive,
  onReset,
  onDropFile,
}) => {
  const spec = ASPECT_RATIOS[params.aspectRatio];
  const dragState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ active: false, startX: 0, startY: 0, origX: 0.5, origY: 0.5 });

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const target = dragTarget === 'media' && params.mediaType !== 'none' ? 'media' : 'text';
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: target === 'media' ? params.mediaX : params.textX,
      origY: target === 'media' ? params.mediaY : params.textY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragState.current.active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dx = (e.clientX - dragState.current.startX) / rect.width;
    const dy = (e.clientY - dragState.current.startY) / rect.height;

    const target = dragTarget === 'media' && params.mediaType !== 'none' ? 'media' : 'text';
    if (target === 'media') {
      onChange({
        mediaX: Number(Math.max(-0.2, Math.min(1.2, dragState.current.origX + dx)).toFixed(3)),
        mediaY: Number(Math.max(-0.2, Math.min(1.2, dragState.current.origY + dy)).toFixed(3)),
      });
    } else {
      onChange({
        textX: Number(Math.max(0.0, Math.min(1.0, dragState.current.origX + dx)).toFixed(3)),
        textY: Number(Math.max(0.0, Math.min(1.0, dragState.current.origY + dy)).toFixed(3)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragState.current.active) {
      dragState.current.active = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <section
      className="flex-1 min-w-0 min-h-[480px] lg:h-full studio-matboard flex flex-col relative overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onDropFile(file);
      }}
    >
      {/* Top Canvas Spec Strip (clean unboxed metadata) */}
      <div className="px-5 pt-3.5 pb-2 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#8E8E99] font-mono-tabular">
          <span>{spec.label}</span>
          <span aria-hidden="true">·</span>
          <span>
            {spec.width} × {spec.height} px
          </span>
          <span aria-hidden="true">·</span>
          <span>4K {spec.export4KWidth} × {spec.export4KHeight}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#7E7E8A] hidden sm:inline">Arrastar no quadro:</span>
          <div className="flex items-center p-0.5 bg-[#16161B] border border-[#26262E] rounded-md">
            <button
              type="button"
              onClick={() => onChangeDragTarget('text')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                dragTarget === 'text' ? 'bg-[#282831] text-white' : 'text-[#8E8E99] hover:text-white'
              }`}
            >
              Texto
            </button>
            <button
              type="button"
              disabled={params.mediaType === 'none'}
              onClick={() => onChangeDragTarget('media')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                params.mediaType === 'none'
                  ? 'text-[#4E4E58] cursor-not-allowed'
                  : dragTarget === 'media'
                  ? 'bg-[#282831] text-white cursor-pointer'
                  : 'text-[#8E8E99] hover:text-white cursor-pointer'
              }`}
            >
              Mídia
            </button>
          </div>
        </div>
      </div>

      {/* Main Artwork Frame */}
      <div className="flex-1 min-h-0 px-6 py-3 flex items-center justify-center">
        <div
          className="relative flex items-center justify-center shadow-[0_24px_70px_rgba(0,0,0,0.65)] border border-[#242429] bg-black"
          style={{
            aspectRatio: `${spec.width} / ${spec.height}`,
            maxHeight: '100%',
            maxWidth: '100%',
            height: spec.height >= spec.width ? '100%' : 'auto',
            width: spec.width > spec.height ? '100%' : 'auto',
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
          />

          {isDraggingFile && (
            <div className="absolute inset-0 bg-[#0B0B0C]/85 border-2 border-dashed border-[#FF4D2E] flex items-center justify-center pointer-events-none">
              <p className="text-sm font-medium text-white">Solte a imagem ou vídeo para carregar</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Transport & Randomizer Dock */}
      <div className="px-5 pb-4 pt-2 flex flex-wrap items-center justify-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange({ motionPlaying: !params.motionPlaying })}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-[#17171C] hover:bg-[#22222A] text-[#F4F4F0] border border-[#2A2A33] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {params.motionPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{params.motionPlaying ? 'Pausar Fluxo' : 'Reproduzir Fluxo'}</span>
        </button>

        <button
          type="button"
          onClick={onRandomizeMild}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-[#17171C] hover:bg-[#22222A] text-[#F4F4F0] border border-[#2A2A33] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 text-[#D8D8E0]" />
          <span>Randomizar Leve</span>
        </button>

        <button
          type="button"
          onClick={onRandomizeAggressive}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#241615] hover:bg-[#331B19] text-[#FF7A63] border border-[#FF4D2E]/40 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-[#FF4D2E]" />
          <span>Randomizar Agressivo</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#17171C] hover:bg-[#22222A] text-[#A0A0AB] hover:text-white border border-[#2A2A33] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Restaurar padrões iniciais"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Resetar</span>
        </button>
      </div>
    </section>
  );
};
