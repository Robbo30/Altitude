// Your FastAPI server. Set it to '' to use only the sample data below.
const API_URL = 'http://127.0.0.1:8000';

// The endpoints your backend has so far. Add each one as you build it;
// anything not listed here still uses the sample data.
const LIVE = ['/player'];

export const LANDMARKS = [
  { name: 'Ben Nevis', metres: 1345, fact: 'It\'s the highest mountain in the UK.' },
  { name: 'Mont Blanc', metres: 4806, fact: 'It\'s the highest mountain in the Alps.' },
  { name: 'Kilimanjaro', metres: 5895, fact: 'It\'s the highest mountain in Africa.' },
  { name: 'Everest', metres: 8849, fact: 'It\'s the highest mountain above sea level on Earth.' },
  { name: 'Airliners', metres: 11000, fact: 'Passenger jets cruise at around this height.' },
  { name: 'Edge of space', metres: 100000, fact: 'This is the Kármán line, a common boundary for space.' },
  { name: 'ISS', metres: 400000, fact: 'The International Space Station orbits at around this height.' },
  { name: 'Moon', metres: 384400000, fact: 'You made it to the Moon.' }
];

async function request(path, body) {
  const res = await fetch(API_URL + path, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('The server said no: ' + res.status);
  return res.json();
}

const live = (path) => API_URL && LIVE.includes(path);

export const getPlayer = () => (live('/player') ? request('/player') : sample.getPlayer());
export const startClimb = (task, minutes) => (live('/climbs/start') ? request('/climbs/start', { task, minutes }) : sample.startClimb(task, minutes));
export const pauseClimb = () => (live('/climbs/pause') ? request('/climbs/pause', {}) : sample.pauseClimb());
export const resumeClimb = () => (live('/climbs/resume') ? request('/climbs/resume', {}) : sample.resumeClimb());
export const finishClimb = () => (live('/climbs/finish') ? request('/climbs/finish', {}) : sample.finishClimb());
export const getShop = () => (live('/shop') ? request('/shop') : sample.getShop());
export const buyItem = (id) => (live('/shop/buy') ? request('/shop/buy', { item_id: id }) : sample.buyItem(id));
export const setOutfit = (outfit) => (live('/outfit') ? request('/outfit', outfit) : sample.setOutfit(outfit));

// Everything below stands in for the backend, and can go once FastAPI is running.
const KEY = 'altitude-sample';
const SHOP = [
  { id: 'bush', slot: 'hat', name: 'Bush hat', price: 150 },
  { id: 'alpine', slot: 'suit', name: 'Alpine shell', price: 250 },
  { id: 'roman', slot: 'hat', name: 'Roman helmet', price: 400 },
  { id: 'legion', slot: 'suit', name: 'Legionary armour', price: 600 },
  { id: 'space', slot: 'hat', name: 'Space helmet', price: 900 },
  { id: 'spacesuit', slot: 'suit', name: 'Spacesuit', price: 1500 }
];
const FRESH = {
  altitude_m: 3918,
  coins: 1280,
  metres_per_minute: 40,
  owned: ['beanie', 'trail'],
  outfit: { hat: 'beanie', suit: 'trail' },
  active_climb: null
};

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || structuredClone(FRESH); } catch { return structuredClone(FRESH); }
}
function save(player) {
  try { localStorage.setItem(KEY, JSON.stringify(player)); } catch { /* Sample data just won't survive a reload. */ }
  return player;
}
const iso = () => new Date().toISOString();

const sample = {
  async getPlayer() { return load(); },
  async getShop() { return SHOP; },
  async startClimb(task, minutes) {
    const player = load();
    player.active_climb = { id: Date.now(), task, minutes, started_at: iso(), paused_at: null, paused_seconds: 0 };
    return save(player).active_climb;
  },
  async pauseClimb() {
    const player = load();
    player.active_climb.paused_at = iso();
    return save(player).active_climb;
  },
  async resumeClimb() {
    const player = load(), climb = player.active_climb;
    climb.paused_seconds += (Date.now() - Date.parse(climb.paused_at)) / 1000;
    climb.paused_at = null;
    return save(player).active_climb;
  },
  async finishClimb() {
    const player = load(), climb = player.active_climb;
    const end = climb.paused_at ? Date.parse(climb.paused_at) : Date.now();
    const seconds = Math.min(climb.minutes * 60, (end - Date.parse(climb.started_at)) / 1000 - climb.paused_seconds);
    const before = player.altitude_m;
    const gained = Math.round(seconds / 60 * player.metres_per_minute);
    const passed = LANDMARKS.filter((l) => before < l.metres && before + gained >= l.metres).map((l) => l.name);
    const earned = Math.floor(gained / 10) + passed.length * 50;
    player.altitude_m += gained;
    player.coins += earned;
    player.active_climb = null;
    save(player);
    return {
      focused_seconds: Math.round(seconds), metres_gained: gained, coins_earned: earned,
      altitude_m: player.altitude_m, coins: player.coins, landmarks_passed: passed
    };
  },
  async buyItem(id) {
    const player = load(), item = SHOP.find((i) => i.id === id);
    if (player.owned.includes(id) || player.coins < item.price) throw new Error('You can\'t buy that');
    player.coins -= item.price;
    player.owned.push(id);
    return save(player);
  },
  async setOutfit(outfit) {
    const player = load();
    player.outfit = outfit;
    return save(player);
  }
};
