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

  // Banner stays fixed in background (no scroll effect)

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

  // Reveal on scroll (with staggered delay for children)
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });
    reveals.forEach((el, index) => {
      el.style.transitionDelay = `${index * 0.1}s`;
      io.observe(el);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3D TILT EFFECT ON HERO CARD
  // ══════════════════════════════════════════════════════════════════════════
  const tiltElements = document.querySelectorAll("[data-tilt]");
  if (tiltElements.length) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (!prefersReduced) {
      tiltElements.forEach(el => {
        el.addEventListener("mousemove", (e) => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const rotateX = ((y - centerY) / centerY) * -0.5;
          const rotateY = ((x - centerX) / centerX) * 0.5;
          
          el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        el.addEventListener("mouseleave", () => {
          el.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
        });
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATED COUNTING NUMBERS
  // ══════════════════════════════════════════════════════════════════════════
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute("data-count"), 10);
      const duration = 2000;
      const startTime = performance.now();
      
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
      
      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const current = Math.round(easedProgress * target);
        
        el.textContent = current;
        
        if (progress < 1) {
          requestAnimationFrame(update);
        }
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

    // Helper function to validate email format
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // Helper function to show field error
    const showFieldError = (fieldName, message) => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        field.style.borderColor = "#ff6b6b";
        field.focus();
      }
      status.textContent = message;
      status.style.color = "#ff6b6b";
    };

    // Helper function to clear field errors
    const clearFieldErrors = () => {
      const fields = form.querySelectorAll(".field__input");
      fields.forEach(field => {
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

      // Get form values
      const nameField = form.querySelector('[name="name"]');
      const emailField = form.querySelector('[name="email"]');
      const messageField = form.querySelector('[name="message"]');

      const name = nameField?.value.trim() || "";
      const email = emailField?.value.trim() || "";
      const message = messageField?.value.trim() || "";

      // Validate required fields
      if (!name) {
        showFieldError("name", "Please enter your name.");
        return;
      }

      if (name.length < 2) {
        showFieldError("name", "Name must be at least 2 characters.");
        return;
      }

      if (!email) {
        showFieldError("email", "Please enter your email address.");
        return;
      }

      if (!isValidEmail(email)) {
        showFieldError("email", "Please enter a valid email address.");
        return;
      }

      if (!message) {
        showFieldError("message", "Please enter your message.");
        return;
      }

      if (message.length < 10) {
        showFieldError("message", "Message must be at least 10 characters.");
        return;
      }

      // Human check
      if (humanCheck && !humanCheck.checked) {
        status.textContent = "Please confirm you're a real person.";
        status.style.color = "#ff6b6b";
        return;
      }

      // Time-based spam check
      const elapsed = Date.now() - startTs;
      if (elapsedField) elapsedField.value = String(elapsed);
      if (elapsed < 2200) {
        status.textContent = "Please take a moment to review your message, then try again.";
        status.style.color = "#ff6b6b";
        return;
      }

      // All validations passed - submit the form
      status.textContent = "Sending…";
      status.style.color = "";

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
          status.textContent = "Message sent! I'll get back to you shortly.";
          status.style.color = "#4ade80";
        } else {
          status.textContent = "Something went wrong. Please email me directly.";
          status.style.color = "#ff6b6b";
        }
      } catch {
        status.textContent = "Network error. Please email me directly.";
        status.style.color = "#ff6b6b";
      } finally {
        // Reset button state
        submitBtn.textContent = originalText;
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
