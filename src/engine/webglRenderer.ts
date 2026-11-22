import { BlurMode, PaperStock, StudioParams } from '../types/studio';

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Pass 1: Motion Blur + Chromatic Dispersion + Temporal Ping-Pong Shutter Trail
const MOTION_PASS_FRAG_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_sourceTex;
uniform sampler2D u_prevTex;
uniform vec2 u_resolution;
uniform float u_time;

uniform int u_blurMode; // 0=directional, 1=radial, 2=spin, 3=shutter
uniform float u_blurAmount;
uniform float u_blurAngle;
uniform int u_blurSamples;
uniform vec2 u_blurCenter;
uniform float u_chromaticSplit;
uniform float u_shutterTrail;
uniform int u_hasPrev;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 rotate2d(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

vec3 sampleChromatic(vec2 uv, vec2 dir, float split) {
  if (split <= 0.001) {
    return texture(u_sourceTex, clamp(uv, 0.001, 0.999)).rgb;
  }
  vec2 offset = dir * split * 0.025;
  float r = texture(u_sourceTex, clamp(uv + offset, 0.001, 0.999)).r;
  float g = texture(u_sourceTex, clamp(uv, 0.001, 0.999)).g;
  float b = texture(u_sourceTex, clamp(uv - offset, 0.001, 0.999)).b;
  return vec3(r, g, b);
}

void main() {
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);

  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float jitter = hash12(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5;

  vec2 blurDir = vec2(cos(u_blurAngle), sin(u_blurAngle));
  blurDir.x /= aspect;

  vec3 accum = vec3(0.0);
  int samples = clamp(u_blurSamples, 4, 48);
  float amount = u_blurAmount;

  if (amount <= 0.002) {
    accum = sampleChromatic(uv, blurDir, u_chromaticSplit);
  } else {
    float totalWeight = 0.0;
    for (int i = 0; i < 48; i++) {
      if (i >= samples) break;
      float t = (float(i) + 0.5 + jitter * 0.85) / float(samples) - 0.5;
      vec2 sampleUv = uv;
      vec2 localDir = blurDir;

      if (u_blurMode == 0) {
        sampleUv = uv + blurDir * t * amount * 0.24;
      } else if (u_blurMode == 1) {
        vec2 center = vec2(u_blurCenter.x, u_blurCenter.y);
        vec2 delta = uv - center;
        localDir = normalize(delta + vec2(1e-5));
        float scale = 1.0 + t * amount * 0.42;
        sampleUv = center + delta * scale;
      } else if (u_blurMode == 2) {
        vec2 center = vec2(u_blurCenter.x, u_blurCenter.y);
        vec2 delta = uv - center;
        delta.x *= aspect;
        float angle = t * amount * 0.65;
        vec2 rotated = rotate2d(delta, angle);
        rotated.x /= aspect;
        localDir = normalize(vec2(-delta.y, delta.x) + vec2(1e-5));
        sampleUv = center + rotated;
      } else {
        float microAngle = u_blurAngle + sin(float(i) * 1.7 + u_time * 3.0) * 0.35;
        vec2 sDir = vec2(cos(microAngle), sin(microAngle));
        sDir.x /= aspect;
        localDir = sDir;
        sampleUv = uv + sDir * (t + 0.25) * amount * 0.2;
      }

      float w = 1.0 - abs(t) * 1.1;
      w = max(w, 0.15);
      accum += sampleChromatic(sampleUv, localDir, u_chromaticSplit) * w;
      totalWeight += w;
    }
    accum /= max(totalWeight, 0.0001);
  }

  if (u_hasPrev == 1 && u_shutterTrail > 0.01) {
    vec3 prev = texture(u_prevTex, v_uv).rgb;
    float trail = clamp(u_shutterTrail, 0.0, 0.94);
    accum = mix(accum, prev, trail * 0.88);
  }

  outColor = vec4(accum, 1.0);
}
`;

// Pass 2: Physical Paper Substrate, Fiber Relief, Ink Distress/Bleed, Aging/Foxing, Crease & Halftone
const PAPER_PASS_FRAG_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_motionTex;
uniform vec2 u_resolution;
uniform float u_time;

uniform int u_paperEnabled;
uniform int u_paperStock; // 0=algodao, 1=pergaminho, 2=jornal, 3=kraft, 4=linho
uniform float u_paperFiber;
uniform float u_paperGrain;
uniform float u_inkDistress;
uniform float u_paperAging;
uniform float u_paperFold;
uniform float u_paperHalftone;
uniform float u_paperContrast;
uniform float u_paperVignette;
uniform float u_paperShimmer;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += amp * valueNoise(p);
    p = rot * p * 2.04;
    amp *= 0.5;
  }
  return v;
}

float paperHeight(vec2 p, int stock) {
  if (stock == 0) {
    // Algodão fosco: organic smooth cotton pulp
    float macro = fbm(p * 6.0);
    float micro = fbm(p * 42.0);
    return mix(macro, micro, 0.6);
  } else if (stock == 1) {
    // Pergaminho / Arquivo: mottled clouding + gentle pulp
    float cloud = fbm(p * 3.8);
    float fine = valueNoise(p * 56.0);
    return mix(cloud, fine, 0.42);
  } else if (stock == 2) {
    // Jornal / Xerox: coarse gritty pulp flecks
    float coarse = valueNoise(p * 78.0);
    float fibers = valueNoise(p * vec2(18.0, 120.0));
    return mix(coarse, fibers, 0.45);
  } else if (stock == 3) {
    // Kraft: strong directional cellulose fibers
    float hFibers = fbm(p * vec2(12.0, 95.0));
    float dFibers = fbm(p * vec2(85.0, 16.0));
    return mix(hFibers, dFibers, 0.35);
  } else {
    // Linho / Telado: woven crosshatch + cotton base
    float weaveX = 0.5 + 0.5 * sin(p.x * 260.0 + fbm(p * 10.0) * 1.8);
    float weaveY = 0.5 + 0.5 * sin(p.y * 260.0 + fbm(p * 10.0 + 4.2) * 1.8);
    float linen = weaveX * 0.5 + weaveY * 0.5;
    float cotton = fbm(p * 24.0);
    return mix(cotton, linen, 0.65);
  }
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec3 color = texture(u_motionTex, v_uv).rgb;

  if (u_paperEnabled == 0) {
    outColor = vec4(color, 1.0);
    return;
  }

  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = v_uv * vec2(aspect, 1.0);

  // Subtle organic breathing for kinetic video loops
  float shimmerPhase = u_time * 0.85 * u_paperShimmer;
  vec2 texCoord = p + vec2(sin(shimmerPhase) * 0.002, cos(shimmerPhase * 0.7) * 0.002);

  // 1. Print Contrast / Xerox bite
  if (abs(u_paperContrast - 1.0) > 0.01) {
    color = clamp((color - 0.5) * u_paperContrast + 0.5, 0.0, 1.0);
  }

  // 2. Paper substrate heightfield & embossed fiber relief
  float h = paperHeight(texCoord, u_paperStock);
  float hDx = paperHeight(texCoord + vec2(0.0025, 0.0), u_paperStock);
  float hDy = paperHeight(texCoord + vec2(0.0, 0.0025), u_paperStock);
  float relief = ((h - hDx) + (h - hDy)) * 4.5;

  // Apply physical tooth/relief to paper lighting
  if (u_paperFiber > 0.005) {
    float tooth = (h - 0.5) * 0.16 + relief * 0.38;
    color += tooth * u_paperFiber;
  }

  // 3. Ink Distress & Stamp Erosion (paper fibers bite into dark ink areas)
  if (u_inkDistress > 0.005) {
    float lum = luma(color);
    float inkMask = 1.0 - smoothstep(0.15, 0.78, lum);
    float fiberPores = smoothstep(0.42, 0.82, paperHeight(texCoord * 2.1 + 3.7, u_paperStock));
    float microPores = smoothstep(0.55, 0.92, valueNoise(texCoord * 165.0));
    float bite = mix(fiberPores, microPores, 0.55) * u_inkDistress * inkMask;
    // Lift dark ink toward warm paper fiber tone
    vec3 paperLift = vec3(0.92, 0.90, 0.85);
    color = mix(color, paperLift, bite * 0.58);
  }

  // 4. Printmaker Halftone Screen (45-degree rotated stipple)
  if (u_paperHalftone > 0.005) {
    float lum = luma(color);
    float s = 0.7071;
    vec2 rotP = vec2(p.x * s - p.y * s, p.x * s + p.y * s) * 140.0;
    float dotPattern = 0.5 + 0.25 * (sin(rotP.x) + sin(rotP.y));
    float halftoneVal = smoothstep(dotPattern - 0.14, dotPattern + 0.14, lum);
    vec3 halftoneCol = mix(vec3(0.06, 0.06, 0.07), color + 0.12, halftoneVal);
    color = mix(color, halftoneCol, u_paperHalftone * 0.72);
  }

  // 5. Archival Aging, Warm Patina & Foxing Specks (inspired by ref 3 & 4)
  if (u_paperAging > 0.005) {
    float patinaNoise = fbm(p * 3.2 + 9.4);
    vec3 warmTint = mix(vec3(1.0, 0.985, 0.945), vec3(0.89, 0.83, 0.69), patinaNoise);
    color *= mix(vec3(1.0), warmTint, u_paperAging * 0.68);

    // Subtle organic foxing spots & dust specks
    float speckCell = valueNoise(p * 110.0);
    float speckMask = smoothstep(0.89, 0.96, speckCell) * smoothstep(0.45, 0.8, fbm(p * 5.5));
    color = mix(color, vec3(0.32, 0.24, 0.16), speckMask * u_paperAging * 0.55);
  }

  // 6. Paper Fold / Crease Line (inspired by ref 3 horizontal archival fold)
  if (u_paperFold > 0.005) {
    float foldY = 0.54 + (fbm(vec2(p.x * 4.0, 1.0)) - 0.5) * 0.014;
    float distFold = v_uv.y - foldY;
    float creaseShadow = exp(-abs(distFold) * 160.0) * sign(distFold) * 0.09;
    float creaseHighlight = exp(-pow((distFold - 0.003) * 240.0, 2.0)) * 0.08;
    color += (creaseHighlight - creaseShadow) * u_paperFold;
  }

  // 7. Mineral Grain
  if (u_paperGrain > 0.005) {
    float gSeed = fract(u_time * 3.1) * 97.0 * step(0.01, u_paperShimmer);
    float g = (hash12(gl_FragCoord.xy + gSeed) - 0.5) * u_paperGrain * 0.17;
    color += g;
  }

  // 8. Edge Burn / Vignette
  if (u_paperVignette > 0.005) {
    float d = distance(v_uv, vec2(0.5));
    float vig = smoothstep(0.36, 0.94, d);
    vec3 edgeBurn = mix(vec3(1.0), vec3(0.56, 0.50, 0.42), vig * u_paperVignette * 0.72);
    color *= edgeBurn;
  }

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Falha ao alocar shader WebGL2');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'Erro de compilação GLSL';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  if (!prog) throw new Error('Falha ao criar programa WebGL2');
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog) || 'Erro de link GLSL';
    gl.deleteProgram(prog);
    throw new Error(info);
  }
  return prog;
}

function createTexture(gl: WebGL2RenderingContext, w: number, h: number): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error('Falha ao criar textura WebGL2');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  return tex;
}

const STOCK_INDEX: Record<PaperStock, number> = {
  algodao: 0,
  pergaminho: 1,
  jornal: 2,
  kraft: 3,
  linho: 4,
};

const BLUR_INDEX: Record<BlurMode, number> = {
  directional: 0,
  radial: 1,
  spin: 2,
  shutter: 3,
};

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export class TermofluxEngine {
  private outputCanvas: HTMLCanvasElement;
  private compCanvas: HTMLCanvasElement;
  private compCtx: CanvasRenderingContext2D;
  private gl: WebGL2RenderingContext | null = null;

  private motionProgram: WebGLProgram | null = null;
  private paperProgram: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private sourceTex: WebGLTexture | null = null;
  private pingTex: [WebGLTexture | null, WebGLTexture | null] = [null, null];
  private pingFbo: [WebGLFramebuffer | null, WebGLFramebuffer | null] = [null, null];
  private pingIdx = 0;
  private hasPrevFrame = false;

  private currentW = 0;
  private currentH = 0;

  constructor(outputCanvas: HTMLCanvasElement) {
    this.outputCanvas = outputCanvas;
    this.compCanvas = document.createElement('canvas');
    const ctx = this.compCanvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('Canvas 2D não disponível');
    this.compCtx = ctx;
    this.initWebGL();
  }

  private initWebGL() {
    const gl = this.outputCanvas.getContext('webgl2', {
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    this.gl = gl;
    this.motionProgram = createProgram(gl, VERTEX_SHADER_SRC, MOTION_PASS_FRAG_SRC);
    this.paperProgram = createProgram(gl, VERTEX_SHADER_SRC, PAPER_PASS_FRAG_SRC);

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(this.motionProgram, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.sourceTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  public resetTrails() {
    this.hasPrevFrame = false;
  }

  public resize(width: number, height: number) {
    if (this.currentW === width && this.currentH === height) return;
    this.currentW = width;
    this.currentH = height;

    this.outputCanvas.width = width;
    this.outputCanvas.height = height;
    this.compCanvas.width = width;
    this.compCanvas.height = height;

    const gl = this.gl;
    if (!gl) return;

    for (let i = 0; i < 2; i++) {
      if (this.pingTex[i]) gl.deleteTexture(this.pingTex[i]);
      if (this.pingFbo[i]) gl.deleteFramebuffer(this.pingFbo[i]);

      const tex = createTexture(gl, width, height);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

      this.pingTex[i] = tex;
      this.pingFbo[i] = fbo;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.hasPrevFrame = false;
  }

  private renderComposition2D(
    params: StudioParams,
    mediaElement: HTMLImageElement | HTMLVideoElement | null,
    timeSec: number
  ) {
    const ctx = this.compCtx;
    const w = this.compCanvas.width;
    const h = this.compCanvas.height;
    const scaleFactor = w / 1080;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // 1. Base paper/canvas fill
    ctx.fillStyle = params.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    // 2. Archival paper border rule
    if (params.paperBorder) {
      const margin = 22 * scaleFactor;
      ctx.save();
      ctx.strokeStyle = 'rgba(25, 22, 18, 0.25)';
      ctx.lineWidth = Math.max(1.5, 2 * scaleFactor);
      ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
      ctx.restore();
    }

    // 3. Uploaded Image or Video Layer
    if (mediaElement && params.mediaType !== 'none') {
      const naturalW =
        mediaElement instanceof HTMLVideoElement
          ? mediaElement.videoWidth
          : mediaElement.naturalWidth;
      const naturalH =
        mediaElement instanceof HTMLVideoElement
          ? mediaElement.videoHeight
          : mediaElement.naturalHeight;

      if (naturalW > 0 && naturalH > 0) {
        ctx.save();
        ctx.globalAlpha = params.mediaOpacity;
        ctx.globalCompositeOperation = params.mediaBlendMode;

        const filters: string[] = [];
        if (Math.abs(params.mediaContrast - 1) > 0.02) {
          filters.push(`contrast(${Math.round(params.mediaContrast * 100)}%)`);
        }
        if (params.mediaInvert) {
          filters.push('invert(100%)');
        }
        if (filters.length > 0 && 'filter' in ctx) {
          ctx.filter = filters.join(' ');
        }

        const coverScale = Math.max(w / naturalW, h / naturalH);
        const drawW = naturalW * coverScale * params.mediaScale;
        const drawH = naturalH * coverScale * params.mediaScale;

        const driftX = Math.sin(timeSec * 0.9) * params.motionDrift * 14 * scaleFactor;
        const driftY = Math.cos(timeSec * 0.7) * params.motionDrift * 10 * scaleFactor;

        ctx.translate(params.mediaX * w + driftX, params.mediaY * h + driftY);
        ctx.rotate((params.mediaRotation * Math.PI) / 180);
        ctx.drawImage(mediaElement, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }
    }

    // 4. Generative Typography + Concrete Echoes Layer
    if (params.textEnabled && params.text.trim().length > 0) {
      const lines = params.text.split('\n');
      const scaledFontSize = params.fontSize * scaleFactor;
      const lineStep = scaledFontSize * params.lineHeight;
      const totalBlockH = (lines.length - 1) * lineStep;
      const echoCount = params.echoMode === 'single' ? 1 : Math.max(1, Math.round(params.echoCount));

      ctx.save();
      ctx.globalCompositeOperation = params.textBlendMode;

      if (params.textBlur > 0.1 && 'filter' in ctx) {
        ctx.filter = `blur(${(params.textBlur * scaleFactor).toFixed(2)}px)`;
      }

      if ('letterSpacing' in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${params.letterSpacing}em`;
      }

      ctx.font = `${params.fontWeight} ${scaledFontSize}px "${params.fontFamily}", sans-serif`;
      ctx.textAlign = params.textAlign;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = params.textColor;

      const baseX = params.textX * w;
      const baseY = params.textY * h;
      const baseRot = (params.textRotation * Math.PI) / 180;

      for (let i = echoCount - 1; i >= 0; i--) {
        const ratio = echoCount > 1 ? i / (echoCount - 1) : 0;
        const alpha = i === 0 ? 1 : Math.max(0.04, Math.pow(1 - ratio, 1.35) * (1 - params.echoDecay * 0.65));

        let dx = 0;
        let dy = 0;
        let dRot = 0;

        const r1 = seededRand(i * 3.1 + 1.0) - 0.5;
        const r2 = seededRand(i * 7.3 + 2.0) - 0.5;
        const r3 = seededRand(i * 11.9 + 5.0) - 0.5;

        const liveOscX = Math.sin(timeSec * 1.4 + i * 0.55) * params.motionDrift * 26 * scaleFactor;
        const liveOscY = Math.cos(timeSec * 1.15 + i * 0.45) * params.motionDrift * 22 * scaleFactor;

        if (i > 0) {
          const offX = params.echoOffsetX * scaleFactor;
          const offY = params.echoOffsetY * scaleFactor;

          if (params.echoMode === 'stack') {
            dx = offX * (i / echoCount) * 2.2 + r1 * params.echoJitter * 24 * scaleFactor;
            dy = offY * (i / echoCount) * 2.2 + r2 * params.echoJitter * 24 * scaleFactor;
            dRot = r3 * params.echoJitter * 0.12;
          } else if (params.echoMode === 'cascade') {
            dx = offX * i * 0.55 + r1 * params.echoJitter * 60 * scaleFactor;
            dy = offY * i * 0.55 + r2 * params.echoJitter * 45 * scaleFactor;
            dRot = r3 * params.echoJitter * 0.16;
          } else if (params.echoMode === 'scatter') {
            dx = r1 * Math.abs(offX + 35 * scaleFactor) * 4.2 * (0.4 + params.echoJitter);
            dy = r2 * Math.abs(offY + 35 * scaleFactor) * 4.5 * (0.4 + params.echoJitter);
            dRot = r3 * params.echoJitter * 0.34;
          } else if (params.echoMode === 'wave') {
            const phase = i * 0.52 + timeSec * params.motionDrift * 2.2;
            dx = Math.sin(phase) * (Math.abs(offX) * 2.2 + 30 * scaleFactor) + r1 * params.echoJitter * 20 * scaleFactor;
            dy = offY * i * 0.38 + Math.cos(phase * 0.8) * 18 * scaleFactor;
            dRot = Math.sin(phase * 0.5) * 0.14 * (0.3 + params.echoJitter);
          }

          dx += liveOscX * ratio;
          dy += liveOscY * ratio;
        } else {
          dx = liveOscX * 0.18;
          dy = liveOscY * 0.18;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(baseX + dx, baseY + dy);
        ctx.rotate(baseRot + dRot);

        for (let l = 0; l < lines.length; l++) {
          const lineY = l * lineStep - totalBlockH / 2;
          ctx.fillText(lines[l], 0, lineY);
        }
        ctx.restore();
      }
      ctx.restore();
    }

    // 5. Archival Colophon Subtext
    if (params.subtextEnabled && params.subtext.trim().length > 0) {
      ctx.save();
      const subSize = 18 * scaleFactor;
      ctx.font = `500 ${subSize}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = params.textColor;
      ctx.globalAlpha = 0.72;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(params.subtext, 44 * scaleFactor, h - 38 * scaleFactor);
      ctx.restore();
    }

    ctx.restore();
  }

  public renderFrame(
    params: StudioParams,
    mediaElement: HTMLImageElement | HTMLVideoElement | null,
    timeSec: number
  ) {
    this.renderComposition2D(params, mediaElement, timeSec);

    const gl = this.gl;
    if (!gl || !this.motionProgram || !this.paperProgram || !this.vao || !this.sourceTex) {
      const ctx2d = this.outputCanvas.getContext('2d');
      if (ctx2d) ctx2d.drawImage(this.compCanvas, 0, 0);
      return;
    }

    const w = this.currentW;
    const h = this.currentH;
    const nextIdx = 1 - this.pingIdx;

    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, w, h);

    // Upload 2D composition canvas to sourceTex
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.compCanvas);

    // PASS 1: Motion Blur + Chromatic Dispersion + Ping-Pong Shutter Trail -> pingFbo[nextIdx]
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingFbo[nextIdx]);
    gl.useProgram(this.motionProgram);

    gl.uniform1i(gl.getUniformLocation(this.motionProgram, 'u_sourceTex'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.pingTex[this.pingIdx]);
    gl.uniform1i(gl.getUniformLocation(this.motionProgram, 'u_prevTex'), 1);

    gl.uniform2f(gl.getUniformLocation(this.motionProgram, 'u_resolution'), w, h);
    gl.uniform1f(gl.getUniformLocation(this.motionProgram, 'u_time'), timeSec);
    gl.uniform1i(gl.getUniformLocation(this.motionProgram, 'u_blurMode'), BLUR_INDEX[params.blurMode]);
    gl.uniform1f(gl.getUniformLocation(this.motionProgram, 'u_blurAmount'), params.blurAmount);
    gl.uniform1f(
      gl.getUniformLocation(this.motionProgram, 'u_blurAngle'),
      (params.blurAngle * Math.PI) / 180
    );
    gl.uniform1i(gl.getUniformLocation(this.motionProgram, 'u_blurSamples'), params.blurSamples);
    gl.uniform2f(
      gl.getUniformLocation(this.motionProgram, 'u_blurCenter'),
      params.blurCenterX,
      params.blurCenterY
    );
    gl.uniform1f(gl.getUniformLocation(this.motionProgram, 'u_chromaticSplit'), params.chromaticSplit);
    gl.uniform1f(gl.getUniformLocation(this.motionProgram, 'u_shutterTrail'), params.shutterTrail);
    gl.uniform1i(gl.getUniformLocation(this.motionProgram, 'u_hasPrev'), this.hasPrevFrame ? 1 : 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PASS 2: Paper Substrate, Fibers, Ink Distress, Aging, Crease & Halftone -> Screen Canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this.paperProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pingTex[nextIdx]);
    gl.uniform1i(gl.getUniformLocation(this.paperProgram, 'u_motionTex'), 0);

    gl.uniform2f(gl.getUniformLocation(this.paperProgram, 'u_resolution'), w, h);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_time'), timeSec);
    gl.uniform1i(
      gl.getUniformLocation(this.paperProgram, 'u_paperEnabled'),
      params.paperEnabled ? 1 : 0
    );
    gl.uniform1i(
      gl.getUniformLocation(this.paperProgram, 'u_paperStock'),
      STOCK_INDEX[params.paperStock]
    );
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_paperFiber'), params.paperFiber);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_paperGrain'), params.paperGrain);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_inkDistress'), params.paperInkDistress);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_paperAging'), params.paperAging);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_paperFold'), params.paperFold);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_paperHalftone'), params.paperHalftone);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_paperContrast'), params.paperContrast);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_paperVignette'), params.paperVignette);
    gl.uniform1f(gl.getUniformLocation(this.paperProgram, 'u_paperShimmer'), params.paperShimmer);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    this.pingIdx = nextIdx;
    this.hasPrevFrame = true;
  }

  public dispose() {
    const gl = this.gl;
    if (!gl) return;
    if (this.sourceTex) gl.deleteTexture(this.sourceTex);
    for (let i = 0; i < 2; i++) {
      if (this.pingTex[i]) gl.deleteTexture(this.pingTex[i]);
      if (this.pingFbo[i]) gl.deleteFramebuffer(this.pingFbo[i]);
    }
    if (this.motionProgram) gl.deleteProgram(this.motionProgram);
    if (this.paperProgram) gl.deleteProgram(this.paperProgram);
    if (this.vao) gl.deleteVertexArray(this.vao);
  }
}

export function renderHighResStaticBlob(
  targetWidth: number,
  targetHeight: number,
  params: StudioParams,
  mediaElement: HTMLImageElement | HTMLVideoElement | null,
  timeSec: number,
  mimeType: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.96
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const offscreen = document.createElement('canvas');
    const engine = new TermofluxEngine(offscreen);
    engine.resize(targetWidth, targetHeight);

    const warmupSteps = params.shutterTrail > 0.05 ? 4 : 1;
    for (let i = 0; i < warmupSteps; i++) {
      const t = timeSec - (warmupSteps - 1 - i) * 0.035 * params.motionSpeed;
      engine.renderFrame(params, mediaElement, t);
    }

    offscreen.toBlob(
      (blob) => {
        engine.dispose();
        if (blob) resolve(blob);
        else reject(new Error('Falha ao codificar imagem de alta resolução.'));
      },
      mimeType,
      quality
    );
  });
}
