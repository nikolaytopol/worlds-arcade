// Playback is shared by the slot scene and its modal bonus: only the foremost
// visible scene may play, so opening a bonus never starts a second decoder.
const scenes = new Set();
const worlds = new Set(['pass', 'dune', 'witcher', 'ukraine']);
let owner = null;
let sequence = 0;

function reconcile() {
  let foremost = null;
  for (const scene of scenes) {
    if (!scene.claimsPlayback()) continue;
    if (!foremost || scene.priority > foremost.priority || (scene.priority === foremost.priority && scene.order > foremost.order)) foremost = scene;
  }
  // A modal still occludes the slot when its own media is unavailable.
  const next = foremost?.eligible() ? foremost : null;
  owner = next;
  for (const scene of scenes) if (scene !== next) scene.pause();
  next?.resume();
}

export function createSlotVideo(host, themeId, { reduced = false, priority = 0, className = '', onPlaying = () => {} } = {}) {
  if (!host || !worlds.has(themeId)) return { setActive() {}, setReduced() {}, destroy() {} };
  const video = document.createElement('video');
  video.className = `slot-video ${className}`.trim();
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'none';
  video.controls = false;
  video.disablePictureInPicture = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('tabindex', '-1');
  video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
  video.poster = new URL(`assets/${themeId}.webp`, document.baseURI).href;
  host.append(video);

  let active = false;
  let visible = true;
  let failed = false;
  let blocked = false;
  let complete = false;
  let disposed = false;
  let suspended = false;
  let shown = false;
  let pending = false;
  let restart = false;
  let attempt = 0;
  const controller = new AbortController();
  const on = (node, event, handler, options = {}) => node.addEventListener(event, handler, { ...options, signal: controller.signal });

  function show(value) {
    if (shown === value) return;
    shown = value;
    host.classList.toggle('slot-video-playing', value);
    onPlaying(value);
  }

  const scene = {
    priority,
    order: 0,
    claimsPlayback: () => active && visible && !document.hidden && !disposed && !suspended,
    eligible: () => active && !reduced && visible && !document.hidden && !failed && !blocked && !complete && !disposed && !suspended,
    pause() {
      attempt += 1;
      pending = false;
      video.pause();
      show(false);
    },
    resume() {
      if (disposed || owner !== scene || !scene.eligible()) return;
      if (!video.getAttribute('src')) {
        // No video is requested on page load or for a reduced-motion visitor.
        video.src = new URL(`assets/video/${themeId}-v1.mp4`, document.baseURI).href;
        video.load();
      }
      if (restart) {
        try { video.currentTime = 0; restart = false; } catch { /* Seek after metadata arrives. */ }
      }
      if (pending || !video.paused) return;
      pending = true;
      const request = ++attempt;
      let playing;
      try { playing = video.play(); }
      catch { pending = false; blocked = true; show(false); return; }
      Promise.resolve(playing).then(() => {
        if (disposed || request !== attempt) return;
        pending = false;
        if (owner !== scene || !scene.eligible()) video.pause();
      }).catch(error => {
        if (disposed || request !== attempt) return;
        pending = false;
        show(false);
        if (error?.name === 'NotSupportedError') failed = true;
        else if (error?.name !== 'AbortError') blocked = true;
        // Static artwork remains in place if a browser declines playback.
      });
    },
  };

  on(video, 'playing', () => {
    pending = false;
    if (owner === scene && scene.eligible()) show(true);
    else video.pause();
  });
  on(video, 'pause', () => show(false));
  on(video, 'waiting', () => show(false));
  on(video, 'error', () => { failed = true; pending = false; show(false); reconcile(); });
  on(video, 'ended', () => { complete = true; show(false); reconcile(); });
  on(video, 'loadedmetadata', () => {
    if (restart) {
      try { video.currentTime = 0; restart = false; } catch { /* A nonseekable source still plays normally. */ }
    }
  });
  on(document, 'visibilitychange', reconcile);
  const retryFromGesture = () => {
    if (!active || !blocked || disposed) return;
    blocked = false;
    reconcile();
  };
  on(document, 'pointerdown', retryFromGesture, { passive: true });
  on(document, 'keydown', retryFromGesture);
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting !== false;
    reconcile();
  }, { threshold: 0 }) : null;
  observer?.observe(host);
  scenes.add(scene);

  const api = {
    setActive(value, { restart: fromStart = false, loop = false } = {}) {
      if (disposed) return;
      const entering = value && !active;
      active = Boolean(value);
      video.loop = loop;
      if (active && (entering || fromStart)) {
        complete = false;
        blocked = false;
        restart = true;
        scene.order = ++sequence;
      }
      reconcile();
    },
    setReduced(value) {
      reduced = Boolean(value);
      reconcile();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      scene.pause();
      observer?.disconnect();
      controller.abort();
      scenes.delete(scene);
      video.removeAttribute('src');
      video.load();
      video.remove();
      reconcile();
    },
  };
  on(window, 'pagehide', event => {
    if (!event.persisted) { api.destroy(); return; }
    suspended = true;
    reconcile();
  });
  on(window, 'pageshow', () => {
    suspended = false;
    reconcile();
  });
  return api;
}
