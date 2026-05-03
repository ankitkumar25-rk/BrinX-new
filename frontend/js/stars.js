function createStarField() {
  const starField = document.getElementById("star-field");
  if (!starField) return;

  // Create static stars with variable size
  for (let i = 0; i < 180; i++) {
    const star = document.createElement("div");
    star.className = "star";
    const size = Math.random() < 0.15 ? 3 : Math.random() < 0.4 ? 2 : 1;
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      --dur: ${(Math.random() * 3 + 3).toFixed(1)}s;
      --delay: ${(Math.random() * 4).toFixed(1)}s;
      animation-delay: var(--delay);
      animation-duration: var(--dur);
    `;
    starField.appendChild(star);
  }

  // Shooting stars
  function launchShootingStar() {
    const s = document.createElement("div");
    s.className = "shooting-star";
    const startX = Math.random() * 80 + 10;
    const startY = Math.random() * 40;
    s.style.cssText = `
      left: ${startX}%;
      top: ${startY}%;
      width: ${Math.random() * 120 + 60}px;
      height: 1.5px;
      background: linear-gradient(90deg, rgba(167,139,250,0.9), transparent);
      border-radius: 2px;
      box-shadow: 0 0 4px rgba(167,139,250,0.4);
    `;
    starField.appendChild(s);

    anime({
      targets: s,
      translateX: [0, -350],
      translateY: [0, 280],
      opacity: [0, 1, 0],
      duration: 1200,
      easing: "easeInCubic",
      complete: () => s.remove(),
    });

    setTimeout(launchShootingStar, Math.random() * 4000 + 3000);
  }

  setTimeout(launchShootingStar, 1500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createStarField);
} else {
  createStarField();
}
