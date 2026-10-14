import type { VizSceneId } from "@/data/viz-lab";
import {
  clear,
  clamp,
  hsl,
  lerp,
  type VizCtx,
  type VizSceneApi,
} from "@/components/viz-lab/engine";

/* ───────── Piston ───────── */
const piston = (() => {
  let phase = 0;
  const hist: number[] = [];
  return {
    reset() {
      phase = 0;
      hist.length = 0;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, dt, params } = c;
      clear(c, "rgba(12,8,10,0.35)");
      const rpm = params.rpm ?? 72;
      const R = params.crank ?? 48;
      const L = params.rod ?? 130;
      phase += ((rpm / 60) * Math.PI * 2 * dt) / 1000;
      const cx = w * 0.34;
      const cy = h * 0.52;
      const theta = phase;
      const pinX = cx + Math.cos(theta) * R;
      const pinY = cy + Math.sin(theta) * R;
      const dx = Math.sqrt(Math.max(1, L * L - (pinY - cy) ** 2));
      const pistonX = pinX + dx;
      hist.push(pistonX);
      if (hist.length > Math.floor(w * 0.42)) hist.shift();

      // rails
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + R + 20, cy - 36);
      ctx.lineTo(cx + R + L + 40, cy - 36);
      ctx.moveTo(cx + R + 20, cy + 36);
      ctx.lineTo(cx + R + L + 40, cy + 36);
      ctx.stroke();

      // crank disk
      ctx.fillStyle = "rgba(244,162,97,0.16)";
      ctx.beginPath();
      ctx.arc(cx, cy, R + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f4a261";
      ctx.lineWidth = 2;
      ctx.stroke();

      // crank + rod
      ctx.strokeStyle = "#ffd3a8";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(pinX, pinY);
      ctx.lineTo(pistonX, cy);
      ctx.stroke();

      // joints
      for (const [x, y] of [
        [cx, cy],
        [pinX, pinY],
        [pistonX, cy],
      ] as const) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // piston
      ctx.fillStyle = "rgba(228,76,101,0.85)";
      roundRect(ctx, pistonX - 10, cy - 28, 48, 56, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      roundRect(ctx, pistonX + 6, cy - 18, 18, 36, 4);
      ctx.fill();

      // indicator
      const gx = w * 0.58;
      const gy = h * 0.18;
      const gw = w * 0.36;
      const gh = h * 0.64;
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.beginPath();
      ctx.strokeStyle = "#2ec4b6";
      ctx.lineWidth = 1.6;
      hist.forEach((px, i) => {
        const x = gx + (i / Math.max(1, hist.length - 1)) * gw;
        const y = gy + gh * 0.5 + ((px - (cx + L)) / (R + 8)) * (gh * 0.35);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "12px Noto Sans SC, sans-serif";
      ctx.fillText("活塞位移示波", gx, gy - 8);
    },
  } satisfies VizSceneApi;
})();

/* ───────── Lorenz ───────── */
const chaos = (() => {
  let pts: { x: number; y: number; z: number; h: number }[] = [];
  let state = { x: 0.1, y: 0, z: 0 };
  return {
    reset() {
      pts = [];
      state = { x: 0.1 + Math.random() * 0.02, y: 0, z: 0 };
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, reduced } = c;
      clear(c, "rgba(6,4,10,0.22)");
      const sigma = params.sigma ?? 10;
      const rho = params.rho ?? 28;
      const beta = params.beta ?? 8 / 3;
      const trail = Math.floor(params.trail ?? 1800);
      const steps = reduced ? 4 : 12;
      const dt = 0.008;
      for (let i = 0; i < steps; i++) {
        const { x, y, z } = state;
        const dx = sigma * (y - x);
        const dy = x * (rho - z) - y;
        const dz = x * y - beta * z;
        state = { x: x + dx * dt, y: y + dy * dt, z: z + dz * dt };
        pts.push({
          x: state.x,
          y: state.y,
          z: state.z,
          h: (c.t * 0.04 + pts.length * 0.2) % 360,
        });
      }
      while (pts.length > trail) pts.shift();
      const sx = w * 0.5;
      const sy = h * 0.55;
      const scale = Math.min(w, h) * 0.028;
      ctx.lineWidth = 1.2;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        ctx.strokeStyle = hsl(a.h, 80, 62, 0.55);
        ctx.beginPath();
        ctx.moveTo(sx + a.x * scale, sy - a.z * scale * 0.85);
        ctx.lineTo(sx + b.x * scale, sy - b.z * scale * 0.85);
        ctx.stroke();
      }
      const last = pts[pts.length - 1];
      if (last) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(sx + last.x * scale, sy - last.z * scale * 0.85, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  } satisfies VizSceneApi;
})();

/* ───────── Optics / communication ───────── */
const optics = (() => {
  let bits: number[] = [];
  let tBit = 0;
  return {
    reset() {
      bits = Array.from({ length: 24 }, () => (Math.random() > 0.5 ? 1 : 0));
      tBit = 0;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, dt, params } = c;
      clear(c, "rgba(5,10,14,0.32)");
      const bitrate = params.bitrate ?? 8;
      const noise = params.noise ?? 0.12;
      const disp = params.dispersion ?? 0.35;
      tBit += (dt / 1000) * bitrate;
      while (tBit >= 1) {
        tBit -= 1;
        bits.push(Math.random() > 0.5 ? 1 : 0);
        if (bits.length > 32) bits.shift();
      }

      const fiberY = h * 0.42;
      // fiber
      const grad = ctx.createLinearGradient(40, 0, w - 40, 0);
      grad.addColorStop(0, "rgba(123,223,242,0.15)");
      grad.addColorStop(0.5, "rgba(123,223,242,0.45)");
      grad.addColorStop(1, "rgba(123,223,242,0.15)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(40, fiberY);
      ctx.lineTo(w - 40, fiberY);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // pulses along fiber
      const n = bits.length;
      for (let i = 0; i < n; i++) {
        const u = (i + tBit) / n;
        const x = lerp(60, w - 60, u);
        const amp = bits[i];
        const blur = 6 + disp * 22;
        const g = ctx.createRadialGradient(x, fiberY, 0, x, fiberY, blur);
        g.addColorStop(0, hsl(190 + amp * 40, 90, 70, 0.9 * amp + 0.15));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, fiberY, blur, 0, Math.PI * 2);
        ctx.fill();
      }

      // TX waveform
      const gy = h * 0.68;
      const gh = h * 0.22;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "12px Noto Sans SC, sans-serif";
      ctx.fillText("发送码元 / 接收判决", 40, gy - 10);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.strokeRect(40, gy, w - 80, gh);
      ctx.beginPath();
      ctx.strokeStyle = "#7bdff2";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < n; i++) {
        const x0 = 40 + (i / n) * (w - 80);
        const x1 = 40 + ((i + 1) / n) * (w - 80);
        const y = gy + gh * (0.75 - bits[i] * 0.45);
        if (i === 0) ctx.moveTo(x0, y);
        ctx.lineTo(x0, y);
        ctx.lineTo(x1, y);
      }
      ctx.stroke();

      // RX noisy
      ctx.beginPath();
      ctx.strokeStyle = "#e44c65";
      for (let i = 0; i < n; i++) {
        const x = 40 + ((i + 0.5) / n) * (w - 80);
        const nse = (Math.sin(c.t * 0.01 + i * 3.1) * 0.5 + Math.random() - 0.5) * noise;
        const y = gy + gh * (0.75 - clamp(bits[i] + nse, 0, 1) * 0.45);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  } satisfies VizSceneApi;
})();

/* ───────── Fluid / ripples ───────── */
const fluid = (() => {
  type Drop = { x: number; y: number; r: number; h: number; life: number };
  type Ripple = { x: number; y: number; r: number; life: number; h: number };
  let drops: Drop[] = [];
  let ripples: Ripple[] = [];
  let field: Float32Array | null = null;
  let cols = 0;
  let rows = 0;

  function ensure(w: number, h: number) {
    cols = Math.max(40, Math.floor(w / 14));
    rows = Math.max(24, Math.floor(h / 14));
    if (!field || field.length !== cols * rows) field = new Float32Array(cols * rows);
  }

  return {
    reset() {
      drops = [];
      ripples = [];
      field = null;
    },
    onPointer(c: VizCtx) {
      if (!c.pointer.justDown) return;
      ripples.push({
        x: c.pointer.x,
        y: c.pointer.y,
        r: 4,
        life: 1,
        h: (c.t * 0.2 + Math.random() * 80) % 360,
      });
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, dt } = c;
      ensure(w, h);
      if (!field) return;
      clear(c, "rgba(4,12,14,0.2)");
      const visc = params.viscosity ?? 0.94;
      const spawn = params.spawn ?? 0.06;
      const swirl = params.swirl ?? 1;

      if (Math.random() < spawn) {
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.35,
          r: 18 + Math.random() * 28,
          h: Math.random() * 360,
          life: 1,
        });
      }

      // advect soft field
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const ang = Math.sin(x * 0.15 + c.t * 0.001) + Math.cos(y * 0.12 - c.t * 0.0012);
          const vx = Math.cos(ang) * swirl;
          const vy = Math.sin(ang * 1.3) * swirl * 0.7;
          const sx = clamp(Math.floor(x - vx), 0, cols - 1);
          const sy = clamp(Math.floor(y - vy), 0, rows - 1);
          field[i] = field[i] * visc + field[sy * cols + sx] * (1 - visc) * 0.85;
        }
      }

      for (const d of drops) {
        d.y += 18 * (dt / 16);
        d.life -= 0.004;
        const gx = clamp(Math.floor((d.x / w) * cols), 0, cols - 1);
        const gy = clamp(Math.floor((d.y / h) * rows), 0, rows - 1);
        field[gy * cols + gx] += 0.35;
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        g.addColorStop(0, hsl(d.h, 85, 60, 0.55 * d.life));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      drops = drops.filter((d) => d.life > 0 && d.y < h + 40);

      for (const r of ripples) {
        r.r += 2.2;
        r.life -= 0.012;
        ctx.strokeStyle = hsl(r.h, 80, 70, 0.55 * r.life);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        const gx = clamp(Math.floor((r.x / w) * cols), 0, cols - 1);
        const gy = clamp(Math.floor((r.y / h) * rows), 0, rows - 1);
        field[gy * cols + gx] += 0.5 * r.life;
      }
      ripples = ripples.filter((r) => r.life > 0);

      const cellW = w / cols;
      const cellH = h / rows;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v = field[y * cols + x];
          if (v < 0.04) continue;
          ctx.fillStyle = hsl((200 + v * 140 + c.t * 0.02) % 360, 75, 55, clamp(v * 0.55, 0, 0.45));
          ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    },
  } satisfies VizSceneApi;
})();

