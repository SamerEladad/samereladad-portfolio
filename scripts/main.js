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

  // Background photo switching by scroll markers
  const photoLayer = document.querySelector(".bg__photo");
  const photoMarks = Array.from(document.querySelectorAll("[data-bg]"));

  if (photoLayer && photoMarks.length) {
    const setPhoto = (url) => {
      document.documentElement.style.setProperty("--bg-photo", `url("${url}")`);
      photoLayer.classList.remove("is-off");
    };

    const ioBg = new IntersectionObserver((entries) => {
      // pick the most visible intersecting entry
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => (b.intersectionRatio - a.intersectionRatio))[0];

      if (visible) {
        const url = visible.target.getAttribute("data-bg");
        if (url) setPhoto(url);
      }
    }, { threshold: [0.12, 0.2, 0.35, 0.5] });

    photoMarks.forEach(m => ioBg.observe(m));
  }

  // Brand/logo carousel (pause on hover)
  const slot = document.querySelector("[data-brand-slot]");
  const items = Array.from(document.querySelectorAll("[data-brand-item]"));
  let idx = 0;
  let paused = false;

  const rotate = () => {
    if (!slot || items.length === 0 || paused) return;
    items.forEach((el, i) => el.style.display = (i === idx ? "block" : "none"));
    idx = (idx + 1) % items.length;
  };

  if (slot && items.length) {
    items.forEach((el, i) => el.style.display = (i === 0 ? "block" : "none"));
    slot.addEventListener("mouseenter", () => paused = true);
    slot.addEventListener("mouseleave", () => paused = false);
    slot.addEventListener("touchstart", () => paused = true, { passive: true });
    slot.addEventListener("touchend", () => paused = false, { passive: true });
    setInterval(rotate, 2200);
  }

  // Contact form (Formspree) + spam gates
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const tsField = document.getElementById("fp_ts");
  const elapsedField = document.getElementById("fp_elapsed");
  const humanCheck = document.getElementById("humanCheck");

  if (form && status) {
    const startTs = Date.now();
    if (tsField) tsField.value = String(startTs);

    form.addEventListener("submit", async (e) => {
      // honeypot
      const gotcha = form.querySelector('input[name="_gotcha"]');
      if (gotcha && gotcha.value.trim().length > 0) {
        e.preventDefault();
        status.textContent = "Submission blocked.";
        return;
      }

      // human checkbox
      if (humanCheck && !humanCheck.checked) {
        e.preventDefault();
        status.textContent = "Please confirm you’re a real person.";
        return;
      }

      // time-to-submit
      const elapsed = Date.now() - startTs;
      if (elapsedField) elapsedField.value = String(elapsed);
      if (elapsed < 2200) {
        e.preventDefault();
        status.textContent = "Please take a second to review your message, then send again.";
        return;
      }

      e.preventDefault();
      status.textContent = "Sending…";

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { "Accept": "application/json" }
        });

        if (res.ok) {
          form.reset();
          status.textContent = "Message sent. I’ll get back to you shortly.";
        } else {
          status.textContent = "Something went wrong. Please email me instead.";
        }
      } catch {
        status.textContent = "Network error. Please email me instead.";
      }
    });
  }
})();