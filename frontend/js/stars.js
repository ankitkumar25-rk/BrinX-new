function createStarField() {
  const starField = document.getElementById("star-field");
  if (!starField) return;

  for (let i = 0; i < 200; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = Math.random() * 3 + "s";
    star.style.animationDuration = Math.random() * 2 + 2 + "s";
    starField.appendChild(star);
  }

  setInterval(() => {
    const shootingStar = document.createElement("div");
    shootingStar.className = "shooting-star";
    shootingStar.style.left = Math.random() * 100 + "%";
    shootingStar.style.top = Math.random() * 50 + "%";
    shootingStar.style.width = Math.random() * 100 + 50 + "px";
    shootingStar.style.height = "2px";

    starField.appendChild(shootingStar);

    anime({
      targets: shootingStar,
      translateX: [0, -300],
      translateY: [0, 300],
      opacity: [1, 0],
      duration: 1500,
      easing: "easeInQuad",
      complete: () => shootingStar.remove(),
    });
  }, 5000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createStarField);
} else {
  createStarField();
}
