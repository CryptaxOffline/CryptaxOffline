(function () {
  'use strict';

  var COINS = [
    '/assets/Logos%20coins/btc.png',
    '/assets/Logos%20coins/Ethereum.png',
    '/assets/Logos%20coins/Solana.png',
    '/assets/Logos%20coins/Polygon.png',
    '/assets/Logos%20coins/Avalanche.png',
    '/assets/Logos%20coins/Cosmos.png',
    '/assets/Logos%20coins/EOS.png',
    '/assets/Logos%20coins/Shiba.png',
    '/assets/Logos%20coins/USDC.png',
    '/assets/logos/Cryptax%20Icon%20Bleu.svg'
  ];

  var CONFIG = {
    spawnInterval: 1200,
    minDuration: 16,
    maxDuration: 28,
    minSize: 36,
    maxSize: 62,
    minOpacity: 0.16,
    maxOpacity: 0.32,
    maxCoins: 30
  };

  // Inject styles
  var style = document.createElement('style');
  style.textContent =
    '.falling-coins-container{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:hidden}' +
    'nav,main,footer,header,section,.site-nav{position:relative;z-index:3}' +
    '@keyframes coinFall{0%{transform:translateY(-60px) rotate(0deg);opacity:0}' +
    '8%{opacity:var(--coin-opacity)}' +
    '85%{opacity:var(--coin-opacity)}' +
    '100%{transform:translateY(calc(100vh + 60px)) rotate(var(--coin-rotation));opacity:0}}' +
    '.falling-coin{position:absolute;top:0;will-change:transform,opacity;animation:coinFall var(--coin-duration) linear forwards;' +
    'user-select:none}';
  document.head.appendChild(style);

  // Create container
  var container = document.createElement('div');
  container.className = 'falling-coins-container';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  var activeCoins = 0;
  var coinQueue = [];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Shuffled queue: each coin appears once before any repeat
  function nextCoin() {
    if (coinQueue.length === 0) {
      coinQueue = COINS.slice();
      for (var i = coinQueue.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = coinQueue[i];
        coinQueue[i] = coinQueue[j];
        coinQueue[j] = tmp;
      }
    }
    return coinQueue.pop();
  }

  function spawnCoin(progressPct) {
    if (activeCoins >= CONFIG.maxCoins) return;

    var img = document.createElement('img');
    var coin = nextCoin();
    var size = rand(CONFIG.minSize, CONFIG.maxSize);
    var duration = rand(CONFIG.minDuration, CONFIG.maxDuration);
    var opacity = rand(CONFIG.minOpacity, CONFIG.maxOpacity);
    var left = rand(0, 100);
    var rotation = rand(-180, 180) + 'deg';

    img.src = coin;
    img.className = 'falling-coin';
    img.width = size;
    img.height = size;
    img.alt = '';
    img.style.left = left + '%';
    img.style.setProperty('--coin-duration', duration + 's');
    img.style.setProperty('--coin-opacity', opacity);
    img.style.setProperty('--coin-rotation', rotation);

    if (progressPct) {
      img.style.animationDelay = (-progressPct * duration) + 's';
    }

    container.appendChild(img);
    activeCoins++;

    img.addEventListener('animationend', function () {
      img.remove();
      activeCoins--;
    });
  }

  // Preload images
  COINS.forEach(function (src) {
    var i = new Image();
    i.src = src;
  });

  // Pre-populate the screen with coins at different points of their fall
  // (negative animation-delay → coin appears already mid-fall)
  for (var i = 0; i < 15; i++) {
    spawnCoin(rand(0.08, 0.85));
  }
  setInterval(spawnCoin, CONFIG.spawnInterval);
})();
