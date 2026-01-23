(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = themeToggle?.querySelector(".theme-toggle__icon");

  // Check for saved theme preference or default to dark
  const currentTheme = localStorage.getItem("theme") || "dark";
  if (currentTheme === "light") {
    document.body.classList.add("light-theme");
    if (themeIcon) themeIcon.textContent = "☀️";
  }

  // Theme toggle handler
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-theme");
      const newTheme = isLight ? "light" : "dark";
      localStorage.setItem("theme", newTheme);

      if (themeIcon) {
        themeIcon.textContent = isLight ? "☀️" : "🌙";
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARALLAX HERO BANNER SCROLL EFFECT
  // ══════════════════════════════════════════════════════════════════════════
  const parallaxBanner = document.querySelector(".parallax-banner__img");
  if (parallaxBanner) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (!prefersReduced) {
      let ticking = false;
      
      const updateParallax = () => {
        const scrollY = window.scrollY;
        const translateY = scrollY * 0.4; // Parallax speed (0.4 = slower than scroll)
        parallaxBanner.style.transform = `translateY(${translateY}px)`;
        ticking = false;
      };
      
      window.addEventListener("scroll", () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
      
      updateParallax(); // Initial position
    }
  }

  // Scroll to top functionality
  const scrollToTopBtn = document.getElementById("scrollToTop");

  const toggleScrollToTop = () => {
    if (window.scrollY > 300) {
      scrollToTopBtn?.classList.add("visible");
    } else {
      scrollToTopBtn?.classList.remove("visible");
    }
  };

  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });

    window.addEventListener("scroll", toggleScrollToTop);
    toggleScrollToTop(); // Check initial state
  }

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

  // Parallax bands (mobile fallback)
  // Desktop uses background-attachment: fixed (when supported)
  // Mobile uses translateY on .parallax-band__inner
  const bands = Array.from(document.querySelectorAll("[data-parallax-band]"));
  if (bands.length) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const supportsFixed =
      !/iP(hone|od|ad)/.test(navigator.platform) &&
      !/Mac/.test(navigator.platform) &&
      CSS.supports("background-attachment: fixed");

    // If fixed is supported, we do nothing (CSS handles it)
    if (!supportsFixed) {
      const onScroll = () => {
        const vh = window.innerHeight || 800;
        for (const band of bands) {
          const inner = band.querySelector(".parallax-band__inner") || band.querySelector(".parallax-window__sticky");
          if (!inner) continue;

          const r = band.getBoundingClientRect();
          // Only compute when near viewport
          if (r.bottom < -200 || r.top > vh + 200) continue;

          // progress: -1..1 (centered around viewport middle)
          const center = r.top + r.height / 2;
          const p = (center - vh / 2) / (vh / 2);
          const offset = Math.max(-1, Math.min(1, p)) * 18; // px range
          inner.style.transform = `translate3d(0, ${offset}px, 0) scale(1.04)`;
        }
      };

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }
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
      if (elapsed < 2200) {
        e.preventDefault();
        status.textContent = "Please take a second to review your message, then send again.";
        return;
      }

      e.preventDefault();
      status.textContent = "Sending…";

      // Add loading state to button
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { "Accept": "application/json" }
        });

        if (res.ok) {
          form.reset();
          status.textContent = "Message sent. I'll get back to you shortly.";
        } else {
          status.textContent = "Something went wrong. Please email me instead.";
        }
      } catch {
        status.textContent = "Network error. Please email me instead.";
      } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
})();