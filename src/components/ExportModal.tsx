import React, { useRef, useState } from 'react';
import { Download, Film, Image as ImageIcon, X } from 'lucide-react';
import { ASPECT_RATIOS } from '../constants/presets';
import { renderHighResStaticBlob } from '../engine/webglRenderer';
import { StudioParams } from '../types/studio';
import { exportStudioVideo } from '../utils/videoExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: StudioParams;
  mediaElement: HTMLImageElement | HTMLVideoElement | null;
  currentTimeSec: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  params,
  mediaElement,
  currentTimeSec,
}) => {
  const [exportKind, setExportKind] = useState<'image' | 'video'>('image');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [resolutionTier, setResolutionTier] = useState<'standard' | '4k'>('4k');

  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [videoFps, setVideoFps] = useState<number>(30);
  const [videoBitrate, setVideoBitrate] = useState<number>(16);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const spec = ASPECT_RATIOS[params.aspectRatio];
  const staticW = resolutionTier === '4k' ? spec.export4KWidth : spec.width;
  const staticH = resolutionTier === '4k' ? spec.export4KHeight : spec.height;

  const videoScale = resolutionTier === '4k' ? 1.33 : 1.0;
  const videoW = Math.round((spec.width * videoScale) / 2) * 2;
  const videoH = Math.round((spec.height * videoScale) / 2) * 2;

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleExportImage = async () => {
    setErrorMsg(null);
    setIsExporting(true);
    try {
      const mime = imageFormat === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await renderHighResStaticBlob(
        staticW,
        staticH,
        params,
        mediaElement,
        currentTimeSec,
        mime,
        0.96
      );
      const stamp = new Date().toISOString().slice(0, 10);
      triggerDownload(blob, `prensa-${params.paperStock}-${staticW}x${staticH}-${stamp}.${imageFormat}`);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao exportar imagem.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVideo = async () => {
    setErrorMsg(null);
    setIsExporting(true);
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await exportStudioVideo({
        width: videoW,
        height: videoH,
        durationSec: videoDuration,
        fps: videoFps,
        bitrateMbps: videoBitrate,
        params,
        mediaElement,
        onProgress: (p) => setProgress(p),
        signal: controller.signal,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      triggerDownload(
        result.blob,
        `prensa-motion-${videoW}x${videoH}-${stamp}.${result.extension}`
      );
      onClose();
    } catch (err) {
      if (!(err instanceof Error && err.message.includes('cancelada'))) {
        setErrorMsg(err instanceof Error ? err.message : 'Erro ao gravar vídeo.');
      }
    } finally {
      setIsExporting(false);
      setProgress(0);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={!isExporting ? onClose : undefined}
    >
      <div
        className="w-full max-w-md bg-[#121216] border border-[#2A2A33] rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#242429] flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#F4F4F0]">
            Exportar em Alta Resolução
          </h2>
          {!isExporting && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#8E8E99] hover:text-white rounded cursor-pointer"
              aria-label="Fechar exportação"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#18181E] border border-[#26262F] rounded-md">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setExportKind('image')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded transition-colors cursor-pointer ${
                exportKind === 'image'
                  ? 'bg-[#FF4D2E] text-white'
                  : 'text-[#9898A4] hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Imagem Estática</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setExportKind('video')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded transition-colors cursor-pointer ${
                exportKind === 'video'
                  ? 'bg-[#FF4D2E] text-white'
                  : 'text-[#9898A4] hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Vídeo Animado</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#B8B8C2] block">Qualidade de Saída</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setResolutionTier('standard')}
                className={`p-3 text-left rounded-md border transition-colors cursor-pointer ${
                  resolutionTier === 'standard'
                    ? 'border-[#FF4D2E] bg-[#1E1A1A]'
                    : 'border-[#272730] bg-[#16161B] hover:border-[#3A3A46]'
                }`}
              >
                <div className="text-xs font-semibold text-[#F4F4F0]">HD / Web</div>
                <div className="text-[11px] font-mono-tabular text-[#8E8E99] mt-0.5">
                  {spec.width} × {spec.height} px
                </div>
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setResolutionTier('4k')}
                className={`p-3 text-left rounded-md border transition-colors cursor-pointer ${
                  resolutionTier === '4k'
                    ? 'border-[#FF4D2E] bg-[#1E1A1A]'
                    : 'border-[#272730] bg-[#16161B] hover:border-[#3A3A46]'
                }`}
              >
                <div className="text-xs font-semibold text-[#F4F4F0]">
                  {exportKind === 'image' ? 'Ultra 4K / Print' : 'Master 1440p+'}
                </div>
                <div className="text-[11px] font-mono-tabular text-[#8E8E99] mt-0.5">
                  {exportKind === 'image'
                    ? `${spec.export4KWidth} × ${spec.export4KHeight} px`
                    : `${videoW} × ${videoH} px`}
                </div>
              </button>
            </div>
          </div>

          {exportKind === 'image' ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#B8B8C2] block">Formato do Arquivo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImageFormat('png')}
                  className={`py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    imageFormat === 'png'
                      ? 'border-[#FF4D2E] bg-[#1E1A1A] text-white'
                      : 'border-[#272730] bg-[#16161B] text-[#9898A4]'
                  }`}
                >
                  PNG (Sem Perdas)
                </button>
                <button
                  type="button"
                  onClick={() => setImageFormat('jpeg')}
                  className={`py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    imageFormat === 'jpeg'
                      ? 'border-[#FF4D2E] bg-[#1E1A1A] text-white'
                      : 'border-[#272730] bg-[#16161B] text-[#9898A4]'
                  }`}
                >
                  JPEG (96% Qualidade)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#9898A4] block">Duração</label>
                  <select
                    disabled={isExporting}
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(Number(e.target.value))}
                    className="w-full h-8 px-2 text-xs font-mono-tabular bg-[#17171C] border border-[#2B2B33] rounded text-[#F4F4F0]"
                  >
                    <option value={3}>3 seg</option>
                    <option value={5}>5 seg</option>
                    <option value={10}>10 seg</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#9898A4] block">Taxa</label>
                  <select
                    disabled={isExporting}
                    value={videoFps}
                    onChange={(e) => setVideoFps(Number(e.target.value))}
                    className="w-full h-8 px-2 text-xs font-mono-tabular bg-[#17171C] border border-[#2B2B33] rounded text-[#F4F4F0]"
                  >
                    <option value={30}>30 fps</option>
                    <option value={60}>60 fps</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#9898A4] block">Bitrate</label>
                  <select
                    disabled={isExporting}
                    value={videoBitrate}
                    onChange={(e) => setVideoBitrate(Number(e.target.value))}
                    className="w-full h-8 px-2 text-xs font-mono-tabular bg-[#17171C] border border-[#2B2B33] rounded text-[#F4F4F0]"
                  >
                    <option value={12}>12 Mbps</option>
                    <option value={16}>16 Mbps</option>
                    <option value={24}>24 Mbps</option>
                  </select>
                </div>
              </div>

              {isExporting && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#C4C4CE]">Gravando quadro a quadro...</span>
                    <span className="font-mono-tabular text-[#FF4D2E]">
                      {Math.round(progress * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#24242C] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF4D2E] transition-all duration-100"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-[#FF6B52] bg-[#291412] border border-[#52231E] rounded p-2.5">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            {isExporting && exportKind === 'video' ? (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-medium text-[#E4E4EA] bg-[#23232B] hover:bg-[#2F2F3A] rounded-md cursor-pointer"
              >
                Cancelar Gravação
              </button>
            ) : (
              <button
                type="button"
                disabled={isExporting}
                onClick={exportKind === 'image' ? handleExportImage : handleExportVideo}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#FF4D2E] hover:bg-[#E84326] disabled:opacity-60 rounded-md transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting
                    ? 'Processando...'
                    : exportKind === 'image'
                    ? `Baixar ${imageFormat.toUpperCase()} (${staticW}×${staticH})`
                    : `Gravar Vídeo (${videoDuration}s · ${videoW}×${videoH})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
