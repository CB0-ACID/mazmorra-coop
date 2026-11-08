// Uso: node run.js <índice de personaje> <nivel: experto|medio> <semillas> > salida.json
// Corre todos los escenarios de equilibrio para un personaje en solitario y vuelca las métricas en JSON.
'use strict';
const { makeSim, newMetrics, runRoom } = require('./sim');
const ci = +process.argv[2], level = process.argv[3] || 'experto', NS = +process.argv[4] || 10;
// parryRate/parryLead: bloqueo perfecto de Ceniza a escala humana (cuántos intenta y con qué margen alza el escudo; ventana perfecta 0,2 s)
const SKILLS = {
  experto: { react: 0.15, notice: 0.95, abilities: true, dodge: true, parryRate: 0.7, parryLead: [0.05, 0.3] },
  medio: { react: 0.35, notice: 0.7, abilities: true, dodge: true, parryRate: 0.4, parryLead: [0.05, 0.45] }
};
const S = makeSim(SKILLS[level]);
if (process.env.SIMPATCH) S.sim.ev(process.env.SIMPATCH); // cambio de equilibrio de prueba (solo en la simulación)
const { sim, G } = S;
const name = sim.ev(`CHARS[${ci}].name`);
const W = (list) => list.map(t => ({ type: t.replace('*', ''), elite: t.endsWith('*') }));
const SCEN = [
  { id: 't1', label: 'Enjambre tier 1 (piso 1)', depth: 1, waves: [W(['mite', 'mite', 'slime', 'slime', 'bat']), W(['mite', 'mite', 'slime', 'bat'])], cap: 180 },
  { id: 't2', label: 'Tier 2 (piso 2)', depth: 2, waves: [W(['charger', 'shooter']), W(['charger*', 'shooter', 'mite'])], cap: 180 },
  { id: 't3', label: 'Tier 3 (piso 2)', depth: 2, waves: [W(['golem']), W(['splitter', 'slime'])], cap: 180 },
  { id: 'mix', label: 'Sala real (piso 2)', depth: 2, waves: null, cap: 240 },
  { id: 'g1', label: 'Guardián piso 1', depth: 1, boss: true, cap: 300 },
  { id: 'g2', label: 'Guardián piso 2', depth: 2, boss: true, cap: 300 },
  { id: 'g3', label: 'Guardián piso 3', depth: 3, boss: true, cap: 300 },
  { id: 'g4', label: 'Guardián piso 4 (Dragón)', depth: 4, boss: true, cap: 360 }
];
const out = { name, ci, level, seeds: NS, scen: {}, dummy: [], runs: [] };
function snap(M) { return JSON.parse(JSON.stringify(M)); }
G.__simStart(ci, 1, 1);
// 1) Muñeco: DPS puro contra un objetivo quieto (sin ataques); 30 s
for (let s = 0; s < Math.max(3, Math.round(NS / 3)); s++) {
  G.__M = newMetrics(); G.__dummy(1, 777 + s);
  const r = runRoom(S, 30);
  out.dummy.push(Object.assign(r, { M: snap(G.__M) }));
  G.__dummyE = null;
}
// 2) Encuentros
for (const sc of SCEN) {
  const arr = out.scen[sc.id] = { label: sc.label, list: [] };
  for (let s = 0; s < NS; s++) {
    G.__M = newMetrics();
    const desc = G.__encounter(sc.depth, sc.boss ? 'boss' : 'room', sc.waves ? JSON.parse(JSON.stringify(sc.waves)) : null, 1000 + s * 7919 + sc.depth);
    const r = runRoom(S, sc.cap);
    arr.list.push(Object.assign(r, { desc, M: snap(G.__M) }));
  }
}
// 3) Partida completa en solitario: pisos 1-4, todas las salas de combate y el guardián; la vida se arrastra
for (let s = 0; s < NS; s++) {
  G.__simStart(ci, 1, 1);
  const run = { seed: 5000 + s, rooms: 0, floor: 1, t: 0, dealt: 0, taken: 0, died: false, killer: null, hpPerFloor: [] };
  let alive = true;
  for (let d = 1; d <= 4 && alive; d++) {
    run.floor = d;
    const list = G.__seq(d, run.seed);
    if (d > 1) sim.ev('for (const p of players) { if (p.down) { p.down = false; p.hp = Math.min(p.maxHp, REVIVE.hp); } healPlayer(p, HEAL.floor); }');
    for (const r of list) {
      G.__M = newMetrics();
      sim.ev('(r => { state = "play"; r.cleared = false; r.waves = null; r.pickups = []; for (const p of players) { p.bot = null; } enterRoom(r, null); banner = null; })')(r);
      const res = runRoom(S, r.type === 'boss' ? 360 : 240);
      run.t += res.t; run.dealt += res.dealt; run.taken += G.__M.taken;
      if (res.res !== 'win') {
        alive = false; run.died = res.res === 'dead'; run.timeout = res.res === 'timeout';
        const tb = Object.entries(G.__M.takenBy).sort((a, b) => b[1] - a[1]);
        run.killer = (r.type === 'boss' ? 'guardián' : 'sala') + ' · ' + (tb[0] ? tb[0][0] : '?');
        run.deathRoom = r.type;
        break;
      }
      run.rooms++;
      // corazones que han caído en la sala: se recogen al terminar
      sim.ev('for (const p of players) for (const k of pickups) healPlayer(p, HEAL.pickup); pickups.length = 0;');
    }
    run.hpPerFloor.push(sim.ev('players[0].hp'));
  }
  run.cleared = alive;
  out.runs.push(run);
}
process.stdout.write(JSON.stringify(out));
