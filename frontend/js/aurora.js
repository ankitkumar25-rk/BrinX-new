// Aurora mouse parallax + ripple micro-interaction
(function () {
  // Mouse parallax on aurora blobs
  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener("mousemove", (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  function lerp(a, b, t) { return a + (b - a) * t; }
  (function tick() {
    tx = lerp(tx, mx, 0.04);
    ty = lerp(ty, my, 0.04);
    const blobs = document.querySelectorAll(".ab");
    blobs.forEach((b, i) => {
      const f = (i + 1) * 18;
      b.style.transform = `translate(${tx * f}px, ${ty * f}px)`;
    });
    requestAnimationFrame(tick);
  })();

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

  // Animate elements into view on load
  document.addEventListener("DOMContentLoaded", () => {
    // Page-enter animation
    document.body.style.opacity = "0";
    document.body.style.transform = "translateY(8px)";
    requestAnimationFrame(() => {
      document.body.style.transition = "opacity .5s ease, transform .5s ease";
      document.body.style.opacity = "1";
      document.body.style.transform = "translateY(0)";
    });
  });
})();
