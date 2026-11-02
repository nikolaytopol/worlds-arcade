import { createSlotVideo } from './slot-video.js';

const actors = {
  pass: { name: 'Lucien · The night chef', role: 'THE LAST SERVICE', idle: 'The kitchen is yours. Make it memorable.', spin: 'A little fire. A little instinct.', win: 'Now that deserves a second serving.', bonus: 'Three orders. One unforgettable service.' },
  dune: { name: 'The desert ranger', role: 'THE CALL OF THE MAKER', idle: 'Listen closely. The desert is alive.', spin: 'The sand is moving. Hold your ground.', win: 'The spice has found its way to you.', bonus: 'Place the thumper. Ride with the Maker.' },
  witcher: { name: 'The White Wolf', role: 'A CONTRACT IN THE MIST', idle: 'Keep your silver close. Trust your signs.', spin: 'Something stirs beyond the treeline.', win: 'A clean contract. A worthy reward.', bonus: 'Remember the signs. Meet the darkness.' },
  ukraine: { name: 'Mila · The village restorer', role: 'A NEW DAY BEGINS', idle: 'Every small act brings us closer to home.', spin: 'A bridge. A garden. A place to begin.', win: 'Look how much light we have gathered.', bonus: 'Let us bring this village back to life.' },
};

const ornaments = {
  pass: '<div class="scene-steam scene-steam-a"></div><div class="scene-steam scene-steam-b"></div><div class="scene-copper-orbit"></div>',
  dune: '<div class="scene-dune-haze"></div><svg class="scene-maker" viewBox="0 0 300 130" aria-hidden="true"><defs><linearGradient id="makerSkin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e3b76b"/><stop offset="1" stop-color="#46331f"/></linearGradient></defs><path d="M-30 125C20 80 32 112 77 82s35-61 84-62c30 0 36 30 56 32s56 29 67 74" fill="url(#makerSkin)" stroke="#b48c52" stroke-width="2"/><path d="M41 105l11 25M66 91l14 35M90 74l21 46M111 45l28 58M137 24l24 64M161 21l12 61M183 29l4 54M210 53l-5 43M233 63l-7 48M259 87l-10 35" stroke="#32271d" stroke-width="5" fill="none"/></svg><div class="scene-thumper"><i></i><i></i><i></i></div>',
  witcher: '<div class="scene-mist scene-mist-a"></div><div class="scene-mist scene-mist-b"></div><svg class="scene-raven" viewBox="0 0 120 50" aria-hidden="true"><path d="M60 28Q26 5 1 19q23 2 35 15l19 4 5 10 5-10 19-4q12-13 35-15Q94 5 60 28" fill="#101a16" stroke="#829884" stroke-opacity=".25"/></svg><svg class="scene-sign" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54"/><path d="m60 12 42 72H18zM60 108 18 36h84z"/><circle cx="60" cy="60" r="24"/></svg><div class="scene-silver-slash"></div>',
  ukraine: '<div class="scene-sunbeam"></div><svg class="scene-dove" viewBox="0 0 100 70" aria-hidden="true"><path d="M43 34Q14 18 6 6q2 34 32 38L20 61l28-7q28 2 34-22l12-5-13-3q-10-10-19 4Q64 5 48 1z" fill="#f6eed1" fill-opacity=".75"/></svg>',
};

