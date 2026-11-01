import * as api from './api.js';
import { W, H, ground, buildWorld, drawWorld, hikerSprite } from './art.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString('en-GB');
const distance = (m) => (m >= 100000 ? fmt(m / 1000) + ' km' : fmt(m) + ' m');
const clock = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const world = buildWorld();
const sceneCtx = $('scene').getContext('2d');

let view = 'climb';
let player = null;
let shop = [];
let picked = null;
let tryOn = null;
let result = null;
let finishing = false;

function focusedSeconds(climb) {
  const end = climb.paused_at ? Date.parse(climb.paused_at) : Date.now();
  const seconds = (end - Date.parse(climb.started_at)) / 1000 - climb.paused_seconds;
  return Math.max(0, Math.min(climb.minutes * 60, seconds));
}

function currentAltitude() {
  const climb = player.active_climb;
  return player.altitude_m + (climb ? focusedSeconds(climb) / 60 * player.metres_per_minute : 0);
}

function nextLeg(altitude) {
  const i = api.LANDMARKS.findIndex((l) => l.metres > altitude);
  const next = api.LANDMARKS[i === -1 ? api.LANDMARKS.length - 1 : i];
  const from = i > 0 ? api.LANDMARKS[i - 1].metres : 0;
  return { next, from, progress: Math.min(1, (altitude - from) / (next.metres - from)) };
}

function setView(next) {
  view = next;
  $('view-shop').hidden = view !== 'shop';
  $('view-done').hidden = view !== 'done';
  $('view-start').hidden = view !== 'climb' || !!player.active_climb;
  $('view-active').hidden = view !== 'climb' || !player.active_climb;
  $('ladder').hidden = view === 'shop';
  $('next').hidden = view === 'shop';
  $('tag').hidden = view === 'shop';
  $('nav-climb').classList.toggle('on', view !== 'shop');
  $('nav-shop').classList.toggle('on', view === 'shop');
  if (view === 'shop') {
    tryOn = { ...player.outfit };
    renderShop();
  }
  refresh();
}

function renderLadder(altitude) {
  const { next } = nextLeg(altitude);
  const rows = [...api.LANDMARKS].reverse().flatMap((l) => {
    const row = { name: l.name, at: distance(l.metres), kind: l.metres <= altitude ? 'past' : l === next ? 'next' : '' };
    return l === next ? [row, { name: 'You', at: distance(altitude), kind: 'you' }] : [row];
  });
  $('rungs').replaceChildren(...rows.map((r) => {
    const row = document.createElement('div');
    row.className = 'rung ' + r.kind;
    const name = document.createElement('span');
    const at = document.createElement('span');
    name.textContent = r.name;
    at.textContent = r.at;
    row.append(name, at);
    return row;
  }));
}

function refresh() {
  const altitude = currentAltitude();
  const leg = nextLeg(altitude);
  const climb = player.active_climb;
  $('coins').textContent = fmt(player.coins);
  $('tag').textContent = distance(altitude);
  $('next-name').textContent = 'Next stop: ' + leg.next.name;
  $('next-left').textContent = distance(Math.max(0, leg.next.metres - altitude)) + ' to go';
  $('bar-fill').style.width = (leg.progress * 100).toFixed(1) + '%';
  renderLadder(altitude);
  if (climb) {
    const left = climb.minutes * 60 - focusedSeconds(climb);
    $('active-task').textContent = climb.task;
    $('time').textContent = clock(Math.ceil(left));
    $('length').textContent = 'of ' + climb.minutes + ':00 climb';
    $('pause').textContent = climb.paused_at ? 'Resume' : 'Pause';
    if (left <= 0) finish();
  }
}

function showResult() {
  const passed = result.landmarks_passed;
  const last = api.LANDMARKS.find((l) => l.name === passed[passed.length - 1]);
  $('done-kicker').textContent = last ? 'New landmark passed' : 'Climb finished';
  $('done-title').textContent = last ? last.name : 'Nice climb';
  $('done-text').textContent = last ? 'At ' + distance(last.metres) + ': ' + last.fact : 'Your hiker is further up the mountain.';
  const stats = [
    ['Focused for', clock(result.focused_seconds)],
    ['Climbed', '+' + distance(result.metres_gained)],
    ['Now at', distance(result.altitude_m)],
    ['Coins earned', '+' + fmt(result.coins_earned)]
  ];
  $('stats').replaceChildren(...stats.map(([label, value]) => {
    const box = document.createElement('div');
    const title = document.createElement('div');
    const number = document.createElement('strong');
    box.className = 'stat';
    title.className = 'label';
    title.textContent = label;
    number.textContent = value;
    box.append(title, number);
    return box;
  }));
}

