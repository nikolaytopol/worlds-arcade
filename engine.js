import { themes, symbolMarkup } from './themes.js';
import { createCinema } from './cinema.js';
import { playBonus } from './bonuses.js';

const COLS = 5;
const ROWS = 3;
const BETS = [1, 2, 5, 10, 25];
const PAYLINES = [[0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2]];
const cash = value => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

function payoutFor(symbol, count) {
  if (!symbol || count < 3) return 0;
  if (Array.isArray(symbol.pay)) return Number(symbol.pay.length === 3 ? symbol.pay[count - 3] : symbol.pay[count]) || 0;
  return (Number(symbol.pay) || 0) * [1, 3, 8][count - 3];
}

// This pure result function is also used by the build's deterministic engine checks.
export function evaluateGrid(grid, symbols, stake = 1, multiplier = 1) {
  const lookup = new Map(symbols.map(symbol => [symbol.id, symbol]));
  const hits = [];
  let lineTotal = 0;
  for (let lineIndex = 0; lineIndex < PAYLINES.length; lineIndex += 1) {
    const line = PAYLINES[lineIndex];
    const ids = line.map((row, col) => grid[col][row]);
    let target = 'WILD';
    for (const id of ids) {
      if (id === 'SCATTER') break;
      if (id !== 'WILD') { target = id; break; }
    }
    let count = 0;
    for (const id of ids) {
      if (id === 'SCATTER' || (id !== target && id !== 'WILD')) break;
      count += 1;
    }
    let payout = round(payoutFor(lookup.get(target), count) * stake * multiplier);
    const leadingWilds = ids.findIndex(id => id !== 'WILD');
    const wildCount = leadingWilds < 0 ? COLS : leadingWilds;
    const wildPayout = round(payoutFor(lookup.get('WILD'), wildCount) * stake * multiplier);
    if (wildPayout > payout) { target = 'WILD'; count = wildCount; payout = wildPayout; }
    if (payout > 0) {
      lineTotal += payout;
      hits.push({ line: lineIndex + 1, symbol: target, count, payout, cells: line.slice(0, count).map((row, col) => ({ col, row })) });
    }
  }
  const scatterCells = [];
  grid.forEach((column, col) => column.forEach((id, row) => { if (id === 'SCATTER') scatterCells.push({ col, row }); }));
  const scatters = scatterCells.length;
  const scatterTotal = scatters >= 3 ? round(stake * 20 * multiplier) : 0;
  return { total: round(lineTotal + scatterTotal), lineTotal: round(lineTotal), scatterTotal, scatters, scatterCells, hits };
}

function randomUnit() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 4294967296;
}

function pickSymbol(symbols) {
  const weight = symbol => symbol.id === 'WILD' ? 2 : symbol.id === 'SCATTER' ? 2 : ['A', 'K', 'Q', 'J'].includes(symbol.id) ? 13 : 7;
  let cursor = randomUnit() * symbols.reduce((total, symbol) => total + weight(symbol), 0);
  for (const symbol of symbols) {
    cursor -= weight(symbol);
    if (cursor < 0) return symbol.id;
  }
  return symbols[symbols.length - 1].id;
}

function readStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function boot() {
  document.body.classList.toggle('embedded', new URLSearchParams(location.search).get('embed') === '1');
  const themeId = Object.prototype.hasOwnProperty.call(themes, document.body.dataset.game) ? document.body.dataset.game : 'pass';
  const theme = themes[themeId];
  const key = `worlds-arcade:v1:${themeId}`;
  const prefsKey = 'worlds-arcade:prefs:v1';
  const stored = readStored(key);
  const prefs = readStored(prefsKey) || {};
  const savedBalance = Number(stored?.balance);
  const validIds = new Set(theme.symbols.map(symbol => symbol.id));
  const savedGrid = Array.isArray(stored?.grid) && stored.grid.length === COLS && stored.grid.every(column => Array.isArray(column) && column.length === ROWS && column.every(id => validIds.has(id))) ? stored.grid : null;
  const state = {
    balance: Number.isFinite(savedBalance) && savedBalance >= 0 && savedBalance < 1e10 ? savedBalance : 1000,
    betIndex: Number.isInteger(stored?.betIndex) && stored.betIndex >= 0 && stored.betIndex < BETS.length ? stored.betIndex : 2,
    power: Number.isInteger(stored?.power) && stored.power >= 0 && stored.power <= 5 ? stored.power : 0,
    win: Number.isFinite(stored?.win) && stored.win >= 0 ? stored.win : 0,
    busy: false,
    sound: prefs.sound === true,
    reduced: typeof prefs.reduced === 'boolean' ? prefs.reduced : matchMedia('(prefers-reduced-motion: reduce)').matches,
    grid: savedGrid || Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => pickSymbol(theme.symbols))),
    net: 0,
    pendingRound: null,
    bonusStake: BETS.includes(stored?.bonusStake) ? stored.bonusStake : BETS[Number.isInteger(stored?.betIndex) ? Math.max(0, Math.min(4, stored.betIndex)) : 2],
    bonusTicket: typeof stored?.bonusTicket === 'string' ? stored.bonusTicket : null,
    inBonus: false,
  };
  const el = {};
  for (const id of ['reels', 'balance', 'win', 'bet', 'spinButton', 'betDown', 'betUp', 'message', 'stage', 'winOverlay', 'winAmount', 'winTitle', 'closeWin', 'soundButton', 'motionButton', 'helpButton', 'helpDialog', 'closeHelp', 'paytable', 'resetButton', 'sessionNet', 'featureMeter', 'featureLabel', 'gameStatus', 'bonusButton', 'previewBonus', 'bonusStatus']) el[id] = document.getElementById(id);
  if (!el.reels) return;
  const cinema = createCinema(themeId, { reduced: state.reduced });
  const ticket = () => crypto.randomUUID?.() || `${Date.now()}-${randomUnit()}`;
  if (state.power === 5 && !state.bonusTicket) state.bonusTicket = ticket();
  let audio;
  let overlayTimer;
  let restoreFocus;
  const activeTracks = new Map();
  const measuredHeights = new WeakMap();
  let measureFrame = 0;
  const symbolLookup = new Map(theme.symbols.map(symbol => [symbol.id, symbol]));
  const symbolTemplates = new Map();
  const paintLibrary = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  paintLibrary.setAttribute('aria-hidden', 'true');
  paintLibrary.setAttribute('width', '0');
  paintLibrary.setAttribute('height', '0');
  paintLibrary.style.cssText = 'position:absolute;overflow:hidden;pointer-events:none';
  const paintDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  paintLibrary.append(paintDefs);
  for (const symbol of theme.symbols) {
    const template = document.createElement('template');
    template.innerHTML = symbolMarkup(themeId, symbol.id);
    const art = template.content.firstElementChild;
    const defs = art.querySelector('defs');
    if (defs) { paintDefs.append(...defs.children); defs.remove(); }
    symbolTemplates.set(symbol.id, art);
  }
  document.body.append(paintLibrary);

  function persist() {
    try {
      // Commit the complete selected result before animation so refresh/navigation
      // cannot undo a debit or discard an earned return halfway through a spin.
      const settled = state.pendingRound || state;
      localStorage.setItem(key, JSON.stringify({ balance: settled.balance, betIndex: state.betIndex, power: settled.power, grid: settled.grid, win: settled.win, bonusStake: settled.bonusStake, bonusTicket: settled.bonusTicket }));
      localStorage.setItem(prefsKey, JSON.stringify({ sound: state.sound, reduced: state.reduced }));
    } catch { /* The game remains playable when storage is unavailable. */ }
  }

  function text(node, value) { if (node) node.textContent = value; }
  function announce(value) { text(el.message, value); }
  function paint() {
    text(el.balance, cash(state.balance));
    text(el.win, cash(state.win));
    text(el.bet, cash(BETS[state.betIndex]));
    text(el.sessionNet, `SESSION ${state.net >= 0 ? '+' : '−'}${cash(Math.abs(state.net))}`);
    if (el.sessionNet) el.sessionNet.dataset.positive = String(state.net > 0);
    if (el.spinButton) {
      el.spinButton.disabled = state.busy || state.power === 5;
      el.spinButton.setAttribute('aria-busy', String(state.busy));
      el.spinButton.setAttribute('aria-label', state.inBonus ? 'Bonus round in progress' : state.busy ? 'Reels spinning' : state.power === 5 ? 'Bonus ready. Enter your bonus round to continue.' : `Spin for ${BETS[state.betIndex]} demo credits`);
      const label = el.spinButton.querySelector('[data-spin-label]') || el.spinButton.querySelector('span');
      if (label) label.textContent = state.inBonus ? 'Bonus' : state.busy ? 'Spinning' : state.power === 5 ? 'Bonus ready' : 'Spin';
      else el.spinButton.textContent = state.inBonus ? 'Bonus' : state.busy ? 'Spinning' : state.power === 5 ? 'Bonus ready' : 'Spin';
    }
    if (el.betDown) el.betDown.disabled = state.busy || state.betIndex === 0;
    if (el.betUp) el.betUp.disabled = state.busy || state.betIndex === BETS.length - 1;
    if (el.resetButton) el.resetButton.disabled = state.busy;
    if (el.helpButton) el.helpButton.disabled = state.busy;
    if (el.soundButton) { el.soundButton.setAttribute('aria-pressed', String(state.sound)); el.soundButton.setAttribute('aria-label', state.sound ? 'Mute sound' : 'Enable sound'); el.soundButton.classList.toggle('is-on', state.sound); }
    if (el.motionButton) { el.motionButton.setAttribute('aria-pressed', String(state.reduced)); el.motionButton.setAttribute('aria-label', state.reduced ? 'Enable full motion' : 'Reduce motion'); el.motionButton.classList.toggle('is-on', state.reduced); }
    if (el.featureMeter) el.featureMeter.style.width = `${state.power * 20}%`;
    text(el.featureLabel, state.power === 5 ? 'BONUS READY' : `${state.power} / 5`);
    text(el.gameStatus, state.inBonus ? 'Bonus round' : state.busy ? 'In motion' : state.power === 5 ? 'Bonus unlocked' : 'Ready to play');
    if (el.bonusButton) { el.bonusButton.disabled = state.busy || state.power < 5; el.bonusButton.classList.toggle('is-ready', state.power === 5); }
    if (el.previewBonus) el.previewBonus.disabled = state.busy;
    text(el.bonusStatus, state.power === 5 ? `Your bonus is ready · based on your ${state.bonusStake}-credit qualifying bet.` : `${5 - state.power} spins until your exclusive bonus round.`);
    document.body.classList.toggle('reduced-motion', state.reduced);
    document.body.classList.toggle('motion-full', !state.reduced);
    el.reels.setAttribute('aria-busy', String(state.busy));
    el.stage?.classList.toggle('is-spinning', state.busy);
  }

  function symbolNode(id, row, col) {
    const node = document.createElement('div');
    node.className = `symbol${id === 'WILD' ? ' is-wild' : id === 'SCATTER' ? ' is-scatter' : ''}`;
    node.dataset.symbol = id;
    node.dataset.row = String(row);
    node.dataset.col = String(col);
    const symbol = symbolLookup.get(id);
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', symbol?.name || id);
    node.append((symbolTemplates.get(id) || symbolTemplates.values().next().value).cloneNode(true));
    return node;
  }

  function mountGrid() {
    el.reels.replaceChildren();
    state.grid.forEach((column, col) => {
      const reel = document.createElement('div');
      reel.className = 'reel';
      reel.setAttribute('role', 'group');
      reel.setAttribute('aria-label', `Reel ${col + 1}`);
      const track = document.createElement('div');
      track.className = 'reel-track';
      track.style.willChange = 'auto';
      column.forEach((id, row) => track.append(symbolNode(id, row, col)));
      reel.append(track);
      el.reels.append(reel);
    });
    measure();
  }

  function measure() {
    const measurements = [...el.reels.children].map(reel => ({ reel, height: reel.clientHeight / ROWS }));
    for (const { reel, height } of measurements) {
      if (height <= 0 || Math.abs((measuredHeights.get(reel) || 0) - height) < .05) continue;
      measuredHeights.set(reel, height);
      reel.style.setProperty('--symbol-height', `${height}px`);
      for (const cell of reel.querySelectorAll('.symbol')) cell.style.height = `${height}px`;
      const moving = activeTracks.get(reel);
      if (moving && Math.abs(moving.height - height) > 0.1) {
        moving.height = height;
        moving.animation?.effect?.setKeyframes(reelFrames(height, moving.travel));
      }
    }
  }

  function requestMeasure() {
    if (measureFrame) return;
    measureFrame = requestAnimationFrame(() => { measureFrame = 0; measure(); });
  }

  function reelFrames(height, travel) {
    // Integrate one continuous velocity curve: eased acceleration, cruise, then
    // cosine deceleration. Sampling it avoids abrupt speed changes at phase joins.
    const accelerateUntil = .16;
    const coastUntil = .64;
    const deceleration = 1 - coastUntil;
    const totalArea = accelerateUntil / 2 + coastUntil - accelerateUntil + deceleration / 2;
    return Array.from({ length: 61 }, (_, index) => {
      const t = index / 60;
      let area;
      if (t < accelerateUntil) {
        const u = t / accelerateUntil;
        area = accelerateUntil * (u ** 3 - u ** 4 / 2);
      } else if (t < coastUntil) area = accelerateUntil / 2 + t - accelerateUntil;
      else {
        const u = (t - coastUntil) / deceleration;
        area = accelerateUntil / 2 + coastUntil - accelerateUntil + deceleration * (u / 2 + Math.sin(Math.PI * u) / (2 * Math.PI));
      }
      return { transform: `translate3d(0,${-height * travel * (area / totalArea)}px,0)`, offset: t };
    });
  }

  function tone(frequency, duration, volume = 0.035, type = 'sine', offset = 0) {
    if (!state.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + offset;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    } catch { /* Audio is an enhancement; browsers may disallow it. */ }
  }

  function themeSound(event) {
    const palettes = {
      pass: { spin: [164.81, 220], win: [329.63, 440, 554.37, 659.25], type: 'triangle' },
      dune: { spin: [55, 82.41, 110], win: [146.83, 220, 293.66, 440], type: 'triangle' },
      witcher: { spin: [98, 146.83], win: [196, 233.08, 293.66, 392], type: 'sine' },
      ukraine: { spin: [261.63, 329.63], win: [261.63, 329.63, 392, 523.25], type: 'sine' },
    };
    const palette = palettes[themeId];
    palette[event].forEach((frequency, index) => tone(frequency, event === 'win' ? .45 : .28, .021, palette.type, index * .095));
  }

  async function reelMotion(reel, col, nextColumn, reduced) {
    const height = reel.clientHeight / ROWS;
    const track = reel.querySelector('.reel-track');
    const travel = 15 + col * 2;
    const moving = { height, travel, animation: null };
    activeTracks.set(reel, moving);
    const sequence = [...state.grid[col]];
    for (let i = sequence.length; i < travel; i += 1) sequence.push(pickSymbol(theme.symbols));
    sequence.push(...nextColumn);
    const fragment = document.createDocumentFragment();
    sequence.forEach((id, row) => {
      const node = symbolNode(id, row, col);
      node.style.height = `${height}px`;
      if (row < travel || row > travel + 2) node.setAttribute('aria-hidden', 'true');
      fragment.append(node);
    });
    track.replaceChildren(fragment);
    track.style.willChange = 'transform';
    reel.classList.add('is-spinning');
    const duration = 1680 + col * 125;
    if (reduced || typeof track.animate !== 'function') {
      await delay(duration);
      track.style.transform = `translateY(${-travel * moving.height}px)`;
    } else {
      const animation = track.animate(reelFrames(height, travel), { duration, easing: 'linear', fill: 'forwards' });
      moving.animation = animation;
      try { await animation.finished; } catch { /* Retain the final grid if an animation is cancelled. */ }
      animation.cancel();
    }
    activeTracks.delete(reel);
    track.style.transform = '';
    track.replaceChildren(...nextColumn.map((id, row) => { const node = symbolNode(id, row, col); node.style.height = `${moving.height}px`; return node; }));
    reel.classList.remove('is-spinning');
    track.style.willChange = 'auto';
    reel.classList.add('is-landing');
    tone(125 + col * 24, 0.14, 0.025, 'triangle');
    setTimeout(() => reel.classList.remove('is-landing'), 240);
  }

  function clearHighlights() {
    el.reels.querySelectorAll('.is-winning, .is-muted').forEach(node => node.classList.remove('is-winning', 'is-muted'));
    el.stage?.classList.remove('has-win', 'has-big-win');
  }

  function highlight(result) {
    if (result.total <= 0) return;
    const positions = new Set(result.hits.flatMap(hit => hit.cells.map(cell => `${cell.col}:${cell.row}`)));
    if (result.scatterTotal) result.scatterCells.forEach(cell => positions.add(`${cell.col}:${cell.row}`));
    el.reels.querySelectorAll('.symbol').forEach(node => node.classList.add(positions.has(`${node.dataset.col}:${node.dataset.row}`) ? 'is-winning' : 'is-muted'));
    el.stage?.classList.add('has-win');
  }

  function closeWin() {
    if (!el.winOverlay || el.winOverlay.hidden) return;
    clearTimeout(overlayTimer);
    el.winOverlay.hidden = true;
    if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
  }

  function showWin(amount, stake) {
    if (!el.winOverlay || amount < stake * 20) return;
    restoreFocus = document.activeElement;
    el.stage?.classList.add('has-big-win');
    text(el.winTitle, amount >= stake * 50 ? 'Legendary win' : 'World-class win');
    text(el.winAmount, cash(amount));
    el.winOverlay.hidden = false;
    el.closeWin?.focus({ preventScroll: true });
    overlayTimer = setTimeout(closeWin, 4800);
  }

  async function spin() {
    if (state.busy || el.helpDialog?.open) return;
    if (state.power === 5) { announce('Your exclusive bonus is ready. Choose Enter bonus to continue.'); el.bonusButton?.focus({ preventScroll: true }); return; }
    const stake = BETS[state.betIndex];
    if (state.balance < stake) {
      announce('Not enough demo credits. Lower the bet or reset to 1,000 credits.');
      el.resetButton?.focus({ preventScroll: true });
      return;
    }
    closeWin();
    clearHighlights();
    const started = performance.now();
    const multiplier = 1;
    const nextGrid = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => pickSymbol(theme.symbols)));
    const result = evaluateGrid(nextGrid, theme.symbols, stake, multiplier);
    const before = { balance: state.balance, win: state.win, power: state.power, grid: state.grid, net: state.net, bonusStake: state.bonusStake, bonusTicket: state.bonusTicket };
    const nextPower = Math.min(5, state.power + 1);
    state.pendingRound = { balance: round(state.balance - stake + result.total), win: result.total, power: nextPower, grid: nextGrid, bonusStake: nextPower === 5 ? stake : state.bonusStake, bonusTicket: nextPower === 5 ? ticket() : state.bonusTicket };
    state.balance = round(state.balance - stake);
    state.win = 0;
    state.busy = true;
    persist();
    paint();
    announce('Spinning. Five reels in motion.');
    cinema.setState('spin');
    themeSound('spin');
    try {
      await delay(state.reduced ? 0 : 120);
      await Promise.all([...el.reels.children].map((reel, col) => reelMotion(reel, col, nextGrid[col], state.reduced)));
      const remaining = (themeId === 'dune' || themeId === 'witcher' ? 2700 : 2500) - (performance.now() - started);
      if (remaining > 0) await delay(remaining);
      state.grid = nextGrid;
      state.win = result.total;
      state.balance = round(state.balance + result.total);
      state.net = round(state.net + result.total - stake);
      state.power = state.pendingRound.power;
      state.bonusStake = state.pendingRound.bonusStake;
      state.bonusTicket = state.pendingRound.bonusTicket;
      highlight(result);
      const net = round(result.total - stake);
      const feature = state.power === 5 ? ' Your exclusive bonus round is now ready.' : '';
      if (result.total > stake) {
        announce(`${result.hits.length ? `${result.hits.length} winning ${result.hits.length === 1 ? 'line' : 'lines'}. ` : ''}${result.scatterTotal ? 'Three or more scatters. ' : ''}Returned ${cash(result.total)} credits. Net gain ${cash(net)} credits.${feature}`);
        themeSound('win');
        cinema.setState('win', { big: result.total >= stake * 20 });
        showWin(result.total, stake);
      } else if (result.total > 0) {
        cinema.setState('idle');
        announce(`Returned ${cash(result.total)} credits. ${net < 0 ? `Net loss ${cash(-net)} credits.` : 'Bet returned.'}${feature}`);
      } else {
        cinema.setState(state.power === 5 ? 'bonus' : 'idle');
        announce(`No matching line. Net loss ${cash(stake)} demo credits.${feature}`);
      }
    } catch (error) {
      // A rendering failure refunds the paid stake rather than silently losing credits.
      Object.assign(state, before);
      for (const moving of activeTracks.values()) moving.animation?.cancel();
      activeTracks.clear();
      mountGrid();
      announce('The reels could not finish. Your demo bet was refunded. Please try again.');
      console.error('Reel rendering failed:', error);
      cinema.setState('idle');
    } finally {
      state.pendingRound = null;
      state.busy = false;
      paint();
      measure();
      persist();
    }
  }

  async function enterBonus(practice = false) {
    if (state.busy || el.helpDialog?.open) return;
    if (!practice && state.power < 5) return;
    closeWin();
    clearHighlights();
    const earnedTicket = state.bonusTicket;
    const stake = practice ? BETS[state.betIndex] : state.bonusStake;
    state.busy = true;
    state.inBonus = true;
    paint();
    cinema.setState('bonus');
    announce(practice ? 'Bonus practice. No demo credits will be awarded.' : 'Your earned bonus round is beginning.');
    let claimed = false;
    try {
      const result = await playBonus(themeId, { stake, reduced: state.reduced, practice });
      if (!result) { announce(practice ? 'Bonus practice closed.' : 'Your earned bonus is saved. Enter it whenever you are ready.'); return; }
      if (practice) { announce(`Practice complete. ${result.summary} No credits were added.`); return; }
      const latest = readStored(key);
      if (latest && (latest.power !== 5 || latest.bonusTicket !== earnedTicket)) {
        state.balance = latest.balance;
        state.win = latest.win;
        state.power = latest.power;
        state.bonusTicket = latest.bonusTicket;
        state.bonusStake = latest.bonusStake;
        announce('This bonus has already been collected in another tab. Reload to see the updated balance.');
        return;
      }
      const reward = round(Number(result.reward));
      if (!Number.isFinite(reward) || reward < 0 || reward > stake * 1000) throw new Error('Invalid bonus reward');
      state.balance = round(state.balance + reward);
      state.win = reward;
      state.net = round(state.net + reward);
      state.power = 0;
      state.bonusTicket = null;
      persist();
      claimed = true;
      announce(`${result.summary} ${cash(reward)} demo credits added to your balance.`);
      cinema.setState('win', { big: true });
      themeSound('win');
    } catch (error) {
      announce('The bonus could not finish. Your earned bonus remains available. Please try again.');
      console.error('Bonus rendering failed:', error);
    } finally {
      state.inBonus = false;
      state.busy = false;
      if (!claimed) cinema.setState(state.power === 5 ? 'bonus' : 'idle');
      paint();
      persist();
      (practice ? el.previewBonus : el.bonusButton)?.focus({ preventScroll: true });
    }
  }

  function setBet(delta) {
    if (state.busy) return;
    state.betIndex = Math.max(0, Math.min(BETS.length - 1, state.betIndex + delta));
    clearHighlights();
    paint();
    persist();
    announce(`Bet set to ${BETS[state.betIndex]} demo credits.`);
  }

  function makePaytable() {
    if (!el.paytable) return;
    const heading = document.createElement('p');
    heading.className = 'paytable-intro';
    heading.textContent = 'Five fixed paylines: three horizontal rows, V, and inverted V. Match 3 or more symbols from the left. Values below are multiples of your bet.';
    const table = document.createElement('table');
    table.className = 'payout-table';
    table.innerHTML = '<thead><tr><th scope="col">Symbol</th><th scope="col">3</th><th scope="col">4</th><th scope="col">5</th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const symbol of theme.symbols.filter(item => item.id !== 'SCATTER')) {
      const row = document.createElement('tr');
      const name = document.createElement('th');
      name.scope = 'row';
      name.textContent = symbol.name;
      row.append(name);
      for (const count of [3, 4, 5]) { const cell = document.createElement('td'); cell.textContent = `${payoutFor(symbol, count)}×`; row.append(cell); }
      tbody.append(row);
    }
    table.append(tbody);
    const notes = document.createElement('p');
    notes.className = 'paytable-notes';
    notes.textContent = 'Wild replaces any line symbol except Scatter. Only the highest return on each line is paid. Three or more Scatters anywhere return 20× your bet. Complete five paid spins to unlock this world’s interactive bonus. The fifth spin’s bet sets your bonus stake. Try bonus is a free practice round and does not change your credits. Each game stores its own demo balance and earned bonus on this device. Demo credits have no cash value.';
    el.paytable.replaceChildren(heading, table, notes);
  }

  el.spinButton?.addEventListener('click', spin);
  el.bonusButton?.addEventListener('click', () => enterBonus(false));
  el.previewBonus?.addEventListener('click', () => enterBonus(true));
  el.betDown?.addEventListener('click', () => setBet(-1));
  el.betUp?.addEventListener('click', () => setBet(1));
  el.closeWin?.addEventListener('click', closeWin);
  el.winOverlay?.addEventListener('click', event => { if (event.target === el.winOverlay) closeWin(); });
  el.soundButton?.addEventListener('click', () => { state.sound = !state.sound; paint(); persist(); if (state.sound) tone(440, 0.15); });
  el.motionButton?.addEventListener('click', () => {
    state.reduced = !state.reduced;
    cinema.setReduced(state.reduced);
    if (state.reduced) for (const moving of activeTracks.values()) moving.animation?.finish();
    paint();
    persist();
    announce(state.reduced ? 'Reduced motion enabled.' : 'Full motion enabled.');
  });
  el.helpButton?.addEventListener('click', () => { if (!state.busy) el.helpDialog?.showModal(); });
  el.closeHelp?.addEventListener('click', () => el.helpDialog?.close());
  el.helpDialog?.addEventListener('click', event => { if (event.target === el.helpDialog) { const rect = el.helpDialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) el.helpDialog.close(); } });
  el.resetButton?.addEventListener('click', () => {
    if (state.busy) return;
    closeWin();
    clearHighlights();
    state.balance = 1000;
    state.win = 0;
    state.net = 0;
    state.power = 0;
    state.bonusTicket = null;
    state.bonusStake = BETS[state.betIndex];
    cinema.setState('idle');
    paint();
    persist();
    announce('Demo balance reset to 1,000 credits.');
  });
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape') { closeWin(); return; }
    if (event.code === 'Tab' && el.winOverlay && !el.winOverlay.hidden) {
      const controls = [...el.winOverlay.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !el.winOverlay.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !el.winOverlay.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || el.helpDialog?.open || (el.winOverlay && !el.winOverlay.hidden)) return;
    if (event.target.closest?.('input, textarea, select, button, a, [contenteditable="true"]')) return;
    event.preventDefault();
    spin();
  });
  window.addEventListener('resize', requestMeasure, { passive: true });
  const reelResizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(requestMeasure) : null;
  reelResizeObserver?.observe(el.reels);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) for (const moving of activeTracks.values()) moving.animation?.finish();
    else requestMeasure();
  });
  window.addEventListener('pagehide', () => {
    if (measureFrame) cancelAnimationFrame(measureFrame);
    reelResizeObserver?.disconnect();
    cinema.destroy();
  }, { once: true });
  makePaytable();
  mountGrid();
  paint();
  persist();
  if (state.power === 5) cinema.setState('bonus');
  announce(state.power === 5 ? 'Welcome back. Your exclusive bonus round is ready.' : 'Choose your bet, then spin. Five spins unlock your world’s bonus.');
}

if (typeof document !== 'undefined') boot();
