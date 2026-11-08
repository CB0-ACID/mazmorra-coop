// Carga el código real de mazmorra-coop.html en Node, sin navegador: lienzo, audio y DOM son stubs sin efecto.
// Expone __SIM.ev(código) para leer y escribir el estado interno del juego (eval directo dentro del cierre del script).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function stub(name) {
  const fn = function () { return P; };
  const P = new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;
      if (k in t && typeof t[k] !== 'function') return t[k];
      if (k === 'width' || k === 'height' || k === 'clientWidth' || k === 'clientHeight' || k === 'innerWidth' || k === 'innerHeight') return 1280;
      if (k === 'length') return 0;
      if (k === 'measureText') return () => ({ width: 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 });
      if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 });
      if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
      if (k === 'style') return {};
      return P;
    },
    set() { return true; },
    apply() { return P; },
    construct() { return P; }
  });
  return P;
}

function loadGame(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  let src = m[1];
  // gancho de simulación justo antes del cierre del IIFE principal
  const close = src.lastIndexOf('})();');
  src = src.slice(0, close) + '\nglobalThis.__SIM = { ev: (code) => eval(code) };\n' + src.slice(close);
  const S = stub('dom');
  const store = {};
  const ctx = {
    console: { log() {}, warn() {}, error: console.error, info() {} },
    Math, Date, JSON, Map, Set, WeakMap, Array, Object, Number, String, Boolean, Symbol, Promise, Error, RegExp, Infinity, NaN,
    parseInt, parseFloat, isNaN, isFinite, Float32Array, Uint8Array, Int32Array, Uint32Array, Float64Array, ArrayBuffer, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    localStorage: { getItem: k => (k in store ? store[k] : (k === 'mz-tutorial' ? '0' : null)), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: S, navigator: { maxTouchPoints: 0, getGamepads: () => [], userAgent: 'node' }, location: { search: '', href: '' },
    addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
    devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720, visualViewport: null, screen: { orientation: null },
    Image: function () { return S; }, Path2D: function () { return S; }, AudioContext: undefined, webkitAudioContext: undefined
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'mazmorra-coop.js' });
  return ctx.__SIM;
}
module.exports = { loadGame, gamePath: path.join(__dirname, '..', '..', 'mazmorra-coop.html') };

if (require.main === module) {
  const sim = loadGame(module.exports.gamePath);
  console.log('ok', sim.ev('CHARS.map(c => c.name).join(", ")'), sim.ev('state'));
}
