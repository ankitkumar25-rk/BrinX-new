anime({
  targets: "#logo-x",
  rotate: [0, 360],
  duration: 4000,
  easing: "easeInOutQuad",
  loop: true,
});

window.addEventListener("DOMContentLoaded", () => {
  anime({
    targets: ".glass-card",
    translateY: [60, 0],
    opacity: [0, 1],
    duration: 900,
    easing: "easeOutExpo",
    delay: anime.stagger(100),
  });

  const cards = document.querySelectorAll(
    ".task-card, .stat-card, .quick-action-btn"
  );
  if (cards.length > 0) {
    anime({
      targets: cards,
      translateY: [40, 0],
      opacity: [0, 1],
      delay: anime.stagger(120),
      duration: 700,
      easing: "easeOutExpo",
    });
  }

  const buttons = document.querySelectorAll(
    "button, .btn-primary, .btn-secondary"
  );
  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      anime({
        targets: btn,
        scale: 1.05,
        duration: 250,
        easing: "easeOutQuad",
      });
    });

    btn.addEventListener("mouseleave", () => {
      anime({
        targets: btn,
        scale: 1,
        duration: 250,
        easing: "easeOutQuad",
      });
    });
  });

  const inputs = document.querySelectorAll("input, textarea");
  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      anime({
        targets: input,
        scale: [1, 1.02],
        duration: 300,
        easing: "easeOutExpo",
      });
    });

    input.addEventListener("blur", () => {
      anime({
        targets: input,
        scale: [1.02, 1],
        duration: 300,
        easing: "easeOutExpo",
      });
    });
  });
});

function animateNotificationBell() {
  anime({
    targets: "#notification-btn",
    translateY: [0, -12, 0],
    duration: 700,
    easing: "easeInOutQuad",
  });
}

function showSuccessAnimation(element) {
  anime({
    targets: element,
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 400,
    easing: "easeOutExpo",
  });
}

function hideAnimation(element) {
  anime({
    targets: element,
    opacity: [1, 0],
    translateY: [0, -20],
    duration: 300,
    easing: "easeInExpo",
    complete: () => {
      if (element) element.style.display = "none";
    },
  });
}

window.animateNotificationBell = animateNotificationBell;
window.showSuccessAnimation = showSuccessAnimation;
window.hideAnimation = hideAnimation;
