import {
  CHAPTERS, cameraAt, chapterAt, chapterProgress, clamp01, ease, hash01, lerp, window, TOTAL_FRAMES,
} from "./timeline";

export const W = 1280;
export const H = 720;

const INK = "#0B1019";
const PANEL = "#111A2A";
const STRUCT = "#344257";
const STRUCT_D = "#232F42";
const STRUCT_L = "#46586F";
const BONE = "#E8E4D8";
const MUTED = "#8A99B0";
const CYAN = "#00E5FF";
const GOLD = "#FFD166";
const VIOLET = "#9D4EDD";

type Ctx = CanvasRenderingContext2D;

function alpha(ctx: Ctx, a: number) { ctx.globalAlpha = clamp01(a); }
function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, w = 2, dash: number[] = []) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
}
function rect(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, stroke = "", lw = 1, r = 6) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function text(ctx: Ctx, s: string, x: number, y: number, size = 14, color = BONE, align: CanvasTextAlign = "left", weight = 600, mono = false) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${mono ? '"JetBrains Mono", ui-monospace, monospace' : '"Space Grotesk", system-ui, sans-serif'}`;
  ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(s, x, y);
}
function label(ctx: Ctx, s: string, x: number, y: number, tx: number, ty: number, color = MUTED, a = 1, align: CanvasTextAlign = "left") {
  alpha(ctx, a);
  line(ctx, x, y, tx, ty, color, 1, [3, 4]);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  text(ctx, s, tx, ty, 13, "#C9D4E6", align, 600, true);
  alpha(ctx, 1);
}
/** Animated flow dashes. Offset is a pure function of frame. */
function flowLine(ctx: Ctx, pts: [number, number][], color: string, frame: number, w = 3, speed = 2.2, a = 1) {
  alpha(ctx, a); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = "round";
  ctx.setLineDash([10, 14]); ctx.lineDashOffset = -frame * speed;
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.setLineDash([]); alpha(ctx, 1);
}
function arrowHead(ctx: Ctx, x: number, y: number, ang: number, color: string, s = 8) {
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x - s * Math.cos(ang - 0.45), y - s * Math.sin(ang - 0.45));
  ctx.lineTo(x - s * Math.cos(ang + 0.45), y - s * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
}
function pill(ctx: Ctx, s: string, x: number, y: number, color: string, a = 1, align: CanvasTextAlign = "left") {
  ctx.font = `700 11px "JetBrains Mono", ui-monospace, monospace`;
  const w = ctx.measureText(s).width + 20;
  const px = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  alpha(ctx, a); rect(ctx, px, y - 13, w, 26, "#0D1626", color, 1, 13);
  text(ctx, s, px + w / 2, y + 1, 11, color, "center", 700, true); alpha(ctx, 1);
}

/* ---------------- stack geometry ---------------- */
interface Layer { name: string; sub: string; w: number; fill: string; edge: string }
const LAYERS: Layer[] = [
  { name: "END PLATE", sub: "compression", w: 34, fill: STRUCT_D, edge: STRUCT_L },
  { name: "BIPOLAR PLATE", sub: "flow field · anode", w: 22, fill: STRUCT, edge: STRUCT_L },
  { name: "PTL", sub: "porous transport", w: 18, fill: "#2C3A50", edge: "#3D4F6B" },
  { name: "CATALYST", sub: "anode · OER", w: 10, fill: "#4A3F22", edge: GOLD },
  { name: "PEM MEMBRANE", sub: "proton conductor", w: 14, fill: "#D8D2BE", edge: BONE },
  { name: "CATALYST", sub: "cathode · HER", w: 10, fill: "#4A3F22", edge: GOLD },
  { name: "PTL", sub: "porous transport", w: 18, fill: "#2C3A50", edge: "#3D4F6B" },
  { name: "BIPOLAR PLATE", sub: "flow field · cathode", w: 22, fill: STRUCT, edge: STRUCT_L },
  { name: "END PLATE", sub: "compression", w: 34, fill: STRUCT_D, edge: STRUCT_L },
];
const STACK_CX = 640, STACK_CY = 330, STACK_H = 250;

function layerCenters(spread: number): number[] {
  const widths = LAYERS.map((l) => l.w);
  const totalNatural = widths.reduce((a, b) => a + b, 0);
  const gap = spread * 16;
  const total = totalNatural + gap * (LAYERS.length - 1);
  let x = STACK_CX - total / 2;
  return LAYERS.map((l, i) => { const c = x + l.w / 2; x += l.w + gap; return c; });
}

function drawStack(ctx: Ctx, frame: number, explode: number, opts: { channels?: number; coolant?: number; dim?: number } = {}) {
  const centers = layerCenters(explode);
  alpha(ctx, opts.dim ?? 1);
  // tie rods
  [-STACK_H / 2 - 18, STACK_H / 2 + 18].forEach((dy) => {
    line(ctx, centers[0] - 34, STACK_CY + dy, centers[8] + 34, STACK_CY + dy, STRUCT_L, 5);
  });
  LAYERS.forEach((l, i) => {
    const cx = centers[i], x = cx - l.w / 2, y = STACK_CY - STACK_H / 2;
    rect(ctx, x, y, l.w, STACK_H, l.fill, l.edge, i === 4 ? 2 : 1, 3);
    if (i === 4) { // membrane hydration ticks
      ctx.fillStyle = "rgba(0,229,255,.35)";
      for (let k = 0; k < 9; k++) ctx.fillRect(x + 3, y + 16 + k * 26, l.w - 6, 2);
    }
    if ((i === 1 || i === 7) && (opts.channels ?? 0) > 0) { // flow channels
      alpha(ctx, (opts.dim ?? 1) * (opts.channels ?? 0));
      ctx.strokeStyle = CYAN; ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) {
        const yy = y + 28 + k * 38;
        ctx.beginPath(); ctx.moveTo(x + 3, yy);
        ctx.lineTo(x + l.w - 3, yy + (i === 1 ? 8 : -8)); ctx.stroke();
      }
      alpha(ctx, opts.dim ?? 1);
    }
    if ((i === 1 || i === 7) && (opts.coolant ?? 0) > 0) {
      alpha(ctx, (opts.dim ?? 1) * (opts.coolant ?? 0) * 0.9);
      ctx.strokeStyle = CYAN; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -frame * 1.4;
      ctx.beginPath(); ctx.moveTo(x + l.w / 2, y + 8); ctx.lineTo(x + l.w / 2, y + STACK_H - 8); ctx.stroke(); ctx.setLineDash([]);
      alpha(ctx, opts.dim ?? 1);
    }
    if (i === 3 || i === 5) { // catalyst speckle, deterministic
      ctx.fillStyle = GOLD;
      for (let k = 0; k < 14; k++) {
        const px = x + 2 + hash01(i * 100 + k) * (l.w - 4);
        const py = y + 10 + hash01(i * 200 + k) * (STACK_H - 20);
        ctx.fillRect(px, py, 2, 2);
      }
    }
  });
  alpha(ctx, 1);
  return centers;
}

function drawStackLabels(ctx: Ctx, centers: number[], p: number) {
  const top = STACK_CY - STACK_H / 2, bot = STACK_CY + STACK_H / 2;
  const items: [number, string, number, number, CanvasTextAlign][] = [
    [0, "END PLATE", centers[0] - 10, top - 42, "right"],
    [1, "BIPOLAR PLATE", centers[1], top - 66, "center"],
    [2, "PTL (ANODE)", centers[2] + 6, bot + 44, "center"],
    [3, "ANODE CATALYST", centers[3], top - 66, "center"],
    [4, "PEM MEMBRANE", centers[4], bot + 68, "center"],
    [5, "CATHODE CATALYST", centers[5], top - 90, "center"],
    [6, "PTL (CATHODE)", centers[6] - 6, bot + 44, "center"],
    [7, "BIPOLAR PLATE", centers[7], top - 42, "center"],
    [8, "END PLATE", centers[8] + 10, top - 66, "left"],
  ];
  items.forEach(([idx, s, tx, ty, al], k) => {
    const a = window(p, 0.08 + k * 0.055, 0.2 + k * 0.055, 1.1, 1.2);
    const isTop = ty < STACK_CY;
    label(ctx, s, centers[idx as number], isTop ? top - 4 : bot + 4, tx, ty, idx === 4 ? VIOLET : MUTED, a, al);
  });
  // compression arrows (gold = actuation/energy)
  const a = window(p, 0.45, 0.6, 1.1, 1.2);
  alpha(ctx, a);
  [-70, 0, 70].forEach((dy) => {
    line(ctx, centers[0] - 86, STACK_CY + dy, centers[0] - 44, STACK_CY + dy, GOLD, 3); arrowHead(ctx, centers[0] - 42, STACK_CY + dy, 0, GOLD);
    line(ctx, centers[8] + 86, STACK_CY + dy, centers[8] + 44, STACK_CY + dy, GOLD, 3); arrowHead(ctx, centers[8] + 42, STACK_CY + dy, Math.PI, GOLD);
  });
  text(ctx, "TIE-ROD COMPRESSION", STACK_CX, STACK_CY + STACK_H / 2 + 96, 11, GOLD, "center", 700, true);
  alpha(ctx, 1);
}

/* ---------------- chapters ---------------- */
function drawWater(ctx: Ctx, frame: number, p: number, centers: number[]) {
  const a = window(p, 0.02, 0.14, 0.94, 1.05);
  // tank + pump, left
  const tx = 218, ty = 300;
  alpha(ctx, a);
  rect(ctx, tx - 62, ty - 78, 124, 156, PANEL, STRUCT_L, 1.5, 10);
  rect(ctx, tx - 50, ty + 6, 100, 58, "rgba(0,229,255,.13)", CYAN, 1, 6);
  text(ctx, "DI WATER", tx, ty - 56, 13, BONE, "center", 700, true);
  text(ctx, "feed tank", tx, ty - 36, 11, MUTED, "center", 500, true);
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(tx + 92, ty + 30, 17, 0, Math.PI * 2); ctx.fill();
  text(ctx, "P", tx + 92, ty + 31, 14, INK, "center", 800, true);
  text(ctx, "PUMP", tx + 92, ty + 60, 10, GOLD, "center", 700, true);
  alpha(ctx, 1);
  flowLine(ctx, [[tx + 62, ty + 10], [tx + 92, ty + 10], [tx + 92, ty + 30]], CYAN, frame, 3, 2.2, a);
  flowLine(ctx, [[tx + 109, ty + 30], [centers[1], ty + 30], [centers[1], STACK_CY - 60]], CYAN, frame, 3.5, 2.2, a);
  // manifold distribution to cells (repeated ticks)
  alpha(ctx, a);
  for (let k = 0; k < 5; k++) {
    const yy = STACK_CY - 88 + k * 44;
    line(ctx, centers[1], yy, centers[3] - 6, yy, CYAN, 2, []);
    arrowHead(ctx, centers[3] - 6, yy, 0, CYAN, 7);
  }
  text(ctx, "MANIFOLD DISTRIBUTES FEED TO EVERY CELL", STACK_CX - 60, STACK_CY - STACK_H / 2 - 40, 12, CYAN, "center", 700, true);
  text(ctx, "Water is fed to the anode side in a generic PEM electrolyzer.", STACK_CX - 60, STACK_CY + STACK_H / 2 + 52, 13, "#C9D4E6", "center", 500);
  alpha(ctx, 1);
}

function drawGas(ctx: Ctx, frame: number, p: number, centers: number[]) {
  const a = window(p, 0.02, 0.12, 0.95, 1.06);
  const memX = centers[4], anX = centers[3], caX = centers[5];
  const top = STACK_CY - STACK_H / 2, bot = STACK_CY + STACK_H / 2;
  alpha(ctx, a);
  // protons crossing membrane (cyan dots, deterministic loop)
  for (let i = 0; i < 10; i++) {
    const t = ((frame * 0.006 + i / 10) % 1);
    const x = lerp(anX + 8, caX - 8, t);
    const y = top + 24 + hash01(i * 7 + 3) * (STACK_H - 48);
    ctx.fillStyle = CYAN; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    text(ctx, "H+", x, y - 11, 9, CYAN, "center", 700, true);
  }
  text(ctx, "PROTONS CROSS THE MEMBRANE", memX, bot + 34, 12, CYAN, "center", 700, true);
  // electrons: external gold circuit over the top
  flowLine(ctx, [[anX, top - 6], [anX, top - 64], [caX, top - 64], [caX, top - 6]], GOLD, frame, 3.5, 3, a);
  text(ctx, "e-  ELECTRONS TAKE THE EXTERNAL CIRCUIT", (anX + caX) / 2, top - 82, 12, GOLD, "center", 700, true);
  // DC supply marker on the electron path
  const midX = (anX + caX) / 2;
  rect(ctx, midX - 30, top - 78, 60, 26, INK, GOLD, 1.5, 6);
  text(ctx, "DC", midX, top - 64, 12, GOLD, "center", 800, true);
  // bubbles: anode O2 (left), cathode H2 (right, twice the count, stoich. 2:1 by moles)
  const bubble = (cx: number, n: number, seedBase: number, color: string, lab: string) => {
    for (let i = 0; i < n; i++) {
      const cycle = 130 + hash01(seedBase + i) * 60;
      const t = ((frame + i * 37) % cycle) / cycle;
      const y = lerp(bot - 14, top + 18, t);
      const x = cx + Math.sin(t * 9 + i) * 5 + (hash01(seedBase + i * 3) - 0.5) * 14;
      const r = 2.5 + t * 5;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    }
    text(ctx, lab, cx, top - 22, 13, color, "center", 800, true);
  };
  bubble(centers[2] - 16, 7, 500, CYAN, "O2");
  bubble(centers[6] + 16, 13, 900, CYAN, "H2");
  // equations
  const eqA = window(p, 0.18, 0.3, 0.95, 1.06), eqC = window(p, 0.34, 0.46, 0.95, 1.06);
  alpha(ctx, a * eqA); rect(ctx, 196, 128, 330, 62, PANEL, CYAN, 1.2, 8);
  text(ctx, "ANODE (OXIDATION)", 212, 148, 11, CYAN, "left", 700, true);
  text(ctx, "2H2O  →  O2 + 4H+ + 4e-", 212, 172, 17, BONE, "left", 700, true); alpha(ctx, 1);
  alpha(ctx, a * eqC); rect(ctx, 754, 128, 330, 62, PANEL, CYAN, 1.2, 8);
  text(ctx, "CATHODE (REDUCTION)", 770, 148, 11, CYAN, "left", 700, true);
  text(ctx, "4H+ + 4e-  →  2H2", 770, 172, 17, BONE, "left", 700, true); alpha(ctx, 1);
  alpha(ctx, a);
  text(ctx, "BUBBLE COUNT SHOWS THE 2:1 H2:O2 MOLE RATIO FROM THE EQUATIONS ABOVE.", STACK_CX, bot + 62, 11, MUTED, "center", 600, true);
  alpha(ctx, 1);
}

function drawCooling(ctx: Ctx, frame: number, p: number, centers: number[]) {
  const a = window(p, 0.02, 0.12, 0.94, 1.05);
  alpha(ctx, a);
  // heat leaving stack (gold arrows up)
  for (let k = 0; k < 5; k++) {
    const x = lerp(centers[1], centers[7], k / 4);
    const bob = Math.sin(frame * 0.08 + k * 1.7) * 4;
    line(ctx, x, STACK_CY - STACK_H / 2 - 12 + bob, x, STACK_CY - STACK_H / 2 - 44 + bob, GOLD, 3);
    arrowHead(ctx, x, STACK_CY - STACK_H / 2 - 48 + bob, -Math.PI / 2, GOLD, 8);
  }
  text(ctx, "WASTE HEAT", STACK_CX, STACK_CY - STACK_H / 2 - 66, 12, GOLD, "center", 700, true);
  // coolant loop to exchanger (bottom)
  const exX = 900, exY = 560;
  flowLine(ctx, [[centers[7] + 10, STACK_CY + 80], [exX - 90, STACK_CY + 80], [exX - 90, exY - 30]], CYAN, frame, 3.5, 2, a);
  flowLine(ctx, [[exX + 90, exY - 30], [exX + 90, STACK_CY + 100], [centers[1] - 10, STACK_CY + 100]], CYAN, frame, 3, 2, a * 0.75);
  rect(ctx, exX - 92, exY - 32, 184, 64, PANEL, CYAN, 1.5, 10);
  text(ctx, "HEAT EXCHANGER", exX, exY - 10, 12, BONE, "center", 700, true);
  text(ctx, "coolant in · coolant out", exX, exY + 12, 11, MUTED, "center", 500, true);
  text(ctx, "WARM COOLANT OUT", exX - 150, STACK_CY + 66, 10, CYAN, "center", 700, true);
  text(ctx, "COOLED RETURN", exX + 150, STACK_CY + 116, 10, CYAN, "center", 700, true);
  // violet sensors + schematic trace
  [centers[1], centers[4], centers[7]].forEach((x, i) => {
    const y = STACK_CY - STACK_H / 2 - 8;
    ctx.fillStyle = VIOLET; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    text(ctx, `T${i + 1}`, x, y - 16, 10, VIOLET, "center", 700, true);
  });
  const gx = 150, gy = 486, gw = 300, gh = 104;
  rect(ctx, gx, gy, gw, gh, PANEL, VIOLET, 1.2, 8);
  text(ctx, "STACK TEMPERATURE · SENSING (VIOLET)", gx + 14, gy + 18, 10, VIOLET, "left", 700, true);
  ctx.strokeStyle = VIOLET; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 0; x <= gw - 28; x += 4) {
    const t = x / (gw - 28);
    const reveal = clamp01((p - 0.15) / 0.6) * (gw - 28);
    if (x > reveal) break;
    const y = gy + gh - 22 - (0.42 + 0.3 * (1 - Math.exp(-t * 4)) + Math.sin(t * 22 + frame * 0.02) * 0.012) * (gh - 48);
    x === 0 ? ctx.moveTo(gx + 14 + x, y) : ctx.lineTo(gx + 14 + x, y);
  }
  ctx.stroke();
  line(ctx, gx + 14, gy + 34, gx + gw - 14, gy + 34, "rgba(157,78,221,.4)", 1, [4, 5]);
  text(ctx, "controller setpoint (schematic)", gx + 14, gy + gh - 12, 9, MUTED, "left", 500, true);
  text(ctx, "Sensors adjust coolant flow. No measured data is shown.", gx + 14, gy + gh + 18, 11, "#C9D4E6", "left", 500);
  alpha(ctx, 1);
}

function drawBOP(ctx: Ctx, frame: number, p: number) {
  const a = window(p, 0.04, 0.18, 1.1, 1.2);
  const settle = ease(clamp01((p - 0.55) / 0.35)); // extra stability at the end
  const flowA = a * (1 - settle * 0.35);
  const box = (x: number, y: number, w: number, h: number, title: string, sub: string, color: string) => {
    rect(ctx, x, y, w, h, PANEL, color, 1.5, 10);
    text(ctx, title, x + w / 2, y + 22, 12, BONE, "center", 700, true);
    text(ctx, sub, x + w / 2, y + 42, 10, MUTED, "center", 500, true);
  };
  alpha(ctx, a);
  box(84, 108, 208, 62, "DC POWER SUPPLY", "actuation · gold", GOLD);
  box(84, 402, 208, 62, "WATER SKID", "DI polish · pump · cyan", CYAN);
  box(988, 108, 208, 62, "H2 SEPARATOR + DRYER", "gas out · cyan", CYAN);
  box(988, 266, 208, 62, "O2 SEPARATOR", "vent with water return", CYAN);
  box(988, 424, 208, 62, "RADIATOR / HX", "cooling loop · cyan", CYAN);
  box(536, 84, 208, 52, "CONTROLLER + SENSORS", "sensing · violet", VIOLET);
  alpha(ctx, 1);
  // connections (kept thin so the stack stays the subject)
  flowLine(ctx, [[292, 139], [470, 139], [470, STACK_CY - 90]], GOLD, frame, 3, 2.4, flowA);
  flowLine(ctx, [[292, 433], [420, 433], [420, STACK_CY + 70]], CYAN, frame, 3, 2.2, flowA);
  flowLine(ctx, [[810, STACK_CY - 50], [988, 139]], CYAN, frame, 3, 2.2, flowA);
  flowLine(ctx, [[810, STACK_CY + 30], [988, 297]], CYAN, frame, 2.5, 2, flowA * 0.8);
  flowLine(ctx, [[810, STACK_CY + 95], [988, 455]], CYAN, frame, 2.5, 1.8, flowA * 0.8);
  alpha(ctx, a * 0.95);
  line(ctx, 640, 136, 640, STACK_CY - STACK_H / 2 - 14, VIOLET, 2, [4, 5]);
  text(ctx, "STACK", STACK_CX, STACK_CY + STACK_H / 2 + 34, 13, BONE, "center", 800, true);
  alpha(ctx, 1);
  // end card
  if (p > 0.72) {
    const ea = ease(clamp01((p - 0.72) / 0.18));
    alpha(ctx, ea);
    rect(ctx, 340, 596, 600, 54, "#0D1626", STRUCT_L, 1, 10);
    text(ctx, "COMPLETE SYSTEM · STABLE VIEW", STACK_CX, 616, 14, BONE, "center", 800, true);
    text(ctx, "Power and water in. Hydrogen and oxygen out. Heat removed. State sensed.", STACK_CX, 638, 11, MUTED, "center", 500, true);
    alpha(ctx, 1);
  }
}

/* ---------------- screen-space HUD ---------------- */
function drawHUD(ctx: Ctx, frame: number) {
  const c = chapterAt(frame), p = chapterProgress(frame);
  // top bar
  rect(ctx, 0, 0, W, 58, "rgba(7,11,20,.92)", "", 0, 0);
  line(ctx, 0, 58, W, 58, STRUCT, 1);
  text(ctx, "PEM ELECTROLYZER STACK", 24, 22, 15, BONE, "left", 800, true);
  text(ctx, "ANATOMY MOTION EXPLAINER · GENERIC PEM · NOT A COMMERCIAL DESIGN", 24, 42, 10, MUTED, "left", 600, true);
  text(ctx, `${c.short}`, 640, 22, 13, CYAN, "center", 800, true);
  text(ctx, c.cameraNote.toUpperCase(), 640, 42, 9, MUTED, "center", 600, true);
  const { timecode } = requireTimecode(frame);
  text(ctx, timecode, W - 24, 22, 15, BONE, "right", 700, true);
  text(ctx, `FRAME ${String(frame).padStart(4, "0")} / ${TOTAL_FRAMES - 1} · 30 FPS`, W - 24, 42, 10, MUTED, "right", 600, true);
  pill(ctx, c.scaleNote, W / 2, 82, VIOLET, 0.95, "center");
  // causal ribbon (always visible: the chain that links chapters)
  const ry = H - 44;
  rect(ctx, 0, ry - 20, W, 64, "rgba(7,11,20,.92)", "", 0, 0);
  line(ctx, 0, ry - 20, W, ry - 20, STRUCT, 1);
  const nodes = ["DC POWER + DI WATER", "MEA REACTION", "H2 / O2 SEPARATION", "HEAT REMOVAL", "BALANCE OF PLANT"];
  const active = [1, 0, 2, 3, 4][c.index] ?? c.index;
  // map chapter -> ribbon node: water feed highlights input, gas highlights reaction+separation
  const activeNode = c.index === 0 ? 1 : c.index === 1 ? 0 : c.index === 2 ? 2 : c.index === 3 ? 3 : 4;
  void active;
  nodes.forEach((n, i) => {
    const x = 150 + i * 245, isA = i === activeNode || (c.index === 2 && i === 1);
    const col = i === 3 ? GOLD : i === 4 ? VIOLET : CYAN;
    const colr = isA ? col : STRUCT_L;
    rect(ctx, x - 104, ry - 8, 208, 30, isA ? "#0D1B2E" : "transparent", colr, isA ? 1.5 : 1, 15);
    text(ctx, n, x, ry + 8, 10, isA ? BONE : MUTED, "center", 700, true);
    if (i < nodes.length - 1) arrowHead(ctx, x + 122, ry + 7, 0, isA ? col : STRUCT_L, 7);
  });
  // segmented progress
  CHAPTERS.forEach((ch) => {
    const x0 = (ch.start / TOTAL_FRAMES) * W, x1 = (ch.end / TOTAL_FRAMES) * W;
    rect(ctx, x0, H - 6, x1 - x0 - 2, 4, frame >= ch.start ? CYAN : STRUCT_D, "", 0, 1);
    if (frame >= ch.start && frame < ch.end) rect(ctx, x0, H - 6, (x1 - x0) * p, 4, GOLD, "", 0, 1);
  });
}
function requireTimecode(frame: number) {
  const s = frame / 30;
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  const ff = String(frame % 30).padStart(2, "0");
  return { timecode: `${mm}:${ss}:${ff}` };
}

/* ---------------- main render: pure function of frame ---------------- */
export function render(ctx: Ctx, frameRaw: number) {
  const frame = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(frameRaw)));
  const c = chapterAt(frame), p = chapterProgress(frame);
  const cam = cameraAt(frame);

  ctx.save();
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
  // stage grid
  ctx.strokeStyle = "rgba(255,255,255,.045)"; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // camera
  ctx.translate(W / 2, H / 2); ctx.scale(cam.scale, cam.scale); ctx.translate(-cam.cx, -cam.cy);

  const explode = c.index === 0 ? ease(clamp01(p / 0.5)) : c.index === 1 ? lerp(1, 0.25, ease(clamp01(p / 0.6))) : 0.18;
  const assembled = c.index >= 2;
  const centers = drawStack(ctx, frame, explode, {
    channels: c.index === 1 ? window(p, 0.1, 0.3, 0.9, 1) : 0,
    coolant: c.index === 3 ? window(p, 0.1, 0.3, 0.9, 1) : c.index === 4 ? 0.5 : 0,
    dim: c.index === 4 ? 0.92 : 1,
  });
  if (c.index === 0) drawStackLabels(ctx, centers, p);
  if (c.index === 1) drawWater(ctx, frame, p, centers);
  if (c.index === 2) drawGas(ctx, frame, p, centers);
  if (c.index === 3) drawCooling(ctx, frame, p, centers);
  if (c.index === 4) drawBOP(ctx, frame, p);
  if (assembled && c.index === 2) {
    pill(ctx, "LABELED SCHEMATIC · INTERFACES ENLARGED, NOT A MICROGRAPH", STACK_CX, 96, VIOLET, window(p, 0.05, 0.2, 0.9, 1), "center");
  }
  ctx.restore();
  drawHUD(ctx, frame);
}
