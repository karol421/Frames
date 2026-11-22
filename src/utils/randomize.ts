import { GOOGLE_FONTS_CATALOG, loadGoogleFont } from '../constants/fonts';
import { BlurMode, EchoMode, PaperStock, StudioParams } from '../types/studio';

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const PAPER_STOCKS: PaperStock[] = ['algodao', 'pergaminho', 'jornal', 'kraft', 'linho'];
const BLUR_MODES: BlurMode[] = ['directional', 'radial', 'spin', 'shutter'];
const ECHO_MODES: EchoMode[] = ['single', 'stack', 'cascade', 'scatter', 'wave'];

const MILD_BACKGROUNDS = ['#F3F1EA', '#EFECE0', '#E8E4D8', '#FFFFFF', '#E3E1DA'];
const AGGRESSIVE_BACKGROUNDS = ['#EFECE0', '#DFDDD6', '#FFFFFF', '#D6C4A8', '#141418'];

export async function randomizeMild(current: StudioParams): Promise<StudioParams> {
  const fontChoice = pick(GOOGLE_FONTS_CATALOG);
  const weight = pick(fontChoice.weights);
  await loadGoogleFont(fontChoice.family, weight);

  const nextBg = Math.random() > 0.45 ? current.backgroundColor : pick(MILD_BACKGROUNDS);
  const nextDark = nextBg.startsWith('#0') || nextBg.startsWith('#1');

  return {
    ...current,
    backgroundColor: nextBg,
    paperBorder: Math.random() > 0.55,
    fontFamily: fontChoice.family,
    fontWeight: weight,
    fontSize: Math.round(
      rand(Math.max(48, current.fontSize * 0.78), Math.min(200, current.fontSize * 1.22))
    ),
    letterSpacing: Number(rand(-0.06, 0.08).toFixed(3)),
    textRotation: Number(rand(-8, 8).toFixed(1)),
    textColor: nextDark ? '#F5F4EE' : pick(['#141416', '#1F36F2', '#6E1111']),
    textBlur: Number(rand(0.5, 4.0).toFixed(1)),

    echoCount: randInt(3, 14),
    echoMode: pick(['stack', 'cascade', 'wave']),
    echoOffsetX: Math.round(rand(-28, 28)),
    echoOffsetY: Math.round(rand(-24, 28)),
    echoJitter: Number(rand(0.12, 0.48).toFixed(2)),
    echoDecay: Number(rand(0.45, 0.78).toFixed(2)),

    paperEnabled: true,
    paperStock: pick(PAPER_STOCKS),
    paperFiber: Number(rand(0.25, 0.68).toFixed(2)),
    paperGrain: Number(rand(0.18, 0.52).toFixed(2)),
    paperInkDistress: Number(rand(0.15, 0.52).toFixed(2)),
    paperAging: Number(rand(0.08, 0.48).toFixed(2)),
    paperFold: Math.random() > 0.55 ? Number(rand(0.1, 0.42).toFixed(2)) : 0,
    paperHalftone: Math.random() > 0.7 ? Number(rand(0.1, 0.35).toFixed(2)) : 0,
    paperContrast: Number(rand(0.98, 1.28).toFixed(2)),
    paperVignette: Number(rand(0.1, 0.34).toFixed(2)),

    blurMode: pick(['directional', 'radial', 'shutter']),
    blurAmount: Number(rand(0.1, 0.34).toFixed(2)),
    blurAngle: randInt(0, 360),
    shutterTrail: Number(rand(0.15, 0.52).toFixed(2)),
    chromaticSplit: Number(rand(0.02, 0.2).toFixed(2)),
    motionDrift: Number(rand(0.1, 0.34).toFixed(2)),
    paperShimmer: Number(rand(0.05, 0.25).toFixed(2)),
  };
}

export async function randomizeAggressive(current: StudioParams): Promise<StudioParams> {
  const fontChoice = pick(GOOGLE_FONTS_CATALOG);
  const weight = pick(fontChoice.weights);
  await loadGoogleFont(fontChoice.family, weight);

  const nextBg = pick(AGGRESSIVE_BACKGROUNDS);
  const nextDark = nextBg.startsWith('#0') || nextBg.startsWith('#1');

  return {
    ...current,
    backgroundColor: nextBg,
    paperBorder: Math.random() > 0.45,
    mediaScale: Number(rand(0.65, 1.9).toFixed(2)),
    mediaRotation: randInt(-35, 35),
    mediaContrast: Number(rand(0.95, 2.2).toFixed(2)),
    mediaInvert: Math.random() > 0.72,

    fontFamily: fontChoice.family,
    fontWeight: weight,
    fontSize: randInt(68, 240),
    lineHeight: Number(rand(0.72, 1.32).toFixed(2)),
    letterSpacing: Number(rand(-0.1, 0.2).toFixed(3)),
    textRotation: randInt(-30, 30),
    textColor: nextDark ? pick(['#F4F2EA', '#FF4D2E', '#D8E8FF']) : pick(['#0A0A0C', '#1E3EEB', '#6E1111']),
    textBlendMode: pick(['source-over', 'multiply', 'difference', 'exclusion', 'hard-light']),
    textBlur: Number(rand(0, 12).toFixed(1)),

    echoCount: randInt(12, 34),
    echoMode: pick(ECHO_MODES.slice(1)),
    echoOffsetX: Math.round(rand(-75, 75)),
    echoOffsetY: Math.round(rand(-75, 75)),
    echoJitter: Number(rand(0.45, 1.0).toFixed(2)),
    echoDecay: Number(rand(0.25, 0.72).toFixed(2)),

    paperEnabled: true,
    paperStock: pick(PAPER_STOCKS),
    paperFiber: Number(rand(0.52, 1.0).toFixed(2)),
    paperGrain: Number(rand(0.38, 0.92).toFixed(2)),
    paperInkDistress: Number(rand(0.45, 0.95).toFixed(2)),
    paperAging: Number(rand(0.25, 0.95).toFixed(2)),
    paperFold: Number(rand(0.15, 0.85).toFixed(2)),
    paperHalftone: Math.random() > 0.35 ? Number(rand(0.25, 0.85).toFixed(2)) : 0,
    paperContrast: Number(rand(1.1, 1.95).toFixed(2)),
    paperVignette: Number(rand(0.22, 0.75).toFixed(2)),

    blurMode: pick(BLUR_MODES),
    blurAmount: Number(rand(0.32, 0.88).toFixed(2)),
    blurAngle: randInt(0, 360),
    blurSamples: randInt(24, 42),
    blurCenterX: Number(rand(0.25, 0.75).toFixed(2)),
    blurCenterY: Number(rand(0.25, 0.75).toFixed(2)),
    shutterTrail: Number(rand(0.42, 0.86).toFixed(2)),
    chromaticSplit: Number(rand(0.2, 0.85).toFixed(2)),
    motionSpeed: Number(rand(0.7, 2.1).toFixed(2)),
    motionDrift: Number(rand(0.38, 0.92).toFixed(2)),
    paperShimmer: Number(rand(0.2, 0.75).toFixed(2)),
  };
}
