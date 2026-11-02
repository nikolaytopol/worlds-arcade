import { themes, symbolMarkup } from './themes.js';

const money = value => Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
const bonusInfo = {
  dune: { title: 'Ride the Maker', kicker: 'THE DEEP DESERT', intro: 'Find the rhythm beneath the sand.', character: 'Desert ranger' },
  witcher: { title: 'Signs of the Hunt', kicker: 'A CONTRACT IN THE MIST', intro: 'Remember the signs. Turn the creature back.', character: 'White Wolf' },
  pass: { title: 'Dinner Rush', kicker: 'THE MIDNIGHT SERVICE', intro: 'Three courses. One perfect service.', character: 'The chef' },
  ukraine: { title: 'A New Dawn', kicker: 'A VILLAGE REBORN', intro: 'Reconnect a village, one act at a time.', character: 'The restorer' },
};
let active = null;

const rune = name => {
  const paths = {
    Aard: '<path d="M32 8 9 52h46zM20 42h24M26 29h12"/>',
    Igni: '<path d="m32 7 21 19-21 31L11 26zM32 7v50M11 26h42"/>',
    Yrden: '<path d="m32 6 7 18 19 8-19 8-7 18-7-18L6 32l19-8zM18 18l28 28m0-28L18 46"/>',
  };
  return `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round">${paths[name]}</svg>`;
};

function randomIndex(length) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return Math.floor((values[0] / 4294967296) * length);
}