/* ───────── Rays ───────── */
const rays = (() => {
  type Hit = { x: number; y: number };
  function reflect(dx: number, dy: number, nx: number, ny: number) {
    const dot = dx * nx + dy * ny;
    return { dx: dx - 2 * dot * nx, dy: dy - 2 * dot * ny };
  }
  function refract(dx: number, dy: number, nx: number, ny: number, eta: number) {
    let ndx = nx;
    let ndy = ny;
    let cosi = -(dx * ndx + dy * ndy);
    let et = eta;
    if (cosi < 0) {
      cosi = -cosi;
      ndx = -nx;
      ndy = -ny;
      et = 1 / eta;
    }
    const k = 1 - et * et * (1 - cosi * cosi);
    if (k < 0) return reflect(dx, dy, ndx, ndy);
    const a = et;
    const b = et * cosi - Math.sqrt(k);
    return { dx: a * dx + b * ndx, dy: a * dy + b * ndy };
  }

  return {
    draw(c: VizCtx) {
      const { ctx, w, h, params } = c;
      clear(c, "rgba(8,7,6,0.4)");
      const beams = Math.floor(params.beams ?? 36);
      const ior = params.ior ?? 1.45;
      const ang = ((params.angle ?? -12) * Math.PI) / 180;
      const mirror = { x: w * 0.62, y: h * 0.55, r: Math.min(w, h) * 0.12 };
      const ball = { x: w * 0.38, y: h * 0.48, r: Math.min(w, h) * 0.1 };

      // objects
      ctx.fillStyle = "rgba(240,193,74,0.12)";
      ctx.beginPath();
      ctx.arc(mirror.x, mirror.y, mirror.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f0c14a";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(123,223,242,0.1)";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7bdff2";
      ctx.stroke();

      const origin = { x: 36, y: h * 0.5 };
      for (let i = 0; i < beams; i++) {
        const spread = ((i / (beams - 1) - 0.5) * 28 * Math.PI) / 180;
        let x = origin.x;
        let y = origin.y + (i - beams / 2) * 1.2;
        let dx = Math.cos(ang + spread);
        let dy = Math.sin(ang + spread);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = hsl(45 + i * 2, 90, 65, 0.45);
        ctx.lineWidth = 1;
        for (let bounce = 0; bounce < 6; bounce++) {
          let bestT = 1e9;
          let hit: Hit | null = null;
          let normal = { nx: 0, ny: 0 };
          let kind: "mirror" | "ball" | null = null;
          for (const obj of [
            { ...mirror, kind: "mirror" as const },
            { ...ball, kind: "ball" as const },
          ]) {
            const ox = x - obj.x;
            const oy = y - obj.y;
            const b = ox * dx + oy * dy;
            const cc = ox * ox + oy * oy - obj.r * obj.r;
            const disc = b * b - cc;
            if (disc < 0) continue;
            const t = -b - Math.sqrt(disc);
            if (t > 0.5 && t < bestT) {
              bestT = t;
              hit = { x: x + dx * t, y: y + dy * t };
              const nx = (hit.x - obj.x) / obj.r;
              const ny = (hit.y - obj.y) / obj.r;
              normal = { nx, ny };
              kind = obj.kind;
            }
          }
          if (!hit || !kind) {
            ctx.lineTo(x + dx * 2000, y + dy * 2000);
            break;
          }
          ctx.lineTo(hit.x, hit.y);
          x = hit.x;
          y = hit.y;
          if (kind === "mirror") {
            const r = reflect(dx, dy, normal.nx, normal.ny);
            dx = r.dx;
            dy = r.dy;
          } else {
            const r = refract(dx, dy, normal.nx, normal.ny, ior);
            dx = r.dx;
            dy = r.dy;
          }
          x += dx * 1.2;
          y += dy * 1.2;
        }
        ctx.stroke();
      }
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
      ctx.fill();
    },
  } satisfies VizSceneApi;
})();

/* ───────── Cosmos ───────── */
const cosmos = (() => {
  type Star = { x: number; y: number; z: number; s: number; h: number };
  let stars: Star[] = [];
  let yaw = 0;
  let zoom = 1;
  return {
    reset() {
      stars = [];
      yaw = 0;
      zoom = 1;
    },
    init(c: VizCtx) {
      const n = Math.floor(c.params.density ?? 220);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random(),
        s: 0.4 + Math.random() * 1.8,
        h: 200 + Math.random() * 80,
      }));
    },
    onPointer(c: VizCtx) {
      if (c.pointer.down) yaw += (c.pointer.x / Math.max(1, c.w) - 0.5) * 0.01;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, dt } = c;
      if (stars.length !== Math.floor(params.density ?? 220)) this.init?.(c);
      clear(c, "rgba(4,4,12,0.55)");
      const milky = params.milky ?? 0.85;
      const speed = params.speed ?? 1;
      yaw += 0.00015 * speed * (dt / 16);

      // milky way band
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.35 + yaw * 0.2);
      const g = ctx.createLinearGradient(-w, 0, w, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.5, `rgba(180,160,255,${0.12 * milky})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-w, -h * 0.08, w * 2, h * 0.16);
      ctx.restore();

      for (const s of stars) {
        const ang = yaw;
        const x = s.x * Math.cos(ang) - s.z * Math.sin(ang);
        const z = s.x * Math.sin(ang) + s.z * Math.cos(ang);
        const depth = (z + 1.4) * 0.5;
        const px = w * 0.5 + x * w * 0.45 * zoom * (0.6 + depth);
        const py = h * 0.5 + s.y * h * 0.4 * zoom;
        const twinkle = 0.55 + 0.45 * Math.sin(c.t * 0.01 + s.x * 40);
        ctx.fillStyle = hsl(s.h, 70, 75, 0.35 + twinkle * 0.5);
        ctx.beginPath();
        ctx.arc(px, py, s.s * (0.6 + depth), 0, Math.PI * 2);
        ctx.fill();
      }

      // planets
      const planets = [
        { r: 70, speed: 0.9, size: 5, color: "#f4a261" },
        { r: 110, speed: 0.55, size: 8, color: "#7bdff2" },
        { r: 155, speed: 0.32, size: 6, color: "#e44c65" },
      ];
      const cx = w * 0.5;
      const cy = h * 0.55;
      ctx.fillStyle = "#ffd38a";
      ctx.shadowColor = "#f0c14a";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      for (const p of planets) {
        const a = c.t * 0.001 * p.speed * speed;
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.beginPath();
        ctx.ellipse(cx, cy, p.r * zoom, p.r * 0.35 * zoom, 0, 0, Math.PI * 2);
        ctx.stroke();
        const x = cx + Math.cos(a) * p.r * zoom;
        const y = cy + Math.sin(a) * p.r * 0.35 * zoom;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // comet
      const ca = c.t * 0.0007 * speed;
      const cx2 = cx + Math.cos(ca) * 210 * zoom;
      const cy2 = cy + Math.sin(ca) * 70 * zoom;
      const tail = ctx.createLinearGradient(cx2, cy2, cx2 - 60, cy2 - 10);
      tail.addColorStop(0, "rgba(255,255,255,0.85)");
      tail.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = tail;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx2, cy2);
      ctx.lineTo(cx2 - 70, cy2 - 12);
      ctx.stroke();
    },
  } satisfies VizSceneApi;
})();

/* ───────── Double pendulum ───────── */
const pendulum = (() => {
  let th1 = Math.PI / 2;
  let th2 = Math.PI / 2 + 0.01;
  let w1 = 0;
  let w2 = 0;
  const trail: { x: number; y: number; h: number }[] = [];
  const m1 = 1;
  const m2 = 1;

  function deriv(a1: number, a2: number, o1: number, o2: number, L1: number, L2: number, g: number) {
    const den = 2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2);
    const a1a =
      (-g * (2 * m1 + m2) * Math.sin(a1) -
        m2 * g * Math.sin(a1 - 2 * a2) -
        2 * Math.sin(a1 - a2) * m2 * (o2 * o2 * L2 + o1 * o1 * L1 * Math.cos(a1 - a2))) /
      (L1 * den);
    const a2a =
      (2 *
        Math.sin(a1 - a2) *
        (o1 * o1 * L1 * (m1 + m2) + g * (m1 + m2) * Math.cos(a1) + o2 * o2 * L2 * m2 * Math.cos(a1 - a2))) /
      (L2 * den);
    return { o1, o2, a1a, a2a };
  }

  return {
    reset() {
      th1 = Math.PI / 2;
      th2 = Math.PI / 2 + 0.02 * Math.random();
      w1 = 0;
      w2 = 0;
      trail.length = 0;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, dt, reduced } = c;
      clear(c, "rgba(10,6,10,0.28)");
      const L1 = params.l1 ?? 100;
      const L2 = params.l2 ?? 90;
      const g = params.g ?? 9.8;
      const steps = reduced ? 2 : 6;
      const hstep = Math.min(0.02, (dt / 1000) * 2);
      for (let i = 0; i < steps; i++) {
        const k1 = deriv(th1, th2, w1, w2, L1, L2, g);
        const k2 = deriv(
          th1 + 0.5 * hstep * k1.o1,
          th2 + 0.5 * hstep * k1.o2,
          w1 + 0.5 * hstep * k1.a1a,
          w2 + 0.5 * hstep * k1.a2a,
          L1,
          L2,
          g
        );
        const k3 = deriv(
          th1 + 0.5 * hstep * k2.o1,
          th2 + 0.5 * hstep * k2.o2,
          w1 + 0.5 * hstep * k2.a1a,
          w2 + 0.5 * hstep * k2.a2a,
          L1,
          L2,
          g
        );
        const k4 = deriv(
          th1 + hstep * k3.o1,
          th2 + hstep * k3.o2,
          w1 + hstep * k3.a1a,
          w2 + hstep * k3.a2a,
          L1,
          L2,
          g
        );
        th1 += (hstep / 6) * (k1.o1 + 2 * k2.o1 + 2 * k3.o1 + k4.o1);
        th2 += (hstep / 6) * (k1.o2 + 2 * k2.o2 + 2 * k3.o2 + k4.o2);
        w1 += (hstep / 6) * (k1.a1a + 2 * k2.a1a + 2 * k3.a1a + k4.a1a);
        w2 += (hstep / 6) * (k1.a2a + 2 * k2.a2a + 2 * k3.a2a + k4.a2a);
      }
      const ox = w * 0.5;
      const oy = h * 0.28;
      const x1 = ox + L1 * Math.sin(th1);
      const y1 = oy + L1 * Math.cos(th1);
      const x2 = x1 + L2 * Math.sin(th2);
      const y2 = y1 + L2 * Math.cos(th2);
      trail.push({ x: x2, y: y2, h: (Math.hypot(w1, w2) * 40 + c.t * 0.05) % 360 });
      if (trail.length > 900) trail.shift();

      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        ctx.strokeStyle = hsl(a.h, 80, 62, 0.45);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = "#ff9aab";
      ctx.beginPath();
      ctx.arc(x1, y1, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e44c65";
      ctx.beginPath();
      ctx.arc(x2, y2, 9, 0, Math.PI * 2);
      ctx.fill();
    },
  } satisfies VizSceneApi;
})();

/* ───────── Aurora ───────── */
const aurora = (() => {
  return {
    draw(c: VizCtx) {
      const { ctx, w, h, params } = c;
      clear(c, "rgba(3,6,12,0.5)");
      // stars dust
      for (let i = 0; i < 60; i++) {
        const x = ((i * 97) % w) + Math.sin(c.t * 0.001 + i) * 2;
        const y = ((i * 53) % (h * 0.55)) + 10;
        ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.08})`;
        ctx.fillRect(x, y, 1.4, 1.4);
      }
      const bands = Math.floor(params.bands ?? 5);
      const flicker = params.flicker ?? 1;
      const hueShift = params.hueShift ?? 40;
      for (let b = 0; b < bands; b++) {
        const baseY = h * (0.35 + b * 0.08);
        const hue = 140 + b * 18 + Math.sin(c.t * 0.001 * flicker + b) * hueShift;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const n =
            Math.sin(x * 0.01 + c.t * 0.002 * flicker + b) * 28 +
            Math.sin(x * 0.023 - c.t * 0.0015 + b * 2) * 16 +
            Math.sin(x * 0.002 + b) * 40;
          const y = baseY + n;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let x = w; x >= 0; x -= 4) {
          const n =
            Math.sin(x * 0.01 + c.t * 0.002 * flicker + b) * 28 +
            Math.sin(x * 0.023 - c.t * 0.0015 + b * 2) * 16;
          ctx.lineTo(x, baseY + n + 70 + b * 10);
        }
        ctx.closePath();
        const g = ctx.createLinearGradient(0, baseY - 40, 0, baseY + 120);
        g.addColorStop(0, hsl(hue, 85, 60, 0.0));
        g.addColorStop(0.35, hsl(hue, 85, 55, 0.28));
        g.addColorStop(1, hsl(hue + 40, 80, 45, 0));
        ctx.fillStyle = g;
        ctx.fill();
      }
    },
  } satisfies VizSceneApi;
})();

