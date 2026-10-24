/**
 * sprites.js
 * All temporary CSS / inline-SVG pixel-art graphics.
 * To swap in a real PNG later, just change the return value of the
 * matching function to:  `<img src="assets/my-sprite.png" class="sprite" />`
 * Palette: cream #F5E6C8, peach #F2A96E, brown #7B4A1E, dark #2B1A0E, warm-white #FFF8EE
 */

export const PALETTE = {
  cream:   '#F5E6C8',
  peach:   '#F2A96E',
  brown:   '#7B4A1E',
  darkBrown:'#2B1A0E',
  warmWhite:'#FFF8EE',
  riceWhite:'#FFFDE8',
  eggYellow:'#F5C842',
  eggWhite: '#FFF8EE',
  meatBrown:'#8B3A0F',
  meatPink: '#E8826A',
  coinGold: '#F5C842',
  raw:     '#D4956A',
  cooked:  '#7B4A1E',
  burnt:   '#1A0A00',
  green:   '#5A8A3C',
};

/** Rice sprite — pixel art bowl of rice */
export function riceSprite(state = 'raw') {
  const colors = {
    raw:    PALETTE.cream,
    cooking:PALETTE.riceWhite,
    cooked: PALETTE.riceWhite,
    burnt:  PALETTE.burnt,
  };
  const c = colors[state] || PALETTE.cream;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" shape-rendering="crispEdges" viewBox="0 0 10 10">
    <!-- bowl -->
    <rect x="1" y="5" width="8" height="4" fill="${PALETTE.brown}" />
    <rect x="2" y="4" width="6" height="1" fill="${PALETTE.brown}" />
    <!-- rice mound -->
    <rect x="2" y="2" width="6" height="3" fill="${c}" />
    <rect x="3" y="1" width="4" height="1" fill="${c}" />
    <!-- outline -->
    <rect x="1" y="5" width="8" height="1" fill="${PALETTE.darkBrown}" opacity="0.3"/>
    ${state === 'burnt' ? `<rect x="2" y="1" width="6" height="4" fill="${PALETTE.burnt}" opacity="0.6"/>` : ''}
  </svg>`;
}

/** Egg sprite */
export function eggSprite(state = 'raw') {
  const yolk = state === 'burnt' ? PALETTE.burnt : state === 'raw' ? PALETTE.eggYellow : '#E8A800';
  const white = state === 'burnt' ? '#3A2A1A' : state === 'raw' ? '#FFF8EE' : '#FFFDE0';
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" shape-rendering="crispEdges" viewBox="0 0 10 10">
    <!-- egg white -->
    <rect x="2" y="4" width="6" height="4" fill="${white}" />
    <rect x="1" y="5" width="8" height="2" fill="${white}" />
    <rect x="3" y="3" width="4" height="1" fill="${white}" />
    <!-- yolk -->
    <rect x="3" y="4" width="4" height="3" fill="${yolk}" />
    <rect x="4" y="3" width="2" height="1" fill="${yolk}" />
    ${state === 'burnt' ? `<rect x="1" y="3" width="8" height="6" fill="${PALETTE.burnt}" opacity="0.5"/>` : ''}
  </svg>`;
}

