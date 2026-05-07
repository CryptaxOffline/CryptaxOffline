(function () {
  var TARGET_SELECTOR = '.cryptax-house-anim';
  var ASSET_BASE = 'assets/cryptax-house-anim/';

  var FPS = 30;
  var DURATION_FRAMES = 135;
  var TOTAL_DURATION = DURATION_FRAMES / FPS;

  var EXIT_START = 3.8;
  var EXIT_DURATION = 0.55;

  var elements = [
    { src: 'base.svg',    start: 0.10, duration: 0.40, scaleFrom: 0.85, origin: '50% 50%' },
    { src: 'grid.svg',    start: 0.60, duration: 0.35, scaleFrom: 1.00, origin: '25% 60%' },
    { src: 'cube-tl.svg', start: 1.05, duration: 0.30, scaleFrom: 0.40, origin: '32% 10%' },
    { src: 'cube-r.svg',  start: 1.50, duration: 0.30, scaleFrom: 0.40, origin: '71% 54%' },
    { src: 'cube-t.svg',  start: 1.95, duration: 0.30, scaleFrom: 0.40, origin: '42% 28%' },
    { src: 'filled.svg',  start: 2.40, duration: 0.45, scaleFrom: 0.85, origin: '50% 50%' }
  ];

  function bezierEasing(p1x, p1y, p2x, p2y) {
    function A(a1, a2) { return 1 - 3 * a2 + 3 * a1; }
    function B(a1, a2) { return 3 * a2 - 6 * a1; }
    function C(a1) { return 3 * a1; }
    function calcBezier(t, a1, a2) { return ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t; }
    function getSlope(t, a1, a2) { return 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1); }
    function getTForX(x) {
      var t = x;
      for (var i = 0; i < 8; i++) {
        var slope = getSlope(t, p1x, p2x);
        if (slope === 0) return t;
        var currentX = calcBezier(t, p1x, p2x) - x;
        t -= currentX / slope;
      }
      return t;
    }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return calcBezier(getTForX(x), p1y, p2y);
    };
  }

  var easeOut = bezierEasing(0.16, 1, 0.3, 1);
  var easeIn  = bezierEasing(0.7, 0, 0.84, 0);

  function interp(t, range, values, easing) {
    var p = (t - range[0]) / (range[1] - range[0]);
    if (p <= 0) p = 0;
    if (p >= 1) p = 1;
    var e = easing(p);
    return values[0] + (values[1] - values[0]) * e;
  }

  function setupOne(container) {
    container.style.position = container.style.position || 'relative';
    container.style.overflow = 'hidden';

    var stage = document.createElement('div');
    stage.style.position = 'absolute';
    stage.style.left = '50%';
    stage.style.top = '50%';
    stage.style.width = '400px';
    stage.style.height = '400px';
    stage.style.transformOrigin = 'center center';
    container.appendChild(stage);

    function fit() {
      var w = container.clientWidth;
      var h = container.clientHeight;
      var s = Math.min(w, h) / 400;
      stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    fit();
    window.addEventListener('resize', fit);

    var imgs = elements.map(function (el) {
      var img = document.createElement('img');
      img.src = ASSET_BASE + el.src;
      img.alt = '';
      img.draggable = false;
      img.style.position = 'absolute';
      img.style.left = '0';
      img.style.top = '0';
      img.style.width = '400px';
      img.style.height = '400px';
      img.style.opacity = '0';
      img.style.willChange = 'transform, opacity';
      img.style.userSelect = 'none';
      img.style.pointerEvents = 'none';
      stage.appendChild(img);
      return img;
    });

    var isVisible = false;
    var elapsed = 0;
    var lastNow = null;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        for (var e = 0; e < entries.length; e++) {
          isVisible = entries[e].isIntersecting;
          if (!isVisible) lastNow = null;
        }
      }, { threshold: 0.15 });
      observer.observe(container);
    } else {
      isVisible = true;
    }

    function tick(now) {
      if (isVisible) {
        if (lastNow !== null) elapsed += (now - lastNow) / 1000;
        lastNow = now;
      }
      var t = elapsed % TOTAL_DURATION;

      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var img = imgs[i];
        var exitStart = el.exitStart != null ? el.exitStart : EXIT_START;
        var isExit = t >= exitStart;
        var range = isExit
          ? [exitStart, exitStart + EXIT_DURATION]
          : [el.start, el.start + el.duration];
        var ease = isExit ? easeIn : easeOut;

        var opacity = interp(t, range, isExit ? [1, 0] : [0, 1], ease);
        var scale = interp(t, range, isExit ? [1, el.scaleFrom] : [el.scaleFrom, 1], ease);

        img.style.opacity = opacity;
        img.style.transform = 'scale(' + scale + ')';
        img.style.transformOrigin = el.origin;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function init() {
    var nodes = document.querySelectorAll(TARGET_SELECTOR);
    for (var i = 0; i < nodes.length; i++) setupOne(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