/* ───────── Fourier epicycles ───────── */
const epicycles = (() => {
  const trail: { x: number; y: number }[] = [];
  function coeffs(shape: number, n: number) {
    // discrete Fourier-ish amplitudes for square / flower / heart-ish
    const out: { r: number; f: number; p: number }[] = [];
    for (let k = 1; k <= n; k++) {
      let r = 0;
      let p = 0;
      if (shape < 0.5) {
        // square-ish odd harmonics
        r = k % 2 === 1 ? 70 / k : 0;
        p = 0;
      } else if (shape < 1.5) {
        // flower
        r = 55 / (1 + (k % 3)) + (k % 2 ? 18 : 0);
        p = (k * Math.PI) / 4;
      } else {
        // heart-ish decaying
        r = 48 / Math.pow(k, 0.85);
        p = k * 0.4;
      }
      if (r > 0.5) out.push({ r, f: k, p });
    }
    return out;
  }
  return {
    reset() {
      trail.length = 0;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params } = c;
      clear(c, "rgba(10,6,10,0.3)");
      const n = Math.floor(params.harmonics ?? 8);
      const speed = params.speed ?? 1;
      const shape = params.shape ?? 0;
      const terms = coeffs(shape, n);
      let x = w * 0.38;
      let y = h * 0.5;
      const t = c.t * 0.0018 * speed;
      ctx.strokeStyle = "rgba(255,154,171,0.35)";
      ctx.lineWidth = 1;
      for (const term of terms) {
        const ang = term.f * t + term.p;
        const nx = x + Math.cos(ang) * term.r;
        const ny = y + Math.sin(ang) * term.r;
        ctx.beginPath();
        ctx.arc(x, y, term.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = hsl(330 + term.f * 12, 80, 70, 0.55);
        ctx.stroke();
        x = nx;
        y = ny;
      }
      trail.push({ x, y });
      if (trail.length > 900) trail.shift();
      ctx.beginPath();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      trail.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.fillStyle = "#e44c65";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "12px Noto Sans SC, sans-serif";
      const labels = ["方波轮廓", "花瓣轮廓", "心形轮廓"];
      ctx.fillText(labels[clamp(Math.round(shape), 0, 2)], 20, 28);
    },
  } satisfies VizSceneApi;
})();

