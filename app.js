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
// Intro splash → hero reveal (wipe + FLIP)
// ===========================
window.addEventListener("load", () => {
  const intro      = document.getElementById("intro");
  const introLogo  = document.getElementById("introLogo");
  const hero       = document.querySelector(".hero");
  const heroLogoEl = document.querySelector(".logoHero");
  const heroLogoImg= document.querySelector(".logoHero img");

  if (!intro || !introLogo) {
    if (hero) requestAnimationFrame(() => hero.classList.add("is-ready"));
    return;
  }

  // Держим logoHero скрытым
  if (heroLogoEl)  heroLogoEl.style.opacity = "0";
  if (heroLogoImg) heroLogoImg.style.opacity = "0";

  // ─── Фаза 1: вайп логотипа слева → справа (1.44s)
  const phase1 = () => {
    introLogo.style.transition = "clip-path 1.44s cubic-bezier(0.22, 1, 0.36, 1)";
    introLogo.style.clipPath   = "inset(0 0% 0 0)";
  };

  // ─── Фаза 2: FLIP — логотип летит к .logoHero
  const phase2 = () => {
    if (!heroLogoImg) return;
    const fromR = introLogo.getBoundingClientRect();
    const toR   = heroLogoImg.getBoundingClientRect();
    const scale = toR.width / fromR.width;
    const tx = (toR.left + toR.width  / 2) - (fromR.left + fromR.width  / 2);
    const ty = (toR.top  + toR.height / 2) - (fromR.top  + fromR.height / 2);
    introLogo.style.transition      = "transform 0.75s cubic-bezier(0.4, 0, 0.2, 1)";
    introLogo.style.transformOrigin = "center center";
    introLogo.style.transform       = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };

  // ─── Фаза 3: мгновенная подмена → flush → убрать оверлей → is-ready
  const phase3 = () => {
    // Мгновенная подмена логотипа
    introLogo.style.transition = "none";
    introLogo.style.opacity    = "0";
    if (heroLogoEl)  { heroLogoEl.style.transition  = "none"; heroLogoEl.style.opacity  = "1"; }
    if (heroLogoImg) { heroLogoImg.style.transition = "none"; heroLogoImg.style.opacity = "1"; }

    // Синхронный layout flush — браузер рисует кадр с hero ДО следующей строки
    void document.body.offsetHeight;

    // Убираем оверлей мгновенно — никаких transition
    intro.style.display = "none";

    // Запускаем все анимации первого экрана
    if (hero) hero.classList.add("is-ready");
    const topbarEl = document.getElementById("topbar");
    if (topbarEl) topbarEl.classList.add("is-ready");

    // Возвращаем CSS-управление логотипом
    requestAnimationFrame(() => {
      if (heroLogoEl)  { heroLogoEl.style.transition = ""; heroLogoEl.style.opacity = ""; }
    });
  };

  setTimeout(phase1,  200);
  setTimeout(phase2, 1840);
  setTimeout(phase3, 2650);
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

  const DURATION = 5000; // ms — длительность основной анимации

  function applyState(p) {
    const pEnter = easeOut(clamp01(p / 0.28));
    const revealStart = 0.18;
    const revealEnd = 0.52;
    const pReveal = easeInOut(clamp01((p - revealStart) / (revealEnd - revealStart)));

    // --- Машина въезжает и растворяется ---
    const yCar = lerp(165, -50, pEnter);
    car.style.transform = `translate(-50%, ${yCar}%)`;
    car.style.opacity = String(lerp(1, 0, pReveal));

    const shA = lerp(0.18, 0.05, pReveal);
    const shY = lerp(14, 8, pReveal);
    const shB = lerp(28, 14, pReveal);
    car.style.filter = `drop-shadow(0 ${shY}px ${shB}px rgba(0,0,0,${shA}))`;

    // --- Чертёж раскрывается снизу вверх ---
    const clip = lerp(100, 0, pReveal);
    blueprint.style.opacity = String(lerp(0, 1, pReveal));
    blueprint.style.clipPath = `inset(${clip}% 0 0 0)`;

    // --- Луч строго синхронизирован с границей clip-path ---
    // clip% = отступ сверху у blueprint; граница видимой области движется снизу вверх
    beam.style.opacity = String(lerp(0, 1, pReveal));

    const stageH = section.offsetHeight || 1;
    const bpH = blueprint.offsetHeight || 0;
    // Blueprint центрирован вертикально внутри stage
    const bpOffsetTop = (stageH - bpH) / 2;
    // Граница клипа в пикселях от верха stage
    const clipBoundaryPx = bpOffsetTop + (clip / 100) * bpH;
    // Центр луча (высота луча = 160px) совмещаем с границей
    const beamTopPx = clipBoundaryPx - 80;
    beam.style.top = `${(beamTopPx / stageH) * 100}%`;

    if (grid) grid.style.opacity = String(lerp(0, 0.55, pReveal));
    if (hud) hud.style.opacity = String(lerp(0, 0.7, pReveal));
  }

  // --- Аннотации узлов: появляются последовательно после scan ---
  function startAnnotations() {
    const notes = [...section.querySelectorAll(".scanNote")];
    if (!notes.length) return;

    let idx = 0;
    function showNext() {
      if (idx >= notes.length) return;
      notes[idx].classList.add("is-visible");
      idx++;
      if (idx < notes.length) setTimeout(showNext, 380);
    }
    // Запускаем сразу после окончания скана — без задержки
    showNext();
  }

  if (prefersReducedMotion) {
    applyState(1);
    startAnnotations();
    return;
  }

  let started = false;
  let startTime = null;

  function animate(ts) {
    if (!startTime) startTime = ts;
    const p = clamp01((ts - startTime) / DURATION);
    applyState(p);
    if (p < 1) {
      requestAnimationFrame(animate);
    } else {
      // Основная анимация завершена — запускаем аннотации
      startAnnotations();
    }
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