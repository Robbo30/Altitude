// All the pixel art. Coordinates are in scene pixels: 240 by 152.
export const W = 240;
export const H = 152;

const SKY = ['#1b1a4b', '#2c2566', '#4b2f80', '#86407f', '#d4606e', '#f59a63', '#fcc77b'];
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

const BODY = [
  '....ssss....', '....ssse....', '....ssss....',
  '..bbjjjj....', '.bbbjjjjj.t.', '.bbbjjjssst.', '.bbbjjjj..t.', '..bbjjjj..t.', '....pppp..t.'
];
const LEGS = [
  ['....pp.dd.t.', '...pp...dd.t', '...pp...dd.t', '...kkk..kkk.'],
  ['....ppdd..t.', '....ppdd..t.', '....ppdd..t.', '....kkkkk.t.'],
  ['....dd.pp.t.', '...dd...pp.t', '...dd...pp.t', '...kkk..kkk.']
];
const HATS = {
  beanie: { rows: ['....rrrr....', '...rrrrrr...', '...RRRRRR...'], ink: { r: '#ff5d5d', R: '#c93a4b' } },
  bush: { rows: ['....uuuu....', '....uuuu....', '..UUUUUUUU..'], ink: { u: '#b98a52', U: '#8f6638' } },
  roman: { rows: ['..cccccc....', '...cgggg....', '...ggggggg..'], ink: { c: '#d8283c', g: '#ffc94a' } },
  space: { rows: ['...wwwwww...', '..wwwwwwww..', '..wwvvvvww..', '..wwvvvvww..', '..wwwwwwww..', '...wwwwww...'], ink: { w: '#eceaf5', v: '#2c6fd6' } }
};
const SUITS = {
  trail: { j: '#ff9142', p: '#2c3f73', d: '#22325e', k: '#4a4470', b: '#3f7fd6' },
  alpine: { j: '#2fb7a8', p: '#2c3f73', d: '#22325e', k: '#4a4470', b: '#ffc94a' },
  legion: { j: '#c9a24a', p: '#d8283c', d: '#a81f30', k: '#8a5a33', b: '#d8283c' },
  spacesuit: { j: '#eceaf5', p: '#c9c6e0', d: '#a9a5c6', k: '#8a86a8', b: '#8a86a8' }
};

function layer() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}

export function ground(x) {
  const jag = 1.6 * Math.sin(x * .41) + .9 * Math.sin(x * 1.13);
  if (x < 150) return 140 - Math.pow(x / 150, 1.3) * 106 + jag;
  return 34 + (x - 150) * 1.05 + jag;
}

function pine(pen, px, base) {
  for (let r = 0; r < 12; r++) {
    const w = Math.floor(r / 2) + (r % 4 === 0 ? 0 : 1);
    for (let x = -w; x <= w; x++) pen(px + x, base - 14 + r, x > 0 ? '#16493f' : '#1f6a55');
  }
  pen(px, base - 2, '#3a2a2a');
  pen(px, base - 1, '#3a2a2a');
}

function paintBack() {
  const canvas = layer(), ctx = canvas.getContext('2d');
  const pen = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = Math.min(y / 104, 1) * (SKY.length - 1), i = Math.floor(t);
    pen(x, y, SKY[t - i > BAYER[y % 4][x % 4] / 16 ? Math.min(i + 1, SKY.length - 1) : i]);
  }
  for (let y = -13; y <= 13; y++) for (let x = -13; x <= 13; x++) {
    if (x * x + y * y < 170) pen(66 + x, 88 + y, '#ffe3a3');
  }
  return canvas;
}

