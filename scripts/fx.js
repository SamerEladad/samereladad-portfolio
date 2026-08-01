/* ══════════════════════════════════════════════════════════════════════════
   FX LAYER — interactive polish: particle field, word reveal, live console,
   cursor spotlight, photo parallax. All effects no-op under reduced motion.
   ══════════════════════════════════════════════════════════════════════════ */
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ────────────────────────────────────────────────────────────────────────
  // 1. Split headline into animated words
  // ────────────────────────────────────────────────────────────────────────
  document.querySelectorAll("[data-split]").forEach(el => {
    if (reduced) return;
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (!part.trim()) return frag.appendChild(document.createTextNode(part));
            const span = document.createElement("span");
            span.className = "w";
            span.style.setProperty("--i", i++);
            span.textContent = part;
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // gradient-ink spans paint their own background — animate them
          // whole rather than splitting, or the inner text inherits
          // `color: transparent` with no background of its own.
          if (child.classList.contains("tint")) {
            child.classList.add("w");
            child.style.setProperty("--i", i++);
          } else {
            walk(child);
          }
        }
      });
    };
    walk(el);
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Hero particle constellation — nodes drift, link up, lean toward cursor
  // ────────────────────────────────────────────────────────────────────────
  const canvas = document.getElementById("heroCanvas");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const stage = canvas.parentElement;
    let w = 0, h = 0, dpr = 1;
    let nodes = [];
    let raf = null;
    let running = false;
    const pointer = { x: -9999, y: -9999, active: false };

    const accent = () =>
      getComputedStyle(document.body).getPropertyValue("--grad-a").trim() || "#5c9bff";

    const rgb = () => {
      const c = accent();
      if (c.startsWith("#")) {
        const hex = c.slice(1);
        const n = hex.length === 3
          ? hex.split("").map(ch => parseInt(ch + ch, 16))
          : [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
        return n.join(",");
      }
      return "92,155,255";
    };
    let tint = rgb();

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = Math.min(Math.round((w * h) / 14000), 90);
      nodes = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.7
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;

        // gentle attraction toward the pointer
        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 26000 && d2 > 1) {
            const f = 0.00016;
            n.vx += dx * f;
            n.vy += dy * f;
          }
        }

        // damping keeps drift calm
        n.vx *= 0.994;
        n.vy *= 0.994;

        // wrap
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tint},.55)`;
        ctx.fill();
      }

      // link nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 15000) {
            const a = (1 - d2 / 15000) * 0.3;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${tint},${a})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };

    resize();
    start();

    window.addEventListener("resize", () => { resize(); }, { passive: true });

    stage.addEventListener("pointermove", (e) => {
      const rect = stage.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }, { passive: true });

    stage.addEventListener("pointerleave", () => { pointer.active = false; });

    // pause when scrolled away or tab hidden
    new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? start() : stop();
    }, { threshold: 0 }).observe(stage);

    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    // re-read the accent when the theme flips
    document.getElementById("themeToggle")?.addEventListener("click", () => {
      setTimeout(() => { tint = rgb(); }, 50);
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // 3. Live console — types out pipeline phrases in the hero
  // ────────────────────────────────────────────────────────────────────────
  const consoleEl = document.getElementById("heroConsole");
  if (consoleEl) {
    const phrases = JSON.parse(consoleEl.dataset.phrases || "[]");
    const out = consoleEl.querySelector(".hero__console-text");

    if (out && phrases.length) {
      if (reduced) {
        out.textContent = phrases[0];
      } else {
        let p = 0, i = 0, deleting = false;

        const tick = () => {
          const phrase = phrases[p];
          i = deleting ? i - 1 : i + 1;
          out.textContent = phrase.slice(0, i);

          let delay = deleting ? 28 : 52;
          if (!deleting && i === phrase.length) {
            delay = 2100;
            deleting = true;
          } else if (deleting && i === 0) {
            deleting = false;
            p = (p + 1) % phrases.length;
            delay = 420;
          }
          setTimeout(tick, delay);
        };
        setTimeout(tick, 900);
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // 4. Cursor spotlight on cards
  // ────────────────────────────────────────────────────────────────────────
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".fx-spot").forEach(el => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }, { passive: true });
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // 5. Photo band parallax
  // ────────────────────────────────────────────────────────────────────────
  const bands = [...document.querySelectorAll(".photoband picture")];
  if (bands.length && !reduced) {
    let ticking = false;

    const update = () => {
      const vh = window.innerHeight;
      for (const band of bands) {
        const r = band.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        const progress = (r.top + r.height / 2 - vh / 2) / vh;
        band.style.transform = `translate3d(0, ${(progress * -26).toFixed(2)}px, 0) scale(1.09)`;
      }
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }
})();
