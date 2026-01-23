(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Reveal on scroll
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      }
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  }

  // Banner “window” logic: fixed image, appears only near markers
  const bannerWin = document.querySelector(".bg__bannerWin");
  const marks = Array.from(document.querySelectorAll("[data-banner]"));

  if (bannerWin && marks.length) {
    const setBanner = (url) => {
      document.documentElement.style.setProperty("--banner-url", `url("${url}")`);
      document.documentElement.style.setProperty("--banner-opacity", "1");
    };
    const hideBanner = () => {
      document.documentElement.style.setProperty("--banner-opacity", "0");
    };

    const ioBanner = new IntersectionObserver((entries) => {
      const active = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!active) {
        hideBanner();
        return;
      }

      const url = active.target.getAttribute("data-banner");
      if (url) setBanner(url);
    }, { threshold: [0.18, 0.28, 0.40] });

    marks.forEach(m => ioBanner.observe(m));
  }

  // Contact form: Formspree + spam gates
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

      // time-to-submit gate
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