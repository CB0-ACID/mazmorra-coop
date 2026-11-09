#!/usr/bin/env python3
"""Genera el informe HTML de equilibrio a partir de summary.json (analyze.py) y de los what-if."""
import json, sys, math, html

S = json.load(open(sys.argv[1]))
WI = [json.loads(l) for f in sys.argv[3:] for l in open(f) if l.strip().startswith('{')]
OUT = sys.argv[2]

CH = ['Ceniza', 'Musgo', 'Escarcha', 'Coral', 'Brasa', 'Ámbar', 'Marea', 'Ciruela']
COL = {'Ceniza': '#a9a2b4', 'Musgo': '#3cc9a0', 'Escarcha': '#bfeaf5', 'Coral': '#ef5da8', 'Brasa': '#ff5a36', 'Ámbar': '#f5c542', 'Marea': '#3f8ff5', 'Ciruela': '#c07af0'}
ROLE = {'Ceniza': 'Tanque · Bastión', 'Musgo': 'Tanque · Mago', 'Escarcha': 'Ágil · Escarcha', 'Coral': 'Ágil · Demoledora', 'Brasa': 'Brawler · Ejecutor', 'Ámbar': 'Brawler · Sombra', 'Marea': 'Tirador · Rebote', 'Ciruela': 'Tirador · Torreta'}
HP = {'Ceniza': 200, 'Musgo': 200, 'Escarcha': 80, 'Coral': 60, 'Brasa': 100, 'Ámbar': 100, 'Marea': 100, 'Ciruela': 100}
RATING = {'Ceniza': 2, 'Musgo': 3, 'Escarcha': 4, 'Coral': 4, 'Brasa': 5, 'Ámbar': 4, 'Marea': 5, 'Ciruela': 4}
SC = ['t1', 't2', 't3', 'mix', 'g1', 'g2', 'g3', 'g4']
SCL = {'t1': 'Enjambre T1', 't2': 'Tier 2', 't3': 'Tier 3', 'mix': 'Sala real', 'g1': 'Cañonero', 'g2': 'Ariete', 'g3': 'Coloso', 'g4': 'Dragón'}
SCS = {'t1': 'piso 1', 't2': 'piso 2', 't3': 'piso 2', 'mix': 'piso 2', 'g1': 'guardián p1', 'g2': 'guardián p2', 'g3': 'guardián p3', 'g4': 'guardián p4'}
E = lambda n: S['experto:' + n]
M = lambda n: S['medio:' + n]
fmt = lambda v, d=1: ('—' if v is None else (f'{v:.{d}f}'.replace('.', ',')))
pct = lambda v: f'{round(v * 100)} %'
esc = html.escape

# ---------- puntuaciones ----------
def rel_dps(n):
    vals = []
    for s in SC:
        avg = sum(E(c)['scen'][s]['dps'] for c in CH) / len(CH)
        vals.append(E(n)['scen'][s]['dps'] / avg)
    return math.exp(sum(math.log(v) for v in vals) / len(vals))
def surv(n):
    w = [ (E(n)['scen'][s]['win'] + M(n)['scen'][s]['win']) / 2 for s in SC]
    return sum(w) / len(w)
def runscore(n):
    f = E(n)['runs']['floorsReached'] + M(n)['runs']['floorsReached']
    return (sum(f) / len(f) - 1) / 4  # piso 1 = 0, completada = 1
rows = []
for n in CH:
    off = rel_dps(n); sv = surv(n); rn = runscore(n)
    rows.append({'n': n, 'off': off, 'sv': sv, 'rn': rn})
maxoff = max(r['off'] for r in rows)
for r in rows:
    r['score'] = 100 * (0.45 * r['off'] / maxoff + 0.35 * r['sv'] + 0.20 * r['rn'])
rows.sort(key=lambda r: -r['score'])
def tier(s):
    return 'S' if s >= 85 else 'A' if s >= 65 else 'B' if s >= 50 else 'C'

def bossT(n, lv='experto'):
    R = S[lv + ':' + n]['scen']
    t = [R[g]['t'] for g in ['g1', 'g2', 'g3', 'g4'] if R[g]['t']]
    return sum(t) / len(t) if len(t) == 4 else None

