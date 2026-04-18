(function () {
  // Respect prefers-reduced-motion
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var layer = document.createElement('div');
  layer.id = 'bg-layer';
  layer.setAttribute('aria-hidden', 'true');

  // Orbs — values ported directly from TwitterBackground.tsx
  var orbs = [
    // indigo — top-left
    { w: 500, h: 500, color: 'rgba(99,102,241,0.28)', top: '-80px',  left: '5%',  blur: 60, anim: 'orb-drift-1' },
    // purple — bottom-right
    { w: 450, h: 450, color: 'rgba(168,85,247,0.18)',  bottom: '-120px', right: '5%', blur: 50, anim: 'orb-drift-2' },
    // blue — center
    { w: 350, h: 350, color: 'rgba(59,130,246,0.14)',  top: '30%', left: '44%',  blur: 40, anim: 'orb-drift-3' },
  ];

  orbs.forEach(function (o) {
    var el = document.createElement('div');
    el.className = 'bg-orb';
    el.style.cssText = [
      'position:absolute',
      'border-radius:50%',
      'pointer-events:none',
      'width:' + o.w + 'px',
      'height:' + o.h + 'px',
      'background:radial-gradient(circle,' + o.color + ' 0%,transparent 70%)',
      'filter:blur(' + o.blur + 'px)',
      o.top    ? 'top:'    + o.top    : '',
      o.bottom ? 'bottom:' + o.bottom : '',
      o.left   ? 'left:'   + o.left   : '',
      o.right  ? 'right:'  + o.right  : '',
      reduced  ? '' : 'animation:' + o.anim + ' 18s ease-in-out infinite alternate',
    ].filter(Boolean).join(';');
    layer.appendChild(el);
  });

  // Particles — same distribution as Remotion component (20 dots)
  if (!reduced) {
    var particleColors = [
      'rgba(99,102,241,0.55)',
      'rgba(168,85,247,0.45)',
      'rgba(59,130,246,0.45)',
    ];

    for (var i = 0; i < 20; i++) {
      var p = document.createElement('div');
      p.className = 'bg-particle';
      var size = 2 + (i % 3);
      var x = ((i * 137.5) % 96) + '%';
      var y = ((i * 97.3) % 90) + '%';
      var dur = (6 + (i % 5) * 1.8).toFixed(1) + 's';
      var delay = -(i * 0.6).toFixed(1) + 's';
      var color = particleColors[i % 3];
      p.style.cssText = [
        'position:absolute',
        'border-radius:50%',
        'pointer-events:none',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'background:' + color,
        'left:' + x,
        'top:' + y,
        'animation:particle-float ' + dur + ' ease-in-out ' + delay + ' infinite alternate',
      ].join(';');
      layer.appendChild(p);
    }
  }

  document.body.insertBefore(layer, document.body.firstChild);
})();
