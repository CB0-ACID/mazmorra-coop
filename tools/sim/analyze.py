#!/usr/bin/env python3
"""Agrega los JSON de run.js en un resumen (summary.json) con métricas por personaje, escenario y nivel."""
import json, glob, os, sys, statistics as st

D = sys.argv[1]
OUT = sys.argv[2]

# Origen del daño (pila de llamadas) → categoría legible
def cat(src):
    s = src
    if s == 'ejecución': return 'Ejecución'
    if s.startswith('meleeHit') or 'updateFlurry' in s: return 'Golpes'
    if 'releaseChargedMelee' in s or 'seismic' in s.lower() or 'starfall' in s or 'uppercut' in s.lower() or 'arcane' in s.lower(): return 'Golpe cargado'
    if 'updateEnemy' in s or 'fall' in s.lower(): return 'Caídas y choques'
    if s.startswith('shotHit<fireShot') or 'frostBeamTick' in s or 'updatePBullets' in s or 'coralBlast<updateShells' in s: return 'Disparo'
    return 'Habilidades y especiales'

NAMES = {}
def mean(a): return sum(a) / len(a) if a else None
def med(a): return st.median(a) if a else None

res = {}
for f in sorted(glob.glob(os.path.join(D, '*.json'))):
    try: d = json.load(open(f))
    except Exception: continue
    key = (d['name'], d['level'])
    R = {'name': d['name'], 'level': d['level']}
    # muñeco
    dm = d['dummy']
    raw = [sum(v['hp'] for k, v in x['M']['src'].items() if k != 'ejecución') / x['t'] for x in dm]
    R['dummy'] = {
        'dps': mean(raw), 'dpsMin': min(raw), 'dpsMax': max(raw),
        'execPerMin': mean([x['M']['execs'] / x['t'] * 60 for x in dm]),
        'launchPerMin': mean([x['M']['launches'] / x['t'] * 60 for x in dm]),
        'maxHit': max(x['M']['maxHit'] for x in dm),
    }
    # escenarios
    sc = {}
    srcAll = {}
    srcRaw = {}
    for sid, v in d['scen'].items():
        L = v['list']
        wins = [x for x in L if x['res'] == 'win']
        T = [x['t'] for x in wins]
        sc[sid] = {
            'label': v['label'], 'n': len(L), 'win': len(wins) / len(L),
            'dead': sum(1 for x in L if x['res'] == 'dead') / len(L),
            'timeout': sum(1 for x in L if x['res'] == 'timeout') / len(L),
            't': mean(T), 'tMed': med(T), 'tMin': min(T) if T else None, 'tMax': max(T) if T else None,
            'dps': mean([x['dealt'] / x['t'] for x in L]),
            'dpsEng': mean([x['dealt'] / max(1, x['engaged']) for x in L]),
            'taken': mean([x['M']['taken'] for x in L]),
            'takenPerMin': mean([x['M']['taken'] / x['t'] * 60 for x in L]),
            'hitsPerMin': mean([x['M']['hitsTaken'] / x['t'] * 60 for x in L]),
            'execs': mean([x['M']['execs'] for x in L]),
            'execPerMin': mean([x['M']['execs'] / x['t'] * 60 for x in L]),
            'launchPerMin': mean([x['M']['launches'] / x['t'] * 60 for x in L]),
            'killsPerMin': mean([x['M']['kills'] / x['t'] * 60 for x in L]),
            'firstHit': mean([x['firstHit'] for x in L if x['firstHit'] is not None]),
            'takenBy': {},
        }
        for x in L:
            for k, val in x['M']['takenBy'].items(): sc[sid]['takenBy'][k] = sc[sid]['takenBy'].get(k, 0) + val / len(L)
            for k, val in x['M']['src'].items():
                c = cat(k); srcAll[c] = srcAll.get(c, 0) + val['hp']; srcRaw[k] = srcRaw.get(k, 0) + val['hp']
            for k, val in x['M']['abil'].items():
                R.setdefault('abil', {}); R['abil'][k] = R['abil'].get(k, 0) + val
    tot = sum(srcAll.values()) or 1
    R['src'] = {k: v / tot for k, v in sorted(srcAll.items(), key=lambda a: -a[1])}
    R['srcRaw'] = {k: round(v) for k, v in sorted(srcRaw.items(), key=lambda a: -a[1])}
    R['scen'] = sc
    # partidas
    runs = d['runs']
    R['runs'] = {
        'n': len(runs),
        'cleared': sum(1 for r in runs if r['cleared']) / len(runs),
        'floorAvg': mean([r['floor'] - (0 if r['cleared'] else 1) + (r['rooms'] and 0) for r in runs]),
        'roomsAvg': mean([r['rooms'] for r in runs]),
        'timePerRoom': mean([r['t'] / max(1, r['rooms'] + (0 if r['cleared'] else 1)) for r in runs]),
        'timeClear': mean([r['t'] / 60 for r in runs if r['cleared']]),
        'takenPerRoom': mean([r['taken'] / max(1, r['rooms'] + (0 if r['cleared'] else 1)) for r in runs]),
        'deathsBy': {},
        'deathRoom': {},
        'timeouts': sum(1 for r in runs if r.get('timeout')),
        'floorsReached': [r['floor'] if not r['cleared'] else 5 for r in runs],
    }
    for r in runs:
        if not r['cleared']:
            R['runs']['deathsBy'][r['killer']] = R['runs']['deathsBy'].get(r['killer'], 0) + 1
    res[d['level'] + ':' + d['name']] = R

json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=1)
print('ok', len(res))
