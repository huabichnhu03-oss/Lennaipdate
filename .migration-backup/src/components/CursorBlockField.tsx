import { useEffect, useRef } from "react";
import { BRAND, BRAND_RGB } from "@/lib/brand";

const [BR, BG, BB] = BRAND_RGB[BRAND.blue].split(",").map(Number);
const BLUE = { r: BR, g: BG, b: BB };
const FALLOFF = 340;
const HALO = 1.4;

const PULSE_DURATION = 720;   // ms
const PULSE_RADIUS = 260;     // px the pulse expands to

type Theme = "dark" | "light";

type Pulse = { x: number; y: number; start: number };

interface ThemeTokens {
  /** Alpha used to draw the static idle grain layer. */
  idleGrainAlpha: number;
  /** RGB used for grain pixels (light specks for dark bg, dark for light bg). */
  grainBase: number;
  grainBaseSpread: number;
  /** Composite mode used when adding the cursor / pulse glow. */
  composite: GlobalCompositeOperation;
  /** Alpha multipliers for the cursor halo on this theme. */
  haloMultiplier: number;
}

const THEMES: Record<Theme, ThemeTokens> = {
  dark: {
    idleGrainAlpha: 0.045,
    grainBase: 140,
    grainBaseSpread: 115,
    composite: "lighter",
    haloMultiplier: 1,
  },
  light: {
    /* On a light background we need darker speckles and a *darkening*
       composite so the blue actually tints the page instead of washing
       out to white. We bump grain alpha and halo strength a bit so the
       effect is still visible against #FFFFFF. */
    idleGrainAlpha: 0.06,
    grainBase: 30,
    grainBaseSpread: 60,
    composite: "multiply",
    haloMultiplier: 1.6,
  },
};

