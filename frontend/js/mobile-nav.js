// ── Mobile Navigation Handler ──────────────────────────────────────────
(function() {
  const hamburger = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-nav-overlay');

  if (!hamburger || !drawer || !overlay) return;

  function openNav() {
    hamburger.classList.add('active');
    drawer.classList.add('open');
    overlay.classList.add('visible');
    document.body.classList.add('nav-open');
  }

  function closeNav() {
    hamburger.classList.remove('active');
    drawer.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.classList.remove('nav-open');
  }

  function toggleNav() {
    if (drawer.classList.contains('open')) {
      closeNav();
    } else {
      openNav();
    }
  }

  hamburger.addEventListener('click', toggleNav);
  overlay.addEventListener('click', closeNav);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeNav();
    }
  });

  // Close nav on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && drawer.classList.contains('open')) {
      closeNav();
    }
  });

  // Close drawer when a nav link inside is clicked
  drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeNav();
    });
  });
})();
