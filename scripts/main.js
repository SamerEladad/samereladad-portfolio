(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme toggle (icon swap is handled in CSS via body.light-theme)
  const themeToggle = document.getElementById("themeToggle");

  const currentTheme = localStorage.getItem("theme") || "dark";
  if (currentTheme === "light") {
    document.body.classList.add("light-theme");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-theme");
      localStorage.setItem("theme", isLight ? "light" : "dark");
    });
  }

  // CV Dropdown functionality (resume page)
  const cvDropdowns = document.querySelectorAll(".cv-dropdown");
  cvDropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector(".cv-dropdown__toggle");

    if (toggle) {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen);

        cvDropdowns.forEach(other => {
          if (other !== dropdown) {
            other.classList.remove("is-open");
            other.querySelector(".cv-dropdown__toggle")?.setAttribute("aria-expanded", "false");
          }
        });
      });
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".cv-dropdown")) {
      cvDropdowns.forEach(dropdown => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector(".cv-dropdown__toggle")?.setAttribute("aria-expanded", "false");
      });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cvDropdowns.forEach(dropdown => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector(".cv-dropdown__toggle")?.setAttribute("aria-expanded", "false");
      });
    }
  });

  // Scroll to top
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", toggleScrollToTop, { passive: true });
    toggleScrollToTop();
  }

  // Reveal on scroll (staggered)
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.1 });
    reveals.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 0.08, 0.4)}s`;
      io.observe(el);
    });
  }

  // Animated counting numbers
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute("data-count"), 10);
      if (prefersReduced) {
        el.textContent = target;
        return;
      }
      const duration = 1600;
      const startTime = performance.now();
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

      const update = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        el.textContent = Math.round(easeOutQuart(progress) * target);
        if (progress < 1) requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTACT FORM: Validation + Formspree + Spam Protection
  // ══════════════════════════════════════════════════════════════════════════
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const tsField = document.getElementById("fp_ts");
  const elapsedField = document.getElementById("fp_elapsed");
  const humanCheck = document.getElementById("humanCheck");

  if (form && status) {
    const startTs = Date.now();
    if (tsField) tsField.value = String(startTs);

    const DANGER = "var(--danger)";
    const OK = "var(--ok)";

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const showFieldError = (fieldName, message) => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        field.style.borderColor = DANGER;
        field.focus();
      }
      status.textContent = message;
      status.style.color = DANGER;
    };

    const clearFieldErrors = () => {
      form.querySelectorAll(".field__input").forEach(field => {
        field.style.borderColor = "";
      });
      status.textContent = "";
      status.style.color = "";
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFieldErrors();

      // Honeypot check
      const gotcha = form.querySelector('input[name="_gotcha"]');
      if (gotcha && gotcha.value.trim().length > 0) {
        status.textContent = "Submission blocked.";
        return;
      }

      const name = form.querySelector('[name="name"]')?.value.trim() || "";
      const email = form.querySelector('[name="email"]')?.value.trim() || "";
      const message = form.querySelector('[name="message"]')?.value.trim() || "";

      if (!name) return showFieldError("name", "Please enter your name.");
      if (name.length < 2) return showFieldError("name", "Name must be at least 2 characters.");
      if (!email) return showFieldError("email", "Please enter your email address.");
      if (!isValidEmail(email)) return showFieldError("email", "Please enter a valid email address.");
      if (!message) return showFieldError("message", "Please enter your message.");
      if (message.length < 10) return showFieldError("message", "Message must be at least 10 characters.");

      if (humanCheck && !humanCheck.checked) {
        status.textContent = "Please confirm you're a real person.";
        status.style.color = DANGER;
        return;
      }

      // Time-based spam check
      const elapsed = Date.now() - startTs;
      if (elapsedField) elapsedField.value = String(elapsed);
      if (elapsed < 2200) {
        status.textContent = "Please take a moment to review your message, then try again.";
        status.style.color = DANGER;
        return;
      }

      status.textContent = "Sending…";
      status.style.color = "";

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn.innerHTML;
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
          status.textContent = "Message sent! I'll get back to you shortly.";
          status.style.color = OK;
        } else {
          status.textContent = "Something went wrong. Please email me directly.";
          status.style.color = DANGER;
        }
      } catch {
        status.textContent = "Network error. Please email me directly.";
        status.style.color = DANGER;
      } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
      }
    });

    // Clear error styling when user starts typing
    form.querySelectorAll(".field__input").forEach(field => {
      field.addEventListener("input", () => {
        field.style.borderColor = "";
        status.textContent = "";
        status.style.color = "";
      });
    });
  }
})();
