// Contrôles vidéo : lecture déclenchée au scroll (visible à l'écran),
// bouton lecture/pause, et son muet activé dès la 1re interaction de l'utilisateur.
(function () {
  function setup(wrap) {
    var video = wrap.querySelector('video');
    if (!video) return;
    var soundBtn = wrap.querySelector('.video-sound-btn');
    var playBtn = wrap.querySelector('.video-play-btn');

    var userPaused = false; // l'utilisateur a mis en pause manuellement
    var inView = false;
    var events = ['pointerdown', 'keydown', 'touchstart'];

    function tryPlay() {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    function updatePlayback() {
      if (inView && !userPaused) { tryPlay(); }
      else { video.pause(); }
    }

    function reflectSound() {
      if (!soundBtn) return;
      var on = !video.muted;
      soundBtn.classList.toggle('is-on', on);
      soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      soundBtn.setAttribute('aria-label', on ? 'Couper le son' : 'Activer le son');
    }

    function reflectPlay() {
      if (!playBtn) return;
      var playing = !video.paused;
      playBtn.classList.toggle('is-playing', playing);
      playBtn.setAttribute('aria-label', playing ? 'Mettre en pause' : 'Lire la vidéo');
    }

    // --- Lecture uniquement quand la vidéo est visible ---
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          updatePlayback();
        });
      }, { threshold: 0.25 });
      io.observe(video);
    } else {
      inView = true;
      updatePlayback();
    }

    video.addEventListener('play', reflectPlay);
    video.addEventListener('pause', reflectPlay);

    // --- Bouton lecture / pause ---
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (video.paused) { userPaused = false; tryPlay(); }
        else { userPaused = true; video.pause(); }
        reflectPlay();
      });
    }

    // --- Son : muet pour l'autoplay, activé dès la 1re interaction ---
    function removeAuto() {
      events.forEach(function (ev) { window.removeEventListener(ev, autoUnmute); });
    }
    function autoUnmute(e) {
      // Les interactions à l'intérieur de la vidéo sont gérées par ses propres boutons
      if (e && e.target && wrap.contains(e.target)) return;
      video.muted = false;
      reflectSound();
      if (inView && !userPaused) tryPlay();
      removeAuto();
    }
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        video.muted = !video.muted;
        if (!video.muted && inView && !userPaused) tryPlay();
        reflectSound();
        removeAuto();
      });
      events.forEach(function (ev) {
        window.addEventListener(ev, autoUnmute, { passive: true });
      });
    }

    reflectSound();
    reflectPlay();
  }

  document.querySelectorAll('[data-video-sound]').forEach(setup);
})();
