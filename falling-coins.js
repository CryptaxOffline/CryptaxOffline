(function () {
  'use strict';

  var COINS = [
    'assets/Logos%20coins/btc.png',
    'assets/Logos%20coins/Ethereum.png',
    'assets/Logos%20coins/Solana.png',
    'assets/Logos%20coins/Polygon.png',
    'assets/Logos%20coins/Avalanche.png',
    'assets/Logos%20coins/Cosmos.png',
    'assets/Logos%20coins/EOS.png',
    'assets/Logos%20coins/Shiba.png',
    'assets/Logos%20coins/USDC.png',
    'assets/logos/Cryptax%20Icon%20Bleu.svg'
  ];

  var CONFIG = {
    spawnInterval: 2200,
    minDuration: 12,
    maxDuration: 22,
    minSize: 30,
    maxSize: 54,
    minOpacity: 0.30,
    maxOpacity: 0.40,
    maxCoins: 20
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
    'filter:grayscale(0.3);user-select:none}';
  document.head.appendChild(style);

  // Create container
  var container = document.createElement('div');
  container.className = 'falling-coins-container';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  var activeCoins = 0;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnCoin() {
    if (activeCoins >= CONFIG.maxCoins) return;

    var img = document.createElement('img');
    var coin = COINS[Math.floor(Math.random() * COINS.length)];
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

  // Start with one coin immediately, then regular interval
  spawnCoin();
  setInterval(spawnCoin, CONFIG.spawnInterval);
})();