function paintFront() {
  const canvas = layer(), ctx = canvas.getContext('2d');
  const pen = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1); };
  const far = (x) => 94 + 12 * Math.sin(x * .037 + 1) + 7 * Math.sin(x * .091) + 3 * Math.sin(x * .21);
  const mid = (x) => 112 + 9 * Math.sin(x * .05 + 3) + 5 * Math.sin(x * .13);
  for (let x = 0; x < W; x++) {
    for (let y = Math.floor(far(x)); y < H; y++) pen(x, y, y < far(x) + 3 ? '#a06a9b' : '#5a3a7d');
    for (let y = Math.floor(mid(x)); y < H; y++) pen(x, y, '#3f2f6b');
  }
  for (let x = 0; x < W; x++) {
    const top = Math.floor(ground(x));
    for (let y = top; y < H; y++) {
      const snowLine = 64 + 5 * Math.sin(x * .3) + 3 * Math.sin(y * .7);
      const facet = Math.sin((x + y * .6) * .23) + Math.sin((x - y) * .11);
      let c = facet > .35 ? '#3a3068' : '#2a2450';
      if (y < snowLine) c = x > 150 || facet < -.6 ? '#b9b3dd' : '#f2ecf6';
      else if (y > 122 + 4 * Math.sin(x * .2)) c = facet > 0 ? '#1f3b4d' : '#183042';
      if (y - top < 2) c = y < snowLine ? '#ffffff' : '#7c6aa6';
      pen(x, y, c);
    }
  }
  [[10, 138], [24, 134], [38, 130], [52, 122], [18, 148], [34, 146], [60, 142], [78, 146], [96, 148], [176, 148], [196, 150]]
    .forEach(([x, base]) => pine(pen, x, base));
  return canvas;
}

export function buildWorld() {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const stars = Array.from({ length: 68 }, (_, i) => ({
    x: Math.floor(rnd() * W), y: Math.floor(rnd() * 44), c: i % 3 ? '#b7b1d8' : '#f6efd8', phase: rnd() * 6.3
  }));
  const flakes = Array.from({ length: 30 }, () => ({ x: Math.floor(rnd() * W), y: 18 + Math.floor(rnd() * 112) }));
  return { back: paintBack(), front: paintFront(), stars, flakes };
}

const CLOUDS = [
  { speed: 2.2, top: '#7a4a92', under: '#5c3a80', list: [[62, 34, 15], [176, 26, 21]] },
  { speed: 4.4, top: '#f9b596', under: '#ec8e80', list: [[34, 66, 18], [118, 50, 13], [206, 74, 16]] }
];

export function drawWorld(ctx, world, seconds, hiker) {
  ctx.drawImage(world.back, 0, 0);
  world.stars.forEach((s) => {
    if (Math.sin(seconds * 1.4 + s.phase) < -.45) return;
    ctx.fillStyle = s.c;
    ctx.fillRect(s.x, s.y, 1, 1);
  });
  CLOUDS.forEach((set) => {
    const shift = Math.floor(seconds * set.speed) % W;
    set.list.forEach(([cx, cy, w]) => {
      for (let r = 0; r < 4; r++) {
        ctx.fillStyle = r > 1 ? set.top : set.under;
        const x = cx - w + r * 3 - shift;
        ctx.fillRect(x, cy - r, 2 * w - r * 5, 1);
        ctx.fillRect(x + W, cy - r, 2 * w - r * 5, 1);
      }
    });
  });
  ctx.drawImage(world.front, 0, 0);
  ctx.drawImage(hiker.sprite, hiker.x, hiker.y);
  ctx.fillStyle = '#f6efd8';
  const wind = Math.floor(seconds * 18) % W;
  world.flakes.forEach((f) => ctx.fillRect((f.x - wind + W) % W, f.y, 1, 1));
}

export function hikerSprite(outfit, stride = 0) {
  const hat = HATS[outfit.hat], suit = SUITS[outfit.suit];
  const rows = hat.rows.concat(BODY.slice(hat.rows.length - 3), LEGS[stride]);
  const ink = { s: '#f7c9a0', e: '#171539', t: '#f6efd8', ...hat.ink, ...suit };
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 16;
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    ctx.fillStyle = ink[ch];
    ctx.fillRect(x, y, 1, 1);
  }));
  return c;
}
