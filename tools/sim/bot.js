// Bot de prueba: se evalúa DENTRO del cierre del juego (tiene acceso a players, enemies, hazards, bullets, abilityReady…).
// Juega con la misma entrada que un mando (x, y, a, s, d, q, e, l, rx, ry): todo pasa por updatePlayer como en una partida real.
// Habilidad configurable con BOT_SKILL: reacción (s), probabilidad de ver cada amenaza y si usa las habilidades.
(function () {
  const SK = globalThis.BOT_SKILL || { react: 0.15, notice: 0.95, abilities: true, dodge: true };
  const P = (p) => p.bot || (p.bot = { t: 0, hold: {}, seen: new Map(), strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 0, phase: 0, lastA: false, comboN: 0, aHoldT: 0, abT: 0 });
  const pref = { // distancia preferida al objetivo (borde a borde) para los de distancia
    Escarcha: 150, Coral: 190, Marea: 230, Ciruela: 200
  };
  // Amenaza en un punto (0 = seguro). Solo cuenta lo que el bot ha «visto» (tiempo de reacción y probabilidad de fijarse)
  function seen(b, obj, now) {
    let s = b.seen.get(obj);
    if (s == null) { s = Math.random() < SK.notice ? now + SK.react * (0.6 + Math.random() * 0.8) : Infinity; b.seen.set(obj, s); }
    return now >= s;
  }
  function threatAt(b, p, x, y, now) {
    let th = 0;
    for (const h of hazards) {
      if (h.cancel || h.done || !seen(b, h, now)) continue;
      if (b.parryPlan && h.owner && h.owner.type === 'boss') { // Ceniza con escudo: no se aparta del golpe del guardián si le llega por delante (lo para)
        let da = Math.atan2(h.y - p.y, h.x - p.x) - Math.atan2(p.ay, p.ax); da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) <= AB.wall.arc * 0.85) continue;
      }
      const left = h.delay - h.t, dd = Math.hypot(x - h.x, y - h.y);
      if (left > 1.2) continue;
      let inside = dd < h.r + p.r + 10;
      if (inside && h.arc) { let da = Math.atan2(y - h.y, x - h.x) - h.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > h.arc + 0.25 && dd > p.r + 16) inside = false; }
      if (inside) th += 3 + (1.2 - left) * 4 + (h.r + p.r + 10 - dd) / 30;
    }
    for (const u of bullets) {
      if (!seen(b, u, now)) continue;
      const vx = u.vx, vy = u.vy, v2 = vx * vx + vy * vy || 1;
      const tc = Math.max(0, Math.min(0.6, ((x - u.x) * vx + (y - u.y) * vy) / v2));
      const cx = u.x + vx * tc, cy = u.y + vy * tc, dd = Math.hypot(x - cx, y - cy);
      if (dd < (u.r || 6) + p.r + 12) th += 3 + (0.6 - tc) * 5;
    }
    for (const e of enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const dd = Math.hypot(x - e.x, y - e.y);
      const lineType = e.type === 'mite' || e.type === 'charger';
      if (lineType && (e.state === 'wind' || e.state === 'dash') && seen(b, e.state + ':' + enemies.indexOf(e) + ':' + (e.dirx || 0).toFixed(2), now)) {
        const ux = e.dirx || 0, uy = e.diry || 0, len = e.state === 'dash' ? e.t * (e.type === 'mite' ? 320 : 300) + 30 : (e.type === 'mite' ? 160 : 180);
        const along = (x - e.x) * ux + (y - e.y) * uy, perp = Math.abs((x - e.x) * uy - (y - e.y) * ux);
        if (along > -10 && along < len && perp < e.r + p.r + 14) th += e.state === 'dash' ? 4 : 2.5 + (e.windDur - e.t) * 2;
      } else if (isHot(e) && dd < e.r + p.r + 30) th += 4; // embestida del Ariete
    }
    if (isSolid(Math.floor(x / T), Math.floor(y / T))) th += 50;
    return th;
  }
  // ¿Golpe a punto de llegar por delante? (para el bloqueo perfecto: ventana de 0,2 s)
  function imminent(b, p, now) {
    for (const h of hazards) {
      if (h.cancel || h.done || !seen(b, h, now)) continue;
      const left = h.delay - h.t; if (left > 0.18 || left < 0) continue;
      if (Math.hypot(p.x - h.x, p.y - h.y) < h.r + p.r + 6) return true;
    }
    for (const u of bullets) {
      if (!seen(b, u, now)) continue;
      const v2 = u.vx * u.vx + u.vy * u.vy || 1, tc = ((p.x - u.x) * u.vx + (p.y - u.y) * u.vy) / v2;
      if (tc > 0 && tc < 0.18 && Math.hypot(p.x - (u.x + u.vx * tc), p.y - (u.y + u.vy * tc)) < (u.r || 6) + p.r + 6) return true;
    }
    for (const e of enemies) if (!e.dead && isHot(e) && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 40 && seen(b, 'hot' + enemies.indexOf(e) + Math.floor(e.t * 3), now)) return true;
    return false;
  }
  function pickTarget(p) {
    let best = null, bs = 1e9;
    for (const e of liveTargets()) {
      if (e.type === 'boss' && e.sky) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y) - e.r;
      let s = d;
      if (e.stunT > 0) s -= 220;                        // ejecutar
      if (e.airborne && !e.flying) s -= p.ch.canShoot ? 260 : 120;   // malabares aéreos
      if (e.type === 'bat' && !p.ch.canShoot) s += 140;  // al murciélago no se le pega cuerpo a cuerpo
      if (e.bossAdd) s -= 60;                             // limpiar refuerzos primero
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  }
  // Ruta por casillas (BFS) cuando hay muros entre el bot y su destino: devuelve el siguiente punto de paso
  function pathStep(p, gx, gy) {
    if (!segSolid(p.x, p.y, gx, gy)) return [gx, gy];
    const sx = Math.floor(p.x / T), sy = Math.floor(p.y / T), tx = Math.floor(gx / T), ty = Math.floor(gy / T);
    const key = (x, y) => y * COLS + x, prev = new Map([[key(sx, sy), -1]]), q = [[sx, sy]];
    let found = false;
    for (let i = 0; i < q.length && i < 2000; i++) {
      const [x, y] = q[i];
      if (x === tx && y === ty) { found = true; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (prev.has(k) || (isSolid(nx, ny, false) && !(nx === tx && ny === ty))) continue;
        prev.set(k, key(x, y)); q.push([nx, ny]);
      }
    }
    if (!found) return [gx, gy];
    const path = []; let k = key(tx, ty);
    while (k !== -1) { path.push(k); k = prev.get(k); }
    path.reverse();
    // el punto más lejano del camino que se ve en línea recta
    let best = path[1] != null ? path[1] : path[0];
    for (let i = 1; i < path.length; i++) { const cx = (path[i] % COLS + 0.5) * T, cy = (Math.floor(path[i] / COLS) + 0.5) * T; if (segSolid(p.x, p.y, cx, cy)) break; best = path[i]; }
    return [(best % COLS + 0.5) * T, (Math.floor(best / COLS) + 0.5) * T];
  }
  function pulse(b, k, dur) { if (!b.hold[k]) b.hold[k] = dur; }
  globalThis.__BOTF = function (p) {
    const out = { x: 0, y: 0, a: false, s: false, d: false, q: false, e: false, l: false, c: false, p: false, t: false, rx: 0, ry: 0 };
    if (!p || p.down) return out;
    const b = P(p), c = p.ch, now = time;
    b.t += STEP;
    for (const k in b.hold) { if (b.hold[k] > 0) { out[k] = true; b.hold[k] -= STEP; } else delete b.hold[k]; }
    if (b.seen.size > 4000) b.seen.clear();
    const tg = pickTarget(p);
    // posición deseada
    let gx = p.x, gy = p.y;
    if (tg) {
      const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy) || 1, gap = d - tg.r - p.r;
      out.rx = dx / d; out.ry = dy / d;
      if (c.canShoot) {
        const want = pref[c.name] || 200;
        b.strafeT -= STEP; if (b.strafeT <= 0) { b.strafeT = 1 + Math.random() * 2; b.strafe = -b.strafe; }
        const rad = gap > want + 40 ? 1 : gap < want - 50 ? -1 : 0;
        gx = p.x + (dx / d) * rad * 60 + (-dy / d) * b.strafe * 40; gy = p.y + (dy / d) * rad * 60 + (dx / d) * b.strafe * 40;
        // aturdido en el suelo y da tiempo a llegar: acercarse a rematarlo, como haría un jugador
        b.goExec = SK.execute !== false && tg.stunT > 0 && !tg.airborne && gap / ((c.speed || 200) * 0.9) < tg.stunT - 0.15;
        if (b.goExec) { gx = tg.x; gy = tg.y; }
      } else {
        const stand = (tg.type === 'bat' && !tg.airborne) ? 60 : 6;
        if (gap > stand) { gx = tg.x; gy = tg.y; }
        else if (b.launchT > 0) { gx = p.x - dx / d * 60; gy = p.y - dy / d * 60; } // alejarse mientras golpea: golpe ascendente que lanza
      }
    } else {
      // sin enemigos (refuerzos por llegar): al centro
      gx = (MID_X + 0.5) * T; gy = (MID_Y + 0.5) * T;
    }
    // muros por medio (o sin línea de tiro): rodearlos por casillas
    if (tg && (segSolid(p.x, p.y, gx, gy) || (c.canShoot && segSolid(p.x, p.y, tg.x, tg.y)))) {
      b.pathT = (b.pathT || 0) - STEP;
      if (b.pathT <= 0 || !b.way) { b.way = pathStep(p, c.canShoot ? tg.x : gx, c.canShoot ? tg.y : gy); b.pathT = 0.25; }
      gx = b.way[0]; gy = b.way[1];
    } else b.way = null;
    // esquivar: evaluar 16 direcciones y quedarse con la más segura que siga acercando al objetivo
    let mx = gx - p.x, my = gy - p.y; const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; } else { mx = my = 0; }
    b.parryPlan = SK.parry !== false && c.priType === 'raiseShield' && !p.shieldBroken && !p.shieldOut;
    if (SK.dodge) {
      const here = threatAt(b, p, p.x, p.y, now);
      if (here > 0) {
        let bx = mx, by = my, bv = here + 1e-3;
        for (let i = 0; i < 16; i++) {
          const a = i * Math.PI / 8, ux = Math.cos(a), uy = Math.sin(a);
          const v = threatAt(b, p, p.x + ux * 55, p.y + uy * 55, now) + threatAt(b, p, p.x + ux * 100, p.y + uy * 100, now) * 0.5 - (ux * mx + uy * my) * 0.4;
          if (v < bv) { bv = v; bx = ux; by = uy; }
        }
        mx = bx; my = by;
        if (here >= 3 && p.moveCd <= 0 && !b.hold.d && (!c.moveCharges || p.mCh > 0)) pulse(b, 'd', 0.05); // amenaza inminente: movimiento
        b.dodging = 0.2;
      }
    }
    if (b.parryPlan && imminent(b, p, now)) { if (!p.shieldUp && !b.hold.q) { pulse(b, 'q', 0.04); b.lowerAt = now + 0.7; } } // Ceniza: alza el escudo justo antes del golpe (bloqueo perfecto)
    if (c.priType === 'raiseShield' && p.shieldUp && b.lowerAt && now > b.lowerAt && !b.hold.q) { pulse(b, 'q', 0.04); b.lowerAt = 0; } // vuelve a bajarlo para atacar
    out.x = mx; out.y = my;
    b.dodging = (b.dodging || 0) - STEP;
    // ataque
    if (tg) {
      const d = Math.hypot(tg.x - p.x, tg.y - p.y), gap = d - tg.r - p.r;
      if (!c.canShoot) {
        const inReach = gap < 40 && !(tg.type === 'bat' && !tg.airborne);
        b.launchT = (b.launchT || 0) - STEP;
        if (inReach) {
          b.phase += STEP;
          // patrón: golpes sueltos con ritmo de combo; cada pocos segundos un golpe cargado o alejarse golpeando (lanzar)
          if (b.aHoldT > 0) { out.a = true; b.aHoldT -= STEP; }
          else if (b.phase > 0.16) {
            b.phase = 0; b.comboN++;
            out.a = true;
            if (c.chargedMelee && b.comboN % 7 === 0) b.aHoldT = 0.75; // cargado
            if (b.comboN % 9 === 4 && !tg.airborne && tg.tier <= 3) b.launchT = 0.25;
          }
        }
      } else {
        // disparo según el arma (como el aliado IA, pero con la mira encima del objetivo)
        const ph = b.t;
        let fire;
        if (c.shotMode === 'launcher') fire = (p.sAmmo > 0 && (ph % 3) > 2.4) ? (ph % 3) < 2.95 : (ph % 0.4) < 0.07; // granadas sueltas; cada 3 s, carga pegajosa
        else if (c.shotMode === 'auto') { if (c.gatling) { if (p.heat > 0.85) b.cool = true; if (p.heat < 0.2) b.cool = false; fire = !b.cool && !(p.overheat > 0); } else fire = true; }
        else if (c.shotMode === 'frost') fire = true;
        else if (c.ammo) { // Marea: pulsaciones; tras un movimiento, Bravata
          fire = (ph % 0.18) < 0.05; if (gap > 450) fire = false;
          if (p.ammo >= 5 && (ph % 6) > 5.3) fire = true; // cada 6 s, cargado: vacía el tambor
        }
        else fire = (ph % 0.4) < 0.28;
        if (gap > 520) fire = false;
        if (p.shotHold) fire = false; // tras ejecutar, el misil o la pausa hay que soltar el botón antes de volver a disparar
        out.s = fire;
        if (!p.lockOn || p.target !== tg) { if (!b.lT || b.lT <= 0) { pulse(b, 'l', 0.04); b.lT = 0.5; } }
        b.lT = (b.lT || 0) - STEP;
        // a quemarropa: ejecutar aturdidos con el ataque
        if (tg.stunT > 0 && !tg.airborne && gap < 40) { out.a = (ph % 0.2) < 0.05; out.s = false; }
      }
      // habilidades
      b.abT -= STEP;
      if (SK.abilities && b.abT <= 0 && !p.cast && !b.hold.q && !b.hold.e) {
        const ok = s => abilityReady(p, s), t1 = c.priType, t2 = abilityType(p, 'sec');
        const near = gap < (c.canShoot ? 420 : 220);
        if (t1 && !SK.noPri && t1 !== 'raiseShield' && !(t1 === 'frostburst' && tg.frozenT > 0) && p.priCd <= 0 && near && ok('pri') && !(t1 === 'turret' && myTurret(p))) {
          pulse(b, 'q', t1 === 'shieldThrow' ? 1.05 : 0.12); b.abT = 0.4;
        } else if (t2 && !SK.noSec && t2 !== 'frostMode' && !(t2 === 'snowball' && !(tg.frozenT > 0.15 && gap < 330 && (gap >= 150 || p.moveCd > 0 || p.flip))) && t2 !== 'taunt' && p.secCd <= 0 && near && ok('sec') && !(t2 === 'turret' && myTurret(p))) {
          pulse(b, 'e', t2 === 'shieldThrow' ? 1.05 : t2 === 'ricochet' ? 0.5 : t2 === 'dragon' ? 0.1 : t2 === 'snowball' ? 0.35 : 0.12); b.abT = 0.4;
        }
      }
      // Escarcha: picado sobre el congelado (salto y, ya en el aire, otra pulsación) cuando la bola de nieve no está lista
      if (c.moveType === 'flip' && !SK.noDive) {
        if (b.diveStep === 1 && p.flip && (p.z || 0) >= 10 && !b.hold.d) { pulse(b, 'd', 0.04); b.diveStep = 0; }
        else if (!b.diveStep && tg.frozenT > 0.3 && gap < 190 && !p.flip && p.moveCd <= 0 && !b.hold.d && !b.hold.e) { pulse(b, 'd', 0.04); b.diveStep = 1; b.diveT = 0.6; }
        if (b.diveStep) { b.diveT -= STEP; if (b.diveT <= 0) b.diveStep = 0; }
      }
      // Marea y Ciruela: Bravata / misil tras moverse cuando no hay peligro (cada pocos segundos)
      if ((c.ammo || c.postMoveMissile) && p.moveCd <= 0 && b.dodging <= 0) {
        b.bravT = (b.bravT || 0) - STEP;
        if (b.bravT <= 0 && ((c.ammo && p.ammo <= 1) || (c.postMoveMissile && Math.random() < 0.004))) { pulse(b, 'd', 0.05); b.bravT = 2; b.postFire = 0.12; }
      }
      if (b.postFire > 0) { b.postFire -= STEP; if (b.postFire < 0.07) out.s = !b.lastS; }
      // brawlers: tras moverse, golpe en carrera de vez en cuando para cerrar distancia
      if (!c.canShoot && gap > 90 && gap < 200 && p.moveCd <= 0 && b.dodging <= 0 && c.moveType === 'jump' && Math.random() < 0.02) pulse(b, 'd', 0.05);
    }
    b.lastS = out.s;
    return out;
  };
})();