/* ───────── Boids ───────── */
const boids = (() => {
  type Bird = { x: number; y: number; vx: number; vy: number };
  let birds: Bird[] = [];
  function ensure(c: VizCtx, count: number) {
    if (birds.length === count) return;
    birds = Array.from({ length: count }, () => ({
      x: Math.random() * c.w,
      y: Math.random() * c.h,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));
  }
  return {
    reset() {
      birds = [];
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params } = c;
      clear(c, "rgba(4,10,16,0.28)");
      const count = Math.floor(params.count ?? 90);
      const radius = params.radius ?? 42;
      const cohesion = params.cohesion ?? 1;
      ensure(c, count);
      for (const b of birds) {
        let sx = 0;
        let sy = 0;
        let ax = 0;
        let ay = 0;
        let cx = 0;
        let cy = 0;
        let n = 0;
        for (const o of birds) {
          if (o === b) continue;
          const dx = o.x - b.x;
          const dy = o.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > radius * radius || d2 < 1e-4) continue;
          n++;
          const d = Math.sqrt(d2);
          sx -= dx / d;
          sy -= dy / d;
          ax += o.vx;
          ay += o.vy;
          cx += o.x;
          cy += o.y;
          if (d < radius * 0.35) {
            sx -= (dx / d) * 1.8;
            sy -= (dy / d) * 1.8;
          }
        }
        if (n > 0) {
          ax = ax / n - b.vx;
          ay = ay / n - b.vy;
          cx = cx / n - b.x;
          cy = cy / n - b.y;
          b.vx += sx * 0.04 + ax * 0.03 + cx * 0.0025 * cohesion;
          b.vy += sy * 0.04 + ay * 0.03 + cy * 0.0025 * cohesion;
        }
        // soft edges
        if (b.x < 40) b.vx += 0.12;
        if (b.x > w - 40) b.vx -= 0.12;
        if (b.y < 40) b.vy += 0.12;
        if (b.y > h - 40) b.vy -= 0.12;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        const max = 2.6;
        if (sp > max) {
          b.vx = (b.vx / sp) * max;
          b.vy = (b.vy / sp) * max;
        }
        b.x += b.vx;
        b.y += b.vy;
      }
      for (const b of birds) {
        const ang = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(ang);
        ctx.fillStyle = hsl(195 + Math.hypot(b.vx, b.vy) * 20, 80, 65, 0.9);
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, 3.5);
        ctx.lineTo(-5, -3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },
  } satisfies VizSceneApi;
})();

