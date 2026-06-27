document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("open");
    });
  }

  document.querySelectorAll("[data-property-gallery]").forEach((gallery) => {
    const mainImage = gallery.querySelector(".property-gallery__main img");
    const thumbs = gallery.querySelectorAll(".property-gallery__thumb");

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const src = thumb.dataset.gallerySrc;
        if (!src || !mainImage) return;

        mainImage.src = src;
        thumbs.forEach((t) => t.classList.remove("is-active"));
        thumb.classList.add("is-active");
      });
    });
  });

  const homeHero = document.querySelector(".home-hero");
  const heroImage = document.querySelector(".home-hero__bg img");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (homeHero && heroImage && !prefersReducedMotion) {
    homeHero.addEventListener("mousemove", (event) => {
      const rect = homeHero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      heroImage.style.transform = `translate(calc(-50% + ${x * 18}px), calc(-50% + ${y * 14}px)) scale(1.08)`;
    });

    homeHero.addEventListener("mouseleave", () => {
      heroImage.style.transform = "";
    });
  }

  const revealItems = document.querySelectorAll(".reveal");

  if (revealItems.length) {
    if (prefersReducedMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      document.querySelectorAll(".home-stat[data-count]").forEach((stat) => {
        const valueEl = stat.querySelector("strong");
        if (valueEl) valueEl.textContent = `0${stat.dataset.suffix || ""}`;
      });
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");

          const stat = entry.target.classList.contains("home-stat")
            ? entry.target
            : entry.target.closest(".home-stat");

          if (stat && !prefersReducedMotion && !stat.dataset.counted) {
            animateStat(stat);
            stat.dataset.counted = "true";
          }

          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }
});

function animateStat(stat) {
  const target = Number(stat.dataset.count);
  const suffix = stat.dataset.suffix || "";
  const valueEl = stat.querySelector("strong");

  if (!valueEl || Number.isNaN(target)) return;

  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    const current = Math.round(target * eased);

    valueEl.textContent = `${current}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}
