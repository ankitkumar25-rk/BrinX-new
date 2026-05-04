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
})();
