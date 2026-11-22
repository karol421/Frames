export type AspectRatioKey = '4:5' | '1:1' | '9:16' | '16:9' | 'a4';

export type BlendModeOption =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'difference'
  | 'exclusion'
  | 'hard-light';

export type EchoMode = 'single' | 'stack' | 'cascade' | 'scatter' | 'wave';

export type PaperStock = 'algodao' | 'pergaminho' | 'jornal' | 'kraft' | 'linho';

export type BlurMode = 'directional' | 'radial' | 'spin' | 'shutter';

export type InspectorTab = 'media' | 'typography' | 'paper' | 'motion';

export type DragTarget = 'text' | 'media';

export interface LocalFontEntry {
  family: string;
  fileName: string;
}

export interface StudioParams {
  // Canvas & Base Paper
  aspectRatio: AspectRatioKey;
  backgroundColor: string;
  paperBorder: boolean;

  // Media Layer
  mediaType: 'none' | 'image' | 'video';
  mediaUrl: string;
  mediaName: string;
  mediaScale: number; // 0.2 - 3.0
  mediaX: number; // -0.5 - 1.5
  mediaY: number; // -0.5 - 1.5
  mediaRotation: number; // -180 - 180
  mediaOpacity: number; // 0 - 1
  mediaBlendMode: BlendModeOption;
  mediaContrast: number; // 0.4 - 2.4
  mediaInvert: boolean;

  // Typography Layer
  textEnabled: boolean;
  text: string;
  fontFamily: string;
  fontWeight: number; // 300 - 900
  fontSize: number; // 18 - 280
  lineHeight: number; // 0.68 - 2.2
  letterSpacing: number; // -0.15 - 0.5 em
  textRotation: number; // -45 - 45 deg
  textColor: string;
  textBlendMode: BlendModeOption;
  textAlign: 'left' | 'center' | 'right';
  textX: number; // 0 - 1
  textY: number; // 0 - 1
  textBlur: number; // 0 - 24 px ink bleed / optical softness

  // Concrete Echoes
  echoCount: number; // 1 - 36
  echoMode: EchoMode;
  echoOffsetX: number; // -120 - 120
  echoOffsetY: number; // -120 - 120
  echoJitter: number; // 0 - 1
  echoDecay: number; // 0 - 1

  // Archival Colophon Subtext
  subtextEnabled: boolean;
  subtext: string;

  // Paper & Print Texture Shader
  paperEnabled: boolean;
  paperStock: PaperStock;
  paperFiber: number; // 0 - 1 (surface fiber weave & bump relief)
  paperGrain: number; // 0 - 1 (mineral pulp grain)
  paperInkDistress: number; // 0 - 1 (letterpress / stamp ink erosion & bleed)
  paperAging: number; // 0 - 1 (warm patina, foxing & ink specks)
  paperFold: number; // 0 - 1 (paper crease / fold line)
  paperHalftone: number; // 0 - 1 (printmaker halftone stipple)
  paperContrast: number; // 0.5 - 2.2 (xerox / litho print bite)
  paperVignette: number; // 0 - 1 (edge darkening)

  // Motion Blur & Kinetic Shader
  blurMode: BlurMode;
  blurAmount: number; // 0 - 1
  blurAngle: number; // 0 - 360 deg
  blurSamples: number; // 8 - 48
  blurCenterX: number; // 0 - 1
  blurCenterY: number; // 0 - 1
  shutterTrail: number; // 0 - 0.94
  chromaticSplit: number; // 0 - 1

  // Live Kinetic Loop
  motionPlaying: boolean;
  motionSpeed: number; // 0.1 - 3.0
  motionDrift: number; // 0 - 1
  paperShimmer: number; // 0 - 1 (subtle organic paper/ink breathing in video)
}

export interface AspectRatioSpec {
  key: AspectRatioKey;
  label: string;
  width: number;
  height: number;
  export4KWidth: number;
  export4KHeight: number;
}

export interface StudioPreset {
  id: string;
  name: string;
  subtitle: string;
  params: Partial<StudioParams>;
}
