/* ============================================
   LayerX-Style Site - Main JavaScript
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileMenu();
  initScrollAnimations();
});

/* --- Sticky Header with scroll detection --- */
function initHeader() {
  const header = document.querySelector(".header");
  if (!header) return;

  let lastScrollY = 0;
  const scrollThreshold = 10;

  function onScroll() {
    const currentScrollY = window.scrollY;

    if (currentScrollY > scrollThreshold) {
      header.classList.add("header--scrolled");
    } else {
      header.classList.remove("header--scrolled");
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* --- Mobile Menu Toggle --- */
function initMobileMenu() {
  const menuBtn = document.querySelector(".header__menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (!menuBtn || !mobileMenu) return;

  let isOpen = false;

  function toggleMenu() {
    isOpen = !isOpen;
    menuBtn.classList.toggle("header__menu-btn--open", isOpen);
    mobileMenu.classList.toggle("mobile-menu--open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  }

  menuBtn.addEventListener("click", toggleMenu);

  // Close menu on link click
  mobileMenu.querySelectorAll(".mobile-menu__link").forEach((link) => {
    link.addEventListener("click", () => {
      if (isOpen) toggleMenu();
    });
  });

  // Close menu on resize to desktop
  const mql = window.matchMedia("(min-width: 768px)");
  mql.addEventListener("change", (e) => {
    if (e.matches && isOpen) toggleMenu();
  });
}

/* --- Scroll-triggered Fade-up Animations --- */
function initScrollAnimations() {
  const targets = document.querySelectorAll(".fade-up");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-up--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  targets.forEach((target) => observer.observe(target));
}
