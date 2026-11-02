const symbol = (id, name, pay, icon) => ({ id, name, pay, icon });

export const themes = {
  pass: {
    id: 'pass',
    title: 'The Pass',
    eyebrow: 'MIDNIGHT ATELIER · CHAPTER 01',
    description: 'A midnight service. Copper, fire, and a little good fortune.',
    accent: '#dbad68',
    accent2: '#c85a3b',
    background: 'assets/pass.webp',
    featureName: 'Dinner Rush',
    featureDescription: 'Complete five spins to unlock Dinner Rush. Fulfil three orders in the chef’s kitchen to earn a bonus.',
    symbols: [
      symbol('CHEF', 'The chef', 8, 'chef'),
      symbol('KNIFE', 'Chef’s knife', 6, 'knife'),
      symbol('POT', 'Copper pot', 4, 'pot'),
      symbol('FLAME', 'Open flame', 3, 'flame'),
      symbol('OLIVE', 'Olive branch', 2, 'olive'),
      symbol('A', 'Ace', 1.5, 'royal'),
      symbol('K', 'King', 1, 'royal'),
      symbol('WILD', 'Atelier wild', 12, 'wild'),
      symbol('SCATTER', 'Service bell scatter', 20, 'bell'),
    ],
  },
  dune: {
    id: 'dune',
    title: 'Dune: Spice & Sand',
    eyebrow: 'ARRAKIS · CHAPTER 02',
    description: 'Cross the deep desert, follow the spice, and awaken the maker.',
    accent: '#e4b56c',
    accent2: '#76c4dc',
    background: 'assets/dune.webp',
    featureName: 'Ride the Maker',
    featureDescription: 'Complete five spins to unlock Ride the Maker. Time three thumper beats to cross the deep desert.',
    symbols: [
      symbol('WORM', 'Sandworm', 8, 'worm'),
      symbol('CRYSKNIFE', 'Crysknife', 6, 'crysknife'),
      symbol('SPICE', 'Spice crystal', 4, 'crystal'),
      symbol('THOPTER', 'Ornithopter', 3, 'thopter'),
      symbol('MOON', 'Desert moon', 2, 'moon'),
      symbol('A', 'Ace', 1.5, 'royal'),
      symbol('K', 'King', 1, 'royal'),
      symbol('WILD', 'Maker wild', 12, 'wild'),
      symbol('SCATTER', 'Desert compass scatter', 20, 'compass'),
    ],
  },
  witcher: {
    id: 'witcher',
    title: 'The Witcher: Wolf’s Fortune',
    eyebrow: 'THE CONTINENT · CHAPTER 03',
    description: 'Silver in the moonlight. A contract at the edge of the forest.',
    accent: '#c5d6c6',
    accent2: '#9dc695',
    background: 'assets/witcher.webp',
    featureName: 'Signs of the Hunt',
    featureDescription: 'Complete five spins to unlock Signs of the Hunt. Remember and cast three signs to complete the contract.',
    symbols: [
      symbol('WOLF', 'Wolf medallion', 8, 'wolf'),
      symbol('SWORDS', 'Silver swords', 6, 'swords'),
      symbol('POTION', 'Witcher potion', 4, 'potion'),
      symbol('RUNE', 'Runestone', 3, 'rune'),
      symbol('RAVEN', 'Forest raven', 2, 'raven'),
      symbol('A', 'Ace', 1.5, 'royal'),
      symbol('K', 'King', 1, 'royal'),
      symbol('WILD', 'Wolf school wild', 12, 'wild'),
      symbol('SCATTER', 'Elder star scatter', 20, 'star'),
    ],
  },
  ukraine: {
    id: 'ukraine',
    title: 'Sunflower Rising',
    eyebrow: 'RESILIENCE · CHAPTER 04',
    description: 'A hopeful story of home, connection, and rebuilding after conflict.',
    accent: '#e8c76b',
    accent2: '#80b7de',
    background: 'assets/ukraine.webp',
    featureName: 'A New Dawn',
    featureDescription: 'Complete five spins to unlock A New Dawn. Restore a home, bridge and garden to bring the village to life.',
    symbols: [
      symbol('SUNFLOWER', 'Sunflower', 8, 'sunflower'),
      symbol('WHEAT', 'Golden wheat', 6, 'wheat'),
      symbol('DOVE', 'Peace dove', 4, 'dove'),
      symbol('BRIDGE', 'Bridge of connection', 3, 'bridge'),
      symbol('HOME', 'A place to call home', 2, 'home'),
      symbol('A', 'Ace', 1.5, 'royal'),
      symbol('K', 'King', 1, 'royal'),
      symbol('WILD', 'Rising sun wild', 12, 'wild'),
      symbol('SCATTER', 'Hope star scatter', 20, 'star'),
    ],
  },
};

