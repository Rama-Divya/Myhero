document.addEventListener('DOMContentLoaded', () => {
  const giftContainer = document.getElementById('giftContainer');
  const landing = document.getElementById('landing');
  const fanwish = document.getElementById('fanwish');
  const timeline = document.getElementById('timeline');
  const finale = document.getElementById('finale');
  const bgAudio = document.getElementById('bgAudio');
  const audioToggle = document.getElementById('audioToggle');
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const finalVideo = document.getElementById('finalVideo');

  // photo rails and pins
  const photoRails = document.querySelectorAll('.photo-rail');
  const photoPins = document.querySelectorAll('.photo-pin');

  // audio defaults
  if (bgAudio) bgAudio.volume = 0.45;
  let isMuted = false;

  // toggle audio button
  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      isMuted = !isMuted;
      if (bgAudio) bgAudio.muted = isMuted;
      audioToggle.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    });
  }

  // AUTOPLAY FALLBACK: try to play background audio on first user gesture
  (function setupAutoplayFallback() {
    if (!bgAudio) return;
    const tryPlayBgAudio = (e) => {
      // attempt to play once on first user gesture
      bgAudio.play().catch(() => {
        // failed to autoplay (expected on some browsers) — no further action
      });
      // remove the listeners after first gesture
      document.removeEventListener('click', tryPlayBgAudio);
      document.removeEventListener('touchstart', tryPlayBgAudio);
    };
    document.addEventListener('click', tryPlayBgAudio, { once: true });
    document.addEventListener('touchstart', tryPlayBgAudio, { once: true });
  })();

  // show/hide photo rails depending on landing visibility
  function updateRailsVisibility() {
    const landingHidden = landing && landing.classList.contains('hidden');
    photoRails.forEach(r => {
      if (landingHidden) {
        // hide rails when landing is hidden (fanwish/timeline/finale view)
        r.style.display = 'none';
      } else {
        // show rails on landing
        r.style.display = '';
      }
    });
  }

  // initialize rails visibility immediately
  updateRailsVisibility();

  // ====== COUNTDOWN to Aug 19 (IST) - uses IST regardless of client timezone ======
  function computeAug19TargetUTCms(referenceDate = new Date()) {
    // Determine year relative to IST "referenceDate"
    const nowUTC = new Date(referenceDate.getTime() + referenceDate.getTimezoneOffset() * 60000);
    const nowIST = new Date(nowUTC.getTime() + (330 * 60000)); // +5:30
    let year;
    if (nowIST.getMonth() > 7 || (nowIST.getMonth() === 7 && nowIST.getDate() > 19)) {
      year = nowIST.getFullYear() + 1;
    } else {
      year = nowIST.getFullYear();
    }
    // Aug 19 00:00 IST -> UTC = Aug 18 18:30 UTC (same year variable)
    return Date.UTC(year, 7, 18, 18, 30, 0);
  }

  function updateCountdown() {
    const nowMs = Date.now();
    const targetUTCms = computeAug19TargetUTCms(new Date(nowMs));
    const diff = Math.max(0, targetUTCms - nowMs);

    const d = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const h = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
    const m = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
    const s = Math.max(0, Math.floor((diff / 1000) % 60));

    if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');

    return nowMs >= targetUTCms;
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // final video behavior: pause background when playing
  if (finalVideo) {
    finalVideo.volume = 0.95;
    finalVideo.muted = false;
    finalVideo.loop = false; // ensure video plays once, not in loop
    finalVideo.addEventListener('play', () => {
      if (bgAudio && !bgAudio.paused) {
        try { bgAudio.pause(); } catch(e){}
      }
    });
    finalVideo.addEventListener('pause', () => {
      if (bgAudio && bgAudio.paused) {
        try { bgAudio.play(); } catch(e){}
      }
    });
  }

  // reveal animations when in viewport
  function animateOnScroll() {
    document.querySelectorAll('.wish-card').forEach(card => {
      const r = card.getBoundingClientRect();
      if (r.top < window.innerHeight - 80) card.classList.add('visible');
    });
    document.querySelectorAll('.timeline-card').forEach(card => {
      const r = card.getBoundingClientRect();
      if (r.top < window.innerHeight - 80) card.classList.add('visible');
    });
  }
  window.addEventListener('scroll', animateOnScroll);
  animateOnScroll();

  // small enhancement: give pinned photos a casual scattered look and hover interaction
  photoPins.forEach((pin, i) => {
    const tilt = (Math.random() * 12) - 6;
    pin.style.transform = `rotate(${tilt}deg)`;
    pin.style.transition = 'transform .32s ease, box-shadow .32s ease';
    pin.style.willChange = 'transform';
    pin.style.opacity = '0';
    pin.style.transition += ', opacity .45s ease';
    setTimeout(() => { pin.style.opacity = '1'; }, i * 90);

    pin.addEventListener('mouseenter', () => {
      pin.style.transform = 'rotate(0deg) scale(1.04)';
      pin.style.boxShadow = '0 22px 48px rgba(0,0,0,0.5)';
      pin.style.zIndex = 60;
    });
    pin.addEventListener('mouseleave', () => {
      pin.style.transform = `rotate(${tilt}deg) scale(1)`;
      pin.style.boxShadow = '';
      pin.style.zIndex = '';
    });
  });

  // ============================
  // FANWISH LOCK / UNLOCK LOGIC (updated)
  // - no visible dev UI; only ?dev=1 works for dev unlock
  // - overlay shows live countdown
  // - stronger blur by default
  // - unblur animation + confetti on automatic unlock
  // ============================
  const WISH_UNLOCK_KEY = 'fanwishUnlocked';

  function isDevAllowed() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('dev') === '1';
    } catch (e) {
      return false;
    }
  }

  function isPersistentlyUnlocked() {
    try {
      return localStorage.getItem(WISH_UNLOCK_KEY) === '1';
    } catch (e) { return false; }
  }

  function persistUnlock() {
    try { localStorage.setItem(WISH_UNLOCK_KEY, '1'); } catch (e) {}
  }

  function clearPersistentUnlock() {
    try { localStorage.removeItem(WISH_UNLOCK_KEY); } catch(e) {}
  }

  function isPastAug19IST() {
    const nowMs = Date.now();
    const targetUTCms = computeAug19TargetUTCms(new Date(nowMs));
    return nowMs >= targetUTCms;
  }

  // Creates or updates overlay element inside a wish-card
  function ensureLockOverlay(card) {
    let overlay = card.querySelector('.wish-lock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'wish-lock-overlay';
      // content will be updated by updateLockOverlays()
      card.appendChild(overlay);
    }
    return overlay;
  }

  // Apply lock class to all wish cards and add overlay countdown
  function applyLockToWishes() {
    document.querySelectorAll('.wish-card').forEach(card => {
      card.classList.add('locked');
      card.classList.remove('just-unlocked');
      ensureLockOverlay(card);
      // keep visible class for entrance animations; locked handles interactions
    });
    updateLockOverlays(); // immediate update of countdowns
  }

  // Remove overlay element (if any)
  function removeLockOverlay(card) {
    const overlay = card.querySelector('.wish-lock-overlay');
    if (overlay) overlay.remove();
  }

  // Remove lock class and animate unblur + confetti
  function removeLockFromWishes(reason) {
    const cards = Array.from(document.querySelectorAll('.wish-card'));
    if (cards.length === 0) return;

    // remove locked and add just-unlocked to trigger CSS keyframe
    cards.forEach(card => {
      card.classList.remove('locked');
      // ensure overlay will be removed with fade
      const overlay = card.querySelector('.wish-lock-overlay');
      if (overlay) {
        overlay.classList.add('overlay-fadeout');
        setTimeout(() => removeLockOverlay(card), 520);
      }
      // add animation class so unblur effect plays
      card.classList.add('just-unlocked');
      // remove animation class after it finishes
      setTimeout(() => card.classList.remove('just-unlocked'), 1000);
    });

    // small confetti burst when unlocking automatically or by dev flag
    try {
      confetti({ particleCount: 220, spread: 120, origin: { y: 0.45 }, colors: ['#1a73e8','#4285f4','#64b5f6','#ffd700'] });
    } catch (e) {
      // confetti may not be loaded in some contexts; ignore errors
    }

    console.log('[fanwish] unlocked — reason:', reason);
  }

  // Update overlay countdown text for all locked cards
  function updateLockOverlays() {
    const nowMs = Date.now();
    const targetUTCms = computeAug19TargetUTCms(new Date(nowMs));
    const diff = Math.max(0, targetUTCms - nowMs);

    const d = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const h = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
    const m = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
    const s = Math.max(0, Math.floor((diff / 1000) % 60));

    const human = diff > 0
      ? `Unlocks in ${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
      : 'Unlocking...';

    document.querySelectorAll('.wish-card.locked').forEach(card => {
      const overlay = ensureLockOverlay(card);
      overlay.innerHTML = `
        <div class="overlay-content">
          <div class="overlay-icon">🔒</div>
          <div class="overlay-text">${human}</div>
          <div class="overlay-note">Available on Aug 19 (IST)</div>
        </div>
      `;
    });
  }

  // Decide initial state

  // ONE-LINER SAFEGUARD:
  // If dev param is NOT present and Aug 19 hasn't arrived yet, clear any persisted dev unlock so wishes re-lock on reload.
  if (!new URLSearchParams(location.search).has("dev") && !isPastAug19IST()) localStorage.removeItem(WISH_UNLOCK_KEY);

  function checkLockStateAndApply() {
    if (isPersistentlyUnlocked()) {
      removeLockFromWishes('persisted-unlock');
      return;
    }

    if (isDevAllowed()) {
      // dev param present -> unlock silently (no visible controls)
      persistUnlock();
      removeLockFromWishes('dev-param-unlock');
      return;
    }

    if (isPastAug19IST()) {
      persistUnlock();
      removeLockFromWishes('date-Aug19-IST');
      return;
    }

    // still locked
    applyLockToWishes();
  }

  checkLockStateAndApply();

  // periodic checks:
  // - update overlays countdown every second (so countdown in overlay stays live)
  // - check date every 15s to automatically unlock when time arrives
  const overlayInterval = setInterval(updateLockOverlays, 1000);

  const unlockChecker = setInterval(() => {
    if (!isPersistentlyUnlocked() && isPastAug19IST()) {
      persistUnlock();
      removeLockFromWishes('date-Aug19-IST (periodic-check)');
      clearInterval(unlockChecker);
      clearInterval(overlayInterval);
    }
  }, 15 * 1000);

  // ============================
  // gift click sequence (gift open sound removed as requested)
  // ============================
  if (giftContainer) {
    giftContainer.addEventListener('click', () => {
      // Start background music (user gesture)
      if (bgAudio) {
        bgAudio.play().catch(() => {});
      }

      // Open animation
      giftContainer.style.transform = 'translateY(-20px) rotateX(30deg) rotateY(10deg) scale(1.06)';
      const lid = giftContainer.querySelector('.gift-lid');
      if (lid) lid.style.transform = 'rotateX(50deg) translateY(-40px)';
      const content = giftContainer.querySelector('.gift-content');
      if (content) content.textContent = '✨';

      // Confetti
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, colors: ['#1a73e8','#4285f4','#64b5f6','#ffd700'] });

      // Reveal fan wishes (hide landing & rails)
      setTimeout(() => {
        if (landing) landing.classList.add('hidden');
        // update rails (hide them when landing is hidden)
        updateRailsVisibility();
        if (fanwish) {
          fanwish.classList.remove('hidden');
          fanwish.scrollIntoView({ behavior: 'smooth' });
          document.querySelectorAll('.wish-card').forEach((card, i) => setTimeout(() => card.classList.add('visible'), i * 90));
        }
      }, 900);

      // Reveal timeline
      setTimeout(() => {
        if (timeline) {
          timeline.classList.remove('hidden');
          window.scrollTo({ top: timeline.offsetTop - 20, behavior: 'smooth' });
          document.querySelectorAll('.timeline-card').forEach((card, i) => setTimeout(() => card.classList.add('visible'), i * 80));
          confetti({ particleCount: 300, spread: 90, origin: { y: 0.45 }, colors: ['#1a73e8','#4285f4','#64b5f6','#ffd700'] });
        }
      }, 4300);

      // Reveal finale and play video with audio
      setTimeout(() => {
        if (finale) {
          finale.classList.remove('hidden');
          finale.scrollIntoView({ behavior: 'smooth' });

          // burst confetti
          confetti({ particleCount: 500, spread: 160, origin: { y: 0.35 }, colors: ['#1a73e8','#4285f4','#64b5f6','#ffd700'] });

          // pause bg music and play final video
          if (bgAudio && !bgAudio.paused) {
            try { bgAudio.pause(); } catch(e){}
          }
          if (finalVideo) {
            finalVideo.muted = false;
            finalVideo.volume = 0.95;
            finalVideo.loop = false;
            finalVideo.play().catch(err => console.error('Video play failed:', err));
          }
        }
      }, 8800);
    });
  }

  // confetti on wish hover
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.wish-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    try {
      confetti({
        particleCount: 26,
        spread: 55,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + 15) / window.innerHeight
        },
        colors: ['#1a73e8','#4285f4','#64b5f6','#ffd700']
      });
    } catch (e) {}
  });
});