/** Meat sprite — tapa / tocino / longganisa */
export function meatSprite(type = 'tapa', state = 'raw') {
  const colors = {
    tapa:     { raw: '#D4956A', cooking: '#A0522D', cooked: '#7B3010', burnt: PALETTE.burnt },
    tocino:   { raw: '#E8826A', cooking: '#C0504A', cooked: '#8B2020', burnt: PALETTE.burnt },
    longganisa:{ raw: '#C8903A', cooking: '#9B6A20', cooked: '#6B4010', burnt: PALETTE.burnt },
  };
  const c = (colors[type] || colors.tapa)[state] || '#D4956A';
  const accent = type === 'tocino' ? '#FF9090' : type === 'longganisa' ? '#E8A840' : '#E8A870';

  if (type === 'longganisa') {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" shape-rendering="crispEdges" viewBox="0 0 10 10">
      <!-- sausage links -->
      <rect x="1" y="3" width="3" height="5" rx="1" fill="${c}" />
      <rect x="4" y="3" width="1" height="5" fill="${PALETTE.darkBrown}" opacity="0.4"/>
      <rect x="5" y="3" width="3" height="5" rx="1" fill="${c}" />
      <rect x="2" y="4" width="1" height="2" fill="${accent}" opacity="0.5"/>
      <rect x="6" y="4" width="1" height="2" fill="${accent}" opacity="0.5"/>
      ${state === 'burnt' ? `<rect x="1" y="3" width="8" height="5" fill="${PALETTE.burnt}" opacity="0.6"/>` : ''}
    </svg>`;
  }

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" shape-rendering="crispEdges" viewBox="0 0 10 10">
    <!-- meat slice -->
    <rect x="1" y="3" width="8" height="5" fill="${c}" />
    <rect x="2" y="4" width="2" height="1" fill="${accent}" opacity="0.5"/>
    <rect x="5" y="5" width="3" height="1" fill="${accent}" opacity="0.4"/>
    <rect x="1" y="3" width="8" height="1" fill="${PALETTE.darkBrown}" opacity="0.3"/>
    ${state === 'burnt' ? `<rect x="1" y="3" width="8" height="5" fill="${PALETTE.burnt}" opacity="0.6"/>` : ''}
  </svg>`;
}

/** Plate sprite */
export function plateSprite() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="40" shape-rendering="crispEdges" viewBox="0 0 14 10">
    <rect x="1" y="4" width="12" height="5" fill="${PALETTE.warmWhite}" />
    <rect x="0" y="5" width="14" height="3" fill="${PALETTE.warmWhite}" />
    <rect x="2" y="3" width="10" height="1" fill="${PALETTE.warmWhite}" />
    <rect x="1" y="4" width="12" height="1" fill="${PALETTE.cream}" opacity="0.5"/>
    <!-- rim -->
    <rect x="0" y="4" width="1" height="5" fill="${PALETTE.cream}"/>
    <rect x="13" y="4" width="1" height="5" fill="${PALETTE.cream}"/>
  </svg>`;
}

/** Pan / wok icon on the stove */
export function panSprite() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="32" shape-rendering="crispEdges" viewBox="0 0 14 8">
    <rect x="0" y="3" width="2" height="2" fill="${PALETTE.darkBrown}"/>
    <rect x="2" y="2" width="10" height="4" fill="#555"/>>
    <rect x="3" y="1" width="8" height="1" fill="#555"/>
    <rect x="2" y="2" width="10" height="1" fill="#333"/>
  </svg>`;
}

/** Coin */
export function coinSVG() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" shape-rendering="crispEdges" viewBox="0 0 8 8">
    <rect x="2" y="0" width="4" height="1" fill="${PALETTE.coinGold}"/>
    <rect x="1" y="1" width="6" height="1" fill="${PALETTE.coinGold}"/>
    <rect x="0" y="2" width="8" height="4" fill="${PALETTE.coinGold}"/>
    <rect x="1" y="6" width="6" height="1" fill="${PALETTE.coinGold}"/>
    <rect x="2" y="7" width="4" height="1" fill="${PALETTE.coinGold}"/>
    <rect x="3" y="3" width="2" height="2" fill="#E8A800"/>
  </svg>`;
}

/** Flame animation indicator */
export function flameSVG() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" shape-rendering="crispEdges" viewBox="0 0 5 5">
    <rect x="2" y="0" width="1" height="2" fill="#FF6600"/>
    <rect x="1" y="1" width="3" height="2" fill="#FF8800"/>
    <rect x="0" y="2" width="5" height="2" fill="#FFAA00"/>
    <rect x="1" y="4" width="3" height="1" fill="#FFCC00"/>
  </svg>`;
}
