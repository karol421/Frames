import { useCallback, useEffect, useRef, useState } from 'react';
import { ExportModal } from './components/ExportModal';
import { Header } from './components/Header';
import { InspectorPanel } from './components/InspectorPanel';
import { PresetsModal } from './components/PresetsModal';
import { ViewportCanvas } from './components/ViewportCanvas';
import { loadGoogleFont } from './constants/fonts';
import { ASPECT_RATIOS, DEFAULT_PARAMS } from './constants/presets';
import { TermofluxEngine } from './engine/webglRenderer';
import {
  DragTarget,
  InspectorTab,
  LocalFontEntry,
  PaperStock,
  StudioParams,
  StudioPreset,
} from './types/studio';
import { randomizeAggressive, randomizeMild } from './utils/randomize';

export default function App() {
  const [params, setParams] = useState<StudioParams>(DEFAULT_PARAMS);
  const [localFonts, setLocalFonts] = useState<LocalFontEntry[]>([]);
  const [activeTab, setActiveTab] = useState<InspectorTab>('paper');
  const [dragTarget, setDragTarget] = useState<DragTarget>('text');

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryView, setLibraryView] = useState<'presets' | 'references'>('presets');
  const [exportOpen, setExportOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TermofluxEngine | null>(null);
  const mediaElRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const paramsRef = useRef<StudioParams>(params);
  paramsRef.current = params;

  const animTimeRef = useRef<number>(0);
  const lastRafRef = useRef<number>(performance.now());
  const dirtyRef = useRef<boolean>(true);

  const updateParams = useCallback((patch: Partial<StudioParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
    dirtyRef.current = true;
  }, []);

  const handleAddLocalFont = useCallback((entry: LocalFontEntry) => {
    setLocalFonts((prev) => {
      const exists = prev.some((f) => f.family === entry.family);
      return exists ? prev : [entry, ...prev];
    });
    dirtyRef.current = true;
  }, []);

  // Ensure active Google Font is loaded on mount & font changes
  useEffect(() => {
    loadGoogleFont(params.fontFamily, params.fontWeight).then(() => {
      dirtyRef.current = true;
    });
  }, [params.fontFamily, params.fontWeight]);

  // Initialize WebGL2 Engine & continuous render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new TermofluxEngine(canvas);
    engineRef.current = engine;

    const spec = ASPECT_RATIOS[paramsRef.current.aspectRatio];
    engine.resize(spec.width, spec.height);

    let rafId = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastRafRef.current) / 1000);
      lastRafRef.current = now;

      const cur = paramsRef.current;
      const curSpec = ASPECT_RATIOS[cur.aspectRatio];
      engine.resize(curSpec.width, curSpec.height);

      const isVideoPlaying =
        cur.mediaType === 'video' &&
        mediaElRef.current instanceof HTMLVideoElement &&
        !mediaElRef.current.paused;

      if (cur.motionPlaying) {
        animTimeRef.current += dt * cur.motionSpeed;
        engine.renderFrame(cur, mediaElRef.current, animTimeRef.current);
        dirtyRef.current = false;
      } else if (dirtyRef.current || isVideoPlaying) {
        engine.renderFrame(cur, mediaElRef.current, animTimeRef.current);
        dirtyRef.current = false;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLibraryOpen(false);
        setExportOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const cleanupMediaElement = useCallback(() => {
    if (mediaElRef.current instanceof HTMLVideoElement) {
      mediaElRef.current.pause();
      mediaElRef.current.src = '';
    }
    mediaElRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const loadImageUrl = useCallback(
    (url: string, name: string, isBlobUrl: boolean, extraPatch?: Partial<StudioParams>) => {
      cleanupMediaElement();
      if (isBlobUrl) {
        objectUrlRef.current = url;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        mediaElRef.current = img;
        engineRef.current?.resetTrails();
        updateParams({
          mediaType: 'image',
          mediaUrl: url,
          mediaName: name,
          mediaScale: 1.0,
          mediaX: 0.5,
          mediaY: 0.5,
          mediaRotation: 0,
          ...extraPatch,
        });
      };
      img.src = url;
    },
    [cleanupMediaElement, updateParams]
  );

  const handleUploadFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        cleanupMediaElement();
        objectUrlRef.current = url;
        const video = document.createElement('video');
        video.src = url;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.onloadeddata = () => {
          video.play().catch(() => {});
          mediaElRef.current = video;
          engineRef.current?.resetTrails();
          updateParams({
            mediaType: 'video',
            mediaUrl: url,
            mediaName: file.name,
            mediaScale: 1.0,
            mediaX: 0.5,
            mediaY: 0.5,
            mediaRotation: 0,
            mediaBlendMode: 'multiply',
            mediaOpacity: 0.94,
          });
        };
      } else if (file.type.startsWith('image/')) {
        loadImageUrl(url, file.name, true, {
          mediaBlendMode: 'multiply',
          mediaOpacity: 0.94,
        });
      }
    },
    [cleanupMediaElement, loadImageUrl, updateParams]
  );

  const handleClearMedia = useCallback(() => {
    cleanupMediaElement();
    engineRef.current?.resetTrails();
    updateParams({
      mediaType: 'none',
      mediaUrl: '',
      mediaName: '',
    });
    setDragTarget('text');
  }, [cleanupMediaElement, updateParams]);

  const handleSelectPreset = useCallback(async (preset: StudioPreset) => {
    const merged: StudioParams = {
      ...paramsRef.current,
      ...preset.params,
    };
    await loadGoogleFont(merged.fontFamily, merged.fontWeight);
    engineRef.current?.resetTrails();
    setParams(merged);
    dirtyRef.current = true;
  }, []);

  const handleLoadReferenceImage = useCallback(
    (url: string, title: string, stock: PaperStock) => {
      loadImageUrl(url, title, false, {
        mediaBlendMode: 'multiply',
        mediaOpacity: 0.92,
        paperEnabled: true,
        paperStock: stock,
      });
      setActiveTab('paper');
    },
    [loadImageUrl]
  );

  const handleRandomizeMild = useCallback(async () => {
    const next = await randomizeMild(paramsRef.current);
    engineRef.current?.resetTrails();
    setParams(next);
    dirtyRef.current = true;
  }, []);

  const handleRandomizeAggressive = useCallback(async () => {
    const next = await randomizeAggressive(paramsRef.current);
    engineRef.current?.resetTrails();
    setParams(next);
    dirtyRef.current = true;
  }, []);

  const handleReset = useCallback(async () => {
    cleanupMediaElement();
    await loadGoogleFont(DEFAULT_PARAMS.fontFamily, DEFAULT_PARAMS.fontWeight);
    engineRef.current?.resetTrails();
    setParams(DEFAULT_PARAMS);
    setDragTarget('text');
    dirtyRef.current = true;
  }, [cleanupMediaElement]);

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#0B0B0C] text-[#F4F4F0] lg:overflow-hidden">
      <Header
        onOpenPresets={() => {
          setLibraryView('presets');
          setLibraryOpen(true);
        }}
        onOpenReferences={() => {
          setLibraryView('references');
          setLibraryOpen(true);
        }}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenExport={() => setExportOpen(true)}
      />

      <main className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <ViewportCanvas
          canvasRef={canvasRef}
          params={params}
          dragTarget={dragTarget}
          onChangeDragTarget={setDragTarget}
          onChange={updateParams}
          onRandomizeMild={handleRandomizeMild}
          onRandomizeAggressive={handleRandomizeAggressive}
          onReset={handleReset}
          onDropFile={handleUploadFile}
        />

        <InspectorPanel
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          params={params}
          localFonts={localFonts}
          onAddLocalFont={handleAddLocalFont}
          onChange={updateParams}
          onUploadFile={handleUploadFile}
          onClearMedia={handleClearMedia}
          onOpenReferences={() => {
            setLibraryView('references');
            setLibraryOpen(true);
          }}
        />
      </main>

      <PresetsModal
        isOpen={libraryOpen}
        initialView={libraryView}
        onChangeView={setLibraryView}
        onClose={() => setLibraryOpen(false)}
        onSelectPreset={handleSelectPreset}
        onLoadReferenceImage={handleLoadReferenceImage}
      />

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        params={params}
        mediaElement={mediaElRef.current}
        currentTimeSec={animTimeRef.current}
      />
    </div>
  );
}
