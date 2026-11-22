import { TermofluxEngine } from '../engine/webglRenderer';
import { StudioParams } from '../types/studio';

export interface VideoExportOptions {
  width: number;
  height: number;
  durationSec: number;
  fps: number;
  bitrateMbps: number;
  params: StudioParams;
  mediaElement: HTMLImageElement | HTMLVideoElement | null;
  onProgress: (progress: number) => void;
  signal?: AbortSignal;
}

export interface VideoExportResult {
  blob: Blob;
  mimeType: string;
  extension: 'mp4' | 'webm';
}

function getSupportedVideoMime(): { mimeType: string; extension: 'mp4' | 'webm' } {
  const candidates: { mimeType: string; extension: 'mp4' | 'webm' }[] = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ];

  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: 'video/webm', extension: 'webm' };
}

export async function exportStudioVideo(options: VideoExportOptions): Promise<VideoExportResult> {
  const { width, height, durationSec, fps, bitrateMbps, params, mediaElement, onProgress, signal } =
    options;

  const { mimeType, extension } = getSupportedVideoMime();

  const recCanvas = document.createElement('canvas');
  const engine = new TermofluxEngine(recCanvas);
  engine.resize(width, height);

  // Warm up shutter trails on frame 0
  for (let i = 0; i < 3; i++) {
    engine.renderFrame(params, mediaElement, i * 0.016);
  }

  const stream = recCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitrateMbps * 1_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise<VideoExportResult>((resolve, reject) => {
    let rafId = 0;
    let finished = false;
    const startPerf = performance.now();
    const totalMs = durationSec * 1000;

    const cleanup = () => {
      cancelAnimationFrame(rafId);
      stream.getTracks().forEach((t) => t.stop());
      engine.dispose();
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        if (!finished) {
          finished = true;
          try {
            recorder.stop();
          } catch {
            // ignore
          }
          cleanup();
          reject(new Error('Exportação de vídeo cancelada.'));
        }
      });
    }

    recorder.onerror = () => {
      if (!finished) {
        finished = true;
        cleanup();
        reject(new Error('Erro durante a gravação do vídeo.'));
      }
    };

    recorder.onstop = () => {
      if (finished) return;
      finished = true;
      cleanup();
      const blob = new Blob(chunks, { type: mimeType });
      onProgress(1);
      resolve({ blob, mimeType, extension });
    };

    recorder.start(100);

    const step = (now: number) => {
      if (finished) return;
      const elapsed = now - startPerf;
      const progress = Math.min(1, elapsed / totalMs);
      const animTime = (elapsed / 1000) * params.motionSpeed;

      engine.renderFrame(params, mediaElement, animTime);
      onProgress(progress);

      if (elapsed >= totalMs) {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        return;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
  });
}