/* ───────── Julia set ───────── */
const julia = (() => {
  let cx = -0.4;
  let cy = 0.6;
  let dirty = true;
  let lastKey = "";
  let off: HTMLCanvasElement | null = null;
  return {
    reset() {
      cx = -0.4;
      cy = 0.6;
      dirty = true;
      off = null;
      lastKey = "";
    },
    onPointer(c: VizCtx) {
      if (!c.pointer.down) return;
      cx = lerp(-1, 1, c.pointer.x / Math.max(1, c.w));
      cy = lerp(-1, 1, c.pointer.y / Math.max(1, c.h));
      dirty = true;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, reduced } = c;
      const iter = Math.floor(params.iter ?? 55);
      const zoom = params.zoom ?? 1.1;
      const palette = Math.floor(params.palette ?? 0);
      const key = `${iter}|${zoom}|${palette}|${cx.toFixed(3)}|${cy.toFixed(3)}|${w}|${h}`;
      if (key !== lastKey) {
        dirty = true;
        lastKey = key;
      }
      if (dirty || !off) {
        const scale = reduced ? 0.45 : 0.65;
        const sw = Math.max(80, Math.floor(w * scale));
        const sh = Math.max(60, Math.floor(h * scale));
        off = document.createElement("canvas");
        off.width = sw;
        off.height = sh;
        const octx = off.getContext("2d");
        if (octx) {
          const tmp = octx.createImageData(sw, sh);
          const data = tmp.data;
          const aspect = sw / sh;
          for (let py = 0; py < sh; py++) {
            for (let px = 0; px < sw; px++) {
              let zx = (((px / sw - 0.5) * 3.2) / zoom) * aspect;
              let zy = ((py / sh - 0.5) * 3.2) / zoom;
              let i = 0;
              while (i < iter && zx * zx + zy * zy < 4) {
                const xt = zx * zx - zy * zy + cx;
                zy = 2 * zx * zy + cy;
                zx = xt;
                i++;
              }
              const idx = (py * sw + px) * 4;
              if (i >= iter) {
                data[idx] = 8;
                data[idx + 1] = 6;
                data[idx + 2] = 14;
              } else {
                const t = i / iter;
                if (palette === 0) {
                  data[idx] = Math.floor(40 + 200 * t);
                  data[idx + 1] = Math.floor(30 + 80 * (1 - t));
                  data[idx + 2] = Math.floor(120 + 120 * Math.sin(t * 6));
                } else if (palette === 1) {
                  data[idx] = Math.floor(20 + 60 * t);
                  data[idx + 1] = Math.floor(80 + 160 * t);
                  data[idx + 2] = Math.floor(140 + 100 * (1 - t));
                } else {
                  data[idx] = Math.floor(255 * Math.abs(Math.sin(t * 8)));
                  data[idx + 1] = Math.floor(180 * t);
                  data[idx + 2] = Math.floor(220 * (1 - t));
                }
              }
              data[idx + 3] = 255;
            }
          }
          octx.putImageData(tmp, 0, 0);
        }
        dirty = false;
      }
      ctx.imageSmoothingEnabled = true;
      if (off) ctx.drawImage(off, 0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "12px Noto Sans SC, sans-serif";
      ctx.fillText(`c = ${cx.toFixed(3)} + ${cy.toFixed(3)}i · 拖拽改参数`, 16, 26);
    },
  } satisfies VizSceneApi;
})();

