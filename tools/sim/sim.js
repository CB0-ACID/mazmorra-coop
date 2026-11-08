// Simulador de equilibrio: arranca partidas reales en Node con un bot por personaje y mide daño, tiempos y supervivencia.
'use strict';
const fs = require('fs');
const path = require('path');
const { loadGame, gamePath } = require('./harness');

function makeSim(skill) {
  const sim = loadGame(gamePath);
  const G = sim.ev('globalThis');
  G.BOT_SKILL = skill;
  sim.ev(fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8'));
  sim.ev(`
    { const _rd = readDevice; readDevice = function (dev) { if (dev.startsWith('bot')) return globalThis.__BOTF(players.find(q => q.dev === dev)); return _rd(dev); }; }
    globalThis.__M = null;
    const SKIP = new Set(['damageEnemy', 'Error', 'eval', 'Object.eval', 'ev', '']);
    function srcName() {
      const st = new Error().stack.split('\\n').slice(2, 9).map(l => { const m = l.match(/at (?:Object\\.)?([\\w$.]+)/); return m ? m[1] : ''; });
      return st.filter(n => !SKIP.has(n) && !n.startsWith('Array.') && !n.startsWith('Map.')).slice(0, 2).join('<') || '?';
    }
    { const _de = damageEnemy; damageEnemy = function (e, sx, sy, hpDmg, staDmg, kb, ranged) {
        const M = globalThis.__M; const h0 = Math.max(0, e.hp), s0 = Math.max(0, e.sta || 0), dead0 = e.dead;
        const r = _de.apply(this, arguments);
        if (M && !dead0) { const dh = h0 - Math.max(0, e.hp), ds = s0 - Math.max(0, e.sta || 0); const k = srcName(); const o = M.src[k] || (M.src[k] = { hp: 0, sta: 0, n: 0 }); o.hp += dh; o.sta += ds; o.n++; M.hits++; if (dh > M.maxHit) M.maxHit = dh; }
        return r; }; }
    { const _ex = executeEnemy; executeEnemy = function (e, p, how) {
        const M = globalThis.__M; const h0 = Math.max(0, e.hp); const r = _ex.apply(this, arguments);
        if (M) { M.execs++; const o = M.src['ejecución'] || (M.src['ejecución'] = { hp: 0, sta: 0, n: 0 }); o.hp += h0 - Math.max(0, e.hp); o.n++; }
        return r; }; }
    { const _hp = hurtPlayer; hurtPlayer = function (p, sx, sy, srcE, dmg) {
        const M = globalThis.__M; const h0 = p.hp; const r = _hp.apply(this, arguments);
        if (M && r) { const d = h0 - Math.max(0, p.hp); M.taken += d; M.hitsTaken++; const k = srcE ? srcE.type : srcNameH(sx, sy); M.takenBy[k] = (M.takenBy[k] || 0) + d; }
        else if (M && !r && !p.down) M.avoided++;
        return r; }; }
    function srcNameH(sx, sy) { // origen del daño recibido sin enemigo: dueño de la zona avisada, o bala
      const h = hazards.find(h => h.x === sx && h.y === sy && h.owner);
      if (h) return h.owner.type + ' (zona)';
      const b = enemies.some(e => e.type === 'boss' && !e.dead);
      return b ? 'boss (bala)' : 'shooter/bat (proyectil)'; }
    { const _ua = useAbility; useAbility = function (p, slot) {
        const M = globalThis.__M; const cd0 = slot === 'pri' ? p.priCd : p.secCd; const t = abilityType(p, slot); const r = _ua.apply(this, arguments);
        if (M && (slot === 'pri' ? p.priCd : p.secCd) > cd0) M.abil[t] = (M.abil[t] || 0) + 1;
        return r; }; }
    { const _ke = killEnemy; killEnemy = function (e, executed) { const M = globalThis.__M; if (M && !e.dead) { M.kills++; M.killsBy[e.type] = (M.killsBy[e.type] || 0) + 1; } return _ke.apply(this, arguments); }; }
    { const _tl = typeof tryLaunch === 'function' ? tryLaunch : null; if (_tl) tryLaunch = function (e) { const M = globalThis.__M; const r = _tl.apply(this, arguments); if (M && r) M.launches++; return r; }; }
    globalThis.__simStart = function (ci, nBots, depth, seedv) {
      slots = []; for (let i = 0; i < nBots; i++) slots.push({ dev: 'bot' + i, cur: Array.isArray(ci) ? ci[i] : ci, locked: true });
      want = slots.length; npcMode = false; siegeMode = false; devStartDepth = depth || 1;
      startGame(); if (state === 'tutorial') resume();
      testMode = false;
    };
    // Prepara un encuentro: sala de combate (o del guardián) del piso «depth», con oleadas fijas si se dan
    globalThis.__encounter = function (depth, kind, waves, seedv) {
      seed = seedv; floor = genFloor(seed, depth);
      let r = null;
      for (const rr of floor.rooms.values()) { if (kind === 'boss' ? rr.type === 'boss' : (rr.type !== 'boss' && rr !== floor.start && rr.type !== 'treasure')) { if (!r || (kind !== 'boss' && (rr.dist || 0) > (r.dist || 0))) r = rr; } }
      r.cleared = false; r.waves = waves || null; r.pickups = [];
      for (const p of players) { p.hp = p.maxHp; p.down = false; p.inv = 0; p.priCd = p.secCd = 0; p.ghost = false; p.bot = null; }
      state = 'play'; enterRoom(r, null); banner = null;
      return r.waves.map(w => w.map(s => s.type + (s.elite ? '*' : ''))).join(' | ');
    };
    { const _bai = ENEMY_AI.boss; ENEMY_AI.boss = function (e) { if (e.dummy) { e.state = 'walk'; return [0, 0]; } return _bai.apply(this, arguments); }; }
    // Muñeco de práctica: el guardián del piso sin IA y con vida enorme (no ataca ni se mueve; se le puede aturdir, lanzar y ejecutar)
    globalThis.__dummy = function (depth, seedv, hp) {
      seed = seedv; floor = genFloor(seed, depth);
      const r = [...floor.rooms.values()].find(rr => rr.type === 'boss');
      r.cleared = false; r.waves = [[]]; r.pickups = [];
      for (const p of players) { p.hp = p.maxHp; p.down = false; p.inv = 0; p.priCd = p.secCd = 0; p.ghost = false; p.bot = null; }
      state = 'play'; enterRoom(r, null); banner = null;
      const e = makeEnemy('boss', (MID_X + 0.5) * T, (MID_Y + 0.5) * T - 120, false); e.dummy = true; e.spawnT = 0; enemies.push(e); // vida real del guardián del piso
      globalThis.__dummyE = e;
      room.addT = 1e9;
      return e;
    };
    // el muñeco no muere: al bajar de la mitad se rellena (el daño ya se ha contado en damageEnemy y executeEnemy)
    { const _up = update; update = function (dt) { const e = globalThis.__dummyE; if (e && enemies.includes(e) && e.hp < e.maxHp * 0.5) { e.hp = e.maxHp; e.dead = false; } return _up.apply(this, arguments); }; }
    globalThis.__seq = function (depth, seedv) { // todas las salas de combate del piso, por distancia, y el guardián al final
      seed = seedv; floor = genFloor(seed, depth);
      const list = [...floor.rooms.values()].filter(r => r !== floor.start && r.type !== 'treasure' && r.type !== 'boss').sort((a, b) => (a.dist || 0) - (b.dist || 0));
      const boss = [...floor.rooms.values()].find(r => r.type === 'boss');
      return list.concat(boss ? [boss] : []);
    };
  `);
  return { sim, G };
}

function newMetrics() { return { src: {}, hits: 0, maxHit: 0, execs: 0, taken: 0, hitsTaken: 0, avoided: 0, takenBy: {}, abil: {}, kills: 0, killsBy: {}, launches: 0 }; }

// Corre la sala actual hasta despejarla, caer o agotar el tiempo
function runRoom(S, maxT) {
  const { sim, G } = S;
  const M = G.__M;
  const hp0 = sim.ev('players.reduce((a, p) => a + p.hp, 0)');
  let t = 0, dealt = 0, contactT = 0, firstHit = null;
  const steps = Math.round(maxT * 60);
  let res = 'timeout';
  // vida total de los enemigos para el daño efectivo (incluye refuerzos que entran)
  sim.ev('globalThis.__eh = new Set(enemies);');
  for (let i = 0; i < steps; i++) {
    sim.ev('update(STEP)');
    t += 1 / 60;
    if (i % 6 === 0) {
      const r = sim.ev(`(() => { for (const e of enemies) __eh.add(e);
        const live = enemies.some(e => !e.dead); const down = players.every(p => p.down); const near = players.some(p => !p.down && enemies.some(e => !e.dead && e.spawnT <= 0 && Math.hypot(e.x - p.x, e.y - p.y) - e.r - p.r < 320));
        return [0, room.cleared ? 1 : 0, down ? 1 : 0, near ? 1 : 0, state === 'over' ? 1 : 0]; })()`);
      if (r[3]) contactT += 0.1;
      if (r[1]) { res = 'win'; break; }
      if (r[2] || r[4]) { res = 'dead'; break; }
    }
  }
  dealt = sim.ev('(() => { let d = 0; for (const e of __eh) d += e.dummy ? (e.dummyHp - Math.max(0, e.hp)) : (e.dead ? e.maxHp : e.maxHp - Math.max(0, e.hp)); return d; })()');
  const hp1 = sim.ev('players.reduce((a, p) => a + Math.max(0, p.hp), 0)');
  return { res, t, dealt, engaged: contactT, firstHit, hpLost: hp0 - hp1, hpEnd: hp1 };
}

module.exports = { makeSim, newMetrics, runRoom };
