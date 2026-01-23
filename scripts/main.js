(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Reveal-on-scroll
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      }
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  }

  // Background banners: activate based on section in view
  const banners = Array.from(document.querySelectorAll(".bg__banner"));
  const watched = Array.from(document.querySelectorAll("[data-banner]"));

  const setBanner = (idx) => {
    banners.forEach((b, i) => b.classList.toggle("is-active", i === idx));
  };

  if (banners.length && watched.length) {
    const ioBg = new IntersectionObserver((entries) => {
      // choose the most visible intersecting section
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const raw = visible.target.getAttribute("data-banner");
      const n = Number(raw || "0");
      if (!Number.isFinite(n)) return;

      // data-banner is 0..4; we map 1..4 → banners 0..3
      if (n >= 1 && n <= 4) setBanner(n - 1);
      else setBanner(-1);
    }, { threshold: [0.18, 0.35, 0.55] });

    watched.forEach(el => ioBg.observe(el));
  }

  // Logo carousel (one at a time, pauses on hover/touch)
  const logoSlides = Array.from(document.querySelectorAll(".logoSlide"));
  const logoBox = document.querySelector(".logoCarousel");
  let logoIdx = 0;
  let logoPaused = false;

  const showLogo = (i) => {
    logoSlides.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
  };

  const nextLogo = () => {
    if (!logoSlides.length || logoPaused) return;
    logoIdx = (logoIdx + 1) % logoSlides.length;
    showLogo(logoIdx);
  };

  if (logoSlides.length) {
    showLogo(0);
    const t = setInterval(nextLogo, 2200);

    if (logoBox) {
      logoBox.addEventListener("pointerenter", () => logoPaused = true);
      logoBox.addEventListener("pointerleave", () => logoPaused = false);
      logoBox.addEventListener("pointerdown", () => logoPaused = true);
      logoBox.addEventListener("pointerup", () => logoPaused = false);
      logoBox.addEventListener("pointercancel", () => logoPaused = false);
    }
  }

  // Projects deck carousel (pauses on hover/touch)
  const deck = document.querySelector(".deck");
  const slides = Array.from(document.querySelectorAll(".deckSlide"));
  const dots = Array.from(document.querySelectorAll(".dot"));
  const prevBtn = document.getElementById("deckPrev");
  const nextBtn = document.getElementById("deckNext");

  let deckIdx = 0;
  let deckPaused = false;

  const showDeck = (i) => {
    if (!slides.length) return;
    deckIdx = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === deckIdx));
    dots.forEach((d, idx) => d.classList.toggle("is-active", idx === deckIdx));
  };

  const tickDeck = () => {
    if (!slides.length || deckPaused) return;
    showDeck(deckIdx + 1);
  };

  if (slides.length) {
    showDeck(0);
    const t2 = setInterval(tickDeck, 2600);

    if (deck) {
      deck.addEventListener("pointerenter", () => deckPaused = true);
      deck.addEventListener("pointerleave", () => deckPaused = false);
      deck.addEventListener("pointerdown", () => deckPaused = true);
      deck.addEventListener("pointerup", () => deckPaused = false);
      deck.addEventListener("pointercancel", () => deckPaused = false);
    }

    dots.forEach((d, idx) => d.addEventListener("click", () => showDeck(idx)));
    if (prevBtn) prevBtn.addEventListener("click", () => showDeck(deckIdx - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => showDeck(deckIdx + 1));
  }

  // Contact form (Formspree + spam protections)
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const tsField = document.getElementById("fp_ts");
  const elapsedField = document.getElementById("fp_elapsed");
  const humanCheck = document.getElementById("humanCheck");

  if (form && status) {
    const startTs = Date.now();
    if (tsField) tsField.value = String(startTs);

    form.addEventListener("submit", async (e) => {
      const gotcha = form.querySelector('input[name="_gotcha"]');
      if (gotcha && gotcha.value.trim().length > 0) {
        e.preventDefault();
        status.textContent = "Submission blocked.";
        return;
      }

      if (humanCheck && !humanCheck.checked) {
        e.preventDefault();
        status.textContent = "Please confirm you’re a real person.";
        return;
      }

      const elapsed = Date.now() - startTs;
      if (elapsedField) elapsedField.value = String(elapsed);

      if (elapsed < 2500) {
        e.preventDefault();
        status.textContent = "Please take a moment to review your message, then send again.";
        return;
      }

      const action = form.getAttribute("action") || "";
      if (!action || action.includes("xeeakvbd")) {
        e.preventDefault();
        status.textContent = "Form endpoint not set. Replace xeeakvbd with your Formspree ID.";
        return;
      }

      e.preventDefault();
      status.textContent = "Sending…";

      try {
        const res = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { "Accept": "application/json" }
        });

        if (res.ok) {
          form.reset();
          status.textContent = "Message sent. I’ll get back to you shortly.";
        } else {
          status.textContent = "Something went wrong. Please try again or use the email link below.";
        }
      } catch {
        status.textContent = "Network error. Please try again or use the email link below.";
      }
    });
  }
})();