function createGrain(
  width: number,
  height: number,
  base: number,
  spread: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d");
  if (!g) return c;
  const img = g.createImageData(width, height);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.32) {
      const v = base + Math.floor(Math.random() * spread);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 170 + Math.floor(Math.random() * 85);
    } else {
      data[i + 3] = 0;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export interface CursorBlockFieldProps {
  /** Defaults to "dark". The entry/landing page is locked to dark. */
  theme?: Theme;
}

export function CursorBlockField({ theme = "dark" }: CursorBlockFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grainRef = useRef<HTMLCanvasElement | null>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const targetRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const rafRef = useRef<number | null>(null);
  const pulsesRef = useRef<Pulse[]>([]);

  useEffect(() => {
    const tokens = THEMES[theme];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hasHover = window.matchMedia("(hover: hover)").matches;
    const animate = hasHover && !reduceMotion;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let off: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;

    const drawIdleGrain = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const grain = grainRef.current;
      if (!grain) return;
      ctx.globalAlpha = tokens.idleGrainAlpha;
      ctx.drawImage(grain, 0, 0, w, h);
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grainRef.current = createGrain(
        w,
        h,
        tokens.grainBase,
        tokens.grainBaseSpread,
      );

      if (animate) {
        // Offscreen canvas used to mask the radial gradient with grain.
        off = document.createElement("canvas");
        off.width = Math.floor(w * dpr);
        off.height = Math.floor(h * dpr);
        offCtx = off.getContext("2d");
        if (offCtx) offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        offRef.current = off;
      } else {
        drawIdleGrain();
      }
    };

    const drawPulse = (pulse: Pulse, now: number) => {
      const t = (now - pulse.start) / PULSE_DURATION;
      if (t >= 1) return false;
      // Ease-out so the ring decelerates as it expands.
      const eased = 1 - Math.pow(1 - t, 3);
      const radius = PULSE_RADIUS * eased;
      const fade = 1 - t;
      const grain = grainRef.current;
      if (!off || !offCtx || !grain) return true;

      // Build a soft blue ring on the offscreen canvas.
      offCtx.globalCompositeOperation = "source-over";
      offCtx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      const ring = offCtx.createRadialGradient(
        pulse.x,
        pulse.y,
        Math.max(0, radius * 0.65),
        pulse.x,
        pulse.y,
        radius,
      );
      const alpha = 0.32 * fade;
      ring.addColorStop(0, `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, 0)`);
      ring.addColorStop(
        0.55,
        `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, ${alpha})`,
      );
      ring.addColorStop(1, `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, 0)`);
      offCtx.fillStyle = ring;
      offCtx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // Mask through the grain so the pulse shares the speckled aesthetic.
      offCtx.globalCompositeOperation = "destination-in";
      offCtx.drawImage(grain, 0, 0, canvas.clientWidth, canvas.clientHeight);
      offCtx.globalCompositeOperation = "source-over";

      ctx.globalCompositeOperation = tokens.composite;
      ctx.drawImage(off, 0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.globalCompositeOperation = "source-over";
      return true;
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Smooth cursor follow
      mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.2;
      mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.2;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const grain = grainRef.current;

      ctx.clearRect(0, 0, w, h);

      // Layer 1: faint static grain everywhere — the idle dim state.
      if (grain) {
        ctx.globalAlpha = tokens.idleGrainAlpha;
        ctx.drawImage(grain, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      if (mouseRef.current.active && off && offCtx && grain) {
        // Layer 2: blue radial gradient masked by grain (the "grainy light").
        offCtx.globalCompositeOperation = "source-over";
        offCtx.clearRect(0, 0, w, h);
        const grad = offCtx.createRadialGradient(mx, my, 0, mx, my, FALLOFF);
        grad.addColorStop(
          0,
          `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, 0.24)`,
        );
        grad.addColorStop(
          0.35,
          `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, 0.10)`,
        );
        grad.addColorStop(
          0.7,
          `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, 0.025)`,
        );
        grad.addColorStop(1, `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, 0)`);
        offCtx.fillStyle = grad;
        offCtx.fillRect(0, 0, w, h);

        // Mask the gradient by the grain texture: only grain pixels remain.
        offCtx.globalCompositeOperation = "destination-in";
        offCtx.drawImage(grain, 0, 0, w, h);
        offCtx.globalCompositeOperation = "source-over";

        // Composite onto main canvas with the theme-appropriate blend mode.
        ctx.globalCompositeOperation = tokens.composite;
        ctx.drawImage(off, 0, 0, w, h);

        // Layer 3: soft non-grainy blue halo for depth.
        const halo = ctx.createRadialGradient(
          mx,
          my,
          0,
          mx,
          my,
          FALLOFF * HALO,
        );
        halo.addColorStop(
          0,
          `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, ${0.025 * tokens.haloMultiplier})`,
        );
        halo.addColorStop(
          0.45,
          `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, ${0.009 * tokens.haloMultiplier})`,
        );
        halo.addColorStop(1, `rgba(${BLUE.r}, ${BLUE.g}, ${BLUE.b}, 0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = "source-over";
      }

      // Layer 4: click pulses — drawn last so they bloom over everything.
      if (pulsesRef.current.length > 0) {
        const now = performance.now();
        pulsesRef.current = pulsesRef.current.filter((p) =>
          drawPulse(p, now),
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };
    const onMouseLeave = () => {
      mouseRef.current.active = false;
      targetRef.current.x = -9999;
      targetRef.current.y = -9999;
    };
    const onPointerDown = (e: PointerEvent) => {
      // Cap concurrent pulses so rapid clicking can't pile up cost.
      if (pulsesRef.current.length >= 6) {
        pulsesRef.current.shift();
      }
      pulsesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        start: performance.now(),
      });
    };

    resize();

    if (animate) {
      rafRef.current = requestAnimationFrame(draw);
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("mouseleave", onMouseLeave);
      window.addEventListener("blur", onMouseLeave);
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
    }

    window.addEventListener("resize", resize);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("blur", onMouseLeave);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", resize);
      pulsesRef.current = [];
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