export async function playBonus(themeId, { stake = 5, reduced = false, practice = false } = {}) {
  if (active) return active;
  const id = Object.prototype.hasOwnProperty.call(themes, themeId) ? themeId : 'pass';
  const theme = themes[id];
  const info = bonusInfo[id];
  const wager = Number.isFinite(stake) && stake > 0 ? stake : 5;
  const promise = new Promise(resolve => {
    const dialog = document.createElement('dialog');
    const controller = new AbortController();
    const timers = new Set();
    let frame = 0;
    let closed = false;
    let finalResult = null;
    const previousFocus = document.activeElement;
    dialog.className = `bonus-dialog bonus-${id}${reduced ? ' bonus-reduced' : ''}`;
    dialog.style.setProperty('--bonus-accent', theme.accent);
    dialog.style.setProperty('--bonus-secondary', theme.accent2);
    dialog.style.setProperty('--bonus-bg', `url('${theme.background}')`);
    dialog.setAttribute('aria-labelledby', 'bonus-title');
    dialog.innerHTML = `<div class="bonus-backdrop" aria-hidden="true"></div><div class="bonus-vignette" aria-hidden="true"></div><header class="bonus-header"><span>${practice ? 'BONUS EXPLORER · PRACTICE' : 'BONUS ROUND · DEMO CREDITS'}</span><button class="bonus-leave" type="button" aria-label="${practice ? 'Close bonus preview' : 'Leave bonus and return later'}">×</button></header><div class="bonus-title"><p>${info.kicker}</p><h2 id="bonus-title">${info.title}</h2><span>${info.intro}</span></div><div class="bonus-scene"><div class="bonus-character" data-mood="idle" aria-hidden="true"><div class="bonus-character-aura"></div><img src="assets/characters/${id}-idle.webp" alt="" onerror="this.hidden=true"></div><div class="bonus-playarea"></div></div><div class="bonus-status" role="status" aria-live="polite" aria-atomic="true"></div><footer class="bonus-footer"><span>${practice ? 'PRACTICE ONLY · NO CREDITS AWARDED' : `BONUS BET ${money(wager)} · NO CASH VALUE`}</span><span class="bonus-progress">YOUR STORY STARTS HERE</span></footer>`;
    document.body.append(dialog);
    const area = dialog.querySelector('.bonus-playarea');
    const status = dialog.querySelector('.bonus-status');
    const progress = dialog.querySelector('.bonus-progress');
    const hero = dialog.querySelector('.bonus-character');
    const heroImg = hero.querySelector('img');

    function on(node, event, handler) { node.addEventListener(event, handler, { signal: controller.signal }); }
    function later(fn, ms) {
      const timer = setTimeout(() => { timers.delete(timer); if (!closed) fn(); }, ms);
      timers.add(timer);
      return timer;
    }
    function message(text) { if (!closed) status.textContent = text; }
    function character(mood) {
      hero.dataset.mood = mood;
      heroImg.hidden = false;
      heroImg.src = `assets/characters/${id}-${mood === 'win' ? 'win' : mood === 'action' ? 'action' : 'idle'}.webp`;
    }
    function creature(container, className, source) {
      const image = document.createElement('img');
      image.className = className;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.decoding = 'async';
      on(image, 'load', () => container.classList.add('creature-loaded'));
      on(image, 'error', () => { image.hidden = true; });
      container.prepend(image);
      image.src = source;
    }
    function finish(result) {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      timers.clear();
      controller.abort();
      if (dialog.open) dialog.close();
      dialog.remove();
      active = null;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      resolve(result);
    }
    function complete(multiplier, summary) {
      if (closed || finalResult) return;
      cancelAnimationFrame(frame);
      const reward = Math.round(wager * multiplier * 100) / 100;
      finalResult = { reward, summary: `${info.title}: ${summary} ${money(reward)} demo credits.` };
      dialog.classList.add('bonus-complete');
      character('win');
      progress.textContent = 'CHAPTER COMPLETE';
      area.innerHTML = `<div class="bonus-result"><span class="bonus-result-eyebrow">${practice ? 'PRACTICE COMPLETE' : 'YOUR BONUS RETURN'}</span><strong>${money(reward)}</strong><span>${practice ? 'ILLUSTRATIVE DEMO CREDITS' : 'DEMO CREDITS'}</span><p>${summary}</p><button class="bonus-primary" type="button">${practice ? 'Return to the game' : 'Collect bonus'} <span>→</span></button></div>`;
      message(practice ? 'Practice complete. No credits will be added to your balance.' : `Bonus complete. Collect ${money(reward)} demo credits.`);
      const collect = area.querySelector('button');
      on(collect, 'click', () => finish(finalResult));
      collect.focus({ preventScroll: true });
    }
    on(dialog.querySelector('.bonus-leave'), 'click', () => finish(null));
    on(dialog, 'cancel', event => { event.preventDefault(); finish(null); });
    on(dialog, 'close', () => { if (!closed) finish(null); });

    function dune() {
      let beats = 0;
      let total = 0;
      let started = performance.now();
      let phase = 0;
      let locked = false;
      area.innerHTML = `<div class="maker-stage"><div class="maker-horizon" aria-hidden="true"><svg viewBox="0 0 640 220"><path class="maker-body" d="M-20 205q110-160 240-70t210-35 230-45"/><path class="maker-dune" d="M0 200q140-80 280-20t360-40v80H0z"/></svg></div><div class="maker-beats"><i></i><i></i><i></i></div><div class="thumper"><div class="thumper-target"></div><div class="thumper-ring"></div><button type="button" class="thumper-button" aria-label="Strike the thumper">${symbolMarkup('dune', 'WORM')}<span>STRIKE</span></button></div><p class="bonus-instruction">${reduced ? 'Choose a route for each of your three beats.' : 'Strike when the moving ring meets the gold circle. Take your time.'}</p><div class="maker-routes" ${reduced ? '' : 'hidden'}><button data-value="5" type="button">Crescent ridge <b>5×</b></button><button data-value="6" type="button">Deep basin <b>6×</b></button><button data-value="4" type="button">High dune <b>4×</b></button></div><button type="button" class="bonus-text-button maker-access">${reduced ? 'Timing-free routes enabled' : 'Use timing-free routes'}</button></div>`;
      creature(area.querySelector('.maker-horizon'), 'maker-creature', 'assets/creatures/dune-maker.webp');
      const target = area.querySelector('.thumper-ring');
      const strike = area.querySelector('.thumper-button');
      const routes = area.querySelector('.maker-routes');
      const instruction = area.querySelector('.bonus-instruction');
      const routeButtons = [...routes.querySelectorAll('button')];
      let timingFree = reduced;
      function updateControls() {
        area.querySelector('.maker-stage').classList.toggle('routes-mode', timingFree);
        strike.disabled = locked || timingFree || beats >= 3;
        routeButtons.forEach(button => { button.disabled = locked || beats >= 3; });
      }
      function tick(now) {
        if (closed || finalResult || timingFree) return;
        phase = ((now - started) % 1800) / 1800;
        target.style.transform = `translate(-50%, -50%) scale(${0.45 + phase * 1.1})`;
        target.style.opacity = String(1 - phase * 0.55);
        frame = requestAnimationFrame(tick);
      }
      function hit(value) {
        if (closed || locked || beats >= 3) return;
        locked = true;
        updateControls();
        const quality = value || Math.max(3, Math.round(8 - Math.min(1, Math.abs(phase - 0.5) / 0.42) * 5));
        total += quality;
        area.querySelectorAll('.maker-beats i')[beats].classList.add('lit');
        beats += 1;
        progress.textContent = `BEAT ${beats} / 3 · ${total}×`;
        character('action');
        dialog.classList.remove('maker-impact');
        void dialog.offsetWidth;
        dialog.classList.add('maker-impact');
        message(`${quality >= 7 ? 'Perfect rhythm.' : quality >= 5 ? 'Steady rhythm.' : 'The maker hears you.'} Beat ${beats} returns ${quality}× your bonus bet.`);
        if (beats === 3) later(() => complete(total, 'You found the rhythm of the deep desert.'), reduced ? 120 : 750);
        else later(() => { locked = false; updateControls(); started = performance.now(); character('idle'); }, reduced ? 120 : 450);
      }
      on(strike, 'click', () => { if (!timingFree) hit(); });
      routeButtons.forEach(button => on(button, 'click', () => hit(Number(button.dataset.value))));
      on(area.querySelector('.maker-access'), 'click', event => {
        timingFree = true;
        cancelAnimationFrame(frame);
        routes.hidden = false;
        updateControls();
        instruction.textContent = 'Choose a route for each beat. No timing is required.';
        event.currentTarget.textContent = 'Timing-free routes enabled';
        routes.querySelector('button').focus({ preventScroll: true });
      });
      updateControls();
      if (!timingFree) frame = requestAnimationFrame(tick);
      message('Three beats summon the maker. Each beat adds to your bonus return.');
    }

    function witcher() {
      const names = ['Aard', 'Igni', 'Yrden'];
      const sequence = [...names];
      for (let i = sequence.length - 1; i > 0; i--) { const j = randomIndex(i + 1); [sequence[i], sequence[j]] = [sequence[j], sequence[i]]; }
      let attempt = 1;
      let guesses = [];
      let playing = false;
      let best = 0;
      area.innerHTML = `<div class="hunt-stage"><div class="hunt-enemy" aria-hidden="true"><svg viewBox="0 0 240 230"><path d="m74 186-7-56-29-26 20-12-21-47 38 13 10-34 22 38 31 1 22-35 10 36 38-11-21 40 17 12-27 27-8 54-31 31-22-11-20 11z"/><path class="hunt-eyes" d="m89 105 23 9-16 8zm65 0-23 9 16 8z"/><path class="hunt-scar" d="m105 151 17-10 17 10-17 20z"/></svg></div><div class="hunt-circle" aria-hidden="true"></div><div class="hunt-sequence" aria-label="The sign sequence to remember">${sequence.map((name, index) => `<div><b>${index + 1}</b>${rune(name)}<span>${name}</span></div>`).join('')}</div><p class="bonus-instruction">Study these signs in order. Begin when you are ready.</p><div class="hunt-controls"><button class="bonus-primary hunt-start" type="button">I’ve remembered <span>→</span></button><div class="hunt-choices" hidden>${names.map(name => `<button type="button" data-rune="${name}">${rune(name)}<span>${name}</span></button>`).join('')}</div></div><div class="hunt-steps"><i></i><i></i><i></i></div></div>`;
      creature(area.querySelector('.hunt-enemy'), 'hunt-creature', 'assets/creatures/witcher-leshen.webp');
      const show = area.querySelector('.hunt-sequence');
      const start = area.querySelector('.hunt-start');
      const choices = area.querySelector('.hunt-choices');
      const instruction = area.querySelector('.bonus-instruction');
      on(start, 'click', () => {
        guesses = [];
        playing = true;
        show.classList.add('concealed');
        area.querySelector('.hunt-stage').classList.add('is-casting');
        start.hidden = true;
        choices.hidden = false;
        instruction.textContent = 'Cast the three signs in the same order.';
        area.querySelectorAll('.hunt-steps i').forEach(node => node.className = '');
        choices.querySelector('button').focus({ preventScroll: true });
        message(`Attempt ${attempt} of 3. Cast the first sign.`);
      });
      choices.querySelectorAll('button').forEach(button => on(button, 'click', () => {
        if (!playing || closed || guesses.length >= 3) return;
        const name = button.dataset.rune;
        const index = guesses.length;
        guesses.push(name);
        const correct = name === sequence[index];
        area.querySelectorAll('.hunt-steps i')[index].className = correct ? 'lit' : 'miss';
        character('action');
        dialog.classList.remove('sign-cast');
        void dialog.offsetWidth;
        if (correct) dialog.classList.add('sign-cast');
        message(`${name} cast. ${guesses.length} of 3 signs.`);
        if (guesses.length < 3) return;
        playing = false;
        const count = guesses.filter((guess, i) => guess === sequence[i]).length;
        best = Math.max(best, count);
        if (count === 3) {
          dialog.classList.add('hunt-defeated');
          later(() => complete(20, 'The signs held. Your contract is fulfilled.'), reduced ? 120 : 950);
        } else if (attempt === 3) later(() => complete(best >= 2 ? 12 : 6, `${best} signs aligned. You returned safely from the hunt.`), reduced ? 120 : 650);
        else {
          attempt += 1;
          progress.textContent = `ATTEMPT ${attempt} / 3`;
          later(() => {
            show.classList.remove('concealed');
            area.querySelector('.hunt-stage').classList.remove('is-casting');
            choices.hidden = true;
            start.hidden = false;
            start.textContent = 'Try the signs again →';
            instruction.textContent = `${count} signs aligned. Study the order and try again.`;
            message(`${count} correct signs. You have ${4 - attempt} attempts remaining.`);
            start.focus({ preventScroll: true });
            character('idle');
          }, reduced ? 120 : 650);
        }
      }));
      progress.textContent = 'ATTEMPT 1 / 3';
      message(`Remember ${sequence.join(', then ')}. A perfect sequence returns 20× your bonus bet.`);
    }

    function pass() {
      const courses = [
        { name: 'Sear the first course', request: 'A clean flame, chef.', target: 'FLAME' },
        { name: 'Finish the garden plate', request: 'A fresh olive garnish.', target: 'OLIVE' },
        { name: 'Send the midnight braise', request: 'The copper pot is ready.', target: 'POT' },
      ];
      let course = 0;
      let correct = 0;
      let locked = false;
      area.innerHTML = `<div class="service-stage"><div class="service-steam" aria-hidden="true"><i></i><i></i><i></i></div><div class="service-tickets">${courses.map((item, i) => `<span class="${i === 0 ? 'active' : ''}">COURSE 0${i + 1}</span>`).join('')}</div><div class="service-order"><span>ON THE PASS</span><h3></h3><p></p><div class="service-plate"></div></div><div class="service-choices">${[['FLAME','Fire'],['OLIVE','Herbs'],['POT','Copper']].map(([key,label])=>`<button type="button" data-ingredient="${key}">${symbolMarkup('pass',key)}<span>${label}</span></button>`).join('')}</div></div>`;
      const ingredientButtons = [...area.querySelectorAll('.service-choices button')];
      function showCourse() {
        const ticket = courses[course];
        area.querySelector('.service-order h3').textContent = ticket.name;
        area.querySelector('.service-order p').textContent = ticket.request;
        area.querySelector('.service-plate').innerHTML = symbolMarkup('pass', ticket.target);
        progress.textContent = `COURSE ${course + 1} / 3`;
        area.querySelectorAll('.service-tickets span').forEach((node, i) => node.className = i < course ? 'done' : i === course ? 'active' : '');
        message(`${ticket.name}. ${ticket.request} Choose Fire, Herbs, or Copper.`);
      }
      ingredientButtons.forEach(button => on(button, 'click', () => {
        if (closed || locked || course >= courses.length) return;
        locked = true;
        ingredientButtons.forEach(control => { control.disabled = true; });
        const success = button.dataset.ingredient === courses[course].target;
        if (success) correct += 1;
        character('action');
        dialog.classList.remove('service-send');
        void dialog.offsetWidth;
        dialog.classList.add('service-send');
        message(success ? 'Perfect. Send the plate.' : 'A new interpretation. The next course is on its way.');
        course += 1;
        if (course === 3) later(() => complete(3 + correct * 4, `${correct} of 3 courses perfectly served.`), reduced ? 120 : 700);
        else later(() => { showCourse(); locked = false; ingredientButtons.forEach(control => { control.disabled = false; }); character('idle'); }, reduced ? 120 : 650);
      }));
      showCourse();
    }

    function ukraine() {
      const projects = [
        { key:'bridge', name:'Reconnect the bridge', symbol:'BRIDGE', first:6, next:3, story:'The river no longer separates neighbours.' },
        { key:'home', name:'Bring light home', symbol:'HOME', first:5, next:4, story:'Warm windows welcome families home.' },
        { key:'garden', name:'Plant a new garden', symbol:'SUNFLOWER', first:4, next:5, story:'Sunflowers return to the village square.' },
      ];
      const completed = new Set();
      let total = 0;
      let locked = false;
      area.innerHTML = `<div class="dawn-stage"><div class="village-map" aria-hidden="true"><svg viewBox="0 0 640 230"><defs><linearGradient id="bonus-dawn-sky" x2="0" y2="1"><stop stop-color="#dbc77a"/><stop offset="1" stop-color="#617d77"/></linearGradient></defs><circle class="village-sun" cx="425" cy="88" r="38"/><path class="village-hill" d="M0 174q95-89 200-25t230-20 210 34v67H0z"/><path class="village-river" d="M300 230q-90-39-34-67t-10-59h66q65 36 2 68t102 58z"/><g class="village-project" data-project="bridge"><path d="M233 162h137v12H233zM242 162v-37h8v37m101 0v-37h8v37"/><path d="M246 128q55 38 109 0M270 144v19m60-19v19" fill="none" stroke="currentColor" stroke-width="4"/></g><g class="village-project" data-project="home"><path d="M95 124h75v67H95zM83 128l49-45 49 45z"/><path class="village-window" d="M105 139h15v17h-15zm41 0h15v17h-15zm-21 27h18v25h-18z"/></g><g class="village-project" data-project="garden"><path d="M445 207v-47m32 51v-62m32 58v-43" fill="none" stroke="currentColor" stroke-width="5"/><g class="village-flowers"><circle cx="445" cy="155" r="14"/><circle cx="477" cy="143" r="18"/><circle cx="509" cy="159" r="14"/></g></g></svg></div><p class="bonus-instruction">Choose what to restore first. Every project adds to the dawn.</p><div class="project-choices">${projects.map(project=>`<button type="button" data-project="${project.key}">${symbolMarkup('ukraine',project.symbol)}<strong>${project.name}</strong><span>${project.first}× first · ${project.next}× later</span></button>`).join('')}</div></div>`;
      const projectButtons = [...area.querySelectorAll('.project-choices button')];
      projectButtons.forEach(button => on(button, 'click', () => {
        const key = button.dataset.project;
        if (closed || locked || completed.has(key)) return;
        locked = true;
        projectButtons.forEach(control => { control.disabled = true; });
        const project = projects.find(item => item.key === key);
        const amount = completed.size ? project.next : project.first;
        completed.add(key);
        total += amount;
        button.disabled = true;
        button.classList.add('restored');
        area.querySelector(`.village-project[data-project="${key}"]`).classList.add('restored');
        dialog.style.setProperty('--dawn-progress', String(completed.size / 3));
        character('action');
        progress.textContent = `${completed.size} / 3 RESTORED · ${total}×`;
        message(`${project.story} Added ${amount}× your bonus bet.`);
        if (completed.size === 3) later(() => complete(total, 'The bridge, homes, and garden shine again.'), reduced ? 120 : 950);
        else later(() => { locked = false; projectButtons.forEach(control => { control.disabled = completed.has(control.dataset.project); }); character('idle'); }, reduced ? 120 : 450);
      }));
      message('Restore the bridge, homes, and garden. Your first choice shapes the bonus return.');
    }

    try {
      ({ dune, witcher, pass, ukraine })[id]();
      dialog.showModal();
      const firstControl = area.querySelector('button:not(:disabled):not([hidden])');
      (firstControl || dialog.querySelector('.bonus-leave')).focus({ preventScroll: true });
    } catch (error) {
      console.error('Bonus could not open:', error);
      finish(null);
    }
  });
  active = promise;
  try { return await promise; }
  finally { if (active === promise) active = null; }
}
