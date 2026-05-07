(function () {
  var h1 = document.querySelector('.hero h1');
  if (!h1) return;

  var nodes = Array.prototype.slice.call(h1.childNodes);
  var fragment = document.createDocumentFragment();

  nodes.forEach(function (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      var chars = node.textContent.split('');
      chars.forEach(function (ch) {
        if (ch === ' ' || ch === ' ') {
          fragment.appendChild(document.createTextNode(ch));
        } else {
          var span = document.createElement('span');
          span.className = 'hero-letter';
          span.textContent = ch;
          fragment.appendChild(span);
        }
      });
    } else {
      fragment.appendChild(node.cloneNode(true));
    }
  });

  h1.innerHTML = '';
  h1.appendChild(fragment);

  var letters = h1.querySelectorAll('.hero-letter');
  var STEP = 28;
  var DURATION = 450;
  for (var i = 0; i < letters.length; i++) {
    letters[i].style.setProperty('--hero-letter-delay', (i * STEP) + 'ms');
  }

  var totalTitleTime = (letters.length - 1) * STEP + DURATION;
  var subtitle = document.querySelector('.hero-subtitle');
  if (subtitle) {
    subtitle.style.setProperty('--hero-subtitle-delay', (totalTitleTime + 100) + 'ms');
    subtitle.classList.add('hero-subtitle--animated');
  }
})();
