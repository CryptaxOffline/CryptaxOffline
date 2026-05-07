(function () {
  var logos = document.querySelector('.compat-band .compat-logos');
  if (!logos) return;

  document.documentElement.classList.add('js-marquee');

  var items = Array.prototype.slice.call(logos.children);
  if (!items.length) return;

  // Fisher-Yates shuffle for random ordering on each load
  for (var i = items.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }

  var track = document.createElement('div');
  track.className = 'compat-logos-track';

  items.forEach(function (item) { track.appendChild(item); });

  items.forEach(function (item) {
    var clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach(function (img) {
      img.setAttribute('alt', '');
      img.setAttribute('aria-hidden', 'true');
    });
    track.appendChild(clone);
  });

  track.style.animationDuration = (items.length * 1.3) + 's';

  logos.appendChild(track);
})();
