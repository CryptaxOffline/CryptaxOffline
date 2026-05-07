(function () {
  if (!window.IntersectionObserver) return;

  document.documentElement.classList.add('js-reveal');

  var THRESHOLD = 0.12;
  var ROOT_MARGIN = '0px 0px -60px 0px';

  // Single element observer
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: THRESHOLD, rootMargin: ROOT_MARGIN });

  // Stagger container observer — reveals children sequentially
  var staggerObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var step = parseInt(entry.target.getAttribute('data-stagger-delay'), 10) || 90;
      var children = Array.prototype.slice.call(
        entry.target.querySelectorAll(':scope > [data-reveal]')
      );
      children.forEach(function (child, i) {
        setTimeout(function () {
          child.classList.add('revealed');
        }, i * step);
      });
      staggerObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: ROOT_MARGIN });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    // Skip children of stagger containers — they're handled by staggerObserver
    if (!el.closest('[data-stagger]')) {
      observer.observe(el);
    }
  });

  document.querySelectorAll('[data-stagger]').forEach(function (el) {
    staggerObserver.observe(el);
  });
})();
