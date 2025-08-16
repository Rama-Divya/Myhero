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

  // countdown to Aug 19
  function updateCountdown() {
    const now = new Date();
    const year = (now.getMonth() > 7 || (now.getMonth() === 7 && now.getDate() > 19)) ? now.getFullYear() + 1 : now.getFullYear();
    const target = new Date(year, 7, 19, 0, 0, 0);
    const diff = target - now;

    const d = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const h = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
    const m = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
    const s = Math.max(0, Math.floor((diff / 1000) % 60));

    if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // final video behavior: pause background when playing
  if (finalVideo) {
    finalVideo.volume = 0.95;
    finalVideo.muted = false;
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
    // random tiny tilt between -6 and 6 degrees (slightly smaller range for neater look)
    const tilt = (Math.random() * 12) - 6;
    pin.style.transform = `rotate(${tilt}deg)`;
    pin.style.transition = 'transform .32s ease, box-shadow .32s ease';
    pin.style.willChange = 'transform';
    // staggered entrance
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

  // gift click sequence (gift open sound removed as requested)
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
    confetti({
      particleCount: 26,
      spread: 55,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + 15) / window.innerHeight
      },
      colors: ['#1a73e8','#4285f4','#64b5f6','#ffd700']
    });
  });
});
