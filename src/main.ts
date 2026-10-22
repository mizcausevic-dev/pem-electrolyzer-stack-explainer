import "./style.css";
import { render, W, H } from "./render";
import { CHAPTERS, TOTAL_FRAMES, FPS, chapterAt, clampFrame, timecode } from "./timeline";

const canvas = document.getElementById("stage") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const dpr = Math.min(2, window.devicePixelRatio || 1);
canvas.width = W * dpr; canvas.height = H * dpr;

const playBtn = document.getElementById("play") as HTMLButtonElement;
const scrub = document.getElementById("scrub") as HTMLInputElement;
const frameOut = document.getElementById("frameOut")!;
const chapterOut = document.getElementById("chapterOut")!;
const narration = document.getElementById("narration")!;
const speedSel = document.getElementById("speed") as HTMLSelectElement;

const params = new URLSearchParams(location.search);
let frame = clampFrame(Number(params.get("frame") ?? 0));
let playing = false;
let lastTs = 0;
let lastChapter = -1;
let acc = 0;

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render(ctx, frame);
  scrub.value = String(frame);
  const c = chapterAt(frame);
  frameOut.textContent = `${timecode(frame)} · frame ${frame} / ${TOTAL_FRAMES - 1}`;
  if (c.index !== lastChapter) {
    lastChapter = c.index;
    chapterOut.textContent = c.title;
    narration.textContent = c.narration;
    document.querySelectorAll<HTMLButtonElement>("[data-chapter]").forEach((b) =>
      b.classList.toggle("active", Number(b.dataset.chapter) === c.index));
    document.querySelectorAll<HTMLElement>("[data-narrate]").forEach((el) => {
      const on = Number(el.dataset.narrate) === c.index;
      el.classList.toggle("active", on);
    });
  }
}
function setPlaying(on: boolean) {
  playing = on;
  playBtn.textContent = on ? "❚❚ Pause" : "▶ Play";
  playBtn.setAttribute("aria-pressed", String(on));
}
function loop(ts: number) {
  if (playing) {
    if (lastTs) {
      const speed = Number(speedSel.value || 1);
      acc += ((ts - lastTs) / 1000) * FPS * speed;
      const step = Math.floor(acc); acc -= step;
      if (step > 0) {
        frame = clampFrame(frame + step);
        if (frame >= TOTAL_FRAMES - 1) setPlaying(false);
        draw();
      }
    }
    lastTs = ts;
    if (playing) requestAnimationFrame(loop); else lastTs = 0;
  }
}
playBtn.addEventListener("click", () => {
  if (!playing && frame >= TOTAL_FRAMES - 1) frame = 0;
  setPlaying(!playing);
  if (playing) { lastTs = 0; requestAnimationFrame(loop); }
});
scrub.addEventListener("input", () => { setPlaying(false); frame = clampFrame(Number(scrub.value)); draw(); });
document.getElementById("restart")!.addEventListener("click", () => { frame = 0; draw(); setPlaying(true); lastTs = 0; requestAnimationFrame(loop); });
document.getElementById("prev")!.addEventListener("click", () => { setPlaying(false); frame = clampFrame(frame - 1); draw(); });
document.getElementById("next")!.addEventListener("click", () => { setPlaying(false); frame = clampFrame(frame + 1); draw(); });
document.querySelectorAll<HTMLButtonElement>("[data-chapter]").forEach((b) =>
  b.addEventListener("click", () => { setPlaying(false); frame = CHAPTERS[Number(b.dataset.chapter)].start; draw(); }));
document.querySelectorAll<HTMLElement>("[data-narrate]").forEach((el) =>
  el.addEventListener("click", () => { setPlaying(false); frame = CHAPTERS[Number(el.dataset.narrate)].start; draw(); }));
document.getElementById("exportPng")!.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = `pem-electrolyzer-frame-${String(frame).padStart(4, "0")}.png`;
  a.href = canvas.toDataURL("image/png"); a.click();
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); playBtn.click(); }
  if (e.key === "ArrowRight") { setPlaying(false); frame = clampFrame(frame + (e.shiftKey ? 30 : 1)); draw(); }
  if (e.key === "ArrowLeft") { setPlaying(false); frame = clampFrame(frame - (e.shiftKey ? 30 : 1)); draw(); }
});

// Build chapter buttons + narration list from the same data the renderer uses.
const btnWrap = document.getElementById("chapters")!;
CHAPTERS.forEach((c) => {
  const b = document.createElement("button");
  b.dataset.chapter = String(c.index);
  b.innerHTML = `<span>${c.short}</span><small>${(c.start / FPS).toFixed(0)}s–${(c.end / FPS).toFixed(0)}s · f${c.start}–${c.end - 1}</small>`;
  btnWrap.appendChild(b);
});
const list = document.getElementById("narrateList")!;
CHAPTERS.forEach((c) => {
  const li = document.createElement("li");
  li.dataset.narrate = String(c.index);
  li.innerHTML = `<strong>${c.title}</strong><span>${c.narration}</span><em>${c.cameraNote}. ${c.scaleNote}.</em>`;
  list.appendChild(li);
});

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
draw();
// Autoplay only when no explicit frame was requested and motion is allowed.
if (!params.has("frame") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setPlaying(true); requestAnimationFrame(loop);
}