async function finish() {
  if (finishing) return;
  finishing = true;
  try {
    result = await api.finishClimb();
    player = await api.getPlayer();
    showResult();
    setView('done');
  } finally {
    finishing = false;
  }
}

function drawInto(canvas, sprite) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 12, 16);
  ctx.drawImage(sprite, 0, 0);
}

function renderShop() {
  const pick = shop.find((i) => i.id === picked);
  $('items').replaceChildren(...shop.map((item) => {
    const owned = player.owned.includes(item.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'item' + (item.id === picked ? ' on' : '');
    button.setAttribute('aria-pressed', String(item.id === picked));
    const art = document.createElement('canvas');
    art.width = 12;
    art.height = 16;
    drawInto(art, hikerSprite({ ...player.outfit, [item.slot]: item.id }, 1));
    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = item.name;
    const tag = document.createElement('span');
    tag.className = 'item-tag' + (owned ? ' owned' : '');
    tag.textContent = owned ? 'Owned' : fmt(item.price) + ' coins';
    button.append(art, name, tag);
    button.addEventListener('click', () => choose(item));
    return button;
  }));
  drawInto($('preview'), hikerSprite(tryOn, 1));
  $('pick-name').textContent = pick ? pick.name : 'Pick an item';
  const buy = $('buy'), note = $('shop-note');
  const owned = pick && player.owned.includes(pick.id);
  const short = pick ? pick.price - player.coins : 0;
  buy.hidden = !pick || owned;
  buy.disabled = short > 0;
  buy.textContent = pick ? (short > 0 ? fmt(short) + ' more coins' : 'Buy for ' + fmt(pick.price)) : '';
  note.textContent = owned ? 'Wearing it' : '';
}

async function choose(item) {
  picked = item.id;
  tryOn = { ...player.outfit, [item.slot]: item.id };
  if (player.owned.includes(item.id)) {
    player = await api.setOutfit(tryOn);
  }
  renderShop();
}

async function buy() {
  const item = shop.find((i) => i.id === picked);
  player = await api.buyItem(item.id);
  player = await api.setOutfit({ ...player.outfit, [item.slot]: item.id });
  tryOn = { ...player.outfit };
  $('coins').textContent = fmt(player.coins);
  renderShop();
}

function frame(ms) {
  const seconds = ms / 1000;
  const altitude = currentAltitude();
  const climbing = player.active_climb && !player.active_climb.paused_at;
  const step = reducedMotion ? 1 : Math.floor(seconds * 6);
  const stride = climbing ? [0, 1, 2, 1][step % 4] : 1;
  const x = Math.round(60 + nextLeg(altitude).progress * 80);
  const y = Math.floor(ground(x + 6)) - 15 - (stride === 1 && climbing ? 1 : 0);
  const outfit = view === 'shop' ? tryOn : player.outfit;
  drawWorld(sceneCtx, world, reducedMotion ? 0 : seconds, { sprite: hikerSprite(outfit, stride), x, y });

  const canvas = $('scene');
  const scale = Math.max(canvas.clientWidth / W, canvas.clientHeight / H);
  const tag = $('tag');
  tag.style.left = (canvas.clientWidth - W * scale) / 2 + (x + 6) * scale + 'px';
  tag.style.top = (canvas.clientHeight - H * scale) / 2 + (y - 10) * scale - 34 + 'px';
  setTimeout(() => requestAnimationFrame(frame), 80);
}

$('nav-climb').addEventListener('click', () => setView('climb'));
$('nav-shop').addEventListener('click', () => setView('shop'));
$('to-shop').addEventListener('click', () => setView('shop'));
$('again').addEventListener('click', () => setView('climb'));
$('buy').addEventListener('click', buy);
$('finish').addEventListener('click', finish);
$('pause').addEventListener('click', async () => {
  const paused = player.active_climb.paused_at;
  player.active_climb = await (paused ? api.resumeClimb() : api.pauseClimb());
  refresh();
});
$('start-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  player.active_climb = await api.startClimb($('task').value.trim(), Number($('minutes').value));
  setView('climb');
});

player = await api.getPlayer();
shop = await api.getShop();
tryOn = { ...player.outfit };
setView('climb');
setInterval(refresh, 1000);
requestAnimationFrame(frame);
