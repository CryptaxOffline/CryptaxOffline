(function () {
  if (window.innerWidth >= 768 && !('ontouchstart' in window)) {
    // Optimisation : on n'injecte rien si on est sûr d'être sur desktop sans touch.
    // Sinon (tablette, fenêtre réduite), on l'injecte au cas où.
  }

  var navInner = document.querySelector('.site-nav .nav-inner');
  if (!navInner) return;

  var navLinks = navInner.querySelector('.nav-links');
  var navCta = navInner.querySelector(':scope > .nav-cta');
  if (!navLinks) return;

  // --- Bouton burger
  var burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Ouvrir le menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'mobile-menu-panel');
  burger.innerHTML = '<span></span><span></span><span></span>';
  navInner.appendChild(burger);

  // --- Backdrop
  var backdrop = document.createElement('div');
  backdrop.className = 'mobile-menu-backdrop';
  document.body.appendChild(backdrop);

  // --- Panneau
  var panel = document.createElement('div');
  panel.id = 'mobile-menu-panel';
  panel.className = 'mobile-menu-panel';
  panel.setAttribute('aria-hidden', 'true');

  // Cloner les liens (sans toucher l'original)
  var linksClone = navLinks.cloneNode(true);
  linksClone.classList.add('mobile-menu-links');
  panel.appendChild(linksClone);

  // Cloner le CTA s'il existe
  if (navCta) {
    var ctaClone = navCta.cloneNode(true);
    ctaClone.classList.add('mobile-menu-cta');
    panel.appendChild(ctaClone);
  }

  document.body.appendChild(panel);

  function open() {
    burger.classList.add('open');
    panel.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('mobile-menu-active');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    panel.setAttribute('aria-hidden', 'false');
  }

  function close() {
    burger.classList.remove('open');
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('mobile-menu-active');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    panel.setAttribute('aria-hidden', 'true');
  }

  burger.addEventListener('click', function () {
    if (panel.classList.contains('open')) close();
    else open();
  });

  backdrop.addEventListener('click', close);

  // Ferme au clic sur un lien interne (sauf les liens externes target=_blank
  // qui ouvrent dans un nouvel onglet, donc on garde le menu ouvert si l'utilisateur
  // veut en cliquer plusieurs)
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.target !== '_blank') close();
    });
  });

  // Escape ferme
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  // Auto-close si la fenêtre s'élargit au-delà du breakpoint
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768 && panel.classList.contains('open')) close();
  });
})();
