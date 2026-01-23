(() => {
  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Active nav link: set aria-current based on current path
  const path = window.location.pathname.replace(/\/+$/, "/");
  document.querySelectorAll('[data-nav="true"] a').forEach(a => {
    try {
      const url = new URL(a.getAttribute("href"), window.location.origin);
      const target = url.pathname.replace(/\/+$/, "/");
      if (target === path) a.setAttribute("aria-current", "page");
    } catch {}
  });

  // Reveal-on-scroll
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    // fallback
    revealEls.forEach(el => el.classList.add("is-visible"));
  }

  // Logo fallback: if an image fails, hide it and show fallback text
  document.querySelectorAll("img[data-fallback]").forEach(img => {
    const fallbackId = img.getAttribute("data-fallback");
    const fallback = fallbackId ? document.getElementById(fallbackId) : null;

    const showFallback = () => {
      img.style.display = "none";
      if (fallback) fallback.style.display = "inline";
    };

    img.addEventListener("error", showFallback);
    // If cached error or missing file, force a check
    if (img.complete && img.naturalWidth === 0) showFallback();
  });

  // Contact form (Formspree) – graceful UX status
  const form = document.getElementById("contactForm");
  const status = document.getElementById("status");
  if (form && status) {
    form.addEventListener("submit", async (e) => {
      // honeypot
      const hp = form.querySelector('input[name="company"]');
      if (hp && hp.value.trim().length > 0) {
        e.preventDefault();
        status.textContent = "Submission blocked.";
        return;
      }

      const action = form.getAttribute("action") || "";
      if (action.includes("YOUR_FORM_ID")) {
        e.preventDefault();
        status.textContent = "Form not configured yet. Replace YOUR_FORM_ID in contact/index.html (Formspree).";
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
          status.textContent = "Something went wrong. Please email me instead.";
        }
      } catch {
        status.textContent = "Network error. Please email me instead.";
      }
    });
  }
})();