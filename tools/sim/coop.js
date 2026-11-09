// Uso: node coop.js <id> <personajes separados por coma (índices)> <nivel> <semillas> > salida.json
// Partidas cooperativas con un bot por personaje: guardianes, sala real y partida completa (pisos 1-4).
// Métricas de equipo (victorias, tiempos, caídas, levantamientos) y por jugador (daño hecho atribuido, estamina quitada,
// ejecuciones, daño recibido, caídas).
'use strict';
const { makeSim, newMetrics, runRoom } = require('./sim');
const [id, compS, level, NSs] = process.argv.slice(2);
const comp = compS.split(',').map(Number), NS = +NSs || 8;
const SKILLS = {
  experto: { react: 0.15, notice: 0.95, abilities: true, dodge: true, parryRate: 0.7, parryLead: [0.05, 0.3] },
  medio: { react: 0.35, notice: 0.7, abilities: true, dodge: true, parryRate: 0.4, parryLead: [0.05, 0.45] }
};
const S = makeSim(SKILLS[level || 'experto']);
const { sim, G } = S;
if (process.env.SIMPATCH) sim.ev(process.env.SIMPATCH);
// atribución del daño a cada jugador: quién está actuando cuando se llama a damageEnemy
sim.ev(`
  globalThis.__cur = null; globalThis.__PM = null;
  const wrapP = (name, idx) => { const f = eval(name); eval(name + ' = function () { const prev = __cur; __cur = arguments[idx] || prev; try { return f.apply(this, arguments); } finally { __cur = prev; } }'); };
  wrapP('updatePlayer', 0); wrapP('shotHit', 0); wrapP('meleeHit', 0); wrapP('updateFlip', 0); wrapP('useAbility', 0);
  { const _d = damageEnemy; damageEnemy = function (e, sx, sy, h) { const M = __PM; const h0 = Math.max(0, e.hp), s0 = Math.max(0, e.sta || 0), d0 = e.dead; const r = _d.apply(this, arguments);
      if (M && !d0) { const k = __cur && players.includes(__cur) ? players.indexOf(__cur) : -1; const o = M[k] || (M[k] = { hp: 0, sta: 0, ex: 0, taken: 0, downs: 0, revives: 0 }); o.hp += h0 - Math.max(0, e.hp); o.sta += s0 - Math.max(0, e.sta || 0); }
      return r; }; }
  { const _x = executeEnemy; executeEnemy = function (e, p) { const M = __PM; const h0 = Math.max(0, e.hp); const r = _x.apply(this, arguments);
      if (M && players.includes(p)) { const o = M[players.indexOf(p)] || (M[players.indexOf(p)] = { hp: 0, sta: 0, ex: 0, taken: 0, downs: 0, revives: 0 }); o.ex++; o.hp += h0 - Math.max(0, e.hp); } return r; }; }
  { const _h = hurtPlayer; hurtPlayer = function (p) { const M = __PM; const h0 = p.hp, dn = p.down; const r = _h.apply(this, arguments);
      if (M && r && players.includes(p)) { const o = M[players.indexOf(p)] || (M[players.indexOf(p)] = { hp: 0, sta: 0, ex: 0, taken: 0, downs: 0, revives: 0 }); o.taken += Math.max(0, h0 - Math.max(0, p.hp)); if (!dn && p.down) o.downs++; } return r; }; }
  { const _u = update; update = function (dt) { const M = __PM; const dn = players.map(p => p.down); const r = _u.apply(this, arguments);
      if (M) players.forEach((p, i) => { if (dn[i] && !p.down) { const o = M[i] || (M[i] = { hp: 0, sta: 0, ex: 0, taken: 0, downs: 0, revives: 0 }); o.revives++; } }); return r; }; }
`);
const names = comp.map(c => sim.ev(`CHARS[${c}].name`));
const out = { id, comp: names, n: comp.length, level, seeds: NS, scen: {}, runs: [] };
const SC = [['mix', 2, 'room'], ['g1', 1, 'boss'], ['g2', 2, 'boss'], ['g3', 3, 'boss'], ['g4', 4, 'boss']];
G.__simStart(comp, comp.length, 1);
for (const [sid, depth, kind] of SC) {
  const L = out.scen[sid] = [];
  for (let s = 0; s < NS; s++) {
    G.__M = newMetrics(); sim.ev('__PM = {}');
    G.__encounter(depth, kind, null, 1000 + s * 7919 + depth);
    const r = runRoom(S, kind === 'boss' ? 360 : 240);
    L.push({ res: r.res, t: r.t, execs: G.__M.execs, P: JSON.parse(sim.ev('JSON.stringify(__PM)')) });
  }
}
for (let s = 0; s < NS; s++) {
  G.__simStart(comp, comp.length, 1); sim.ev('__PM = {}');
  const run = { seed: 5000 + s, rooms: 0, floor: 1, t: 0, cleared: false };
  let alive = true;
  for (let d = 1; d <= 4 && alive; d++) {
    run.floor = d;
    const list = G.__seq(d, run.seed);
    if (d > 1) sim.ev('for (const p of players) { if (p.down) { p.down = false; p.ghost = false; p.hp = Math.min(p.maxHp, REVIVE.hp); } healPlayer(p, HEAL.floor); }');
    for (const r of list) {
      G.__M = newMetrics();
      sim.ev('(r => { state = "play"; r.cleared = false; r.waves = null; r.pickups = []; for (const p of players) p.bot = null; enterRoom(r, null); banner = null; })')(r);
      const res = runRoom(S, r.type === 'boss' ? 360 : 240);
      run.t += res.t;
      if (res.res !== 'win') { alive = false; run.end = res.res + ' · ' + (r.type === 'boss' ? 'guardián' : 'sala'); break; }
      run.rooms++;
      sim.ev('for (const p of players) for (const k of pickups) healPlayer(p, HEAL.pickup); pickups.length = 0;');
    }
  }
  run.cleared = alive; run.P = JSON.parse(sim.ev('JSON.stringify(__PM)'));
  out.runs.push(run);
}
process.stdout.write(JSON.stringify(out));
