(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Reveal-on-scroll (subtle)
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      }
    },
    { threshold: 0.12 }
  );
  reveals.forEach(el => io.observe(el));

  // Contact form: lightweight spam protection + AJAX submission (Formspree)
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const tsField = document.getElementById("fp_ts");
  const elapsedField = document.getElementById("fp_elapsed");
  const humanCheck = document.getElementById("humanCheck");

  if (!form || !status) return;

  // Timestamp-based spam friction (bots submit instantly)
  const startTs = Date.now();
  if (tsField) tsField.value = String(startTs);

  form.addEventListener("submit", async (e) => {
    // Honeypot (_gotcha) — if filled, drop
    const gotcha = form.querySelector('input[name="_gotcha"]');
    if (gotcha && gotcha.value.trim().length > 0) {
      e.preventDefault();
      status.textContent = "Submission blocked.";
      return;
    }

    // Human checkbox (quality gate)
    if (humanCheck && !humanCheck.checked) {
      e.preventDefault();
      status.textContent = "Please confirm you’re a real person.";
      return;
    }

    // Time-to-submit gate: require a few seconds on page
    const elapsed = Date.now() - startTs;
    if (elapsedField) elapsedField.value = String(elapsed);
    if (elapsed < 2500) {
      e.preventDefault();
      status.textContent = "Please take a second to review your message, then send again.";
      return;
    }

    const action = form.getAttribute("action") || "";
    if (action.includes("YOUR_FORM_ID")) {
      e.preventDefault();
      status.textContent = "Form endpoint not set. Paste your Formspree endpoint in contact/index.html.";
      return;
    }

    // AJAX submit for clean UX (works on GitHub Pages)
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
        status.textContent = "Something went wrong. Please email me instead.";
      }
    } catch {
      status.textContent = "Network error. Please email me instead.";
    }
  });
})();