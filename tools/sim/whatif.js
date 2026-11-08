// Uso: node whatif.js <personaje> <parche> <semillas>: repite escenarios con un cambio de equilibrio aplicado solo en la simulación
'use strict';
const { makeSim, newMetrics, runRoom } = require('./sim');
const [ci, patch, NS] = [+process.argv[2], process.argv[3], +process.argv[4] || 10];
const S = makeSim({ react: 0.15, notice: 0.95, abilities: patch !== 'noAbil', dodge: true, noPri: patch === 'noPri', noSec: patch === 'noSec', parry: patch !== 'noParry', noDive: patch === 'noDive' || patch === 'noAbil' });
const PATCH = {
  none: '', noPri: '', noSec: '', noAbil: '', noParry: '', noDive: '',
  noFury: `CHARS[5].fury = false;`,
  bossHp2: `{ const _d = damageEnemy; damageEnemy = function (e, sx, sy, h, s, kb, ranged) { if (e.type === 'boss' && ranged) h *= 2; return _d.call(this, e, sx, sy, h, s, kb, ranged); }; }`,
  frostHp2: `CHARS[2].hp = 80; CHARS[2].shot = 1.6; { const _d = damageEnemy; damageEnemy = function (e, sx, sy, h, s, kb, ranged) { if (e.type === 'boss' && ranged) h *= 2; return _d.call(this, e, sx, sy, h, s, kb, ranged); }; }`,
  bossShot: `TIER_RULES[4].shotStaMul = 0.6;`,
  frostBoss: `TIER_RULES[4].shotStaMul = 0.6; CHARS[2].hp = 80; CHARS[2].shot = 1.6;`,
  exec12: `{ const _ex = executeEnemy; executeEnemy = function (e, p, how) { const boss = e.type === 'boss'; const r = _ex.apply(this, arguments); if (boss && !e.dead) e.hp += e.maxHp * 0.13; return r; }; }`,
  frost: `CHARS[2].hp = 80; CHARS[2].shot = 1.6;`,
  ciruela: `AB.gatling.cd0 = 0.22; AB.gatling.cdMin = 0.085;`,
  tank: `{ const _h = hurtPlayer; hurtPlayer = function (p, sx, sy, s, d) { if (p.ch.family === 'tanque') { if (d == null) d = s ? contactDmg(s) : DMG_FALLBACK; d = Math.round(d * 0.7); } return _h.call(this, p, sx, sy, s, d); }; }`
};
S.sim.ev(PATCH[patch]);
if (patch === 'frost') S.sim.ev('null'); // la vida se aplica al empezar
const out = {};
const sc = [['mix', 2, 'room'], ['g1', 1, 'boss'], ['g2', 2, 'boss'], ['g3', 3, 'boss'], ['g4', 4, 'boss']];
S.G.__simStart(ci, 1, 1);
for (const [id, depth, kind] of sc) {
  const L = [];
  for (let s = 0; s < NS; s++) { S.G.__M = newMetrics(); S.G.__encounter(depth, kind, null, 1000 + s * 7919 + depth); const rr = runRoom(S, kind === 'boss' ? 360 : 240); rr.taken = S.G.__M.taken; rr.execs = S.G.__M.execs; L.push(rr); }
  const w = L.filter(x => x.res === 'win');
  out[id] = { win: w.length / L.length, t: w.length ? w.reduce((a, x) => a + x.t, 0) / w.length : null, dps: L.reduce((a, x) => a + x.dealt / x.t, 0) / L.length, taken: L.reduce((a, x) => a + x.taken, 0) / L.length, execs: L.reduce((a, x) => a + x.execs / x.t * 60, 0) / L.length };
}
console.log(JSON.stringify({ name: S.sim.ev(`CHARS[${ci}].name`), patch, out }));