# ---------- piezas ----------
def ranking_table():
    out = []
    for i, r in enumerate(rows):
        n = r['n']; e = E(n)
        bt = bossT(n)
        out.append(f'''<tr>
<td class="num pos">{i + 1}</td>
<td><span class="who"><i style="--c:{COL[n]}"></i><b>{n}</b><small>{ROLE[n]}</small></span></td>
<td><span class="tier t{tier(r['score'])}">{tier(r['score'])}</span></td>
<td class="barcell"><span class="sbar"><span style="width:{r['score']:.0f}%"></span></span><span class="num">{r['score']:.0f}</span></td>
<td class="num">×{fmt(r['off'], 2)}</td>
<td class="num">{pct(r['sv'])}</td>
<td class="num">{fmt(sum(E(n)['runs']['floorsReached'] + M(n)['runs']['floorsReached']) / 30, 1)}</td>
<td class="num">{fmt(bt, 0) + ' s' if bt else 'no lo vence'}</td>
</tr>''')
    return '\n'.join(out)

def heat(metric='t'):
    # tiempo medio de victoria por encuentro (experto); color relativo a la mediana del escenario
    head = ''.join(f'<th><span>{SCL[s]}</span><small>{SCS[s]}</small></th>' for s in SC)
    body = []
    for n in CH:
        cells = []
        for s in SC:
            v = E(n)['scen'][s]
            others = sorted(E(c)['scen'][s]['t'] for c in CH if E(c)['scen'][s]['t'])
            medv = others[len(others) // 2]
            if not v['t'] or v['win'] < 0.5:
                cells.append(f'<td class="hc lose" title="Victorias {pct(v["win"])}">✕<small>{pct(v["win"])}</small></td>')
                continue
            r = v['t'] / medv
            lvl = 'h1' if r <= 0.5 else 'h2' if r <= 0.85 else 'h3' if r <= 1.2 else 'h4' if r <= 2 else 'h5'
            win = '' if v['win'] >= 0.99 else f'<small>{pct(v["win"])}</small>'
            cells.append(f'<td class="hc {lvl}">{fmt(v["t"], 0)}{win}</td>')
        body.append(f'<tr><th class="rowh"><i style="--c:{COL[n]}"></i>{n}</th>{"".join(cells)}</tr>')
    return f'<table class="heat"><thead><tr><th></th>{head}</tr></thead><tbody>{"".join(body)}</tbody></table>'

def bars(values, unit='', maxv=None, dec=1, note=None):
    maxv = maxv or max(v for _, v in values) * 1.05
    out = []
    for n, v in values:
        w = 100 * v / maxv
        out.append(f'<div class="brow"><span class="bl"><i style="--c:{COL[n]}"></i>{n}</span><span class="bt"><span class="bf" style="width:{w:.1f}%;--c:{COL[n]}"></span></span><span class="bv num">{fmt(v, dec)}{unit}</span></div>')
    return '<div class="bars">' + ''.join(out) + '</div>'

SRC_ORDER = ['Golpes', 'Golpe cargado', 'Disparo', 'Habilidades y especiales', 'Ejecución', 'Caídas y choques']
SRC_VAR = {'Golpes': 'var(--s1)', 'Golpe cargado': 'var(--s2)', 'Disparo': 'var(--s3)', 'Habilidades y especiales': 'var(--s4)', 'Ejecución': 'var(--s5)', 'Caídas y choques': 'var(--s6)'}
def stacks():
    out = []
    for n in CH:
        src = E(n)['src']
        segs = ''.join(f'<span style="width:{src.get(k, 0) * 100:.1f}%;background:{SRC_VAR[k]}" title="{k}: {pct(src.get(k, 0))}"></span>' for k in SRC_ORDER if src.get(k, 0) > 0.004)
        ex = src.get('Ejecución', 0)
        out.append(f'<div class="brow"><span class="bl"><i style="--c:{COL[n]}"></i>{n}</span><span class="stack">{segs}</span><span class="bv num">{pct(ex)}</span></div>')
    leg = ''.join(f'<span><i style="background:{SRC_VAR[k]}"></i>{k}</span>' for k in SRC_ORDER)
    return '<div class="legend">' + leg + '</div><div class="bars">' + ''.join(out) + '</div>'

def survival_table():
    out = []
    for n in CH:
        e, m = E(n), M(n)
        tpm_room = sum(e['scen'][s]['takenPerMin'] for s in ['t1', 't2', 't3', 'mix']) / 4
        tpm_boss = sum(e['scen'][s]['takenPerMin'] for s in ['g1', 'g2', 'g3', 'g4']) / 4
        we = sum(e['scen'][s]['win'] for s in SC) / 8; wm = sum(m['scen'][s]['win'] for s in SC) / 8
        gap = we - wm
        out.append(f'''<tr><th class="rowh"><i style="--c:{COL[n]}"></i>{n}</th>
<td class="num">{HP[n]}</td><td class="num">{fmt(tpm_room, 0)}</td><td class="num">{fmt(tpm_boss, 0)}</td>
<td class="num">{pct(we)}</td><td class="num">{pct(wm)}</td><td class="num {'warn' if gap > 0.15 else ''}">{'−' + pct(gap) if gap > 0.004 else '='}</td>
<td class="num">{pct(e['runs']['cleared'])}</td><td class="num">{pct(m['runs']['cleared'])}</td></tr>''')
    return '\n'.join(out)

def floors_chart():
    # distribución del piso alcanzado en la partida completa (experto + medio, 30 partidas)
    out = []
    for n in CH:
        f = E(n)['runs']['floorsReached'] + M(n)['runs']['floorsReached']
        cnt = [f.count(k) for k in [1, 2, 3, 4, 5]]
        segs = ''.join(f'<span class="f{k}" style="width:{c / len(f) * 100:.1f}%" title="{["Cae en piso 1", "Cae en piso 2", "Cae en piso 3", "Cae en piso 4", "Completa los 4 pisos"][k - 1]}: {c}"></span>' for k, c in zip([1, 2, 3, 4, 5], cnt) if c)
        out.append(f'<div class="brow"><span class="bl"><i style="--c:{COL[n]}"></i>{n}</span><span class="stack">{segs}</span><span class="bv num">{pct(cnt[4] / len(f))}</span></div>')
    leg = ''.join(f'<span><i class="f{k}"></i>{t}</span>' for k, t in zip([1, 2, 3, 4, 5], ['Cae en piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Completa']))
    return '<div class="legend">' + leg + '</div><div class="bars">' + ''.join(out) + '</div>'

def detail_cards():
    out = []
    for n in CH:
        e = E(n); d = e['dummy']; ab = e.get('abil', {})
        top = sorted(e['srcRaw'].items(), key=lambda a: -a[1])[:3]
        names = {'meleeHit<updatePlayer': 'golpes', 'ejecución': 'ejecuciones', 'shieldThrowHit<updateShieldThrows': 'Lanzar escudo', 'releaseChargedMelee<updatePlayer': 'golpe cargado', 'updateEnemy<update': 'caídas', 'updateArcOrbs<update': 'orbe arcano', 'vineHit<updateVines': 'Liana', 'shotHit<frostBeamTick': 'rayo de escarcha', 'diveImpact<updateDive': 'picado', 'castFrostburst<useAbility': 'Estallido helado', 'coralBlast<updateCBombs': 'granadas', 'coralBlast<updateShells': 'mortero', 'updateCBombs<update': 'granadas (impacto)', 'coralBlast<castDetonator': 'Detonador', 'coralBlast<dollBoom': 'muñeco bomba', 'fireHit<dragonBallBoom': 'Poder del dragón', 'reaperStrike<updateSpecial': 'Puño ejecutor', 'endDrill<updateDrill': 'Garra taladro', 'updateDrill<updateSpecial': 'Garra taladro', 'updateFuryDrop<updateSpecial': 'Izuna de furia', 'updateSpecial<updatePlayer': 'embestida', 'shotHit<fireShot': 'disparo', 'shotHit<updateChains': 'disparo rebotante', 'updateGrenades<update': 'granada', 'shotHit<explodeMissile': 'misiles', 'shotHit<updateTurrets': 'torreta'}
        tot = sum(e['srcRaw'].values()) or 1
        tops = ', '.join(f'{names.get(k, k)} {round(v / tot * 100)} %' for k, v in top)
        out.append(f'''<article class="card" style="--c:{COL[n]}">
<header><i></i><h3>{n}</h3><span>{ROLE[n]} · {HP[n]} PV</span></header>
<dl>
<div><dt>DPS al muñeco</dt><dd class="num">{fmt(d['dps'], 1)}</dd></div>
<div><dt>Ejecuciones / min</dt><dd class="num">{fmt(d['execPerMin'], 1)}</dd></div>
<div><dt>DPS en sala real</dt><dd class="num">{fmt(e['scen']['mix']['dps'], 1)}</dd></div>
<div><dt>DPS a guardianes</dt><dd class="num">{fmt(sum(e['scen'][g]['dps'] for g in ['g1','g2','g3','g4']) / 4, 1)}</dd></div>
<div><dt>Tiempo por sala (partida)</dt><dd class="num">{fmt(e['runs']['timePerRoom'], 0)} s</dd></div>
<div><dt>Nota de diseño (daño)</dt><dd class="num">{RATING[n]} / 5</dd></div>
</dl>
<p>Su daño sale de: {esc(tops)}.</p>
</article>''')
    return '\n'.join(out)

def whatif_table():
    lab = {'exec12': 'Ejecución al guardián: −25 % → −12 %', 'tank': 'Tanques reciben −30 % de daño', 'frost': 'Escarcha: 80 PV y disparo ×1,6', 'ciruela': 'Ciruela: gatling ~25 % más rápida', 'bossShot': 'Disparos quitan ×2 de estamina al guardián', 'bossHp2': 'Disparos quitan ×2 de vida al guardián', 'frostHp2': 'Escarcha buff + disparos ×2 de vida al guardián', 'frostBoss': 'Escarcha buff + ×2 estamina al guardián'}
    out = []
    for w in WI:
        n = w['name']; o = w['out']; b = E(n)['scen']
        def cell(g):
            t0, w0 = b[g]['t'], b[g]['win']; t1, w1 = o[g]['t'], o[g]['win']
            a = f'{fmt(t0, 0)} s' if t0 and w0 >= 0.5 else f'✕ {pct(w0)}'
            c = f'{fmt(t1, 0)} s' if t1 and w1 >= 0.5 else f'✕ {pct(w1)}'
            return f'<td class="num">{a} → <b>{c}</b>{"" if w1 >= 0.99 or not (t1 and w1 >= 0.5) else f"<small> {pct(w1)}</small>"}</td>'
        out.append(f'<tr><th class="rowh"><i style="--c:{COL[n]}"></i>{n}</th><td>{lab.get(w["patch"], w["patch"])}</td>{cell("mix")}{cell("g1")}{cell("g4")}</tr>')
    return '\n'.join(out)

BANDS = {'sala': {'experto': (0.95, 1.0), 'medio': (0.85, 0.95)}, 'g': {'experto': (0.75, 0.90), 'medio': (0.50, 0.70)}, 'run': {'experto': (0.30, 0.60), 'medio': (0.05, 0.25)}}
def band_cell(v, lo, hi):
    if v > hi + 1e-9: cls, tag = 'hi', '▲'
    elif v < lo - 1e-9: cls, tag = 'lo', '▼'
    else: cls, tag = 'ok', '●'
    return f'<td class="num bc {cls}"><span>{tag}</span> {round(v * 100)} %</td>'
def bands_table():
    out = []
    for n in CH:
        cells = []
        for lv in ['experto', 'medio']:
            e = S[lv + ':' + n]
            sala = sum(e['scen'][s]['win'] for s in ['t1', 't2', 't3', 'mix']) / 4
            g = sum(e['scen'][s]['win'] for s in ['g1', 'g2', 'g3', 'g4']) / 4
            run = e['runs']['cleared']
            cells += [band_cell(sala, *BANDS['sala'][lv]), band_cell(g, *BANDS['g'][lv]), band_cell(run, *BANDS['run'][lv])]
        ge = E(n)['runs']['cleared'] - M(n)['runs']['cleared']
        gap = sum(E(n)['scen'][s]['win'] - M(n)['scen'][s]['win'] for s in SC) / 8
        skill = ge * 0.6 + gap * 0.4
        sk = '<td class="bc na">— caen con los dos</td>' if E(n)['runs']['cleared'] == 0 and M(n)['runs']['cleared'] == 0 else '<td class="bc lo"><span>▼</span> no premia</td>' if abs(ge) < 0.1 and abs(gap) < 0.05 else ('<td class="bc hi"><span>▲</span> castiga mucho</td>' if ge > 0.5 else '<td class="bc ok"><span>●</span> sí</td>')
        out.append(f'<tr><th class="rowh"><i style="--c:{COL[n]}"></i>{n}</th>{"".join(cells[:3])}<td class="sep"></td>{"".join(cells[3:])}<td class="sep"></td>{sk}</tr>')
    return '\n'.join(out)


# ---------- Ablación y cooperativo (informe integrado) ----------
import os, glob as _glob
ABL_DIR = os.environ.get('ABL_DIR'); COOP_DIR = os.environ.get('COOP_DIR')
AB_NAMES = {'Ceniza': ('Escudo en alto', 'Lanzar escudo'), 'Musgo': ('Liana giratoria', 'Enredaderas'), 'Escarcha': ('Estallido helado', 'Burbuja de hielo'), 'Coral': ('Detonador', 'Lluvia de mortero'), 'Brasa': ('Puño ejecutor', 'Poder del dragón'), 'Ámbar': ('Garra taladro', 'Izuna de furia'), 'Marea': ('Granada', 'Disparo rebotante'), 'Ciruela': ('Torreta', 'Sobrecarga')}
def _ablm(o):
    gw = sum(o[g]['win'] for g in ['g1', 'g2', 'g3', 'g4']) / 4
    gt = [o[g]['t'] for g in ['g1', 'g2', 'g3', 'g4'] if o[g]['t']]
    return gw, (sum(gt) / len(gt) if gt else None), o['mix']['t'], o['mix']['taken']
def abl_table():
    if not ABL_DIR: return ''
    rows = []
    for i, n in enumerate(CH):
        try: b = _ablm(json.load(open(f'{ABL_DIR}/{i}-none.json'))['out'])
        except Exception: continue
        cells = []
        for pt in ['noPri', 'noSec', 'noAbil']:
            if pt == 'noPri' and n == 'Ceniza': cells.append('<td class="abl na">el bot casi no lo usa</td>'); continue
            try: m = _ablm(json.load(open(f'{ABL_DIR}/{i}-{pt}.json'))['out'])
            except Exception: cells.append('<td class="abl na">—</td>'); continue
            dt = (m[1] / b[1] - 1) * 100 if (m[1] and b[1]) else 0
            dw = (m[0] - b[0]) * 100
            dtk = (m[3] / max(1, b[3]) - 1) * 100
            imp = 'big' if (dt >= 25 or dw <= -20 or dtk >= 80) else 'mid' if (dt >= 10 or dw <= -10 or dtk >= 40) else 'none'
            cells.append(f'<td class="abl {imp}"><b>{"+" if dt >= 0 else "−"}{abs(dt):.0f} %</b> tiempo<br><small>{"+" if dw >= 0 else "−"}{abs(dw):.0f} pts victorias · {"+" if dtk >= 0 else "−"}{abs(dtk):.0f} % daño recibido</small></td>')
        rows.append(f'<tr><th class="rowh"><i style="--c:{COL[n]}"></i>{n}</th><td><small>1: {AB_NAMES[n][0]}<br>2: {AB_NAMES[n][1]}</small></td>{"".join(cells)}</tr>')
    return '\n'.join(rows)
def coop_data():
    if not COOP_DIR: return []
    out = []
    for f in sorted(_glob.glob(f'{COOP_DIR}/*.json')):
        try: d = json.load(open(f))
        except Exception: continue
        sc = d['scen']; R = {'id': d['id'], 'comp': d['comp'], 'n': d['n'], 'level': d['level']}
        gw = [sum(1 for x in sc[g] if x['res'] == 'win') / len(sc[g]) for g in ['g1', 'g2', 'g3', 'g4']]
        gt = [sum(x['t'] for x in sc[g] if x['res'] == 'win') / max(1, sum(1 for x in sc[g] if x['res'] == 'win')) for g in ['g1', 'g2', 'g3', 'g4']]
        R['gw'] = gw; R['gt'] = gt
        R['mixT'] = sum(x['t'] for x in sc['mix']) / len(sc['mix']); R['mixW'] = sum(1 for x in sc['mix'] if x['res'] == 'win') / len(sc['mix'])
        runs = d['runs']; R['clear'] = sum(1 for r in runs if r['cleared']) / len(runs)
        R['floor'] = sum((5 if r['cleared'] else r['floor']) for r in runs) / len(runs)
        R['runMin'] = sum(r['t'] for r in runs if r['cleared']) / max(1, sum(1 for r in runs if r['cleared'])) / 60
        # reparto por jugador en guardianes: estamina, daño, ejecuciones, daño recibido
        per = []
        for i, nm in enumerate(d['comp']):
            hp = sta = ex = tk = dn = 0
            for g in ['g1', 'g2', 'g3', 'g4']:
                for x in sc[g]:
                    o = x['P'].get(str(i));
                    if o: hp += o['hp']; sta += o['sta']; ex += o['ex']; tk += o['taken']; dn += o['downs']
            per.append({'n': nm, 'hp': hp, 'sta': sta, 'ex': ex, 'tk': tk, 'dn': dn})
        th = sum(p['hp'] for p in per) or 1; ts = sum(p['sta'] for p in per) or 1; te = sum(p['ex'] for p in per) or 1; tt = sum(p['tk'] for p in per) or 1
        for p in per: p['hpS'] = p['hp'] / th; p['staS'] = p['sta'] / ts; p['exS'] = p['ex'] / te; p['tkS'] = p['tk'] / tt
        R['per'] = per
        rp = {}
        for r in runs:
            for k, o in r['P'].items():
                if k == '-1': continue
                q = rp.setdefault(int(k), {'tk': 0, 'dn': 0, 'rv': 0}); q['tk'] += o['taken'] / len(runs); q['dn'] += o['downs'] / len(runs); q['rv'] += o['revives'] / len(runs)
        R['runPer'] = rp
        out.append(R)
    return out
COOP = coop_data()
def _who(names): return ' + '.join(f'<span class="who"><i style="--c:{COL[n]}"></i>{n}</span>' for n in names)
def coop_table():
    rows = []
    for R in sorted(COOP, key=lambda r: (r['level'] != 'experto', r['n'], r['id'])):
        cells = ''.join(f'<td class="num">{round(w*100)} %<small> · {fmt(t, 0)} s</small></td>' for w, t in zip(R['gw'], R['gt']))
        rows.append(f'<tr><td class="num">{R["n"]}</td><td>{_who(R["comp"])}</td><td>{"experto" if R["level"] == "experto" else "medio"}</td>{cells}<td class="num">{fmt(R["mixT"], 0)} s</td><td class="num">{pct(R["clear"])}</td><td class="num">{fmt(R["floor"], 1)}</td></tr>')
    return '\n'.join(rows)
def coop_roles():
    rows = []
    for R in [r for r in COOP if r['level'] == 'experto']:
        for p in R['per']:
            rows.append(f'<tr><td><small>{" + ".join(R["comp"])}</small></td><th class="rowh"><i style="--c:{COL[p["n"]]}"></i>{p["n"]}</th><td class="num">{pct(p["staS"])}</td><td class="num">{pct(p["hpS"])}</td><td class="num">{pct(p["exS"])}</td><td class="num">{pct(p["tkS"])}</td></tr>')
    return '\n'.join(rows)

# cifras sueltas para el texto
def T(n, g): return E(n)['scen'][g]['t']
spread = {g: (max(T(n, g) for n in CH if T(n, g) and E(n)['scen'][g]['win'] >= 0.5) / min(T(n, g) for n in CH if T(n, g))) for g in ['g1', 'g2', 'g3', 'g4']}
nsim = sum(len(S[k]['scen'][s].get('n', 0) and [1] * S[k]['scen'][s]['n']) for k in S for s in SC) + sum(S[k]['runs']['n'] for k in S)
dummy_rank = sorted(((n, E(n)['dummy']['dps']) for n in CH), key=lambda a: -a[1])
exec_share = {n: E(n)['src'].get('Ejecución', 0) for n in CH}

tpl = open(__file__.replace('report.py', 'report.tpl.html'), encoding='utf-8').read()
rep = {
    '{{RANK}}': ranking_table(), '{{HEAT}}': heat(), '{{DUMMY}}': bars(dummy_rank, ' DPS'),
    '{{MIXDPS}}': bars(sorted(((n, E(n)['scen']['mix']['dps']) for n in CH), key=lambda a: -a[1]), ' DPS'),
    '{{BOSSDPS}}': bars(sorted(((n, sum(E(n)['scen'][g]['dps'] for g in ['g1','g2','g3','g4']) / 4) for n in CH), key=lambda a: -a[1]), ' DPS'),
    '{{STACK}}': stacks(), '{{SURV}}': survival_table(), '{{FLOORS}}': floors_chart(), '{{CARDS}}': detail_cards(), '{{WHATIF}}': whatif_table(), '{{BANDS}}': bands_table(), '{{ABL}}': abl_table(), '{{COOP}}': coop_table(), '{{COOPROLES}}': coop_roles(),
    '{{NSIM}}': f'{nsim:,}'.replace(',', '.'), '{{SPREAD1}}': fmt(spread['g1'], 0), '{{SPREAD4}}': fmt(spread['g4'], 0),
}
for k, v in rep.items(): tpl = tpl.replace(k, v)
open(OUT, 'w', encoding='utf-8').write(tpl)
print('ok', OUT, {r['n']: round(r['score']) for r in rows}, spread, nsim)