export function createCinema(themeId, { reduced = false } = {}) {
  const stage = document.getElementById('worldStage');
  if (!stage) return { setState() {}, setReduced() {}, destroy() {} };
  const actor = actors[themeId] || actors.pass;
  const film = createSlotVideo(stage.closest('.game-arena') || stage, themeId, {
    reduced,
    className: 'scene-film',
    onPlaying: value => document.body.classList.toggle('slot-cinema-live', value),
  });
  let mood = 'idle';
  let engaged = false;
  let resetTimer;
  let introTimer;
  let inView = true;
  let disposed = false;
  function syncVisibility() {
    const paused = document.hidden || !inView;
    stage.classList.toggle('scene-paused', paused);
    document.body.classList.toggle('cinema-suspended', paused);
  }
  const visibilityObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    inView = entries[0]?.isIntersecting !== false;
    syncVisibility();
  }, { threshold: 0 }) : null;
  visibilityObserver?.observe(stage);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
  const atmosphere = stage.querySelector('.scene-atmosphere') || stage.appendChild(document.createElement('div'));
  atmosphere.classList.add('scene-atmosphere');
  atmosphere.setAttribute('aria-hidden', 'true');
  atmosphere.innerHTML = `${ornaments[themeId] || ornaments.pass}<div class="scene-particles"></div><div class="scene-horizon"></div><span class="scene-chapter">${actor.role}</span>`;
  if (themeId === 'dune' || themeId === 'witcher') {
    const creature = document.createElement('img');
    creature.className = 'scene-boss';
    creature.alt = '';
    creature.src = `assets/creatures/${themeId === 'dune' ? 'dune-maker' : 'witcher-leshen'}.webp`;
    creature.addEventListener('load', () => stage.classList.add('scene-boss-ready'), {once:true});
    creature.addEventListener('error', () => { creature.hidden = true; }, {once:true});
    atmosphere.append(creature);
  }
  const particles = atmosphere.querySelector('.scene-particles');
  const particleCount = matchMedia('(max-width: 900px)').matches ? 12 : 18;
  for (let i = 0; i < particleCount; i++) {
    const mote = document.createElement('i');
    mote.style.cssText = `--x:${(i * 41 + 17) % 100}%;--y:${(i * 67 + 11) % 100}%;--delay:${-(i % 9) * .63}s;--duration:${4 + (i % 5)}s;--drift:${(i % 2 ? 1 : -1) * (10 + i % 19)}px;--size:${1.5 + i % 3}px`;
    particles.append(mote);
  }
  const anchor = stage.querySelector('.character-anchor') || stage.appendChild(document.createElement('div'));
  anchor.classList.add('character-anchor');
  anchor.setAttribute('aria-hidden', 'true');
  anchor.innerHTML = '<div class="character-aura"></div><div class="character-ground"></div>';
  const poses = new Map();
  const loadedPoses = new Set();
  let requestedPose = 'idle';
  function applyPose() {
    const target = loadedPoses.has(requestedPose) ? requestedPose : loadedPoses.has('idle') ? 'idle' : [...loadedPoses][0];
    for (const [key, image] of poses) image.classList.toggle('pose-active', key === target);
  }
  for (const pose of ['idle', 'action', 'win']) {
    const image = document.createElement('img');
    image.className = `character-pose pose-${pose}${pose === 'idle' ? ' pose-active' : ''}`;
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    image.src = `assets/characters/${themeId}-${pose}.webp`;
    image.addEventListener('load', async () => {
      try { await image.decode(); } catch { /* Some browsers already decoded at load. */ }
      if (disposed) return;
      loadedPoses.add(pose);
      stage.classList.add('character-ready');
      applyPose();
    }, { once: true });
    image.addEventListener('error', () => { image.hidden = true; loadedPoses.delete(pose); applyPose(); }, { once: true });
    anchor.append(image);
    poses.set(pose, image);
  }
  const name = stage.querySelector('#characterName');
  const line = stage.querySelector('#characterLine');
  if (name) name.textContent = actor.name;
  if (line) line.textContent = actor.idle;
  stage.dataset.world = themeId;
  stage.dataset.mood = 'idle';
  stage.classList.toggle('scene-reduced', reduced);
  stage.classList.add('scene-intro');
  introTimer = setTimeout(() => stage.classList.remove('scene-intro'), 1450);

  function setState(nextMood, detail = {}) {
    clearTimeout(resetTimer);
    mood = nextMood;
    stage.dataset.mood = mood;
    document.body.dataset.cinema = mood;
    const target = mood === 'spin' || mood === 'bonus' ? 'action' : mood === 'win' ? 'win' : 'idle';
    requestedPose = target;
    applyPose();
    if (line) line.textContent = actor[mood] || actor.idle;
    if (mood === 'spin' || mood === 'win') engaged = true;
    film.setActive(engaged && mood !== 'idle', { restart: true });
    if (mood === 'win') resetTimer = setTimeout(() => setState('idle'), detail.big ? 5200 : 3100);
  }
  function setReduced(value) {
    reduced = value;
    stage.classList.toggle('scene-reduced', reduced);
    film.setReduced(reduced);
  }
  return {
    setState,
    setReduced,
    destroy() {
      disposed = true;
      clearTimeout(resetTimer);
      clearTimeout(introTimer);
      visibilityObserver?.disconnect();
      film.destroy();
      document.removeEventListener('visibilitychange', syncVisibility);
      document.body.classList.remove('cinema-suspended');
      document.body.classList.remove('slot-cinema-live');
      delete document.body.dataset.cinema;
    },
  };
}