/* ───────── Wave interference ───────── */
const waves = (() => {
  let cols = 0;
  let rows = 0;
  let u: Float32Array | null = null;
  let v: Float32Array | null = null;
  let pulses: { x: number; y: number; life: number }[] = [];
  function ensure(w: number, h: number) {
    cols = Math.max(60, Math.floor(w / 6));
    rows = Math.max(36, Math.floor(h / 6));
    const n = cols * rows;
    if (!u || u.length !== n) {
      u = new Float32Array(n);
      v = new Float32Array(n);
    }
  }
  return {
    reset() {
      u = null;
      v = null;
      pulses = [];
    },
    onPointer(c: VizCtx) {
      if (!c.pointer.justDown || !u) return;
      const gx = clamp(Math.floor((c.pointer.x / c.w) * cols), 1, cols - 2);
      const gy = clamp(Math.floor((c.pointer.y / c.h) * rows), 1, rows - 2);
      pulses.push({ x: gx, y: gy, life: 1 });
      u[gy * cols + gx] += 2.5;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, reduced } = c;
      ensure(w, h);
      if (!u || !v) return;
      const freq = params.freq ?? 1.2;
      const damp = params.damp ?? 0.992;
      const amp = params.amp ?? 1;
      const s1x = Math.floor(cols * 0.32);
      const s1y = Math.floor(rows * 0.5);
      const s2x = Math.floor(cols * 0.68);
      const s2y = Math.floor(rows * 0.5);
      const pulse = Math.sin(c.t * 0.01 * freq) * amp;
      u[s1y * cols + s1x] += pulse * 0.35;
      u[s2y * cols + s2x] += pulse * 0.35;
      for (const p of pulses) {
        u[p.y * cols + p.x] += p.life * 1.2;
        p.life -= 0.04;
      }
      pulses = pulses.filter((p) => p.life > 0);

      const steps = reduced ? 1 : 2;
      for (let s = 0; s < steps; s++) {
        for (let y = 1; y < rows - 1; y++) {
          for (let x = 1; x < cols - 1; x++) {
            const i = y * cols + x;
            const lap =
              u[i - 1] + u[i + 1] + u[i - cols] + u[i + cols] - 4 * u[i];
            v[i] = (v[i] + lap * 0.2) * damp;
          }
        }
        for (let i = 0; i < u.length; i++) u[i] += v[i];
      }

      const cellW = w / cols;
      const cellH = h / rows;
      clear(c, "rgba(3,10,14,0.35)");
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const val = u[y * cols + x];
          if (Math.abs(val) < 0.03) continue;
          const t = clamp(val * 0.5 + 0.5, 0, 1);
          ctx.fillStyle = hsl(190 + val * 40, 85, 35 + t * 40, 0.55);
          ctx.fillRect(x * cellW, y * cellH, cellW + 0.6, cellH + 0.6);
        }
      }
      // sources
      for (const [sx, sy] of [
        [s1x, s1y],
        [s2x, s2y],
      ] as const) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc((sx + 0.5) * cellW, (sy + 0.5) * cellH, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  } satisfies VizSceneApi;
})();