let instance = 0;

const escapeText = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function iconBody(icon, paint, secondary, symbolId) {
  const edge = '#f3dfb9';
  const ink = '#151b1c';
  const common = `stroke="${edge}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  const filled = `fill="${paint}" ${common}`;

  switch (icon) {
    case 'royal':
      return `<circle cx="32" cy="32" r="23" fill="${paint}" stroke="${edge}" stroke-width="1.4"/><circle cx="32" cy="32" r="19.5" fill="none" stroke="${ink}" stroke-opacity=".5" stroke-width=".8"/><path d="M17 17l2-2m26 0 2 2M17 47l2 2m26 0 2-2" stroke="${edge}" stroke-width="1.2"/><text x="32" y="44" fill="${ink}" text-anchor="middle" font-family="Georgia,serif" font-size="35" font-weight="600">${symbolId}</text>`;
    case 'chef':
      return `<path d="M18 27c-8-4-4-16 4-15 3-8 15-8 19-1 10-3 15 10 7 15l-3 7H20z" fill="#f1e9d6" ${common}/><path d="M20 31h25v10H20z" ${filled}/><path d="M24 21v8m8-12v12m9-9v9" fill="none" stroke="#a58e6a" stroke-width="1.5"/><path d="M24 42v5l8 7 9-7v-5" ${filled}/><path d="M26 45q6 4 12 0" fill="none" stroke="${ink}" stroke-width="1.8"/><circle cx="27" cy="38" r="1.1" fill="${ink}"/><circle cx="38" cy="38" r="1.1" fill="${ink}"/>`;
    case 'knife':
      return `<path d="M12 45 41 12q5 9-2 18L22 47z" fill="#e4e6df" ${common}/><path d="m23 43 4 4-9 12c-3 2-8-2-6-5z" ${filled}/><path d="m20 44 18-21" fill="none" stroke="#8f9d9d" stroke-width="1.1"/><circle cx="19" cy="51" r="1" fill="#fff5cf"/>`;
    case 'pot':
      return `<path d="M15 29h34v16q-1 9-17 9t-17-9z" ${filled}/><path d="M12 30h40l-4-6H16z" ${filled}/><path d="M27 23v-4h10v4" fill="none" ${common}/><path d="M15 33H8v9h7m34-9h7v9h-7" fill="none" ${common}/><path d="M20 33v10q0 5 8 6" fill="none" stroke="#fff1c7" stroke-width="1.5" stroke-opacity=".8"/><path d="M22 13q-3-3 0-6m10 7q3-4 0-8m10 7q-3-3 0-6" fill="none" stroke="${secondary}" stroke-width="1.5" stroke-opacity=".65"/>`;
    case 'flame':
      return `<path d="M34 7c3 14 16 17 16 31 0 12-8 20-18 20S14 50 14 39c0-8 5-14 9-19-1 7 1 9 4 11 6-7 5-14 7-24z" ${filled}/><path d="M33 30c-1 7-10 11-10 18 0 6 4 9 9 9s10-4 10-10c0-6-6-10-9-17z" fill="#f8e7ae" stroke="#ffe4a7" stroke-width="1"/><path d="M32 42c-4 4-5 8 0 12 5-3 5-7 0-12z" fill="${secondary}"/>`;
    case 'olive':
      return `<path d="M16 55Q29 32 46 9" fill="none" stroke="#dfbf78" stroke-width="2"/><path d="M27 39Q9 36 13 22q17 0 14 17zm7-11Q18 22 26 11q15 5 8 17zm4-4q1-17 16-17 2 13-16 17zM24 44q5-17 21-10-2 14-21 10zm-7 10Q2 51 7 39q15 0 10 15z" fill="#879c62" ${common}/><ellipse cx="43" cy="43" rx="8" ry="10" transform="rotate(35 43 43)" fill="${paint}" ${common}/><ellipse cx="36" cy="51" rx="7" ry="9" transform="rotate(35 36 51)" fill="#394835" ${common}/>`;
    case 'bell':
      return `<path d="M10 48h44v5H10z" ${filled}/><path d="M14 46c0-14 6-23 18-23s18 9 18 23z" ${filled}/><path d="M28 22v-6h8v6" fill="none" ${common}/><path d="M19 39q1-10 10-12" fill="none" stroke="#fff2cc" stroke-width="1.4"/><path d="m13 17-4-4m23-2V6m19 11 4-4" fill="none" stroke="${secondary}" stroke-width="2"/>`;
    case 'worm':
      return `<path d="M9 54q5-11 19-13 9-1 9-11V14h16v17q0 22-24 23z" ${filled}/><path d="m35 23 17 2m-17 6 16 4M31 39l13 8m-21-4 4 12M15 48l6 7" stroke="#6b432a" stroke-width="1.8" fill="none"/><ellipse cx="45" cy="15" rx="11" ry="10" fill="#2b211b" ${common}/><ellipse cx="45" cy="15" rx="6.5" ry="6" fill="#090d0e" stroke="#c5914a" stroke-width="2"/><path d="m39 8 3 6m4-8-1 7m7-4-4 5m6 5-6-1m-3 6 1-6m-8 3 5-4" stroke="#f1dfb3" stroke-width="1.1"/><path d="M6 58q11-5 20 0t30 0" fill="none" stroke="${secondary}" stroke-width="1.3"/>`;
    case 'crysknife':
      return `<path d="M41 7q9 20-5 34L24 49l-4-5 12-15z" fill="#efdfb8" ${common}/><path d="m24 44 11-16 6-16" fill="none" stroke="#9e875b" stroke-width="1.4"/><path d="m21 43 7 7-12 10-7-7z" fill="${paint}" ${common}/><path d="m13 51 7 5m-3-10 7 5" stroke="#54402a" stroke-width="1.4"/><path d="m17 42 12 11" stroke="#f5e8cb" stroke-width="2.5"/>`;
    case 'crystal':
      return `<path d="m32 6 14 15-4 29-10 9-11-9-4-29z" ${filled}/><path d="m32 6 4 22-4 31-5-31z" fill="#fff0be" fill-opacity=".45"/><path d="m17 21 15 7 14-7M21 50l11-22 10 22" fill="none" stroke="#fff2c2" stroke-width="1"/><path d="m10 37 5-4 7 17-7 3zm38 0 7-8 4 21-13 5z" fill="${secondary}" fill-opacity=".7" ${common}/>`;
    case 'thopter':
      return `<path d="m28 23 4-9 4 9 4 21-8 13-8-13z" fill="${paint}" ${common}/><path d="m27 27-19-15-4 5 21 22m12-12 19-15 4 5-21 22M25 36 6 38l-2 6 21-2m14-6 19 2 2 6-21-2" fill="#c6d4d0" ${common}/><path d="m29 26 3-5 3 5v9h-6z" fill="${secondary}"/><path d="M29 47h6m-3-9v14" stroke="#f6e1b9" stroke-width="1.2"/>`;
    case 'moon':
      return `<path d="M42 8C24 7 10 17 10 33s14 28 31 24C27 52 22 38 28 25c3-7 8-12 14-17z" ${filled}/><path d="m46 17 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="${secondary}" stroke="#d9eff0" stroke-width="1"/><path d="M7 58q17-8 30-1t23-1" fill="none" stroke="#d1a56a" stroke-width="1.1"/>`;
    case 'compass':
      return `<circle cx="32" cy="32" r="23" ${filled}/><circle cx="32" cy="32" r="18" fill="#1b2428" stroke="#f3dfb9" stroke-width=".8"/><path d="m38 14-2 22-14 14 5-23z" fill="${secondary}" stroke="#f3dfb9" stroke-width="1.2"/><path d="m38 14-6 18-10 18 5-23z" fill="#f4e8c8"/><circle cx="32" cy="32" r="3" fill="#1a252a" stroke="#f3dfb9" stroke-width="1.1"/><path d="M32 6V2m0 60v-4M6 32H2m60 0h-4" stroke="${secondary}" stroke-width="1.4"/>`;
    case 'wolf':
      return `<path d="m15 10 11 7 12-1 11-7-3 17 7 12-10 12-11 10-12-11L9 37l10-12z" ${filled}/><path d="m15 10 9 16-6 9 7 13 7-8 8 8 7-13-7-9 9-17M18 35l9 2m13-2-7 2m-6 7 5 5 5-5m-5-20v16" fill="none" stroke="#26383b" stroke-width="2"/><path d="m21 31 7 3-3-6zm22 0-7 3 3-6z" fill="${secondary}"/><path d="m27 40 5-3 5 3-5 5z" fill="#16232a"/>`;
    case 'swords':
      return `<path d="m11 8 8 2 31 36-5 5L13 16z" fill="#d8e5e4" ${common}/><path d="m53 8-8 2-31 36 5 5 32-35z" fill="#eff3e8" ${common}/><path d="m13 39 12 11m14-11 12 11" fill="none" stroke="${paint}" stroke-width="4"/><path d="m14 47-6 8 4 4 8-8m24-4 8 8 4-4-6-8" fill="${paint}" ${common}/><path d="m47 14-24 28m-6-28 24 28" fill="none" stroke="#819ca0" stroke-width="1"/>`;
    case 'potion':
      return `<path d="M25 9h14v8H25z" fill="#a57a50" ${common}/><path d="M26 17v9c-3 5-14 11-14 20 0 9 8 13 20 13s20-4 20-13c0-9-11-15-14-20v-9z" fill="#1e423d" ${common}/><path d="M15 43q8-5 17 0t17 0v4c0 6-7 9-17 9s-17-3-17-9z" fill="${secondary}" fill-opacity=".75"/><path d="M25 31q-8 7-9 12m2 7 3 3" fill="none" stroke="#f7f6db" stroke-width="1.8"/><path d="M24 18h16" stroke="#e5d0ab" stroke-width="2"/><circle cx="33" cy="46" r="2" fill="#f3edbd"/><circle cx="39" cy="51" r="1.1" fill="#f3edbd"/>`;
    case 'rune':
      return `<path d="m19 7 26 4 10 19-8 25-24 6L9 41l2-21z" fill="#3c4b49" ${common}/><path d="m22 14 14 4 8 13-5 16-13 4-8-13 1-16z" fill="#536b5e" stroke="#97af91" stroke-width=".8"/><path d="M31 17v31m0-27 10 8-10 7-9-6m9 9 9 5" fill="none" stroke="${secondary}" stroke-width="3.5"/><path d="M31 17v31m0-27 10 8-10 7-9-6m9 9 9 5" fill="none" stroke="#e2eac5" stroke-width="1"/>`;
    case 'raven':
      return `<path d="M10 44q-5-18 15-25 3-13 17-8l7 6 11 4-12 5q3 10-9 18l-5 13-8-7-15 7 6-14z" fill="#273c43" ${common}/><path d="M29 24Q15 33 18 45l17-10-10 17m11-24-4 9m13-19 5 2" fill="none" stroke="#7d9899" stroke-width="1.5"/><circle cx="42" cy="17" r="2" fill="${secondary}"/><path d="m26 51-4 9m12-8 3 8" stroke="${paint}" stroke-width="1.5"/>`;
    case 'sunflower':
      return `<path d="M32 36v25m0-6Q10 57 13 43q16 0 19 12zm0-5q6-17 21-15-1 14-21 15z" fill="#5a7849" stroke="#bdd095" stroke-width="1.2"/><g fill="${paint}" stroke="#f5dda0" stroke-width="1">${Array.from({length:12}, (_,i) => `<ellipse cx="32" cy="13" rx="4.7" ry="10" transform="rotate(${i*30} 32 26)"/>`).join('')}</g><circle cx="32" cy="26" r="11" fill="#5d4028" stroke="#ebc86e" stroke-width="1.2"/><circle cx="32" cy="26" r="7.5" fill="#372c20" stroke="#b6924c" stroke-dasharray="1 3" stroke-width="2"/>`;
    case 'wheat':
      return `<path d="M31 60 32 14M20 59 12 24m31 35 8-35" fill="none" stroke="#e4bd66" stroke-width="1.5"/><g ${filled}><path d="M31 18q-9-3-8-10 10 1 8 10zm2 0q9-3 8-10-10 1-8 10zM31 29q-11-3-10-11 11 1 10 11zm2 0q11-3 10-11-11 1-10 11zM31 40q-12-3-11-11 12 1 11 11zm2 0q12-3 11-11-12 1-11 11zM31 51q-11-3-10-11 11 1 10 11zm2 0q11-3 10-11-11 1-10 11z"/></g><path d="M12 39q-10-3-9-10 9 0 9 10zm3 10q8-4 6-11-8 1-6 11zM51 39q10-3 9-10-9 0-9 10zm-3 10q-8-4-6-11 8 1 6 11z" fill="${paint}" ${common}/>`;
    case 'dove':
      return `<path d="M28 29Q10 32 6 15q16 1 25 11Q32 9 46 5q4 15-7 25 9-10 17-4l-4 5 8 4-10 2q-3 13-19 13l-13 9 2-12C9 44 8 40 7 35z" fill="#e4e8d8" stroke="#f6eacb" stroke-width="1.3"/><path d="M29 29q-6 10-16 7m18-4q5-8 9-15M23 45q10 4 20-3" fill="none" stroke="#9baaa0" stroke-width="1.1"/><circle cx="50" cy="29" r="1.2" fill="#273b42"/><path d="m53 36-2 9m0-4 6-3m-5 6 6-1" fill="none" stroke="#87a85f" stroke-width="1.6"/>`;
    case 'bridge':
      return `<path d="M7 47h50v7H7z" ${filled}/><path d="M10 47V24h5v23m34 0V24h5v23" ${filled}/><path d="M12 25q20 24 40 0M13 35h38" fill="none" stroke="${edge}" stroke-width="1.7"/><path d="M23 35v12m9-10v10m9-12v12" fill="none" stroke="${paint}" stroke-width="1.7"/><path d="M3 59q7-4 14 0t15 0 15 0 15 0" fill="none" stroke="${secondary}" stroke-width="1.8"/><path d="M15 19h34" stroke="${secondary}" stroke-width="1" stroke-dasharray="2 5"/>`;
    case 'home':
      return `<path d="M15 31h34v26H15z" fill="#d8c399" ${common}/><path d="M8 32 32 10l24 22-5 5-19-17-19 17z" fill="${paint}" ${common}/><path d="M41 11h7v13l-7-7z" fill="#ae8664" ${common}/><path d="M27 41h10v16H27z" fill="#544839" stroke="#f3dfb9" stroke-width="1"/><path d="M19 35h7v8h-7zm19 0h7v8h-7z" fill="${secondary}" stroke="#f5e4b9" stroke-width="1"/><circle cx="34" cy="49" r=".9" fill="#e9c472"/><path d="M8 59h48" stroke="#94ae77" stroke-width="2"/>`;
    case 'wild':
      return `<path d="m32 4 8 7 11 1 2 11 7 9-7 9-2 11-11 1-8 7-8-7-11-1-2-11-7-9 7-9 2-11 11-1z" ${filled}/><circle cx="32" cy="32" r="20" fill="#172124" stroke="${edge}" stroke-width="1.2"/><path d="m32 15 3.2 8.8 9.3.3-7.4 5.8 2.6 9-7.7-5.3-7.7 5.3 2.6-9-7.4-5.8 9.3-.3z" fill="${secondary}" stroke="#f4e5bf" stroke-width="1"/><text x="32" y="48" fill="#f2dfb8" text-anchor="middle" font-family="Arial,sans-serif" font-size="7.6" font-weight="700" letter-spacing="1.2">WILD</text>`;
    default:
      return `<path d="m32 5 7 17 18 3-13 13 3 19-15-9-15 9 3-19L7 25l18-3z" ${filled}/><path d="m32 16 4 12 12 2-9 8 2 11-9-6-9 6 2-11-9-8 12-2z" fill="${secondary}" stroke="#f7e9c5" stroke-width="1"/><circle cx="32" cy="33" r="4" fill="#f9e9bb"/>`;
  }
}

export function symbolMarkup(themeId, symbolId) {
  const theme = themes[themeId] || themes.pass;
  const item = theme.symbols.find(entry => entry.id === symbolId) || theme.symbols[0];
  const uid = `sym-${theme.id}-${++instance}`;
  const gradient = `url(#${uid})`;
  return `<svg class="symbol-art" viewBox="0 0 64 64" role="img" aria-label="${escapeText(item.name)}" xmlns="http://www.w3.org/2000/svg"><title>${escapeText(item.name)}</title><defs><linearGradient id="${uid}" x1=".1" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#f4e4ba"/><stop offset=".42" stop-color="${theme.accent}"/><stop offset="1" stop-color="${theme.id === 'witcher' ? '#566c64' : '#9a663a'}"/></linearGradient></defs><g>${iconBody(item.icon, gradient, theme.accent2, item.id)}</g></svg>`;
}
