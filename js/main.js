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

  initPropertyGalleries();
  initLightbox();

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

function initPropertyGalleries() {
  document.querySelectorAll("[data-property-gallery]").forEach((gallery) => {
    const mainImage = gallery.querySelector(".property-gallery__main img");
    const mainWrap = gallery.querySelector(".property-gallery__main");
    const thumbs = Array.from(gallery.querySelectorAll(".property-gallery__thumb"));

    const setActive = (index) => {
      const thumb = thumbs[index];
      if (!thumb || !mainImage) return;
      const src = thumb.dataset.gallerySrc;
      if (!src) return;

      mainImage.src = src;
      thumbs.forEach((t) => t.classList.remove("is-active"));
      thumb.classList.add("is-active");
    };

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener("click", () => {
        setActive(index);
      });
    });

    if (mainWrap && mainImage) {
      mainWrap.setAttribute("role", "button");
      mainWrap.setAttribute("tabindex", "0");
      mainWrap.setAttribute("aria-label", "Ampliar foto");

      const openCurrent = () => {
        const sources = thumbs
          .map((t) => t.dataset.gallerySrc)
          .filter(Boolean);
        if (!sources.length || !window.openPropertyLightbox) return;

        const active = thumbs.findIndex((t) => t.classList.contains("is-active"));
        const index = active >= 0 ? active : 0;

        window.openPropertyLightbox(sources, index);
      };

      mainWrap.addEventListener("click", openCurrent);
      mainWrap.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCurrent();
        }
      });
    }
  });
}

function initLightbox() {
  if (document.querySelector(".lightbox")) return;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Visor de fotos");
  lightbox.innerHTML = `
    <button type="button" class="lightbox__close" aria-label="Cerrar">&times;</button>
    <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Foto anterior">&#10094;</button>
    <div class="lightbox__dialog">
      <div class="lightbox__image-wrap">
        <img class="lightbox__image" alt="">
      </div>
      <p class="lightbox__counter" aria-live="polite"></p>
    </div>
    <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Foto siguiente">&#10095;</button>
  `;
  document.body.appendChild(lightbox);

  const image = lightbox.querySelector(".lightbox__image");
  const counter = lightbox.querySelector(".lightbox__counter");
  const btnClose = lightbox.querySelector(".lightbox__close");
  const btnPrev = lightbox.querySelector(".lightbox__nav--prev");
  const btnNext = lightbox.querySelector(".lightbox__nav--next");

  let sources = [];
  let index = 0;

  const update = () => {
    if (!sources.length) return;
    image.src = sources[index];
    counter.textContent = `${index + 1} / ${sources.length}`;
  };

  const open = (list, startIndex = 0) => {
    sources = list;
    index = Math.max(0, Math.min(startIndex, sources.length - 1));
    update();
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    btnClose.focus();
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    sources = [];
  };

  const prev = () => {
    if (!sources.length) return;
    index = (index - 1 + sources.length) % sources.length;
    update();
  };

  const next = () => {
    if (!sources.length) return;
    index = (index + 1) % sources.length;
    update();
  };

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") prev();
    if (event.key === "ArrowRight") next();
  });

  window.openPropertyLightbox = open;
}

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