/* ───────── Rainfall–runoff hydrograph ───────── */
const hydrograph = (() => {
  let rain: number[] = [];
  let q: number[] = [];
  let tIdx = 0;
  let sig = "";
  function unitHydrograph(tp: number, n: number) {
    // triangular UH peaking at tp
    const uh = new Array(n).fill(0);
    const base = tp * 2.5;
    for (let i = 0; i < n; i++) {
      if (i <= tp) uh[i] = i / Math.max(1, tp);
      else if (i < base) uh[i] = Math.max(0, 1 - (i - tp) / (base - tp));
    }
    const sum = uh.reduce((a, b) => a + b, 0) || 1;
    return uh.map((v) => v / sum);
  }
  function rebuild(peak: number, lag: number, tp: number) {
    const n = 96;
    rain = new Array(n).fill(0);
    for (let i = 0; i < 10; i++) {
      const x = lag + i;
      if (x < n) rain[x] = peak * Math.exp(-((i - 3) ** 2) / 8);
    }
    const uh = unitHydrograph(tp, 40);
    q = new Array(n).fill(0);
    for (let t = 0; t < n; t++) {
      let s = 0;
      for (let j = 0; j < uh.length; j++) {
        if (t - j >= 0) s += rain[t - j] * uh[j];
      }
      q[t] = s * 4.2;
    }
    tIdx = 0;
  }
  return {
    reset() {
      rain = [];
      q = [];
      tIdx = 0;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, dt } = c;
      const peak = params.peak ?? 1.2;
      const lag = Math.floor(params.lag ?? 12);
      const tp = Math.floor(params.tp ?? 16);
      const nextSig = `${peak}|${lag}|${tp}`;
      if (!rain.length || sig !== nextSig) {
        sig = nextSig;
        rebuild(peak, lag, tp);
      }
      tIdx = Math.min(rain.length - 1, tIdx + (dt / 1000) * 8);
      clear(c, "rgba(4,12,14,0.4)");

      const pad = 48;
      const gw = w - pad * 2;
      const gh = h * 0.34;
      const yRain = pad + 10;
      const yQ = h * 0.52;

      // rain bars
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "12px Noto Sans SC, sans-serif";
      ctx.fillText("雨强 P(t)", pad, yRain - 4);
      const maxR = Math.max(...rain, 0.01);
      for (let i = 0; i < rain.length; i++) {
        const x = pad + (i / (rain.length - 1)) * gw;
        const bh = (rain[i] / maxR) * (gh - 20);
        ctx.fillStyle = i <= tIdx ? "#7bdff2" : "rgba(123,223,242,0.25)";
        ctx.fillRect(x - 2, yRain + gh - bh, 4, bh);
      }

      // discharge
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("出口流量 Q(t)  ← 单位线卷积", pad, yQ - 8);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.strokeRect(pad, yQ, gw, gh);
      const maxQ = Math.max(...q, 0.01);
      ctx.beginPath();
      ctx.strokeStyle = "#2ec4b6";
      ctx.lineWidth = 2;
      for (let i = 0; i < q.length; i++) {
        const x = pad + (i / (q.length - 1)) * gw;
        const y = yQ + gh - (q[i] / maxQ) * (gh - 12);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // playhead
      const px = pad + (tIdx / (q.length - 1)) * gw;
      ctx.strokeStyle = "rgba(228,76,101,0.8)";
      ctx.beginPath();
      ctx.moveTo(px, yRain);
      ctx.lineTo(px, yQ + gh);
      ctx.stroke();
      const qi = q[Math.floor(tIdx)] ?? 0;
      ctx.fillStyle = "#ff9aab";
      ctx.fillText(`t=${tIdx.toFixed(0)}  Q=${qi.toFixed(2)}`, px + 6, yQ + 16);

      // UH inset
      const uh = unitHydrograph(tp, 40);
      const ix = w * 0.62;
      const iy = yRain + 8;
      const iw = w * 0.3;
      const ih = gh * 0.7;
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(ix, iy, iw, ih);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("单位线 UH", ix + 6, iy + 14);
      ctx.beginPath();
      ctx.strokeStyle = "#f4a261";
      uh.forEach((v, i) => {
        const x = ix + (i / (uh.length - 1)) * iw;
        const y = iy + ih - v * (ih - 16) * (uh.length * 0.35);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      if (tIdx >= rain.length - 1.2) tIdx = 0;
    },
  } satisfies VizSceneApi;
})();

/* ───────── Gray-Scott reaction-diffusion ───────── */
const reaction = (() => {
  let cols = 0;
  let rows = 0;
  let a: Float32Array | null = null;
  let b: Float32Array | null = null;
  let a2: Float32Array | null = null;
  let b2: Float32Array | null = null;
  let off: HTMLCanvasElement | null = null;
  let offCtx: CanvasRenderingContext2D | null = null;
  function ensure(w: number, h: number, reduced: boolean) {
    const scale = reduced ? 0.28 : 0.42;
    const nc = Math.max(60, Math.floor(w * scale));
    const nr = Math.max(40, Math.floor(h * scale));
    if (a && a.length === nc * nr) return;
    cols = nc;
    rows = nr;
    const n = cols * rows;
    a = new Float32Array(n).fill(1);
    b = new Float32Array(n);
    a2 = new Float32Array(n);
    b2 = new Float32Array(n);
    off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    offCtx = off.getContext("2d");
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(cols * (0.3 + Math.random() * 0.4));
      const y = Math.floor(rows * (0.3 + Math.random() * 0.4));
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const ix = x + dx;
          const iy = y + dy;
          if (ix >= 0 && iy >= 0 && ix < cols && iy < rows) b[iy * cols + ix] = 1;
        }
    }
  }
  return {
    reset() {
      a = null;
      b = null;
      off = null;
      offCtx = null;
    },
    onPointer(c: VizCtx) {
      if (!c.pointer.justDown || !b) return;
      const x = clamp(Math.floor((c.pointer.x / c.w) * cols), 2, cols - 3);
      const y = clamp(Math.floor((c.pointer.y / c.h) * rows), 2, rows - 3);
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++) b[(y + dy) * cols + (x + dx)] = 1;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, reduced } = c;
      ensure(w, h, reduced);
      if (!a || !b || !a2 || !b2 || !off || !offCtx) return;
      const feed = params.feed ?? 0.037;
      const kill = params.kill ?? 0.06;
      const steps = Math.floor(params.speed ?? 3);
      const dA = 1.0;
      const dB = 0.5;
      for (let s = 0; s < steps; s++) {
        for (let y = 1; y < rows - 1; y++) {
          for (let x = 1; x < cols - 1; x++) {
            const i = y * cols + x;
            const av = a[i];
            const bv = b[i];
            const lapA =
              a[i - 1] + a[i + 1] + a[i - cols] + a[i + cols] - 4 * av;
            const lapB =
              b[i - 1] + b[i + 1] + b[i - cols] + b[i + cols] - 4 * bv;
            const abb = av * bv * bv;
            a2[i] = av + (dA * lapA - abb + feed * (1 - av));
            b2[i] = bv + (dB * lapB + abb - (kill + feed) * bv);
          }
        }
        [a, a2] = [a2, a];
        [b, b2] = [b2, b];
      }
      const img = offCtx.createImageData(cols, rows);
      for (let i = 0; i < a.length; i++) {
        const t = clamp(b[i] * 2.2, 0, 1);
        const idx = i * 4;
        img.data[idx] = Math.floor(20 + 220 * t);
        img.data[idx + 1] = Math.floor(30 + 80 * (1 - t));
        img.data[idx + 2] = Math.floor(60 + 160 * Math.sin(t * 3));
        img.data[idx + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, w, h);
    },
  } satisfies VizSceneApi;
})();

/* ───────── L-system ───────── */
const lsystem = (() => {
  function expand(depth: number) {
    let s = "X";
    for (let i = 0; i < depth; i++) {
      let n = "";
      for (const ch of s) {
        if (ch === "X") n += "F[+X][-X]FX";
        else if (ch === "F") n += "FF";
        else n += ch;
      }
      s = n;
    }
    return s;
  }
  return {
    draw(c: VizCtx) {
      const { ctx, w, h, params } = c;
      clear(c, "rgba(6,12,8,0.45)");
      const depth = Math.floor(params.depth ?? 4);
      const ang0 = ((params.angle ?? 25) * Math.PI) / 180;
      const wind = params.wind ?? 0.45;
      const str = expand(depth);
      const len = Math.max(2.2, Math.min(w, h) * 0.012 * (7 - depth));
      let x = w * 0.5;
      let y = h * 0.92;
      let a = -Math.PI / 2;
      const stack: { x: number; y: number; a: number }[] = [];
      ctx.lineCap = "round";
      let i = 0;
      for (const ch of str) {
        i++;
        const sway = Math.sin(c.t * 0.002 + i * 0.01) * wind * 0.04;
        if (ch === "F") {
          const nx = x + Math.cos(a + sway) * len;
          const ny = y + Math.sin(a + sway) * len;
          ctx.strokeStyle = hsl(120 + (y / h) * 40, 70, 55, 0.85);
          ctx.lineWidth = Math.max(0.6, 3.2 - depth * 0.35);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          x = nx;
          y = ny;
        } else if (ch === "+") a += ang0;
        else if (ch === "-") a -= ang0;
        else if (ch === "[") stack.push({ x, y, a });
        else if (ch === "]") {
          const s = stack.pop();
          if (s) {
            x = s.x;
            y = s.y;
            a = s.a;
          }
        }
      }
    },
  } satisfies VizSceneApi;
})();

