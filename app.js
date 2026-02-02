// ===== Helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function setBodyLock(isLocked) {
  document.body.style.overflow = isLocked ? "hidden" : "";
}

// ===== Time widgets
function tickTime() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  $("#localTime").textContent = `${hh}:${mm}`;
}
tickTime();
setInterval(tickTime, 15000);

$("#year").textContent = String(new Date().getFullYear());

// ===== Reveal on scroll
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("is-in");
    });
  },
  { threshold: 0.12 }
);

$$(".reveal").forEach((el) => io.observe(el));

// ===== Topbar theme & elevation
const topbar = $(".topbar");
const elevate = () => {
  const y = window.scrollY || 0;
  topbar.classList.toggle("is-elevated", y > 8);
  topbar.classList.toggle("is-dark", y < window.innerHeight * 0.75);
};
elevate();
window.addEventListener("scroll", elevate, { passive: true });

// ===== Progress bar
const progressBar = $("#progressBar");
function updateProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  progressBar.style.width = `${Math.round(p * 100)}%`;
}
updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });

// ===== Modal
const modal = $("#modal");
const openModalBtns = $$("[data-open-modal]");
const closeModalBtns = $$("[data-close-modal]");

function openModal() {
  modal.setAttribute("aria-hidden", "false");
  setBodyLock(true);
}
function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  setBodyLock(false);
}

openModalBtns.forEach((btn) => btn.addEventListener("click", openModal));
closeModalBtns.forEach((btn) => btn.addEventListener("click", closeModal));
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Fake submits (демо)
const bookingForm = $("#bookingForm");
const bookingSuccess = $("#bookingSuccess");
bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  bookingSuccess.hidden = false;
  bookingForm.querySelector("button[type=submit]").disabled = true;
});

const contactForm = $("#contactForm");
const contactSuccess = $("#contactSuccess");
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  contactSuccess.hidden = false;
  contactForm.querySelector("button[type=submit]").disabled = true;
});

// ===== Mobile menu
const mobile = $("[data-mobile]");
const burger = $("[data-burger]");
const closeMobileBtns = $$("[data-close-mobile]");
const mobileLinks = $$("[data-mobile-link]");

function openMobile() {
  mobile.setAttribute("aria-hidden", "false");
  burger.setAttribute("aria-expanded", "true");
  setBodyLock(true);
}
function closeMobile() {
  mobile.setAttribute("aria-hidden", "true");
  burger.setAttribute("aria-expanded", "false");
  setBodyLock(false);
}
burger.addEventListener("click", () => {
  const isOpen = mobile.getAttribute("aria-hidden") === "false";
  isOpen ? closeMobile() : openMobile();
});
closeMobileBtns.forEach((b) => b.addEventListener("click", closeMobile));
mobileLinks.forEach((a) => a.addEventListener("click", closeMobile));

// ===== Subtle parallax (hero glows)
const glows = $$(".glow");
window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY || 0;
    const t = Math.min(1, y / (window.innerHeight || 1));
    glows.forEach((g, i) => {
      const k = i ? 18 : 12;
      g.style.transform = `translateY(${t * k}px)`;
    });
  },
  { passive: true }
);

// ===== Scroll-synced car (SCRUB, straight, guaranteed offscreen at start)
(() => {
  const car = document.getElementById("car");
  const hero = document.querySelector(".hero");
  if (!car || !hero) return;

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  function update() {
    const heroTop = hero.offsetTop;
    const heroH = hero.offsetHeight;
    const y = window.scrollY;

    // Ранний старт движения (можно крутить 0.15..0.35)
    const startOffset = window.innerHeight * 0.22;

    // raw может быть <0 при самом верху — это нормально
    const raw = (y - heroTop + startOffset) / heroH;

    const t = clamp01(raw);
    const eased = t * t * (3 - 2 * t);

    // Дистанция проезда
    const travel = window.innerHeight * 1.80;

    // ВАЖНО:
    // CSS bottom:-120% держит машину полностью ниже экрана.
    // translateY(0) = полностью скрыта, translateY(отриц.) = въезжает вверх.
    const yPos = -travel * eased;

    car.style.transform = `translate3d(-50%, ${yPos}px, 0)`;

    // Показываем после первого движения
    const visible = raw > 0.03;

    // Прячем только когда машина реально уехала за верх экрана
    // car.getBoundingClientRect() уже учитывает transform
    const rect = car.getBoundingClientRect();
    const fullyAbove = rect.bottom < -20; // запас

    car.style.opacity = (visible && !fullyAbove) ? "1" : "0";
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
})();
