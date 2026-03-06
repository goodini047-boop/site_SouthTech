// app.js
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

// ===========================
// Body scroll lock (mobile menu)
// ===========================
let lockedScrollY = 0;
function setBodyLock(isLocked) {
  const body = document.body;

  if (isLocked) {
    lockedScrollY = window.scrollY || 0;
    body.classList.add("is-locked");
    body.style.top = `-${lockedScrollY}px`;
  } else {
    body.classList.remove("is-locked");
    const top = body.style.top;
    body.style.top = "";
    const y = top ? Math.abs(parseInt(top, 10)) : lockedScrollY;
    window.scrollTo(0, y);
  }
}

// ===========================
// Time + footer year
// ===========================
function tickTime() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const el = $("#localTime");
  if (el) el.textContent = `${hh}:${mm}`;
}
tickTime();
setInterval(tickTime, 15000);

const yearEl = $("#year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// ===========================
// Reveal on scroll
// ===========================
(() => {
  const items = $$(".reveal");
  if (!items.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-in");
      }),
    { threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));
})();

// ===========================
// Topbar theme/elevation + Progress (rAF throttled)
// ===========================
const topbar = $("#topbar");
const progressBar = $("#progressBar");

function updateTopbar() {
  if (!topbar) return;
  const y = window.scrollY || 0;
  topbar.classList.toggle("is-elevated", y > 8);
  topbar.classList.toggle("is-dark", y < window.innerHeight * 0.75);
}

function updateProgress() {
  if (!progressBar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  progressBar.style.width = `${Math.round(p * 100)}%`;
}

let scrollRaf = 0;
function onScrollOrResize() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    updateTopbar();
    updateProgress();
  });
}

updateTopbar();
updateProgress();
window.addEventListener("scroll", onScrollOrResize, { passive: true });
window.addEventListener("resize", onScrollOrResize);

// ===========================
// Mobile menu
// ===========================
const mobile = $("[data-mobile]");
const burger = $("[data-burger]");
const closeMobileBtns = $$("[data-close-mobile]");
const mobileLinks = $$("[data-mobile-link]");

function openMobile() {
  if (!mobile || !burger) return;
  mobile.setAttribute("aria-hidden", "false");
  burger.setAttribute("aria-expanded", "true");
  setBodyLock(true);

  // focus first link for accessibility
  const first = mobile.querySelector("a, button");
  first?.focus?.({ preventScroll: true });
}

function closeMobile() {
  if (!mobile || !burger) return;
  mobile.setAttribute("aria-hidden", "true");
  burger.setAttribute("aria-expanded", "false");
  setBodyLock(false);

  burger.focus?.({ preventScroll: true });
}

if (burger) {
  burger.addEventListener("click", () => {
    const isOpen = mobile && mobile.getAttribute("aria-hidden") === "false";
    isOpen ? closeMobile() : openMobile();
  });
}

closeMobileBtns.forEach((b) => b.addEventListener("click", closeMobile));
mobileLinks.forEach((a) => a.addEventListener("click", closeMobile));
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mobile?.getAttribute("aria-hidden") === "false") closeMobile();
});

// Auto-close menu when switching to desktop breakpoint
window.addEventListener("resize", () => {
  if (window.innerWidth > 920 && mobile?.getAttribute("aria-hidden") === "false") closeMobile();
});

// ===========================
// Hero intro (enables animations via .hero.is-ready)
// ===========================
window.addEventListener("load", () => {
  const hero = document.querySelector(".hero");
  if (hero) requestAnimationFrame(() => hero.classList.add("is-ready"));
});

// ===========================
// Section "scan" animation (auto-plays when section enters viewport)
// ===========================
(() => {
  const section = document.getElementById("scan");
  const car = document.getElementById("scanCar");
  const blueprint = document.getElementById("scanBlueprint");
  const beam = document.getElementById("scanBeam");
  const grid = document.getElementById("scanGrid");
  const hud = document.getElementById("scanHUD");

  if (!section || !car || !blueprint || !beam) return;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const DURATION = 5000; // ms — длительность анимации

  function applyState(p) {
    const pEnter = easeOut(clamp01(p / 0.28));
    const revealStart = 0.18;
    const revealEnd = 0.52;
    const pReveal = easeInOut(clamp01((p - revealStart) / (revealEnd - revealStart)));

    const yCar = lerp(165, -50, pEnter);
    car.style.transform = `translate(-50%, ${yCar}%)`;
    car.style.opacity = String(lerp(1, 0, pReveal));

    const shA = lerp(0.18, 0.05, pReveal);
    const shY = lerp(14, 8, pReveal);
    const shB = lerp(28, 14, pReveal);
    car.style.filter = `drop-shadow(0 ${shY}px ${shB}px rgba(0,0,0,${shA}))`;

    blueprint.style.opacity = String(lerp(0, 1, pReveal));
    const clip = lerp(100, 0, pReveal);
    blueprint.style.clipPath = `inset(${clip}% 0 0 0)`;

    beam.style.opacity = String(lerp(0, 1, pReveal));
    const beamTop = lerp(112, -12, pReveal);
    beam.style.top = `${beamTop}%`;

    if (grid) grid.style.opacity = String(lerp(0, 0.55, pReveal));
    if (hud) hud.style.opacity = String(lerp(0, 0.7, pReveal));
  }

  if (prefersReducedMotion) {
    applyState(1);
    return;
  }

  let started = false;
  let startTime = null;

  function animate(ts) {
    if (!startTime) startTime = ts;
    const p = clamp01((ts - startTime) / DURATION);
    applyState(p);
    if (p < 1) requestAnimationFrame(animate);
  }

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting && !started) {
        started = true;
        io.disconnect();
        requestAnimationFrame(animate);
      }
    }),
    { threshold: 0.25 }
  );

  io.observe(section);
})();