/* ───────── Verlet cloth ───────── */
const cloth = (() => {
  type Pt = { x: number; y: number; px: number; py: number; pinned?: boolean };
  let pts: Pt[] = [];
  let links: [number, number, number][] = [];
  let cols = 0;
  let rows = 0;
  let dragIdx = -1;
  function build(w: number, h: number) {
    cols = 18;
    rows = 12;
    pts = [];
    links = [];
    const ox = w * 0.18;
    const oy = h * 0.12;
    const dx = (w * 0.64) / (cols - 1);
    const dy = (h * 0.55) / (rows - 1);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = ox + x * dx;
        const py = oy + y * dy;
        pts.push({ x: px, y: py, px, py, pinned: y === 0 && (x % 3 === 0 || x === cols - 1) });
      }
    }
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (x < cols - 1) links.push([i, i + 1, dx]);
        if (y < rows - 1) links.push([i, i + cols, dy]);
      }
    }
  }
  return {
    reset() {
      pts = [];
      dragIdx = -1;
    },
    onPointer(c: VizCtx) {
      if (!pts.length) return;
      if (c.pointer.justDown) {
        let best = 1e9;
        dragIdx = -1;
        pts.forEach((p, i) => {
          const d = (p.x - c.pointer.x) ** 2 + (p.y - c.pointer.y) ** 2;
          if (d < best && d < 40 * 40) {
            best = d;
            dragIdx = i;
          }
        });
      }
      if (c.pointer.down && dragIdx >= 0) {
        const p = pts[dragIdx];
        p.x = c.pointer.x;
        p.y = c.pointer.y;
        p.px = c.pointer.x;
        p.py = c.pointer.y;
      }
      if (!c.pointer.down) dragIdx = -1;
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params } = c;
      if (!pts.length) build(w, h);
      clear(c, "rgba(10,6,10,0.32)");
      const stiff = Math.floor(params.stiffness ?? 4);
      const g = params.gravity ?? 0.22;
      const damp = params.damping ?? 0.99;
      for (const p of pts) {
        if (p.pinned || (dragIdx >= 0 && pts[dragIdx] === p)) continue;
        const vx = (p.x - p.px) * damp;
        const vy = (p.y - p.py) * damp + g;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy;
        if (p.y > h - 8) {
          p.y = h - 8;
          p.py = p.y;
        }
      }
      for (let k = 0; k < stiff; k++) {
        for (const [i, j, rest] of links) {
          const a = pts[i];
          const b = pts[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const diff = (d - rest) / d;
          const ox = dx * 0.5 * diff;
          const oy = dy * 0.5 * diff;
          if (!a.pinned) {
            a.x += ox;
            a.y += oy;
          }
          if (!b.pinned) {
            b.x -= ox;
            b.y -= oy;
          }
        }
      }
      ctx.strokeStyle = "rgba(255,154,171,0.55)";
      ctx.lineWidth = 1;
      for (const [i, j] of links) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
      for (const p of pts) {
        ctx.fillStyle = p.pinned ? "#fff" : "#e44c65";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.pinned ? 3.5 : 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  } satisfies VizSceneApi;
})();

/* ───────── Metaballs ───────── */
const metaballs = (() => {
  type Ball = { x: number; y: number; vx: number; vy: number; r: number };
  let balls: Ball[] = [];
  return {
    reset() {
      balls = [];
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, reduced } = c;
      const count = Math.floor(params.count ?? 5);
      const thr = params.threshold ?? 1.15;
      const speed = params.speed ?? 0.9;
      if (balls.length !== count) {
        balls = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 2 * speed,
          vy: (Math.random() - 0.5) * 2 * speed,
          r: 40 + Math.random() * 50,
        }));
      }
      for (const b of balls) {
        b.x += b.vx * speed;
        b.y += b.vy * speed;
        if (b.x < b.r || b.x > w - b.r) b.vx *= -1;
        if (b.y < b.r || b.y > h - b.r) b.vy *= -1;
      }
      const step = reduced ? 5 : 3;
      clear(c, "rgba(4,10,16,0.5)");
      const img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          let sum = 0;
          for (const b of balls) {
            const dx = x - b.x;
            const dy = y - b.y;
            sum += (b.r * b.r) / (dx * dx + dy * dy + 1);
          }
          if (sum > thr) {
            const t = clamp((sum - thr) / 2, 0, 1);
            const r = Math.floor(40 + 180 * t);
            const g = Math.floor(180 + 40 * Math.sin(c.t * 0.002 + sum));
            const bl = Math.floor(220 - 80 * t);
            for (let yy = 0; yy < step && y + yy < h; yy++) {
              for (let xx = 0; xx < step && x + xx < w; xx++) {
                const idx = ((y + yy) * w + (x + xx)) * 4;
                img.data[idx] = r;
                img.data[idx + 1] = g;
                img.data[idx + 2] = bl;
                img.data[idx + 3] = 230;
              }
            }
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    },
  } satisfies VizSceneApi;
})();

/* ───────── Fireworks ───────── */
const fireworks = (() => {
  type P = { x: number; y: number; vx: number; vy: number; life: number; h: number; kind: "rocket" | "spark" };
  let parts: P[] = [];
  let acc = 0;
  function burst(x: number, y: number, spread: number) {
    const h = Math.random() * 360;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + Math.random() * 0.2;
      const sp = (1.5 + Math.random() * 2.5) * spread;
      parts.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        h: h + Math.random() * 40,
        kind: "spark",
      });
    }
  }
  return {
    reset() {
      parts = [];
      acc = 0;
    },
    onPointer(c: VizCtx) {
      if (!c.pointer.justDown) return;
      burst(c.pointer.x, c.pointer.y, c.params.spread ?? 1.1);
    },
    draw(c: VizCtx) {
      const { ctx, w, h, params, dt } = c;
      clear(c, "rgba(4,4,12,0.35)");
      const rate = params.rate ?? 0.7;
      const spread = params.spread ?? 1.1;
      const g = params.gravity ?? 0.08;
      acc += (dt / 1000) * rate;
      while (acc >= 1) {
        acc -= 1;
        parts.push({
          x: w * (0.15 + Math.random() * 0.7),
          y: h,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(6 + Math.random() * 3),
          life: 1,
          h: Math.random() * 360,
          kind: "rocket",
        });
      }
      const next: P[] = [];
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += g;
        p.life -= p.kind === "rocket" ? 0.01 : 0.016;
        if (p.kind === "rocket" && p.vy >= -0.5) {
          burst(p.x, p.y, spread);
          continue;
        }
        if (p.life <= 0) continue;
        ctx.fillStyle = hsl(p.h, 90, 65, clamp(p.life, 0, 1));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.kind === "rocket" ? 2.4 : 1.8, 0, Math.PI * 2);
        ctx.fill();
        next.push(p);
      }
      parts = next;
    },
  } satisfies VizSceneApi;
})();

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const SCENES: Record<VizSceneId, VizSceneApi> = {
  piston,
  chaos,
  optics,
  fluid,
  rays,
  cosmos,
  pendulum,
  aurora,
  epicycles,
  boids,
  julia,
  waves,
  hydrograph,
  reaction,
  lsystem,
  cloth,
  metaballs,
  fireworks,
};
