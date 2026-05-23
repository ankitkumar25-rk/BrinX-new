/* ─────────────────────────────────────────────────
   ANTI-FLASH THEME APPLICATION
   Runs synchronously BEFORE DOMContentLoaded
   to prevent white-flash when user prefers dark.
   ───────────────────────────────────────────────── */
(function() {
  var saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark-mode");
    document.body && document.body.classList.add("dark-mode");
  }
})();

// Aurora ripple micro-interaction and page load animation
(function () {
  // Ripple effect on btn-primary clicks
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-primary");
    if (!btn) return;
    const r = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    r.style.cssText = `
      position:absolute;border-radius:50%;pointer-events:none;
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:rgba(255,255,255,0.25);
      transform:scale(0);animation:ripple .55s ease-out forwards;
    `;
    if (!document.getElementById("ripple-style")) {
      const s = document.createElement("style");
      s.id = "ripple-style";
      s.textContent = "@keyframes ripple{to{transform:scale(1);opacity:0}}";
      document.head.appendChild(s);
    }
    btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });

  /* ── SVG Icon Definitions (Lucide / Feather style) ── */
  const SUN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`;

  const MOON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`;

  /* ── Theme Toggle Logic ── */
  function isDark() {
    return document.body.classList.contains("dark-mode");
  }

  function applyTheme(dark) {
    if (dark) {
      document.body.classList.add("dark-mode");
      document.documentElement.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }

  function updateToggleIcon(btn) {
    if (!btn) return;
    btn.innerHTML = isDark() ? SUN_SVG : MOON_SVG;
    btn.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode");
    btn.title = isDark() ? "Switch to light mode" : "Switch to dark mode";
  }

  window.addEventListener("DOMContentLoaded", () => {
    /* ── Apply saved theme to body (handles body not existing at anti-flash time) ── */
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      applyTheme(true);
    } else if (saved === "light") {
      applyTheme(false);
    }
    // If no preference saved, default to light (current state)

    /* ── Inject Theme Toggle Button ── */
    const navRight = document.querySelector(".nav-right");
    if (navRight) {
      // Don't inject twice
      if (!document.getElementById("theme-toggle")) {
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "theme-toggle";
        toggleBtn.className = "theme-toggle-btn";
        updateToggleIcon(toggleBtn);

        // Insert as the first child of nav-right
        navRight.insertBefore(toggleBtn, navRight.firstChild);

        // Click handler
        toggleBtn.addEventListener("click", () => {
          const goingDark = !isDark();
          applyTheme(goingDark);
          updateToggleIcon(toggleBtn);

          // Spin micro-animation
          toggleBtn.classList.add("spin");
          setTimeout(() => {
            toggleBtn.classList.remove("spin");
            // Reset transform so it can spin again next time
            const svg = toggleBtn.querySelector("svg");
            if (svg) svg.style.transform = "";
          }, 500);
        });
      }
    }

    /* ── Dynamic Scroll-To-Top Button injection ── */
    if (!document.getElementById("scroll-to-top")) {
      const scrollBtn = document.createElement("button");
      scrollBtn.id = "scroll-to-top";
      scrollBtn.className = "scroll-to-top-btn";
      scrollBtn.setAttribute("aria-label", "Scroll to top");
      scrollBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      `;
      document.body.appendChild(scrollBtn);

      scrollBtn.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"   // Smooth only for programmatic scroll-to-top
        });
      });

      // RAF-throttled scroll listener — fires max once per frame instead of
      // hammering the main thread on every scroll pixel
      let scrollTicking = false;
      window.addEventListener("scroll", () => {
        if (!scrollTicking) {
          requestAnimationFrame(() => {
            if (window.scrollY > 400) {
              scrollBtn.classList.add("visible");
            } else {
              scrollBtn.classList.remove("visible");
            }
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      }, { passive: true });
    }
  });
})();
