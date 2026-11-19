import { W, H, GROUND, STAGE_L, STAGE_R, SKILLS, DOMAINS, ARENAS, CHARACTERS, SKINS, FONT } from './constants.js';
import { loadControls, keyHints } from './keys.js';
import { sfx as rawSfx } from './audio.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ACTS = {
  punch: { kind: 'melee', pose: 'punch', dur: 0.34, win: [0.08, 0.21], dmg: 6, kb: 280, stun: 0.26, reach: 68, y: [-120, -45], lunge: 140 },
  kick: { kind: 'melee', pose: 'kick', dur: 0.46, win: [0.14, 0.30], dmg: 9, kb: 540, stun: 0.42, reach: 84, y: [-95, 0], lunge: 180, ragdoll: 0.72 },
  domain: { kind: 'domain', pose: 'clap', dur: 9 },
};
const spec = (n) => ACTS[n] || SKILLS[n];
const OPEN = 1.35, CLASH_T = 4;
const DOM_DUR = 4.1, BEAT_T0 = 1.15, BEAT_GAP = 0.38, BEAT_N = 7, PERFECT = 0.075, GOOD = 0.17;
const CUT_DUR = 1.85;
const NAMES = ['head', 'neck', 'hip', 'kF', 'kB', 'fF', 'fB', 'eF', 'eB', 'hF', 'hB'];
const BONES = [['neck', 'head', 17], ['neck', 'hip', 40], ['hip', 'kF', 32], ['kF', 'fF', 32], ['hip', 'kB', 32], ['kB', 'fB', 32],
  ['neck', 'eF', 30], ['eF', 'hF', 30], ['neck', 'eB', 30], ['eB', 'hB', 30]];
const RATE = { hip: [34, 12], neck: [34, 10], head: [30, 8] };
const lim = (p, a, r) => { const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy); if (d > r) { p.x = a.x + (dx / d) * r; p.y = a.y + (dy / d) * r; } };
const bend = (a, b, L, bx, by) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
  const h = Math.sqrt(Math.max(0, L * L - (d * d) / 4)); let nx = -dy / d, ny = dx / d;
  if (nx * bx + ny * by < 0) { nx = -nx; ny = -ny; }
  return { x: mx + nx * h, y: my + ny * h };
};

export class Game {
  constructor(canvas, cfg, cb) {
    this.cv = canvas; this.c = canvas.getContext('2d'); this.cfg = cfg; this.cb = cb;
    canvas.width = W; canvas.height = H;
    this.arena = ARENAS[cfg.arena] || ARENAS[0];
    this.keys = new Set(); this.prev = [{}, {}];
    this.controls = loadControls(); this.hints = keyHints(this.controls);
    this.net = cb.net || null;
    this.netRole = this.net?.role || null;
    if (this.netRole === 'guest') this.hints[1] = this.hints[0];
    this.netEvents = []; this.remoteHeld = {}; this.remotePulse = {}; this.lastSync = 0; this.lastSentHeld = ''; this._lastShake = 0;
    this.sfx = this.netRole === 'host'
      ? Object.fromEntries(Object.keys(rawSfx).map((k) => [k, () => { rawSfx[k](); this.netEvents.push(['sfx', k]); }]))
      : rawSfx;
    this.allKeys = new Set(this.controls.flatMap((c) => Object.values(c).flat()));
    this.fighters = [0, 1].map((i) => {
      const chId = cfg.chars?.[i], ch = CHARACTERS[chId] || null;
      const skinList = (chId && SKINS[chId]) || [];
      const skin = skinList.find((s) => s.id === (cfg.skins?.[i] || 'default')) || skinList[0] || null;
      return { i, color: cfg.colors[i], skills: cfg.loadouts[i], dom: cfg.domains[i], wins: 0, rig: null, rag: 0, lastAfter: 0,
        ch, pas: ch ? ch.pas : {}, name: ch ? ch.name : `PLAYER ${i + 1}`, jp: ch ? ch.jp : '', skin, gear: skin?.gear || null };
    });
    this.round = 1; this.paused = false; this.shake = 0; this.freeze = 0; this.time = 0;
    this.banner = 0; this.reported = false; this.matchWinner = null; this.dom = null; this.cutscene = null;
    this.deco = {
      b: Array.from({ length: 16 }, (_, i) => ({ x: i * 85 - 20, w: 60 + rnd(0, 20), h: 150 + rnd(0, 230) })),
      e: Array.from({ length: 50 }, () => ({ x: rnd(0, W), y: rnd(0, H), s: rnd(1.5, 4), v: rnd(20, 70) })),
      cl: Array.from({ length: 7 }, () => ({ x: rnd(0, W), y: rnd(60, 330), s: rnd(50, 120), v: rnd(6, 20) })),
      st: Array.from({ length: 90 }, () => ({ x: rnd(0, W), y: rnd(0, 480), s: rnd(1, 3) })),
      s: Array.from({ length: 90 }, () => ({ x: rnd(0, W), y: rnd(0, H), l: rnd(30, 140), v: rnd(30, 120) })),
      g: Array.from({ length: 14 }, (_, i) => ({ x: 40 + i * 92 + rnd(-20, 20), h: rnd(40, 75), k: i % 3 })),
    };
    this.resetRound();
    this.onKeyDown = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) this.setPaused(!this.paused); e.preventDefault(); return; }
      if (this.allKeys.has(e.code)) { e.preventDefault(); this.keys.add(e.code); if (this.netRole === 'guest') this.sendGuestInput(); }
    };
    this.onKeyUp = (e) => {
      if (this.allKeys.has(e.code)) { e.preventDefault(); this.keys.delete(e.code); if (this.netRole === 'guest') this.sendGuestInput(); }
    };
    this.clearKeys = () => { this.keys.clear(); if (this.netRole === 'guest') this.sendGuestInput(); };
    this.onVis = () => { if (document.hidden) { this.keys.clear(); if (!this.net) this.setPaused(true); else if (this.netRole === 'guest') this.sendGuestInput(); } };
    this.unsubNet = this.net ? this.net.onMessage((msg) => {
      if (this.netRole === 'host' && msg.type === 'input') {
        this.remoteHeld = msg.held || {};
        if (msg.pulse) for (const k in msg.pulse) if (msg.pulse[k]) this.remotePulse[k] = true;
      } else if (this.netRole === 'guest' && msg.type === 'state') {
        this.applySnapshot(msg);
      } else if (msg.type === 'pause') {
        if (!this.over) { this.paused = !!msg.v; this.keys.clear(); this.cb.onPause?.(this.paused); }
      } else if (msg.type === 'peer-left' || msg.type === 'closed') {
        this.cb.onPeerLeft?.(msg.reason || 'คู่ต่อสู้หลุดการเชื่อมต่อ');
      }
    }) : null;
  }
  setKey(code, v) { v ? this.keys.add(code) : this.keys.delete(code); if (this.netRole === 'guest') this.sendGuestInput(); }
  setPaused(v) { if (this.over) return; this.paused = v; this.keys.clear(); this.cb.onPause?.(v); if (this.net) this.net.send({ type: 'pause', v }); }
  start() {
    addEventListener('keydown', this.onKeyDown); addEventListener('keyup', this.onKeyUp);
    addEventListener('blur', this.clearKeys); document.addEventListener('visibilitychange', this.onVis);
    this.last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.033, (now - this.last) / 1000); this.last = now;
      this.update(dt); this.render();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    this.unsubNet?.();
    removeEventListener('keydown', this.onKeyDown); removeEventListener('keyup', this.onKeyUp);
    removeEventListener('blur', this.clearKeys); document.removeEventListener('visibilitychange', this.onVis);
  }
  resetRound() {
    this.fighters.forEach((f) => {
      Object.assign(f, {
        x: f.i ? 900 : 380, y: GROUND, vx: 0, vy: 0, face: f.i ? -1 : 1, hp: 100, hpShow: 100, act: null, stun: 0, inv: 0, blocking: false,
        parryT: 0, parryCd: 0, dropT: 0, dropCool: 0, climbing: false, floorY: GROUND, ragdollT: 0, ledge: null, ledgeCd: 0,
        cd: [0, 0, 0], amp: 0, ampMul: 1, ampSpd: 1, ce: f.ce > 0 && this.round > 1 ? Math.min(60, f.ce) : 0, combo: 0, comboT: 0, flash: 0, anim: 0, grounded: true, ghost: false, ko: false, rag: 0, aura: 0, auraC: '#fff',
      });
      const T = this.targets(f, this.pose(f)); f.rig = {};
      NAMES.forEach((n) => (f.rig[n] = { x: T[n].x, y: T[n].y, ox: T[n].x, oy: T[n].y }));
    });
    this.phase = 'countdown'; this.phaseT = 3; this.cnt = 4; this.timer = 99; this.msg = ''; this.dom = null; this.cutscene = null;
    this.parts = []; this.proj = []; this.rings = []; this.beams = []; this.slashes = []; this.arcs = []; this.orbs = []; this.zaps = [];
    this.pillars = []; this.texts = []; this.afters = []; this.warns = []; this.sched = []; this.flash = null;
  }
  later(t, fn) { this.sched.push({ t, fn }); }
  surfaceBelow(x, y) {
    let best = x > STAGE_L && x < STAGE_R && y <= GROUND + 6 ? GROUND : null;
    for (const p of this.arena.platforms || []) {
      if (x >= p.x1 && x <= p.x2 && y <= p.y + 6 && (best === null || p.y < best)) best = p.y;
    }
    return best;
  }
  domAbility(f) {
    const d = this.dom;
    if (!d || d.st !== 'linger') return null;
    return { ability: DOMAINS[d.id].ability, isOwner: d.owner === f.i, dom: d };
  }
  /* ---------------- ONLINE SYNC ---------------- */
  sendGuestInput() {
    const c = this.controls[0], held = {}, pulse = {};
    let hasPulse = false;
    for (const k in c) {
      const d = c[k].some((x) => this.keys.has(x));
      held[k] = d;
      if (d && !this.prev[0][k]) { pulse[k] = true; hasPulse = true; }
      this.prev[0][k] = d;
    }
    const sig = JSON.stringify(held);
    if (sig !== this.lastSentHeld || hasPulse) {
      this.lastSentHeld = sig;
      this.net.send({ type: 'input', held, pulse });
    }
  }
  sendSnapshot() {
    const collect = (arr, name) => {
      for (const item of arr) {
        if (!item._s) {
          item._s = true;
          const copy = { ...item }; delete copy._s;
          this.netEvents.push(['fx', name, copy]);
        }
      }
    };
    collect(this.slashes, 'slashes'); collect(this.arcs, 'arcs'); collect(this.zaps, 'zaps');
    collect(this.pillars, 'pillars'); collect(this.texts, 'texts'); collect(this.rings, 'rings');
    if (this.flash && !this.flash._s) { this.flash._s = true; this.netEvents.push(['flash', { t: this.flash.t, max: this.flash.max, c: this.flash.c }]); }
    if (this.shake > 2 && this.shake > this._lastShake + 1.5) this.netEvents.push(['shake', this.shake]);
    this._lastShake = this.shake;
    this.net.send({
      type: 'state',
      round: this.round, phase: this.phase, phaseT: this.phaseT, cnt: this.cnt, timer: this.timer,
      banner: this.banner, label: this.label, msg: this.msg, matchWinner: this.matchWinner,
      fighters: this.fighters.map((f) => ({
        x: Math.round(f.x * 10) / 10, y: Math.round(f.y * 10) / 10, vx: Math.round(f.vx), vy: Math.round(f.vy),
        face: f.face, hp: Math.round(f.hp * 10) / 10, ce: Math.round(f.ce * 10) / 10,
        cd: f.cd.map((v) => Math.round(v * 10) / 10), amp: Math.round(f.amp * 10) / 10, ampMul: f.ampMul, ampSpd: f.ampSpd,
        aura: Math.round(f.aura * 10) / 10, auraC: f.auraC, combo: f.combo, comboT: f.comboT,
        stun: Math.round(f.stun * 100) / 100, inv: Math.round(f.inv * 100) / 100, flash: Math.round(f.flash * 100) / 100,
        blocking: f.blocking, parryT: Math.round(f.parryT * 100) / 100, climbing: f.climbing,
        ragdollT: Math.round(f.ragdollT * 100) / 100, ko: f.ko, grounded: f.grounded, ghost: f.ghost,
        wins: f.wins, anim: f.anim, act: f.act, ledge: f.ledge,
      })),
      proj: this.proj, orbs: this.orbs, beams: this.beams, warns: this.warns,
      dom: this.dom ? { ...this.dom, ticks: undefined } : null,
      cutscene: this.cutscene ? { owner: this.cutscene.owner, target: this.cutscene.target, name: this.cutscene.name, t: this.cutscene.t, dur: this.cutscene.dur, step: this.cutscene.step } : null,
      ev: this.netEvents.splice(0),
    });
  }
  applySnapshot(s) {
    if (s.round !== this.round) {
      this.round = s.round;
      this.parts = []; this.proj = []; this.rings = []; this.beams = []; this.slashes = []; this.arcs = [];
      this.orbs = []; this.zaps = []; this.pillars = []; this.texts = []; this.afters = []; this.warns = []; this.flash = null;
    }
    this.phase = s.phase; this.phaseT = s.phaseT; this.cnt = s.cnt; this.timer = s.timer;
    this.banner = s.banner; this.label = s.label; this.msg = s.msg; this.matchWinner = s.matchWinner;
    s.fighters.forEach((sf, i) => {
      const f = this.fighters[i];
      if (Math.abs(sf.x - f.x) > 85 || Math.abs(sf.y - f.y) > 85) { f.x = sf.x; f.y = sf.y; }
      else { f.x += (sf.x - f.x) * 0.65; f.y += (sf.y - f.y) * 0.65; }
      Object.assign(f, {
        vx: sf.vx, vy: sf.vy, face: sf.face, hp: sf.hp, ce: sf.ce, cd: sf.cd, amp: sf.amp, ampMul: sf.ampMul, ampSpd: sf.ampSpd,
        aura: sf.aura, auraC: sf.auraC, combo: sf.combo, comboT: sf.comboT, stun: sf.stun, inv: sf.inv, flash: sf.flash,
        blocking: sf.blocking, parryT: sf.parryT, climbing: sf.climbing, ragdollT: sf.ragdollT, ko: sf.ko,
        grounded: sf.grounded, ghost: sf.ghost, wins: sf.wins, anim: sf.anim, act: sf.act, ledge: sf.ledge,
      });
    });
    this.proj = s.proj || []; this.orbs = s.orbs || []; this.beams = s.beams || []; this.warns = s.warns || [];
    this.dom = s.dom || null;
    this.cutscene = s.cutscene ? { ...s.cutscene, sp: spec(s.cutscene.name) } : null;
    (s.ev || []).forEach((ev) => {
      const [kind, a1, a2, a3, a4, a5, a6, a7, a8] = ev;
      if (kind === 'sfx') rawSfx[a1]?.();
      else if (kind === 'spark') this.spark(a1, a2, a3, a4, a5, a6, a7, a8);
      else if (kind === 'flash') this.flash = a1;
      else if (kind === 'shake') this.shake = Math.max(this.shake, a1);
      else if (kind === 'fx') this[a1]?.push(a2);
      else if (kind === 'after') this.pushAfter(this.fighters[a1], a2);
    });
    if (this.matchWinner !== null && !this.reported) {
      this.reported = true; this.over = true;
      this.cb.onEnd?.({ winner: this.matchWinner, scores: this.fighters.map((f) => f.wins) });
    }
  }
  stepFx(dt) {
    [this.beams, this.slashes, this.arcs, this.zaps, this.pillars, this.texts, this.rings, this.afters, this.warns].forEach((arr, k) => {
      arr.forEach((x) => { x.t -= dt; if (k === 5) x.y -= 40 * dt; });
    });
    this.beams = this.beams.filter((x) => { if (x.t > 0 && this.netRole !== 'guest') { this.spark(x.x + x.d * rnd(0, W * 0.8), x.y + rnd(-x.th / 2, x.th / 2), 1, x.color, 120, 0.3, 5, 0); } return x.t > 0; });
    this.slashes = this.slashes.filter((x) => x.t > 0); this.arcs = this.arcs.filter((x) => x.t > 0);
    this.zaps = this.zaps.filter((x) => x.t > 0); this.pillars = this.pillars.filter((x) => x.t > 0);
    this.texts = this.texts.filter((x) => x.t > 0); this.rings = this.rings.filter((x) => x.t > 0);
    this.afters = this.afters.filter((x) => x.t > 0); this.warns = this.warns.filter((x) => x.t > 0);
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
    this.parts = this.parts.filter((p) => { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.life > 0; });
    this.fighters.forEach((f) => {
      f.floorY = this.surfaceBelow(f.x, f.y);
      f.hpShow += (f.hp - f.hpShow) * Math.min(1, dt * 3);
      this.updateRig(f, dt);
    });
  }
  /* ---------------- UPDATE ---------------- */
  update(dt) {
    if (this.netRole === 'guest') {
      this.sendGuestInput();
      if (this.paused) return;
      this.time += dt; this.shake = Math.max(0, this.shake - dt * 40); this.banner = Math.max(0, this.banner - dt);
      this.proj.forEach((p) => { p.x += p.vx * dt; });
      this.fighters.forEach((f) => { if (!f.ledge && !this.cutscene) f.x = clamp(f.x + f.vx * dt, -250, W + 250); });
      this.stepFx(dt);
      return;
    }
    if (this.paused) return;
    this.time += dt; this.shake = Math.max(0, this.shake - dt * 40);
    if (this.freeze > 0) { this.freeze -= dt; return; }
    this.banner = Math.max(0, this.banner - dt); this.phaseT -= dt;
    if (this.phase === 'countdown') {
      const n = Math.ceil(this.phaseT);
      if (n !== this.cnt && n > 0) { this.cnt = n; this.sfx.count(); }
      if (this.phaseT <= 0) { this.phase = 'fight'; this.banner = 0.9; this.sfx.fight(); }
    } else if (this.phase === 'fight') {
      if ((!this.dom || this.dom.st === 'linger') && !this.cutscene) {
        this.timer -= dt;
        if (this.timer <= 0) { const [a, b] = this.fighters; this.endRound(a.hp > b.hp ? 0 : b.hp > a.hp ? 1 : -1, 'TIME UP'); }
      }
    } else if (this.phase === 'ko' && this.phaseT <= 0) {
      if (this.matchWinner !== null) {
        if (!this.reported) { this.reported = true; this.over = true; this.cb.onEnd?.({ winner: this.matchWinner, scores: this.fighters.map((f) => f.wins) }); }
      } else { this.round++; this.resetRound(); }
    }
    const can = this.phase === 'fight' && (!this.dom || this.dom.st === 'linger') && !this.cutscene;
    const [a, b] = this.fighters;
    this.step(a, b, dt, can); this.step(b, a, dt, can);
    if (this.dom) this.updateDomain(dt);
    if (this.cutscene) this.updateCutscene(dt);
    if (can && !a.ghost && !b.ghost && !a.ko && !b.ko && !a.ledge && !b.ledge) {
      const dx = b.x - a.x;
      if (Math.abs(dx) < 38 && Math.abs(a.y - b.y) < 90) { const p = (38 - Math.abs(dx)) / 2, s = dx === 0 ? (a.i ? 1 : -1) : Math.sign(dx); a.x -= p * s; b.x += p * s; }
    }
    const due = []; this.sched = this.sched.filter((s) => { s.t -= dt; if (s.t <= 0) { due.push(s); return false; } return true; });
    due.forEach((s) => s.fn());
    this.proj = this.proj.filter((p) => {
      p.x += p.vx * dt; p.life -= dt;
      if (p.kind !== 'dog' && p.style !== 'chain') this.spark(p.x, p.y, 2, p.color, 70, 0.3, p.arrow ? 7 : 5, 0);
      const t = this.fighters[1 - p.owner], att = this.fighters[p.owner];
      if (can && !t.ghost && !t.ko && Math.abs(p.x - t.x) < p.r + 18 && p.y > t.y - 130 - p.r && p.y < t.y + p.r) {
        const ok = this.hit(att, t, { dmg: p.dmg, kb: p.kb, stun: p.stun, vy: p.vy, big: !p.small, color: p.color });
        if (p.echo && ok === true) this.later(p.echo, () => {
          if (this.phase !== 'fight' || (this.dom && this.dom.st !== 'linger') || this.cutscene || t.ko) return;
          t.inv = 0; this.hit(att, t, { dmg: p.dmg2, kb: p.kb2, stun: 0.5, vy: 300, big: true, color: p.color });
          this.ring(t.x, t.y - 80, 140, p.color); this.texts.push({ txt: 'RESONANCE!', x: t.x, y: t.y - 150, t: 0.7, max: 0.7, color: p.color, size: 38 });
        });
        if (p.boom) { this.ring(p.x, p.y, p.boom * 1.7, p.color); this.ring(p.x, p.y, p.boom, '#fff'); this.spark(p.x, p.y, 36, p.color, 450, 0.7, 7, 300); this.shake = Math.max(this.shake, p.boom > 150 ? 20 : 12); this.sfx.boom(); }
        return false;
      }
      return p.life > 0 && p.x > -150 && p.x < W + 150;
    });
    this.orbs = this.orbs.filter((o) => this.updateOrb(o, dt, can));
    this.stepFx(dt);
    if (this.phase === 'fight') {
      const dead = (f) => f.hp <= 0 || f.y > H + 100, [p, q] = this.fighters;
      if (dead(p) && dead(q)) this.endRound(-1, 'K.O.'); else if (dead(p)) this.endRound(1, 'K.O.'); else if (dead(q)) this.endRound(0, 'K.O.');
    }
    if (this.netRole === 'host' && (this.time - this.lastSync >= 0.025 || this.netEvents.length > 0)) {
      this.lastSync = this.time;
      this.sendSnapshot();
    }
  }
  endRound(w, label) {
    this.phase = 'ko'; this.phaseT = 2.6; this.label = label; this.dom = null; this.cutscene = null;
    if (w >= 0) { this.fighters[w].wins++; this.fighters[1 - w].ko = true; if (this.fighters[w].wins >= this.cfg.target) this.matchWinner = w; }
    else this.fighters.forEach((f) => (f.ko = true));
    this.msg = w >= 0 ? `PLAYER ${w + 1} WINS ROUND ${this.round}` : 'DRAW - REPLAY';
    this.shake = 16; this.freeze = 0.12; this.sfx.ko();
    this.fighters.forEach((f) => { f.act = null; f.blocking = false; f.parryT = 0; f.climbing = false; f.ledge = null; f.ragdollT = 0; f.stun = Math.max(f.stun, 0.5); });
  }
  step(f, o, dt, can) {
    const c = this.controls[f.i], inp = {};
    if (this.netRole === 'host' && f.i === 1) {
      for (const k in c) {
        const d = !!this.remoteHeld[k] || !!this.remotePulse[k];
        inp[k] = (d && !this.prev[1][k]) || !!this.remotePulse[k];
        this.prev[1][k] = !!this.remoteHeld[k];
        inp['_' + k] = !!this.remoteHeld[k];
        this.remotePulse[k] = false;
      }
    } else {
      for (const k in c) { const d = c[k].some((x) => this.keys.has(x)); inp[k] = d && !this.prev[f.i][k]; this.prev[f.i][k] = d; inp['_' + k] = d; }
    }
    f.inp = inp; f.aura = Math.max(0, f.aura - dt);
    const da = this.domAbility(f);
    const cdRate = da ? (da.ability === 'shadow' && da.isOwner ? 2.0 : da.ability === 'slow' && !da.isOwner ? 0.5 : 1) : 1;
    f.cd = f.cd.map((v) => Math.max(0, v - dt * cdRate));
    f.inv -= dt; f.flash -= dt; f.comboT -= dt;
    f.parryT = Math.max(0, f.parryT - dt); f.parryCd = Math.max(0, f.parryCd - dt);
    f.dropT = Math.max(0, f.dropT - dt); f.dropCool = Math.max(0, f.dropCool - dt);
    f.ledgeCd = Math.max(0, f.ledgeCd - dt);
    f.ragdollT = Math.max(0, f.ragdollT - dt);
    if (f.comboT <= 0) f.combo = 0;
    if (f.stun > 0) f.stun -= dt;
    if (can) { f.ce = Math.min(100, f.ce + dt * 1.5 * (f.pas.ce ?? 1)); if (f.pas.regen) f.hp = Math.min(100, f.hp + f.pas.regen * dt); }
    f.amp = Math.max(0, f.amp - dt);

    /* QTE เกาะขอบสนามเมื่อกำลังจะตกแมพ! */
    if (f.ledge && !f.ko && !this.cutscene) {
      const L = f.ledge;
      L.t += dt; L.tug = Math.max(0, (L.tug || 0) - dt);
      f.vx = 0; f.vy = 0; f.x = L.x + L.side * 12; f.y = GROUND + 46 - (L.progress / L.need) * 14; f.face = -L.side;
      if (can && (inp.jump || inp.punch || inp.kick)) {
        L.progress++; L.tug = 0.14; this.sfx.qte();
        this.spark(L.x, GROUND + 4, 6, '#ffd24a', 180, 0.25, 4, 220);
      }
      if (L.progress >= L.need) {
        const side = L.side, ex = L.x; f.ledge = null; f.y = GROUND; f.x = ex - side * 50; f.vy = -310; f.vx = -side * 170; f.inv = 0.65; f.grounded = false;
        this.sfx.saved(); this.ring(f.x, GROUND - 40, 110, '#7dff6b');
        this.texts.push({ txt: 'SAVED!', x: f.x, y: GROUND - 150, t: 0.75, max: 0.75, color: '#7dff6b', size: 32 });
      } else if (L.t >= L.dur) {
        f.ledge = null; f.vy = 180; f.ledgeCd = 3.0;
        this.texts.push({ txt: 'SLIPPED!', x: f.x, y: GROUND - 20, t: 0.7, max: 0.7, color: '#ff5252', size: 28 });
      }
      return;
    }

    const busy = !!f.act || f.stun > 0 || f.ragdollT > 0;
    if (busy || f.ko) { f.parryT = 0; f.climbing = false; }

    /* Parry (0.22 วิ เมื่อกดป้องกันตรงจังหวะ) */
    if (can && !busy && f.grounded && inp.block && f.parryCd <= 0) { f.parryT = 0.22; f.parryCd = 0.65; }

    /* กดลงจากเกาะลอย */
    let dropped = false;
    if (can && !busy && f.grounded && f.y < GROUND - 5) {
      if (inp.block) {
        if (f.dropCool > 0) { f.dropT = 0.25; f.grounded = false; f.dropCool = 0; dropped = true; }
        else f.dropCool = 0.28;
      } else if (inp._block && inp.jump) {
        f.dropT = 0.25; f.grounded = false; dropped = true;
      }
    }

    f.blocking = can && !busy && !f.climbing && f.grounded && !dropped && !!inp._block;
    if (!busy && !f.ko) f.face = o.x >= f.x ? 1 : -1;

    const climbs = this.arena.climbs || [];
    const cl = climbs.find((clm) => Math.abs(f.x - clm.x) < 28 && f.y >= clm.y1 - 4 && f.y <= clm.y2 + 12);
    if (can && !busy && !f.ko && cl && !f.climbing && inp._jump && Math.abs(f.x - cl.x) < 22 && f.y > cl.y1 + 10) {
      f.climbing = true; f.grounded = false; f.vy = -260;
    }

    if (this.cutscene) return;

    const domSpd = da
      ? (da.ability === 'slow' && !da.isOwner ? 0.55 : da.ability === 'fever' && da.isOwner ? 1.25 : da.ability === 'fps' && da.isOwner ? 1.35 : 1)
      : 1;

    if (can && !busy && f.climbing) {
      const dir = (inp._right ? 1 : 0) - (inp._left ? 1 : 0);
      f.vx = dir * 220;
      if (dir === 0) f.x += (cl ? cl.x - f.x : 0) * Math.min(1, dt * 10);
      if (inp._jump) { f.vy = -290; f.anim += dt * 1.6; f.grounded = false; }
      else if (inp._block) { f.vy = 290; f.anim += dt * 1.6; f.dropT = 0.18; f.grounded = false; }
      else f.vy = 0;
      const si = ['s1', 's2', 's3'].findIndex((k) => inp[k]);
      if (inp.punch) this.begin(f, o, 'punch');
      else if (inp.kick) this.begin(f, o, 'kick');
      else if (si >= 0 && f.skills[si] && f.cd[si] <= 0) { this.begin(f, o, f.skills[si]); f.cd[si] = SKILLS[f.skills[si]].cd * (f.pas.cd || 1); }
      else if (inp.dom && f.ce >= 100) this.startDomain(f, o);
    } else if (can && !busy && !f.blocking) {
      const dir = (inp._right ? 1 : 0) - (inp._left ? 1 : 0);
      f.vx = dir * 320 * (f.pas.speed || 1) * (f.amp > 0 ? f.ampSpd : 1) * domSpd; if (dir) f.anim += dt;
      if (inp.jump && f.grounded && !dropped) { f.vy = -840; f.grounded = false; this.sfx.jump(); this.dust(f); }
      const si = ['s1', 's2', 's3'].findIndex((k) => inp[k]);
      if (inp.punch) this.begin(f, o, 'punch');
      else if (inp.kick) this.begin(f, o, 'kick');
      else if (si >= 0 && f.skills[si] && f.cd[si] <= 0) { this.begin(f, o, f.skills[si]); f.cd[si] = SKILLS[f.skills[si]].cd * (f.pas.cd || 1); }
      else if (inp.dom && f.ce >= 100) this.startDomain(f, o);
    } else if (f.act) {
      if (f.act.name !== 'domain') f.vx *= Math.exp(-10 * dt);
    } else f.vx *= Math.exp((f.stun > 0 || f.ragdollT > 0 ? -3.5 : -14) * dt);

    if (f.act) this.actUpdate(f, o, dt);
    f.ghost = !!f.act && f.act.name === 'boogieGhost';
    const wasG = f.grounded, vyB = f.vy;
    const gravMul = da && da.ability === 'gravity' && !da.isOwner ? 2.2 : 1;
    if (!f.climbing) f.vy += 2200 * gravMul * dt;
    if (da && da.ability === 'pull' && !da.isOwner && !f.ko && !f.climbing) {
      f.x += Math.sign(W / 2 - f.x) * Math.min(Math.abs(W / 2 - f.x), 155 * dt);
    }
    f.x = clamp(f.x + f.vx * dt, -250, W + 250);
    const py = f.y; f.y = Math.min(H + 300, f.y + f.vy * dt);

    if (f.climbing) {
      const cl2 = climbs.find((clm) => Math.abs(f.x - clm.x) < 26 && f.y >= clm.y1 - 4 && f.y <= clm.y2 + 12);
      if (!cl2) f.climbing = false;
      else if (f.y <= cl2.y1 && inp._jump) { f.y = cl2.y1; f.vy = 0; f.grounded = true; f.climbing = false; }
      else if (f.y >= GROUND && f.x > STAGE_L && f.x < STAGE_R && !inp._block) { f.y = GROUND; f.vy = 0; f.grounded = true; f.climbing = false; }
      return;
    }

    const onStage = f.x > STAGE_L && f.x < STAGE_R; f.grounded = false;
    if (f.vy >= 0) {
      if (f.dropT <= 0) {
        for (const p of this.arena.platforms || []) {
          if (f.x >= p.x1 && f.x <= p.x2 && py <= p.y + 4 && f.y >= p.y) {
            if (f.ragdollT > 0 && vyB > 240) { f.y = p.y; f.vy = -vyB * 0.32; f.vx *= 0.65; this.dust(f); }
            else { f.y = p.y; f.vy = 0; f.grounded = true; }
            break;
          }
        }
      }
      if (!f.grounded && onStage && py <= GROUND + 1 && f.y >= GROUND) {
        if (f.ragdollT > 0 && vyB > 240) { f.y = GROUND; f.vy = -vyB * 0.34; f.vx *= 0.65; this.dust(f); this.sfx.punch(); }
        else { f.y = GROUND; f.vy = 0; f.grounded = true; }
      }
    }
    if (!wasG && f.grounded && vyB > 400) this.dust(f);

    /* ตรวจจับการคว้าขอบสนามตอนจะตกแมพ */
    if (can && !f.grounded && !f.climbing && !f.ko && !f.ledge && f.ledgeCd <= 0 && !f.act && f.vy > 0 && f.y >= GROUND + 4 && f.y <= GROUND + 115) {
      const nearL = Math.abs(f.x - STAGE_L) < 46 && f.x <= STAGE_L + 16;
      const nearR = Math.abs(f.x - STAGE_R) < 46 && f.x >= STAGE_R - 16;
      if (nearL || nearR) {
        const side = nearL ? -1 : 1, edgeX = nearL ? STAGE_L : STAGE_R;
        f.ledge = { side, x: edgeX, t: 0, dur: 2.3, progress: 0, need: 6, tug: 0 };
        f.vx = 0; f.vy = 0; f.stun = 0; f.ragdollT = 0; f.x = edgeX + side * 12; f.y = GROUND + 46;
        this.sfx.ledge(); this.spark(edgeX, GROUND, 10, '#fff', 180, 0.3, 4, 200);
      }
    }
  }
  begin(f, o, name) {
    const sp = spec(name); f.act = { name, t: 0, hit: false, fired: false, arc: false }; f.climbing = false; f.parryT = 0;
    if (sp.lunge) f.vx = f.face * sp.lunge;
    if (name === 'kick') this.sfx.kick(); else if (sp.kind === 'melee' || sp.kind === 'cutmelee') this.sfx.punch(); else this.sfx.charge();
  }
  actUpdate(f, o, dt) {
    const a = f.act, sp = spec(a.name), col = sp.color || f.color, can = this.phase === 'fight' && (!this.dom || this.dom.st === 'linger') && !this.cutscene; a.t += dt;
    if (sp.kind === 'melee' || sp.kind === 'cutmelee') {
      if (!a.arc && a.t >= sp.win[0]) {
        a.arc = true;
        if (a.name === 'punch' || a.name === 'kick') {
          this.arcs.push({ x: f.x + f.face * 24, y: f.y - (a.name === 'kick' ? 54 : 84), r: a.name === 'kick' ? 76 : 56, face: f.face, t: 0.18, max: 0.18, color: f.color, kind: a.name });
        }
      }
      if (!a.hit && a.t >= sp.win[0] && a.t <= sp.win[1]) {
        const px = f.x + f.face * sp.reach * 0.7, py = f.y + (sp.y[0] + sp.y[1]) / 2;
        this.spark(px, py, sp.fx === 'bf' ? 3 : 1, sp.fx === 'bf' ? '#ff1744' : col, 60, 0.25, 4, 0);
        if (sp.lunge && sp.lunge > 260 && this.time - f.lastAfter > 0.03) { f.lastAfter = this.time; this.pushAfter(f, col); }
        const x1 = Math.min(f.x, f.x + f.face * sp.reach) - 15, x2 = Math.max(f.x, f.x + f.face * sp.reach) + 15;
        const y1 = f.y + sp.y[0], y2 = f.y + sp.y[1];
        if (can && x2 > o.x - 20 && x1 < o.x + 20 && y2 > o.y - 130 && y1 < o.y) {
          a.hit = true;
          if (sp.fx === 'slash' || sp.fx === 'ratio' || sp.fx === 'nullify') {
            this.arcs.push({ x: f.x + f.face * 32, y: f.y - 72, r: sp.reach * 0.85, face: f.face, t: 0.26, max: 0.26, color: col });
          }
          if (sp.kind === 'cutmelee' && o.inv <= 0 && !o.ko && !o.blocking && o.parryT <= 0) {
            this.startCutscene(f, o, sp, a.name);
            return;
          }
          const ok = this.hit(f, o, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, vy: a.name === 'kick' ? 330 : undefined, big: sp.dmg >= 9, color: col, fx: sp.fx, ragdoll: sp.ragdoll, basic: a.name === 'punch' || a.name === 'kick' });
          if (sp.delay && ok === true) this.later(sp.delay, () => {
            if (this.phase !== 'fight' || (this.dom && this.dom.st !== 'linger') || this.cutscene || o.ko) return;
            o.inv = 0; this.hit(f, o, { dmg: sp.dmg2, kb: sp.kb2, stun: 0.65, vy: 430, big: true, ragdoll: 0.85, color: col });
            this.ring(o.x, o.y - 80, 130, col); this.texts.push({ txt: 'IMPACT!', x: o.x, y: o.y - 150, t: 0.7, max: 0.7, color: col, size: 40 });
          });
        }
      }
    } else if (sp.kind === 'cutblast') {
      if (a.t < sp.fireAt) this.spark(f.x + f.face * 52 + rnd(-45, 45), f.y - 85 + rnd(-45, 45), 2, col, 60, 0.3, 4, 0);
      if (!a.fired && a.t >= sp.fireAt) {
        a.fired = true;
        if (can) {
          const inRange = Math.abs(o.x - f.x) <= sp.range && Math.abs(o.y - f.y) <= 260;
          if (inRange && (o.parryT > 0 || o.blocking)) {
            this.ring(f.x + f.face * 50, f.y - 80, 220, col);
            this.hit(f, o, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, vy: 450, big: true, color: col });
          } else if (inRange && o.inv <= 0 && !o.ko) {
            this.startCutscene(f, o, sp, a.name);
            return;
          } else {
            this.sfx.boom(); this.ring(f.x + f.face * 60, f.y - 80, 320, col); this.spark(f.x + f.face * 60, f.y - 80, 34, col, 450, 0.6, 6, 150);
          }
        }
      }
    } else if (sp.kind !== 'domain') {
      if ((sp.charge || sp.kind === 'heal' || sp.kind === 'buff' || sp.kind === 'amp') && a.t < sp.fireAt) this.spark(f.x + f.face * 50 + rnd(-40, 40), f.y - 85 + rnd(-40, 40), 1, col, 50, 0.3, 4, 0);
      if (!a.fired && a.t >= sp.fireAt) { a.fired = true; if (can) this.fire(f, o, a.name, sp); }
    }
    if (a.t >= sp.dur) f.act = null;
  }
  fire(f, o, name, sp) {
    const col = sp.color, x0 = f.x + f.face * 35, y0 = f.y - 80;
    if (sp.kind === 'proj') {
      for (let i = 0; i < (sp.n || 1); i++) {
        const shot = () => {
          if (this.phase !== 'fight' || (this.dom && this.dom.st !== 'linger') || this.cutscene || f.stun > 0 || f.ko) return;
          this.shoot(f, sp, { kind: 'orb', y: f.y - 80 + (sp.offs ? sp.offs[i % sp.offs.length] : 0) });
          this.sfx.shoot(); this.ring(f.x + f.face * 35, f.y - 80, 70, col);
        };
        if (i === 0) shot(); else this.later(i * sp.gap, shot);
      }
    }
    else if (sp.kind === 'dogs') {
      this.sfx.howl(); [0, 0.18].forEach((d, i) => this.later(d, () => this.proj.push({ x: f.x + f.face * 30, y: f.y - 24, vx: f.face * (i ? 840 : 620), owner: f.i, color: col, life: 1.7, r: 30, dmg: sp.dmg, kb: sp.kb, stun: sp.stun, kind: 'dog', face: f.face })));
    } else if (sp.kind === 'beam') {
      this.beams.push({ x: x0, y: y0, d: f.face, th: sp.th, t: sp.vis, max: sp.vis, color: col, name, style: sp.style }); this.sfx.beam();
      this.ring(x0, y0, sp.th + 80, col); this.shake = Math.max(this.shake, sp.th > 50 ? 24 : 9); if (sp.th > 50) this.flash = { t: 0.2, max: 0.2, c: '#e1bee7' };
      if (o.y - 130 < y0 + sp.th / 2 && o.y > y0 - sp.th / 2 && (o.x - x0) * f.face > -20) {
        this.hit(f, o, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, vy: sp.vy || 300, big: true, color: col });
      }
    } else if (sp.kind === 'slashes') {
      this.sfx.slash(); const x1 = f.x + f.face * 40, x2 = f.x + f.face * sp.range, xv = f.x + f.face * Math.min(sp.range, 900);
      for (let i = 0; i < sp.n; i++) this.later(i * 0.04, () => {
        this.slashes.push({ x: x1 + (xv - x1) * Math.random(), y: f.y - rnd(10, 140), a: rnd(-1.1, 1.1), len: rnd(160, 300), t: 0.3, max: 0.3, color: name === 'worldslash' ? '#ff5252' : '#80deea' });
        this.sfx.slash();
      });
      if ((o.x - x1) * f.face > -20 && (o.x - x2) * f.face < 20) this.later(0.08, () => this.phase === 'fight' && !this.cutscene && this.hit(f, o, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, big: true, color: col }));
    } else if (sp.kind === 'blue') {
      this.sfx.blue(); this.orbs.push({ x: f.x + f.face * 150, y: f.y - 70, t: 0, hold: sp.hold, owner: f.i, color: col, tick: 0.2, dmg: sp.dmg, kb: sp.kb });
    } else if (sp.kind === 'warp') {
      this.sfx.warp(); this.ring(f.x, f.y - 70, 110, col);
      if (o.inv > 0 || o.ko || o.ghost) return;
      if (o.parryT > 0 || o.blocking) {
        this.ring(o.x, o.y - 70, 110, '#4fc3f7');
        this.hit(f, o, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, big: false, color: col });
        if (o.blocking) this.texts.push({ txt: 'SWAP BLOCKED!', x: o.x, y: o.y - 150, t: 0.65, max: 0.65, color: '#4fc3f7', size: 28 });
        return;
      }
      this.pushAfter(f, col); this.pushAfter(o, col);
      const tx = o.x, ty = o.y; o.x = f.x; o.y = f.y; f.x = tx; f.y = ty; f.face = o.x >= f.x ? 1 : -1;
      this.ring(f.x, f.y - 70, 110, col); this.ring(o.x, o.y - 70, 110, col); this.spark(f.x, f.y - 70, 20, col, 300, 0.5, 5, 0);
      this.hit(f, o, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, big: false, color: col });
      this.texts.push({ txt: 'CLAP!', x: f.x, y: f.y - 150, t: 0.6, max: 0.6, color: col, size: 36 });
    } else if (sp.kind === 'speech') {
      this.sfx.speech(); this.ring(f.x, f.y - 80, 160, col); this.ring(f.x, f.y - 80, 320, col);
      if (Math.abs(o.x - f.x) < sp.range && o.inv <= 0 && !o.ko && !o.ghost) {
        o.act = null; o.stun = Math.max(o.stun, sp.stunTime); o.vx = 0; o.hp = Math.max(0, o.hp - sp.dmg); o.flash = 0.12;
        this.ring(o.x, o.y - 80, 140, '#fff'); this.spark(o.x, o.y - 80, 16, '#fff', 260, 0.5, 5, 0);
        this.texts.push({ txt: "DON'T MOVE!", x: o.x, y: o.y - 170, t: 1, max: 1, color: '#fff', size: 38 });
      }
    } else if (sp.kind === 'buff') {
      this.sfx.buff(); f.inv = Math.max(f.inv, sp.time); f.aura = sp.time; f.auraC = col; this.ring(f.x, f.y - 80, 150, col);
      this.texts.push({ txt: 'INFINITY', x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 38 });
    } else if (sp.kind === 'heal') {
      this.sfx.heal(); f.hp = Math.min(100, f.hp + sp.heal); this.spark(f.x, f.y - 60, 30, col, 200, 0.8, 6, -300); this.ring(f.x, f.y - 80, 120, col);
      this.texts.push({ txt: `+${sp.heal} HP`, x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 36 });
    } else if (sp.kind === 'amp') {
      this.sfx.buff(); f.amp = sp.time; f.ampMul = sp.mul; f.ampSpd = sp.spd || 1; if (sp.inv) f.inv = Math.max(f.inv, sp.inv);
      f.aura = sp.time; f.auraC = col; this.ring(f.x, f.y - 80, 150, col); this.spark(f.x, f.y - 60, 22, col, 260, 0.7, 5, -200);
      this.texts.push({ txt: sp.short, x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 34 });
    } else if (sp.kind === 'jackpot') {
      this.sfx.jackpot(); this.ring(f.x, f.y - 80, 140, col);
      if (Math.random() < 0.3) {
        f.hp = Math.min(100, f.hp + 25); f.inv = Math.max(f.inv, 2.5); f.aura = 2.5; f.auraC = col; this.spark(f.x, f.y - 80, 40, col, 500, 0.8, 7, 200);
        this.texts.push({ txt: '777 JACKPOT!', x: f.x, y: f.y - 170, t: 1.2, max: 1.2, color: col, size: 46 });
      } else { f.ce = Math.min(100, f.ce + 35); this.texts.push({ txt: 'CE +35', x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 34 }); }
    } else if (sp.kind === 'strike') {
      const tx = o.x, ty = o.floorY !== null ? o.floorY : GROUND;
      this.sfx.charge(); this.warns.push({ x: tx, y: ty, r: sp.radius, t: sp.delay, max: sp.delay, color: col, name });
      this.later(sp.delay, () => {
        if (this.phase !== 'fight' || (this.dom && this.dom.st !== 'linger') || this.cutscene) return;
        this.pillars.push({ x: tx, y: ty, t: 0.5, max: 0.5, color: col, w: sp.radius * 0.7 }); this.sfx.thunder(); this.shake = Math.max(this.shake, 16);
        this.spark(tx, ty, 26, col, 420, 0.6, 6, 400); this.ring(tx, ty, sp.radius * 2.2, '#fff'); this.zaps.push({ x: tx, y: ty - 150, t: 0.3, color: col });
        if (!o.ko && !o.ghost && Math.abs(o.x - tx) < sp.radius && Math.abs(o.y - ty) < 160) this.hit(f, o, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, vy: sp.vy, big: true, color: col });
      });
    }
  }
  shoot(f, sp, over) {
    this.proj.push({ x: f.x + f.face * 45, y: f.y - 80, sx: f.x + f.face * 20, sy: f.y - 80, vx: f.face * sp.speed, owner: f.i, color: sp.color, style: sp.style, life: sp.life, r: sp.r, dmg: sp.dmg, kb: sp.kb, stun: sp.stun, boom: sp.boom, vy: sp.vy, arrow: sp.arrow, face: f.face, echo: sp.echo, dmg2: sp.dmg2, kb2: sp.kb2, small: sp.small, ...over });
  }
  updateOrb(o, dt, can) {
    o.t += dt; const t = this.fighters[1 - o.owner], att = this.fighters[o.owner];
    if (!can) return o.t < o.hold + 0.1;
    if (!t.ghost && !t.ko) { const dx = o.x - t.x; t.x += Math.sign(dx) * Math.min(Math.abs(dx), 480 * dt); if (t.grounded) t.vx = 0; }
    this.spark(o.x + rnd(-60, 60), o.y + rnd(-60, 60), 1, o.color, 40, 0.3, 4, 0);
    o.tick -= dt;
    if (o.tick <= 0 && Math.abs(t.x - o.x) < 110) { o.tick = 0.25; this.hit(att, t, { dmg: 2, kb: 0, stun: 0.12, vy: 0, color: o.color }); }
    if (o.t >= o.hold) {
      this.ring(o.x, o.y, 220, o.color); this.ring(o.x, o.y, 120, '#fff'); this.spark(o.x, o.y, 34, o.color, 420, 0.6, 6, 200); this.shake = 14; this.sfx.boom();
      if (Math.abs(t.x - o.x) < 150) { t.inv = 0; this.hit(att, t, { dmg: o.dmg, kb: o.kb, stun: 0.5, vy: 400, big: true, color: o.color }); }
      return false;
    }
    return true;
  }
  /* ---------------- CUTSCENE SYSTEM (10 ท่าคัตซีน!) ---------------- */
  startCutscene(f, o, sp, name) {
    this.cutscene = { owner: f.i, target: o.i, sp, name, t: 0, dur: CUT_DUR, step: 0, ox: o.x, oy: o.y };
    f.act = { name, t: 0, fired: true, hit: true }; f.vx = 0; f.vy = 0; f.inv = CUT_DUR + 0.4; f.climbing = false; f.ledge = null;
    o.act = null; o.vx = 0; o.vy = 0; o.stun = CUT_DUR + 0.4; o.inv = 0; o.climbing = false; o.ledge = null; o.ragdollT = 0;
    this.sfx.cutscene(); this.flash = { t: 0.24, max: 0.24, c: '#fff' }; this.shake = 14;
    this.ring(o.x, o.y - 80, 220, sp.color);
  }
  updateCutscene(dt) {
    const cs = this.cutscene, f = this.fighters[cs.owner], o = this.fighters[cs.target], sp = cs.sp;
    cs.t += dt; f.inv = 0.5; f.vx = 0; f.vy = 0; o.vx = 0; o.vy = 0; o.stun = Math.max(o.stun, 0.5);
    const dmgScale = sp.dmg * (f.pas.dmg || 1) * (f.amp > 0 ? f.ampMul : 1) * (o.pas.guard || 1);
    const dir = o.x >= f.x ? 1 : -1;
    const beats = [0.40, 0.72, 1.02];

    if (cs.step < 3 && cs.t >= beats[cs.step]) {
      const k = cs.step++;
      const side = k % 2 ? -1 : 1;
      o.hp = Math.max(0, o.hp - dmgScale * 0.12); o.flash = 0.12;
      if (sp.cut === 'bf3' || sp.cut === 'gamble') {
        this.pushAfter(f, sp.color);
        f.x = clamp(o.x - side * 72, 80, W - 80); f.y = o.y; f.face = side; f.act = { name: cs.name, t: 0.14 };
        this.impulse(o, side * 160, 140);
        for (let i = 0; i < 4; i++) this.zaps.push({ x: o.x, y: o.y - 80, t: 0.25, color: i % 2 ? sp.color : '#111' });
        this.ring(o.x, o.y - 80, 140 + k * 35, sp.color);
        this.texts.push({ txt: sp.cut === 'gamble' ? ['7', '7', '7'][k] : `黒閃 ${k + 1}!`, x: o.x + rnd(-50, 50), y: o.y - 160 - k * 14, t: 0.65, max: 0.65, color: sp.color, size: 36 });
        if (sp.cut === 'gamble' && k === 2) { f.hp = Math.min(100, f.hp + 12); this.texts.push({ txt: '+12 HP JACKPOT!', x: f.x, y: f.y - 160, t: 0.9, max: 0.9, color: '#ffd24a', size: 32 }); this.sfx.jackpot(); }
        else this.sfx.bf();
        this.shake = 16; this.freeze = 0.07;
      } else if (sp.cut === 'bisect' || sp.cut === 'mahoraga') {
        this.pushAfter(f, sp.color);
        f.x = clamp(o.x + (k % 2 ? 120 : -120), 80, W - 80); f.y = o.y; f.face = o.x >= f.x ? 1 : -1;
        this.slashes.push({ x: o.x, y: o.y - 75, a: [-0.45, 0.55, -0.05][k], len: 760, t: 0.35, max: 0.35, color: sp.color });
        this.arcs.push({ x: o.x, y: o.y - 75, r: 165, face: f.face, t: 0.25, max: 0.25, color: sp.color });
        if (sp.cut === 'mahoraga') this.texts.push({ txt: 'ADAPT!', x: f.x, y: f.y - 155, t: 0.55, max: 0.55, color: '#ffd54f', size: 28 });
        this.sfx.slash(); this.shake = 14;
      } else if (sp.cut === 'soul') {
        this.ring(o.x, o.y - 80, 110 + k * 45, '#9ccc65'); this.spark(o.x, o.y - 80, 18, '#9ccc65', 300, 0.4, 5, 0);
        this.impulse(o, rnd(-180, 180), 120); this.sfx.hit(); this.shake = 12;
      } else if (sp.cut === 'jacob') {
        this.pillars.push({ x: o.x, y: o.y, t: 0.35, max: 0.35, color: '#ffe57f', w: 70 + k * 25 });
        this.ring(o.x, o.y - 90, 180, '#fff'); this.sfx.thunder(); this.shake = 14;
      } else if (sp.cut === 'blood') {
        this.slashes.push({ x: o.x, y: o.y - 75, a: [-0.2, 0.25, 0][k], len: 860, t: 0.25, max: 0.25, color: '#ff1744' });
        this.ring(o.x, o.y - 80, 130, '#ff2d55'); this.sfx.beam(); this.shake = 14;
      } else {
        /* hollow / meteor / uzumaki buildup */
        this.ring((f.x + o.x) / 2, o.y - 90, 140 + k * 45, sp.color);
        this.spark(o.x, o.y - 80, 18, sp.color, 320, 0.45, 5, 0);
        this.sfx.charge(); this.shake = 10 + k * 4;
      }
    } else if (cs.step === 3 && cs.t >= 1.32) {
      cs.step = 4;
      const cx = (sp.cut === 'hollow' || sp.cut === 'uzumaki') ? (f.x + o.x) / 2 : o.x;
      o.hp = Math.max(0, o.hp - dmgScale * 0.64); o.flash = 0.24; o.stun = Math.max(sp.stun, 0.9); o.ragdollT = 0.95;
      if (sp.cut === 'jacob') { o.ce = Math.max(0, o.ce - 40); o.amp = 0; }
      this.impulse(o, dir * 680, 440);
      for (let i = 0; i < 6; i++) this.zaps.push({ x: o.x + rnd(-40, 40), y: o.y - 80 + rnd(-40, 40), t: 0.4, color: i % 2 ? sp.color : '#fff' });
      if (sp.cut === 'bisect' || sp.cut === 'mahoraga') {
        for (let i = 0; i < 6; i++) this.slashes.push({ x: o.x + rnd(-80, 80), y: o.y - 80 + rnd(-50, 50), a: rnd(-1.4, 1.4), len: 1100, t: 0.45, max: 0.45, color: sp.color });
      }
      if (sp.cut === 'jacob' || sp.cut === 'meteor') {
        this.pillars.push({ x: o.x, y: o.y, t: 0.7, max: 0.7, color: sp.color, w: 140 });
      }
      this.ring(cx, o.y - 80, 440, sp.color); this.ring(cx, o.y - 80, 260, '#fff');
      this.spark(cx, o.y - 80, 56, sp.color, 600, 0.75, 8, 150);
      this.flash = { t: 0.3, max: 0.3, c: sp.cut === 'bf3' ? '#000' : '#fff' }; this.shake = 30; this.freeze = 0.14;
      this.sfx.heavy(); this.sfx.boom();
      this.texts.push({ txt: `${sp.short}!`, x: W / 2, y: 205, t: 1.0, max: 1.0, color: sp.color, size: 46 });
      o.vx = dir * sp.kb; o.vy = -480; o.grounded = false;
    }
    if (cs.t >= cs.dur) {
      this.gain(f, o, dmgScale);
      f.act = null; f.inv = 0.35; this.cutscene = null;
    }
  }
  drawCutsceneOverlay() {
    const cs = this.cutscene; if (!cs) return;
    const c = this.c, f = this.fighters[cs.owner], o = this.fighters[cs.target], sp = cs.sp, t = cs.t;
    c.save();
    const cx = (sp.cut === 'hollow' || sp.cut === 'uzumaki') ? (f.x + o.x) / 2 : o.x, cy = o.y - 80;
    c.globalAlpha = 0.45; c.strokeStyle = sp.color; c.lineWidth = 2;
    for (let i = 0; i < 36; i++) {
      const an = (i / 36) * Math.PI * 2 + t * 2.5, r0 = 130 + ((i * 31) % 70);
      c.beginPath(); c.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0);
      c.lineTo(cx + Math.cos(an) * (r0 + 700), cy + Math.sin(an) * (r0 + 700)); c.stroke();
    }
    if (sp.cut === 'hollow' && t < 1.35) {
      const k = clamp((t - 0.2) / 0.75, 0, 1), dist = (1 - k) * 150, an = t * 9;
      if (t < 0.98) {
        this.drawOrb(cx + Math.cos(an) * dist, cy - 20 + Math.sin(an) * dist * 0.4, 42, '#40c4ff');
        this.drawOrb(cx - Math.cos(an) * dist, cy - 20 - Math.sin(an) * dist * 0.4, 42, '#ff3d3d');
      } else this.drawOrb(cx, cy - 20, 70 + (t - 0.95) * 320, '#d500f9');
    } else if (sp.cut === 'meteor' && t < 1.35) {
      const my = -60 + clamp(t / 1.32, 0, 1) * (o.y - 20);
      this.drawOrb(o.x, my, 120, '#ff6d00');
      c.fillStyle = '#3e1a0d'; c.beginPath(); c.arc(o.x, my, 66, 0, 7); c.fill();
    } else if (sp.cut === 'uzumaki' && t < 1.35) {
      c.strokeStyle = '#69f0ae'; c.lineWidth = 5;
      for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(cx, cy - 30, 35 + i * 28, t * 8 + i, t * 8 + i + 4.4); c.stroke(); }
    } else if (sp.cut === 'mahoraga' && t < 1.35) {
      c.save(); c.translate(f.x, f.y - 135); c.rotate(t * 4);
      c.strokeStyle = '#ffd54f'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 38, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) { const a2 = (i * Math.PI) / 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a2) * 52, Math.sin(a2) * 52); c.stroke(); }
      c.restore();
    }
    const bar = Math.min(1, t / 0.18) * 76;
    c.globalAlpha = 1; c.fillStyle = '#000';
    c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    c.fillStyle = sp.color; c.fillRect(0, bar - 3, W, 3); c.fillRect(0, H - bar, W, 3);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `44px ${FONT}`; c.lineWidth = 6; c.strokeStyle = '#000';
    c.strokeText(sp.jp || sp.short, W / 2, bar / 2); c.fillStyle = '#fff'; c.fillText(sp.jp || sp.short, W / 2, bar / 2);
    c.font = `24px ${FONT}`; c.fillStyle = sp.color; c.fillText(sp.name.toUpperCase(), W / 2, H - bar / 2);
    c.restore();
  }
  /* ---------------- DOMAIN SYSTEM (+ Linger Battleground) ---------------- */
  startDomain(f, o) {
    if (this.dom && this.dom.st !== 'linger') return;
    const d = DOMAINS[f.dom]; f.ce = 0; f.act = { name: 'domain', t: 0 }; f.vx = 0; f.inv = 5; f.climbing = false; f.ledge = null;
    o.act = null; o.stun = 5; o.vx = 0; o.climbing = false; o.ledge = null; o.ragdollT = 0;
    this.dom = { owner: f.i, caster: f.i, id: f.dom, t: 0, dur: DOM_DUR, idx: 0, ticks: d.ticks, st: 'open', mult: 1, clash: null, res: null,
      lingerT: 0, lingerDur: d.lingerDur || 4.2, dotT: 0.55, specT: 0.9, ...this.rhythmInit() };
    this.flash = { t: 0.3, max: 0.3, c: '#fff' }; this.sfx.domainOpen(); this.shake = 10;
  }
  startClash() {
    const d = this.dom; d.st = 'clash'; d.clash = { t: 0, dur: CLASH_T, n: [1, 1], share: 0.5, pulse: [0, 0] };
    this.fighters.forEach((f) => { f.ce = 0; f.act = { name: 'domain', t: 0 }; f.vx = 0; f.inv = 9; f.stun = 0; });
    this.flash = { t: 0.4, max: 0.4, c: '#fff' }; this.freeze = 0.15; this.shake = 24; this.sfx.clash(); this.ring(W / 2, GROUND - 90, 500, '#fff');
  }
  updateClash(dt) {
    const k = this.dom.clash; k.t += dt;
    this.fighters.forEach((f) => {
      f.stun = 0; f.inv = Math.max(f.inv, 0.3); f.vx = 0; k.pulse[f.i] = Math.max(0, k.pulse[f.i] - dt * 6);
      if (f.inp && f.inp.dom) { k.n[f.i]++; k.pulse[f.i] = 1; this.sfx.mash(); this.spark(f.x + f.face * 40, f.y - 90, 3, DOMAINS[f.dom].color, 260, 0.35, 5, 0); }
    });
    k.share += ((k.n[0] + 2) / (k.n[0] + k.n[1] + 4) - k.share) * Math.min(1, dt * 12);
    this.shake = Math.max(this.shake, 4); this.spark(W * k.share, rnd(120, GROUND), 2, '#fff', 300, 0.4, 5, 0);
    if (k.t >= k.dur) this.resolveClash();
  }
  resolveClash() {
    const d = this.dom, k = d.clash, [n0, n1] = k.n, w = n0 === n1 ? d.caster : n0 > n1 ? 0 : 1;
    const F = this.fighters[w], L = this.fighters[1 - w], share = k.n[w] / (n0 + n1), D = DOMAINS[F.dom];
    Object.assign(d, { st: 'run', owner: w, id: F.dom, ticks: D.ticks, idx: 0, t: 0, dur: DOM_DUR, lingerT: 0, lingerDur: D.lingerDur || 4.2, dotT: 0.55, specT: 0.9,
      ...this.rhythmInit(), mult: clamp(0.9 + (share - 0.5), 0.9, 1.4), clash: null,
      res: { t: 1.8, txt: `PLAYER ${w + 1} WINS THE CLASH!`, sub: `${k.n[w]} : ${k.n[1 - w]}`, color: F.color } });
    F.act = { name: 'domain', t: 0 }; F.inv = 5; F.vx = 0; F.stun = 0;
    L.act = null; L.stun = 5; L.vx = 0; L.inv = 0;
    this.flash = { t: 0.35, max: 0.35, c: '#fff' }; this.freeze = 0.12; this.shake = 20; this.sfx.domain();
  }
  rhythmInit() {
    return { beats: Array.from({ length: BEAT_N }, (_, i) => ({ t: BEAT_T0 + i * BEAT_GAP, r: null })), streak: 0, best: 0, perfect: 0, lock: 0, arts: 3, artCd: 0, resist: 0, judge: null };
  }
  judgeTxt(d, txt, color) { d.judge = { txt, color, t: 0.6 }; }
  updateDomain(dt) {
    const d = this.dom; if (d.res) d.res.t -= dt;
    if (d.st === 'clash') return this.updateClash(dt);
    const f = this.fighters[d.owner], o = this.fighters[1 - d.owner], D = DOMAINS[d.id];
    d.t += dt;
    if (d.st === 'linger') {
      if (this.cutscene) return;
      d.lingerT += dt; d.dotT -= dt; d.specT -= dt;
      /* ดาเมจเล็กๆ ต่อเนื่องทุก 0.55 วิ + ความสามารถพิเศษแต่ละโดเมน */
      if (d.dotT <= 0) {
        d.dotT = 0.55;
        if (!o.ko) {
          const blkMul = D.ability === 'slash' ? (o.blocking ? 0.85 : 1) : (o.blocking ? 0.5 : 1);
          const chip = (D.dot || 1.4) * (d.mult || 1) * (f.pas.dmg || 1) * blkMul;
          o.hp = Math.max(0, o.hp - chip); o.flash = 0.06;
          this.spark(o.x, o.y - 80, 6, D.color, 200, 0.35, 4, 0);
        }
        if (D.ability === 'drain') { o.ce = Math.max(0, o.ce - 6); f.hp = Math.min(100, f.hp + 0.9); }
        if (D.ability === 'guilty') { o.ce = 0; }
      }
      if (D.ability === 'fever') f.hp = Math.min(100, f.hp + 2.6 * dt);
      if (D.ability === 'mutual') f.hp = Math.min(100, f.hp + 1.5 * dt);
      if (d.specT <= 0 && !o.ko) {
        if (D.ability === 'slash') {
          d.specT = 0.7;
          this.slashes.push({ x: o.x + rnd(-50, 50), y: o.y - rnd(20, 120), a: rnd(-1.4, 1.4), len: 240, t: 0.22, max: 0.22, color: '#ff1744' });
          this.sfx.slash();
        } else if (D.ability === 'lava') {
          d.specT = 1.35;
          const tx = o.x, ty = o.floorY !== null ? o.floorY : GROUND;
          this.warns.push({ x: tx, y: ty, r: 75, t: 0.55, max: 0.55, color: '#ff6d00', name: 'eruption' });
          this.later(0.55, () => {
            if (this.phase !== 'fight' || !this.dom || this.dom.st !== 'linger') return;
            this.pillars.push({ x: tx, y: ty, t: 0.45, max: 0.45, color: '#ff6d00', w: 50 }); this.sfx.boom();
            if (!o.ko && Math.abs(o.x - tx) < 75 && Math.abs(o.y - ty) < 120) this.hit(f, o, { dmg: 5, kb: 320, stun: 0.3, vy: 360, color: '#ff6d00' });
          });
        } else if (D.ability === 'shadow') {
          d.specT = 1.4;
          const dir = o.x >= f.x ? 1 : -1;
          this.proj.push({ x: clamp(f.x, STAGE_L + 30, STAGE_R - 30), y: f.y - 24, vx: dir * 680, owner: f.i, color: '#7c4dff', life: 1.3, r: 26, dmg: 5, kb: 260, stun: 0.28, kind: 'dog', face: dir, small: true });
          this.sfx.howl();
        } else if (D.ability === 'tide') {
          d.specT = 1.25;
          const fromL = Math.random() < 0.5, sx = fromL ? 80 : W - 80, dir = fromL ? 1 : -1;
          this.proj.push({ x: sx, y: o.y - 70, sx, sy: o.y - 70, vx: dir * 720, owner: f.i, color: '#29b6f6', style: 'fish', life: 1.8, r: 20, dmg: 5, kb: 340, stun: 0.25, small: true, face: dir });
        } else if (D.ability === 'fps') {
          d.specT = 1.65;
          o.stun = Math.max(o.stun, 0.55); o.vx = 0; this.ring(o.x, o.y - 80, 120, '#ffee58');
          this.texts.push({ txt: '24 FPS FREEZE!', x: o.x, y: o.y - 165, t: 0.6, max: 0.6, color: '#ffee58', size: 24 });
        } else if (D.ability === 'gravity') {
          d.specT = 1.35;
          o.vy += 480; this.ring(o.x, o.y - 20, 180, '#b388ff'); this.sfx.gavel();
        } else if (D.ability === 'sphere') {
          d.specT = 1.25;
          const fromL = o.x > W / 2, sx = fromL ? 120 : W - 120, dir = fromL ? 1 : -1;
          this.proj.push({ x: sx, y: o.y - 75, sx, sy: o.y - 75, vx: dir * 640, owner: f.i, color: '#e0e0e0', style: 'red', life: 2.0, r: 22, dmg: 6, kb: 360, stun: 0.3, small: true, face: dir });
        } else { d.specT = 1.2; }
      }
      if (d.lingerT >= d.lingerDur) { this.dom = null; }
      return;
    }
    o.stun = Math.max(o.stun, 0.3); f.inv = Math.max(f.inv, 0.3);
    if (d.judge) d.judge.t -= dt;
    if (d.st === 'open') {
      if (d.t < 0.7 && Math.random() < 0.55) this.spark(f.x + rnd(-26, 26), f.y - 75 + rnd(-20, 20), 1, D.color, 90, 0.35, 4, -80);
      if (o.ce >= 100 && o.inp && o.inp.dom) return this.startClash();
      if (d.t >= OPEN) { d.st = 'run'; this.sfx.domain(); this.ring(f.x, f.y - 70, 520, D.color); this.shake = 18; }
    }
    if (d.st === 'run') {
      this.updateRhythm(d, f, o, dt);
      while (d.idx < d.ticks.length && d.t >= d.ticks[d.idx].t) this.domTick(d, d.ticks[d.idx++], f, o);
      if (d.t >= d.dur) {
        d.st = 'linger'; d.lingerT = 0; f.act = null; f.inv = 0.25; o.stun = 0.15;
        this.texts.push({ txt: 'FIGHT IN DOMAIN!', x: W / 2, y: 190, t: 1.0, max: 1.0, color: D.color, size: 36 });
      }
    }
  }
  updateRhythm(d, f, o, dt) {
    d.lock = Math.max(0, d.lock - dt); d.artCd = Math.max(0, d.artCd - dt); d.resist = Math.max(0, d.resist - dt * 0.12);
    const pi = f.inp || {}, qi = o.inp || {}, col = DOMAINS[d.id].color;
    if (qi.block) { d.resist = Math.min(0.4, d.resist + 0.05); this.sfx.resist(); this.spark(o.x, o.y - 80, 3, '#fff', 180, 0.25, 4, 0); }
    d.beats.forEach((b) => { if (b.r === null && d.t > b.t + GOOD) { b.r = 'miss'; d.streak = 0; this.judgeTxt(d, 'MISS', '#9e9e9e'); this.sfx.miss(); } });
    if (pi.dom && d.lock <= 0) {
      let best = null;
      d.beats.forEach((b) => { if (b.r === null) { const e = Math.abs(d.t - b.t); if (e <= GOOD && (!best || e < best.e)) best = { b, e }; } });
      if (best) {
        const perfect = best.e <= PERFECT; best.b.r = perfect ? 'perfect' : 'good'; d.streak++; d.best = Math.max(d.best, d.streak); if (perfect) d.perfect++;
        o.hp = Math.max(0, o.hp - (perfect ? 1.4 : 0.7) * (d.mult || 1) * (1 - d.resist) * (f.pas.dmg || 1)); o.flash = 0.08;
        this.judgeTxt(d, perfect ? 'PERFECT!' : 'GOOD', perfect ? '#ffd24a' : '#3dd6ff'); perfect ? this.sfx.perfect() : this.sfx.good();
        this.spark(o.x, o.y - 80, perfect ? 16 : 8, perfect ? '#ffd24a' : col, 320, 0.4, 5, 0); this.ring(o.x, o.y - 80, perfect ? 140 : 90, perfect ? '#ffd24a' : col);
        this.shake = Math.max(this.shake, perfect ? 9 : 4);
      } else { d.lock = 0.28; d.streak = 0; this.judgeTxt(d, 'OFF BEAT', '#ff5252'); this.sfx.miss(); }
    }
    if (pi.punch && d.arts > 0 && d.artCd <= 0 && d.t < d.dur - 0.5) { d.arts--; d.artCd = 0.75; this.domainArt(d, f, o); }
  }
  domainArt(d, f, o) {
    const D = DOMAINS[d.id], A = D.art, col = D.color, dir = o.x >= f.x ? 1 : -1, fx = A.fx;
    o.hp = Math.max(0, o.hp - A.dmg * 0.7 * (d.mult || 1) * (1 - d.resist) * (f.pas.dmg || 1)); o.flash = 0.1; this.impulse(o, dir * 160, 140);
    this.sfx.art(); this.shake = Math.max(this.shake, 10);
    this.texts.push({ txt: A.name.toUpperCase() + '!', x: o.x, y: o.y - 175, t: 0.9, max: 0.9, color: col, size: 28 });
    if (fx === 'zap') for (let i = 0; i < 6; i++) this.later(i * 0.04, () => this.zaps.push({ x: o.x + rnd(-70, 70), y: o.y - rnd(20, 140), t: 0.25, color: i % 2 ? '#e1f5fe' : col }));
    else if (fx === 'slash') for (let i = 0; i < 7; i++) this.later(i * 0.04, () => { this.slashes.push({ x: o.x + rnd(-130, 130), y: o.y - rnd(0, 140), a: rnd(-1.3, 1.3), len: rnd(260, 480), t: 0.25, max: 0.25, color: '#ff5252' }); this.sfx.slash(); });
    else if (fx === 'pillar') for (let i = 0; i < 3; i++) this.later(i * 0.12, () => { this.pillars.push({ x: o.x + (i - 1) * 90, y: GROUND, t: 0.6, max: 0.6, color: col, w: 55 }); this.sfx.boom(); });
    else if (fx === 'coin') { f.hp = Math.min(100, f.hp + 3); this.texts.push({ txt: '777', x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: '#ffd600', size: 40 }); this.spark(f.x, f.y - 80, 24, '#ffd600', 400, 0.7, 6, 300); }
    else if (fx === 'warp') { this.pushAfter(o, col); o.stun = Math.max(o.stun, 1); for (let i = 0; i < 3; i++) this.ring(o.x, o.y - 80, 100 + i * 60, col); }
    else if (fx === 'shadow') for (let i = 0; i < 4; i++) this.later(i * 0.08, () => this.pillars.push({ x: o.x + rnd(-110, 110), y: GROUND, t: 0.5, max: 0.5, color: '#7c4dff', w: 30 }));
    else if (fx === 'gavel') { this.freeze = 0.12; this.flash = { t: 0.2, max: 0.2, c: '#ffe082' }; this.sfx.gavel(); this.ring(o.x, GROUND, 320, col); this.shake = 22; }
    else if (fx === 'wave') for (let i = 0; i < 5; i++) this.later(i * 0.06, () => this.rings.push({ x: o.x - dir * i * 40, y: GROUND - 30, r: 200 + i * 30, t: 0.4, max: 0.4, color: col }));
    else if (fx === 'rika') { f.hp = Math.min(100, f.hp + 2); this.ring(o.x, o.y - 80, 220, col); this.spark(o.x, o.y - 80, 30, col, 450, 0.6, 6, 0); this.zaps.push({ x: o.x, y: o.y - 80, t: 0.3, color: '#fff' }); }
  }
  domTick(d, tk, f, o) {
    const dir = o.x >= f.x ? 1 : -1, col = DOMAINS[d.id].color;
    let rm = 1 + Math.min(d.streak, BEAT_N) * 0.03;
    if (tk.final) rm *= d.perfect >= BEAT_N ? 1.25 : 1 + d.best * 0.015;
    o.hp = Math.max(0, o.hp - tk.dmg * (d.mult || 1) * rm * (1 - d.resist) * (f.pas.dmg || 1)); o.flash = 0.1; o.inv = 0; f.ce = 0;
    this.impulse(o, dir * (tk.final ? 520 : 80), tk.final ? 420 : 120);
    this.spark(o.x, o.y - 80, tk.final ? 40 : 12, col, tk.final ? 500 : 280, 0.5, 5);
    this.sfx.hit(); this.shake = tk.final ? 22 : 6;
    if (d.id === 'void' || d.id === 'moon') { this.flash = { t: 0.1, max: 0.1, c: col }; this.zaps.push({ x: o.x, y: o.y - 80, t: 0.2, color: col }); }
    if (d.id === 'shrine') for (let i = 0; i < 3; i++) this.slashes.push({ x: o.x + rnd(-120, 120), y: o.y - rnd(0, 130), a: rnd(-1.4, 1.4), len: rnd(300, 520), t: 0.25, max: 0.25, color: '#ff5252' });
    if (d.id === 'coffin' || d.id === 'singularity') { this.pillars.push({ x: o.x + rnd(-30, 30), y: GROUND, t: 0.6, max: 0.6, color: col }); this.sfx.boom(); }
    if (d.id === 'chimera') { this.pillars.push({ x: o.x + rnd(-50, 50), y: GROUND, t: 0.45, max: 0.45, color: '#7c4dff', w: 26 }); this.zaps.push({ x: o.x, y: o.y - 60, t: 0.15, color: '#b388ff' }); }
    if (d.id === 'sentence' || d.id === 'womb' || d.id === 'sphere') this.rings.push({ x: o.x, y: GROUND, r: 200, t: 0.3, max: 0.3, color: col });
    if (d.id === 'skandha') { this.rings.push({ x: o.x + rnd(-80, 80), y: o.y - rnd(20, 120), r: 90, t: 0.3, max: 0.3, color: col }); this.spark(o.x, o.y - 70, 6, '#b3e5fc', 220, 0.5, 4, -200); }
    if (d.id === 'mutual') { this.slashes.push({ x: o.x + rnd(-60, 60), y: o.y - rnd(10, 130), a: rnd(-1, 1), len: 320, t: 0.22, max: 0.22, color: '#ff6bd6' }); this.zaps.push({ x: o.x, y: o.y - 80, t: 0.15, color: '#fff' }); }
    if (tk.final) {
      this.ring(o.x, o.y - 80, 260, col); this.freeze = 0.12; this.flash = { t: 0.25, max: 0.25, c: '#fff' };
      o.vx = dir * 480; o.vy = -420; o.grounded = false; o.ragdollT = 0.65;
      const perfect = d.perfect >= BEAT_N;
      this.texts.push({ txt: perfect ? 'PERFECT DOMAIN!' : 'DOMAIN COMPLETE', x: o.x, y: o.y - 170, t: 1.0, max: 1.0, color: perfect ? '#ffd24a' : col, size: perfect ? 42 : 34 });
      if (d.id === 'sentence') { o.cd = o.cd.map((v) => v + 6); o.ce = 0; this.texts.push({ txt: 'GUILTY! TECHNIQUE CONFISCATED', x: o.x, y: o.y - 215, t: 1.2, max: 1.2, color: '#ffca28', size: 26 }); this.sfx.gavel(); }
      if (d.id === 'mutual') { f.hp = Math.min(100, f.hp + 8); this.texts.push({ txt: '+8 HP', x: f.x, y: f.y - 170, t: 1, max: 1, color: '#ff6bd6', size: 32 }); }
    }
  }
  hit(att, def, o) {
    if (def.inv > 0 || def.ko) return undefined;
    const dir = def.x >= att.x ? 1 : -1, hx = def.x, hy = def.y - 80;
    if (def.ledge) { def.ledge = null; def.ledgeCd = 2.5; }
    if (def.parryT > 0) {
      def.parryT = 0; def.parryCd = 0.12; def.inv = 0.35; def.flash = 0.12; def.ce = Math.min(100, def.ce + 16);
      att.act = null; att.stun = Math.max(att.stun, 1.35); att.vx = -dir * 260; att.vy = Math.min(att.vy, -120); att.flash = 0.18; att.inv = 0;
      this.impulse(att, -dir * 320, 180);
      this.ring(hx, hy, 165, '#ffd24a'); this.ring(hx, hy, 95, '#fff');
      this.spark(hx, hy, 28, '#ffd24a', 460, 0.55, 6, 150);
      this.texts.push({ txt: 'PARRY!', x: def.x, y: def.y - 165, t: 0.85, max: 0.85, color: '#ffd24a', size: 44 });
      this.texts.push({ txt: 'STUNNED!', x: att.x, y: att.y - 150, t: 0.9, max: 0.9, color: '#ff5252', size: 28 });
      this.sfx.parry(); this.shake = Math.max(this.shake, 18); this.freeze = 0.14; this.flash = { t: 0.12, max: 0.12, c: '#ffd24a' };
      return false;
    }
    if (def.blocking) {
      def.vx = dir * o.kb * 0.35; def.inv = 0.12; def.hp = Math.max(0, def.hp - o.dmg * 0.2); this.gain(att, def, o.dmg * 0.2);
      this.spark(hx - dir * 20, hy, 10, '#4fc3f7', 220, 0.3, 4); this.sfx.block(); this.shake = Math.max(this.shake, 3); this.impulse(def, dir * o.kb * 0.2, 0); return false;
    }
    o = { ...o };
    /* คอมโบหมัดที่ 3 ซัดกระเด็นล้มเป็น Ragdoll! */
    const finisher = o.basic && att.combo >= 2;
    if (finisher) { o.dmg *= 1.35; o.kb = Math.max(o.kb, 620); o.vy = 360; o.stun = Math.max(o.stun, 0.65); o.ragdoll = 0.85; o.big = true; }
    if (o.basic && att.pas.bf && Math.random() < att.pas.bf) { o.fx = 'bf'; o.dmg *= 2.2; o.kb = Math.max(o.kb, 750); o.stun = Math.max(o.stun, 0.65); o.ragdoll = 0.9; o.big = true; o.color = '#ff1744'; }
    const da = this.domAbility(att);
    const domDmg = da && da.isOwner ? (da.ability === 'guilty' ? 1.25 : da.ability === 'mutual' ? 1.2 : da.ability === 'pull' && o.basic ? 1.35 : 1) : 1;
    let dmg = o.dmg * (1 + Math.min(att.combo, 4) * 0.08) * (att.pas.dmg || 1) * (att.amp > 0 ? att.ampMul : 1) * domDmg * (def.pas.guard || 1);
    if (o.basic && att.pas.basic) dmg *= att.pas.basic;
    if (att.pas.crit && Math.random() < att.pas.crit) { dmg *= 1.6; this.texts.push({ txt: 'CRIT!', x: hx, y: hy - 130, t: 0.6, max: 0.6, color: '#ffeb3b', size: 30 }); }
    def.hp = Math.max(0, def.hp - dmg); def.vx = dir * o.kb; def.vy = -(o.vy === undefined ? 260 : o.vy); if (o.vy !== 0) def.grounded = false;
    def.stun = Math.max(def.stun, o.stun); def.act = null; def.inv = 0.2; def.flash = 0.12;
    if (o.ragdoll || o.kb >= 520) def.ragdollT = Math.max(def.ragdollT, o.ragdoll || 0.72);
    att.combo++; att.comboT = 1.3; this.gain(att, def, dmg);
    this.impulse(def, dir * o.kb * (def.ragdollT > 0 ? 1.4 : 1), o.vy === undefined ? 260 : o.vy);
    this.spark(hx, hy, o.big ? 28 : 14, o.color || '#fff', o.big ? 450 : 280, 0.5, 5);
    this.ring(hx, hy, o.big ? 115 : 65, o.big ? (o.color || '#fff') : '#fff');
    (o.big ? (o.kb >= 600 ? this.sfx.heavy : this.sfx.hit) : this.sfx.punch)();
    this.shake = Math.max(this.shake, o.big ? 16 : 8); this.freeze = o.big ? 0.10 : 0.045;
    if (finisher && o.fx !== 'bf') this.texts.push({ txt: 'KNOCKDOWN!', x: hx, y: hy - 95, t: 0.7, max: 0.7, color: '#ffd24a', size: 32 });
    if (o.fx === 'bf') {
      this.sfx.bf(); this.shake = 26; this.freeze = 0.17; this.flash = { t: 0.18, max: 0.18, c: '#000' };
      for (let i = 0; i < 4; i++) this.zaps.push({ x: hx, y: hy, t: 0.35, color: i % 2 ? '#ff1744' : '#111' });
      this.texts.push({ txt: 'BLACK FLASH!', x: hx, y: hy - 90, t: 0.9, max: 0.9, color: '#ff1744', size: 46 });
    } else if (o.fx === 'slash') this.slashes.push({ x: hx, y: hy, a: rnd(-0.7, -0.3), len: 260, t: 0.25, max: 0.25, color: '#fff' });
    else if (o.fx === 'ratio') {
      this.slashes.push({ x: hx, y: hy, a: -0.15, len: 300, t: 0.3, max: 0.3, color: '#ffd54f' }); this.shake = Math.max(this.shake, 16); this.freeze = 0.1;
      this.texts.push({ txt: '7 : 3', x: hx, y: hy - 90, t: 0.8, max: 0.8, color: '#ffd54f', size: 46 });
    } else if (o.fx === 'drain') {
      def.ce = Math.max(0, def.ce - 40); att.hp = Math.min(100, att.hp + 5); this.spark(hx, hy, 18, '#b2ff59', 260, 0.6, 5, -150);
      this.texts.push({ txt: 'SOUL DRAIN', x: hx, y: hy - 90, t: 0.9, max: 0.9, color: '#b2ff59', size: 30 });
    } else if (o.fx === 'nullify') {
      def.ce = 0; def.cd = def.cd.map((v) => v + 3);
      this.texts.push({ txt: 'TECHNIQUE NULLIFIED', x: hx, y: hy - 90, t: 1, max: 1, color: '#b0bec5', size: 30 });
    } else if (o.fx === 'soul') {
      for (let i = 0; i < 2; i++) this.ring(hx, hy, 90 + i * 45, '#9ccc65');
    }
    return true;
  }
  gain(att, def, d) { att.ce = Math.min(100, att.ce + d * (att.pas.ce ?? 1)); def.ce = Math.min(100, def.ce + d * 1.4 * (def.pas.ce ?? 1)); }
  impulse(f, vx, vy) { NAMES.forEach((n) => { const p = f.rig[n], r = rnd(0.5, 1.35); p.ox = p.x - (vx / 55) * r; p.oy = p.y + (vy / 55) * r * 0.7; }); }
  pushAfter(f, color) { this.afters.push({ rig: Object.fromEntries(NAMES.map((n) => [n, { x: f.rig[n].x, y: f.rig[n].y }])), face: f.face, color, gear: f.gear, t: 0.3, max: 0.3 }); if (this.netRole === 'host') this.netEvents.push(['after', f.i, color]); }
  spark(x, y, n, color, spd, life, size, g = 600) {
    if (this.netRole === 'host') this.netEvents.push(['spark', x, y, n, color, spd, life, size, g]);
    for (let i = 0; i < n; i++) { const an = rnd(0, Math.PI * 2), s = rnd(0.2, 1) * spd; this.parts.push({ x, y, vx: Math.cos(an) * s, vy: Math.sin(an) * s, life: rnd(0.5, 1) * life, max: life, color, size: rnd(0.5, 1) * size, g }); }
  }
  ring(x, y, r, color) { this.rings.push({ x, y, r, t: 0.35, max: 0.35, color }); }
  dust(f) { this.spark(f.x, f.y, 8, '#cfd8dc', 160, 0.4, 5, 50); }
  /* ---------------- RAGDOLL RIG & NEW ANIMATIONS ---------------- */
  pose(f) {
    const a = f.act, t = this.time; let P = { lean: 0, crouch: 0, hF: [22, 18], hB: [-10, 24], fF: [14, 0], fB: [-14, 0] };
    if (f.ko || f.ragdollT > 0) return P;
    if (f.ledge) {
      const tug = f.ledge.tug > 0 ? -10 : 0, w = Math.sin(t * 14) * 5;
      return { lean: -4, crouch: 8 + tug, hF: [4, -52], hB: [-4, -50], fF: [8 + w, 46], fB: [-8 - w, 42] };
    }
    if (f.stun > 0) P = { lean: -16, crouch: 2, hF: [-14, 6], hB: [-22, 14], fF: [14, -6], fB: [-14, 0] };
    else if (a && a.name === 'domain' && this.dom?.st === 'open') {
      const sign = DOMAINS[f.dom]?.sign || 'clap';
      if (sign === 'cross') return { lean: -4, crouch: 2, hF: [24, -22], hB: [16, -20], fF: [16, 0], fB: [-16, 0] };
      if (sign === 'enmaten') return { lean: 2, crouch: 6, hF: [22, -6], hB: [20, -4], fF: [20, 0], fB: [-20, 0] };
      if (sign === 'raise') return { lean: -6, crouch: 0, hF: [26, -34], hB: [-18, -32], fF: [18, 0], fB: [-18, 0] };
      if (sign === 'shadow') return { lean: 6, crouch: 12, hF: [30, 0], hB: [26, 8], fF: [24, 0], fB: [-24, 0] };
      if (sign === 'mouth') return { lean: -4, crouch: 4, hF: [24, -14], hB: [-18, -14], fF: [20, 0], fB: [-20, 0] };
      if (sign === 'gavel') return { lean: 4, crouch: 0, hF: [14, -38], hB: [-14, 16], fF: [16, 0], fB: [-16, 0] };
      return { lean: 0, crouch: 4, hF: [26, -18], hB: [24, -16], fF: [18, 0], fB: [-18, 0] };
    }
    else if (a) {
      const sp = spec(a.name), k = clamp(a.t / sp.dur, 0, 1), e = Math.sin(k * Math.PI);
      switch (sp.pose) {
        case 'punch':
          if (k < 0.25) { P = { lean: -6, crouch: 4, hF: [-14, 6], hB: [22, -8], fF: [18, 0], fB: [-18, 0] }; }
          else if (k < 0.62) { P = { lean: 18, crouch: 6, hF: [82, -10], hB: [-20, 10], fF: [28, 0], fB: [-26, 0] }; }
          else { P = { lean: 6, crouch: 2, hF: [34, 4], hB: [-8, 16], fF: [20, 0], fB: [-18, 0] }; }
          break;
        case 'kick':
          if (k < 0.28) { P = { lean: -4, crouch: 4, fF: [16, -26], fB: [-10, 0], hF: [16, -8], hB: [-16, 8] }; }
          else if (k < 0.66) { P = { lean: -18, crouch: 2, fF: [88, -50], fB: [-14, 0], hF: [-16, 6], hB: [26, -14] }; }
          else { P = { lean: -4, crouch: 0, fF: [24, -6], fB: [-12, 0], hF: [14, 12], hB: [-12, 16] }; }
          break;
        case 'fire': P.lean = 15; P.crouch = 4; P.hF = [32 + e * 62, -8]; P.hB = [-16, -10]; P.fF = [28, 0]; P.fB = [-26, 0]; break;
        case 'clap': P.hF = [26, -18]; P.hB = [24, -16]; P.crouch = 4; break;
        default: P.lean = -6; P.hF = [44, 2]; P.hB = [38, 8]; P.fF = [26, 0]; P.fB = [-26, 0];
      }
    } else if (f.climbing) {
      const s = Math.sin(f.anim * 12);
      P = { lean: 2, crouch: 2, hF: [8, -26 + s * 16], hB: [-8, -26 - s * 16], fF: [10, -8 - s * 12], fB: [-10, -8 + s * 12] };
    } else if (f.parryT > 0) P = { lean: -4, crouch: 8, hF: [34, -22], hB: [12, -8], fF: [24, 0], fB: [-18, 0] };
    else if (f.blocking) P = { lean: 0, crouch: 10, hF: [22, -16], hB: [16, -6], fF: [16, 0], fB: [-10, 0] };
    else if (!f.grounded) P = f.vy < 0 ? { lean: 4, crouch: 6, hF: [26, -16], hB: [-20, -14], fF: [22, -20], fB: [-14, -10] } : { lean: -2, crouch: 2, hF: [28, -4], hB: [-24, -8], fF: [18, -10], fB: [-12, -2] };
    else if (Math.abs(f.vx) > 20) { const s = Math.sin(f.anim * 13); P = { lean: 11, crouch: 2, fF: [s * 28, -Math.max(0, -s) * 14], fB: [-s * 28, -Math.max(0, s) * 14], hF: [-s * 22, 22], hB: [s * 22, 22] }; }
    else { const b = Math.sin(t * 5.5 + f.i) * 2.5; P.crouch = 2 + Math.abs(b) * 0.4; P.hF = [26, 12 + b]; P.hB = [-4, 20 - b * 0.5]; }
    return P;
  }
  targets(f, P) {
    const sg = f.face, T = {}; let hip, neck;
    if (f.ko) {
      hip = { x: f.x, y: f.y - 12 }; neck = { x: f.x - sg * 40, y: f.y - 14 };
      T.head = { x: f.x - sg * 58, y: f.y - 16 }; T.fF = { x: f.x + sg * 58, y: f.y - 6 }; T.fB = { x: f.x + sg * 44, y: f.y - 18 };
      T.hF = { x: f.x - sg * 70, y: f.y - 8 }; T.hB = { x: f.x - sg * 30, y: f.y - 26 };
    } else if (f.ragdollT > 0) {
      hip = { x: f.x, y: f.y - 34 }; neck = { x: f.x - sg * 24, y: f.y - 54 };
      T.head = { x: neck.x - sg * 14, y: neck.y - 10 };
      T.fF = { x: f.x + sg * 36, y: f.y - 6 }; T.fB = { x: f.x + sg * 24, y: f.y - 20 };
      T.hF = { x: neck.x - sg * 24, y: neck.y - 18 }; T.hB = { x: neck.x + sg * 12, y: neck.y - 26 };
    } else {
      hip = { x: f.x, y: f.y - 60 + P.crouch }; neck = { x: f.x + sg * P.lean, y: hip.y - Math.sqrt(Math.max(400, 1600 - P.lean * P.lean)) };
      T.head = { x: neck.x + sg * P.lean * 0.3, y: neck.y - 17 };
      T.fF = { x: f.x + sg * P.fF[0], y: f.y + P.fF[1] }; T.fB = { x: f.x + sg * P.fB[0], y: f.y + P.fB[1] };
      const sh = { x: neck.x, y: neck.y + 4 };
      T.hF = { x: sh.x + sg * P.hF[0], y: sh.y + P.hF[1] }; T.hB = { x: sh.x + sg * P.hB[0], y: sh.y + P.hB[1] };
      if (!f.ledge) { lim(T.fF, hip, 62); lim(T.fB, hip, 62); }
      lim(T.hF, sh, 62); lim(T.hB, sh, 62);
    }
    T.hip = hip; T.neck = neck; const sh2 = { x: neck.x, y: neck.y + 4 };
    T.kF = bend(hip, T.fF, 32, sg, 0.3); T.kB = bend(hip, T.fB, 32, sg, 0.3);
    T.eF = bend(sh2, T.hF, 30, -sg * 0.3, 1); T.eB = bend(sh2, T.hB, 30, -sg * 0.3, 1);
    return T;
  }
  updateRig(f, dt) {
    const T = this.targets(f, this.pose(f)), R = f.rig;
    const targetRag = f.ko ? 1 : f.ragdollT > 0 ? 1 : f.stun > 0 ? 0.8 : 0;
    f.rag += (targetRag - f.rag) * Math.min(1, dt * 14);
    if (Math.hypot(R.hip.x - f.x, R.hip.y - f.y) > 260) NAMES.forEach((n) => Object.assign(R[n], { x: T[n].x, y: T[n].y, ox: T[n].x, oy: T[n].y }));
    for (const n of NAMES) {
      const p = R[n], q = T[n], r = RATE[n] || [26, 2.5], k = 1 - Math.exp(-(r[0] + (r[1] - r[0]) * f.rag) * dt);
      const m = Math.pow(RATE[n] ? 0.75 : 0.55 + 0.42 * f.rag, dt * 60), vx = (p.x - p.ox) * m, vy = (p.y - p.oy) * m;
      p.ox = p.x; p.oy = p.y; p.x += vx + (q.x - p.x) * k; p.y += vy + (q.y - p.y) * k + 1900 * dt * dt * f.rag;
    }
    for (let it = 0; it < 3; it++) for (const [a, b, L] of BONES) {
      const A = R[a], B = R[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, df = ((d - L) / d) * 0.5;
      A.x += dx * df; A.y += dy * df; B.x -= dx * df; B.y -= dy * df;
    }
    const surf = f.floorY;
    if (surf !== null && !f.climbing && !f.ledge && f.dropT <= 0 && f.y <= surf + 6) {
      for (const n of NAMES) { const p = R[n]; if (p.y > surf) { p.y = surf; p.oy = surf; p.ox = p.x - (p.x - p.ox) * 0.6; } }
    }
  }
  /* ---------------- RENDER ---------------- */
  render() {
    const c = this.c, s = this.shake;
    c.save(); c.translate(rnd(-s, s), rnd(-s, s));
    this.drawBg(); this.drawFloor();
    if (this.dom) this.drawDomain();
    if (this.cutscene) { c.save(); c.fillStyle = 'rgba(4, 2, 12, 0.78)'; c.fillRect(-30, -30, W + 60, H + 60); c.restore(); }
    this.drawPlatformsAndClimbs();
    this.warns.forEach((w) => {
      const k = 1 - w.t / w.max;
      c.save(); c.strokeStyle = w.color; c.fillStyle = w.color; c.shadowColor = w.color; c.shadowBlur = 18; c.lineWidth = 3;
      c.beginPath(); c.ellipse(w.x, w.y + 4, w.r, w.r * 0.22, 0, 0, 7);
      c.globalAlpha = 0.14 + 0.14 * Math.abs(Math.sin(this.time * 16)); c.fill(); c.globalAlpha = 0.9; c.stroke();
      c.beginPath(); c.ellipse(w.x, w.y + 4, w.r * (1 - k * 0.85), w.r * 0.22 * (1 - k * 0.85), 0, 0, 7); c.stroke();
      if (w.name === 'meteor') {
        const my = w.y - (1 - k) * 520 - 40;
        this.drawOrb(w.x, my, 46, '#ff6d00');
        c.fillStyle = '#3e1a0d'; c.beginPath(); c.arc(w.x, my, 24, 0, 7); c.fill();
      }
      c.restore();
    });
    this.afters.forEach((a) => this.drawRig(a.rig, a.color, (a.t / a.max) * 0.4, a.face, false, a.gear));
    this.fighters.forEach((f) => this.drawFighter(f));
    this.proj.forEach((p) => this.drawProj(p));
    this.orbs.forEach((o) => this.drawBlue(o));
    this.beams.forEach((b) => this.drawBeam(b));
    this.arcs.forEach((ar) => {
      const k = ar.t / ar.max;
      c.save(); c.globalAlpha = k; c.strokeStyle = ar.color; c.shadowColor = ar.color; c.shadowBlur = 24;
      c.lineWidth = (ar.kind === 'punch' ? 10 : 14) * k + 2;
      c.beginPath();
      if (ar.kind === 'punch') {
        c.arc(ar.x, ar.y, ar.r * (1.2 - k * 0.3), ar.face > 0 ? -0.65 : Math.PI - 0.65, ar.face > 0 ? 0.65 : Math.PI + 0.65);
      } else if (ar.face > 0) c.arc(ar.x, ar.y, ar.r, -1.15, 0.95);
      else c.arc(ar.x, ar.y, ar.r, Math.PI - 0.95, Math.PI + 1.15);
      c.stroke();
      c.lineWidth = 4 * k; c.strokeStyle = '#fff'; c.stroke();
      c.restore();
    });
    this.slashes.forEach((s2) => {
      const k = s2.t / s2.max; c.save(); c.translate(s2.x, s2.y); c.rotate(s2.a); c.globalAlpha = Math.max(0, k); c.shadowColor = s2.color; c.shadowBlur = 22; c.fillStyle = '#fff';
      const L = s2.len * (1.25 - k * 0.4), w = 8 * k + 1.5; c.beginPath(); c.moveTo(-L / 2, 0); c.quadraticCurveTo(0, -w * 2, L / 2, 0); c.quadraticCurveTo(0, w * 2, -L / 2, 0); c.fill();
      c.strokeStyle = s2.color; c.lineWidth = 2; c.stroke(); c.restore();
    });
    this.pillars.forEach((p) => {
      const k = p.t / p.max, baseY = p.y ?? GROUND, w = (p.w || 60) * Math.sin((1 - k) * Math.PI * 0.9 + 0.2), g = c.createLinearGradient(0, baseY, 0, baseY - 460);
      g.addColorStop(0, '#fff'); g.addColorStop(0.3, p.color); g.addColorStop(1, p.color + '00'); c.fillStyle = g; c.fillRect(p.x - w, baseY - 460, w * 2, 460);
    });
    this.zaps.forEach((z) => {
      c.strokeStyle = z.color; c.lineWidth = 3; c.shadowColor = z.color; c.shadowBlur = 14;
      for (let i = 0; i < 6; i++) { let x = z.x, y = z.y, an = rnd(0, 6.28); c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { an += rnd(-0.8, 0.8); x += Math.cos(an) * 28; y += Math.sin(an) * 28; c.lineTo(x, y); } c.stroke(); }
      c.shadowBlur = 0;
    });
    this.rings.forEach((r) => { const k = 1 - r.t / r.max; c.strokeStyle = r.color; c.lineWidth = 6 * (1 - k) + 1; c.globalAlpha = 1 - k; c.beginPath(); c.ellipse(r.x, r.y, r.r * k, r.r * k * 0.6, 0, 0, 7); c.stroke(); c.globalAlpha = 1; });
    this.parts.forEach((p) => { c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.color; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); });
    c.globalAlpha = 1;
    this.fighters.forEach((f) => f.ledge && this.drawLedgeQTE(f));
    if (this.cutscene) this.drawCutsceneOverlay();
    this.texts.forEach((t) => { c.globalAlpha = Math.min(1, t.t / t.max * 2); c.font = `${t.size}px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = '#000'; c.strokeText(t.txt, t.x, t.y); c.fillStyle = t.color; c.fillText(t.txt, t.x, t.y); });
    c.globalAlpha = 1; c.restore();
    if (this.flash) { c.globalAlpha = (this.flash.t / this.flash.max) * 0.7; c.fillStyle = this.flash.c; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    this.drawHud(); if (this.dom) this.drawDomainIntro();
    this.drawClashHud();
  }
  drawLedgeQTE(f) {
    const c = this.c, L = f.ledge, x = clamp(L.x + L.side * 10, 95, W - 95), y = GROUND - 58;
    const rem = clamp(1 - L.t / L.dur, 0, 1), prog = clamp(L.progress / L.need, 0, 1);
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,0.82)'; c.fillRect(x - 86, y - 34, 172, 54);
    c.strokeStyle = '#ffd24a'; c.lineWidth = 2; c.strokeRect(x - 86, y - 34, 172, 54);
    c.font = `13px ${FONT}`; c.fillStyle = '#ffd24a'; c.fillText(`MASH JUMP/PUNCH! (${L.progress}/${L.need})`, x, y - 16);
    c.fillStyle = '#222'; c.fillRect(x - 74, y - 2, 148, 10);
    c.fillStyle = '#7dff6b'; c.fillRect(x - 74, y - 2, 148 * prog, 10);
    c.fillStyle = '#ff5252'; c.fillRect(x - 74, y + 11, 148 * rem, 4);
    c.restore();
  }
  drawOrb(x, y, r, col) { const c = this.c, g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, '#fff'); g.addColorStop(0.35, col); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  drawBeam(b) {
    const c = this.c, k = b.t / b.max, th = b.th * (0.2 + 0.8 * k), x2 = b.d > 0 ? W + 80 : -80;
    const xMin = Math.min(b.x, x2), len = Math.abs(x2 - b.x);
    const g = c.createLinearGradient(0, b.y - th / 2, 0, b.y + th / 2);
    g.addColorStop(0, b.color + '00'); g.addColorStop(0.3, b.color); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.7, b.color); g.addColorStop(1, b.color + '00');
    c.save(); c.shadowColor = b.color; c.shadowBlur = 40; c.fillStyle = g; c.fillRect(xMin, b.y - th / 2, len, th);
    if (b.style === 'purple') {
      c.lineWidth = 4;
      for (let s = 0; s < 2; s++) {
        c.strokeStyle = s ? '#ff3d3d' : '#40c4ff'; c.beginPath();
        for (let dx = 0; dx <= len; dx += 24) {
          const px = b.x + b.d * dx, py = b.y + Math.sin(dx * 0.03 - this.time * 24 + s * Math.PI) * th * 0.55;
          dx === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
        }
        c.stroke();
      }
    } else if (b.style === 'uzumaki') {
      c.strokeStyle = '#b9f6ca'; c.lineWidth = 3;
      for (let dx = 40; dx < len; dx += 90) { const px = b.x + b.d * ((dx + this.time * 500) % len); c.beginPath(); c.ellipse(px, b.y, 16, th * 0.65, 0, 0, 7); c.stroke(); }
    } else if (b.style === 'piercing') {
      c.strokeStyle = '#fff'; c.lineWidth = 2;
      for (let dx = 45; dx < len; dx += 110) { const px = b.x + b.d * dx; c.beginPath(); c.moveTo(px, b.y); c.lineTo(px - b.d * 34, b.y - th * 1.4); c.moveTo(px, b.y); c.lineTo(px - b.d * 34, b.y + th * 1.4); c.stroke(); }
    } else if (b.style === 'rika') {
      c.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) { const px = b.x + b.d * (((i * 150 + this.time * 700) % len)); c.beginPath(); c.moveTo(px, b.y - 10); c.lineTo(px + 10, b.y); c.lineTo(px, b.y + 10); c.lineTo(px - 10, b.y); c.closePath(); c.fill(); }
    }
    c.restore(); this.drawOrb(b.x, b.y, th * 0.85, b.color);
  }
  drawProj(p) {
    const c = this.c, sg = Math.sign(p.vx) || p.face || 1;
    if (p.kind === 'dog') {
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1); c.shadowColor = p.color; c.shadowBlur = 16; c.fillStyle = '#0a0a12'; c.strokeStyle = p.color; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, 30, 14, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(30, -8, 12, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(26, -17); c.lineTo(30, -30); c.lineTo(35, -17); c.fill(); c.stroke();
      const s = Math.sin(this.time * 30); c.lineWidth = 5; c.beginPath(); c.moveTo(18, 8); c.lineTo(18 + s * 10, 22); c.moveTo(-18, 8); c.lineTo(-18 - s * 10, 22); c.stroke();
      c.fillStyle = '#fff'; c.fillRect(34, -11, 4, 3); c.restore(); return;
    }
    if (p.style === 'chain') {
      c.save(); c.strokeStyle = '#cfd8dc'; c.lineWidth = 4; c.setLineDash([10, 6]);
      c.beginPath(); c.moveTo(p.sx, p.sy); c.lineTo(p.x, p.y); c.stroke(); c.setLineDash([]);
      c.translate(p.x, p.y); c.scale(sg, 1); c.fillStyle = '#fff'; c.shadowColor = '#90a4ae'; c.shadowBlur = 14;
      c.beginPath(); c.moveTo(18, 0); c.lineTo(-12, -8); c.lineTo(-6, 0); c.lineTo(-12, 8); c.closePath(); c.fill(); c.restore(); return;
    }
    if (p.style === 'nail') {
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1); c.shadowColor = p.color; c.shadowBlur = 14; c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(20, 0); c.lineTo(-18, -3); c.lineTo(-22, -6); c.lineTo(-22, 6); c.lineTo(-18, 3); c.closePath(); c.fill();
      c.strokeStyle = p.color; c.lineWidth = 2; c.beginPath(); c.moveTo(-18, 0); c.lineTo(-65, 0); c.stroke(); c.restore(); return;
    }
    if (p.style === 'firearrow') {
      this.drawOrb(p.x, p.y, p.r * 2.1, p.color);
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1); c.fillStyle = '#fff'; c.shadowColor = '#ff9100'; c.shadowBlur = 22;
      c.beginPath(); c.moveTo(32, 0); c.lineTo(-18, -10); c.lineTo(-10, 0); c.lineTo(-18, 10); c.closePath(); c.fill();
      c.strokeStyle = '#ffd54f'; c.lineWidth = 4; c.beginPath(); c.moveTo(-10, 0); c.lineTo(-95, 0); c.stroke(); c.restore(); return;
    }
    if (p.style === 'sonic') {
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1); c.strokeStyle = '#fff'; c.shadowColor = '#80d8ff'; c.shadowBlur = 18;
      for (let i = 0; i < 3; i++) { c.lineWidth = 5 - i; c.globalAlpha = 1 - i * 0.25; c.beginPath(); c.arc(-i * 18, 0, p.r * (0.9 - i * 0.15), -1.1, 1.1); c.stroke(); }
      c.restore(); return;
    }
    if (p.style === 'insect') {
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1); c.fillStyle = '#ff6d00'; c.shadowColor = '#ffab00'; c.shadowBlur = 12;
      const w = Math.sin(this.time * 45) * 8;
      c.beginPath(); c.ellipse(0, 0, 10, 6, 0, 0, 7); c.fill();
      c.fillStyle = '#ffe082'; c.beginPath(); c.ellipse(-2, -7 + w * 0.3, 9, 4, -0.4, 0, 7); c.fill(); c.restore(); return;
    }
    if (p.style === 'wave') {
      this.drawOrb(p.x, p.y, p.r * 1.6, p.color);
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1); c.fillStyle = '#0288d1'; c.strokeStyle = '#e1f5fe'; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 6, p.r, Math.PI * 0.9, Math.PI * 2.15); c.quadraticCurveTo(10, -10, -p.r, 10); c.closePath(); c.fill(); c.stroke(); c.restore(); return;
    }
    if (p.style === 'fish') {
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1); c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = 12;
      c.beginPath(); c.ellipse(0, 0, 15, 7, 0, 0, 7); c.moveTo(-12, 0); c.lineTo(-24, -8); c.lineTo(-24, 8); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.fillRect(6, -3, 3, 3); c.restore(); return;
    }
    if (p.style === 'spirit') {
      this.drawOrb(p.x, p.y, p.r * 1.4, p.color);
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1); c.fillStyle = '#1a0e2e'; c.strokeStyle = p.color; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 13, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#ffeb3b'; c.fillRect(3, -4, 4, 4); c.restore(); return;
    }
    const g = c.createLinearGradient(p.x, 0, p.x - sg * 120, 0); g.addColorStop(0, p.color); g.addColorStop(1, p.color + '00');
    c.fillStyle = g; c.fillRect(Math.min(p.x, p.x - sg * 120), p.y - p.r * 0.5, 120, p.r); this.drawOrb(p.x, p.y, p.r * 1.5, p.color);
    if (p.style === 'red') { c.save(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y, p.r * 1.1, p.r * 0.45, this.time * 12, 0, 7); c.stroke(); c.restore(); }
  }
  drawBlue(o) {
    const c = this.c, r = 38 + Math.sin(o.t * 20) * 3;
    for (let i = 0; i < 3; i++) { const k = (o.t * 2 + i / 3) % 1; c.strokeStyle = o.color; c.globalAlpha = k; c.lineWidth = 3; c.beginPath(); c.ellipse(o.x, o.y, 150 * (1 - k), 150 * (1 - k), 0, 0, 7); c.stroke(); }
    c.globalAlpha = 1; this.drawOrb(o.x, o.y, r * 1.8, o.color); c.fillStyle = '#021a3a'; c.beginPath(); c.arc(o.x, o.y, r * 0.55, 0, 7); c.fill();
  }
  drawSkinGear(R, col, face, gear) {
    if (!gear) return;
    const c = this.c, hx = R.head.x, hy = R.head.y, nx = R.neck.x, ny = R.neck.y, px = R.hip.x, py = R.hip.y;
    if (gear === 'halo') {
      c.strokeStyle = '#ffd24a'; c.lineWidth = 2.5; c.beginPath(); c.arc(hx, hy, 22, 0, 7); c.stroke();
    } else if (gear === 'wheel') {
      c.save(); c.translate(hx, hy - 22); c.rotate(this.time * 2.5);
      c.strokeStyle = '#ffd24a'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); c.stroke(); }
      c.restore();
    } else if (gear === 'whitecoat' || gear === 'shadowcape' || gear === 'robe') {
      c.fillStyle = gear === 'whitecoat' ? 'rgba(243,239,230,0.45)' : gear === 'robe' ? 'rgba(65,24,104,0.55)' : 'rgba(18,12,35,0.6)';
      c.beginPath(); c.moveTo(nx - face * 6, ny); c.lineTo(px - face * 22, py + 18); c.lineTo(px + face * 10, py + 12); c.lineTo(nx + face * 6, ny); c.closePath(); c.fill();
    } else if (gear === 'blindfold') {
      c.fillStyle = '#05030a'; c.fillRect(hx - 14, hy - 7, 28, 7);
    } else if (gear === 'sunglasses') {
      c.fillStyle = '#000'; c.strokeStyle = '#3dd6ff'; c.lineWidth = 1.5; c.fillRect(hx - 10 + face * 4, hy - 6, 16, 6); c.strokeRect(hx - 10 + face * 4, hy - 6, 16, 6);
    } else if (gear === 'eyepatch') {
      c.fillStyle = '#111'; c.fillRect(hx + face * 2, hy - 6, 9, 6); c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx - 12, hy - 8); c.lineTo(hx + 12, hy - 1); c.stroke();
    } else if (gear === 'tattoos' || gear === 'heian') {
      c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(nx - 6, ny + 12); c.lineTo(nx + 6, ny + 12); c.moveTo(nx - 6, ny + 22); c.lineTo(nx + 6, ny + 22); c.stroke();
      if (gear === 'heian') { c.fillStyle = '#ff1744'; c.fillRect(hx + face * 4, hy - 7, 4, 3); c.fillRect(hx + face * 4, hy - 1, 4, 3); }
    } else if (gear === 'hoodie') {
      c.fillStyle = '#ff2d55'; c.beginPath(); c.arc(nx, ny + 2, 10, 0, Math.PI); c.fill();
    } else if (gear === 'bfwrap' || gear === 'claws') {
      c.fillStyle = '#ff1744'; c.beginPath(); c.arc(R.hF.x, R.hF.y, 7, 0, 7); c.arc(R.hB.x, R.hB.y, 6, 0, 7); c.fill();
    } else if (gear === 'scarf') {
      c.strokeStyle = '#ff2d55'; c.lineWidth = 5; c.beginPath(); c.moveTo(nx - 10, ny + 3); c.lineTo(nx + 10, ny + 3); c.lineTo(nx - face * 16, ny + 18); c.stroke();
    } else if (gear === 'fur') {
      c.strokeStyle = '#ff80ab'; c.lineWidth = 9; c.beginPath(); c.moveTo(nx - 12, ny + 4); c.lineTo(nx + 12, ny + 4); c.stroke();
    } else if (gear === 'worm') {
      c.strokeStyle = '#c46bff'; c.lineWidth = 6; c.beginPath(); c.arc(nx, ny + 8, 13, 0.2, Math.PI - 0.2); c.stroke();
    } else if (gear === 'stitches') {
      c.strokeStyle = '#111'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx - 11, hy - 8); c.lineTo(hx + 11, hy - 8); c.stroke();
    }
  }
  drawRig(R, col, alpha, face, ko, gear) {
    const c = this.c, L = (a, b) => { c.beginPath(); c.moveTo(R[a].x, R[a].y); c.lineTo(R[b].x, R[b].y); c.stroke(); };
    c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowColor = col; c.shadowBlur = 14;
    c.globalAlpha = alpha * 0.7; L('hip', 'kB'); L('kB', 'fB'); L('neck', 'eB'); L('eB', 'hB');
    c.globalAlpha = alpha; c.lineWidth = 9; L('neck', 'hip'); c.lineWidth = 8;
    c.fillStyle = '#0b0b14'; c.beginPath(); c.arc(R.head.x, R.head.y, 15, 0, 7); c.fill(); c.stroke(); c.fillStyle = col;
    if (ko) { c.lineWidth = 2; c.beginPath(); c.moveTo(R.head.x + face * 3, R.head.y - 5); c.lineTo(R.head.x + face * 9, R.head.y); c.moveTo(R.head.x + face * 9, R.head.y - 5); c.lineTo(R.head.x + face * 3, R.head.y); c.stroke(); c.lineWidth = 8; }
    else { c.beginPath(); c.arc(R.head.x + face * 6, R.head.y - 2, 2.5, 0, 7); c.fill(); }
    L('hip', 'kF'); L('kF', 'fF'); L('neck', 'eF'); L('eF', 'hF');
    ['kF', 'eF', 'kB', 'eB'].forEach((n) => { c.beginPath(); c.arc(R[n].x, R[n].y, 4.5, 0, 7); c.fill(); });
    this.drawSkinGear(R, col, face, gear);
    c.restore();
  }
  drawFighter(f) {
    const c = this.c, col = f.flash > 0 ? '#fff' : f.color, a = f.act, sp = a && spec(a.name);
    if (f.floorY !== null && !f.ledge) {
      const k = Math.max(0.3, 1 - Math.max(0, f.floorY - f.y) / 300);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(f.x, f.floorY + 4, 30 * k, 7 * k, 0, 0, 7); c.fill();
    }
    this.drawRig(f.rig, col, f.inv > 0 && f.flash <= 0 && f.act?.name !== 'domain' ? 0.65 : 1, f.face, f.ko, f.gear);
    if (f.parryT > 0) {
      c.save(); c.strokeStyle = '#ffd24a'; c.shadowColor = '#ffd24a'; c.shadowBlur = 22; c.lineWidth = 5; c.globalAlpha = 0.85;
      c.beginPath(); c.arc(f.x + f.face * 16, f.y - 72, 48, f.face > 0 ? -1.1 : Math.PI - 1.1, f.face > 0 ? 1.1 : Math.PI + 1.1); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.restore();
    } else if (f.blocking) {
      c.save(); c.strokeStyle = '#4fc3f7'; c.globalAlpha = 0.55; c.lineWidth = 4;
      c.beginPath(); c.arc(f.x + f.face * 16, f.y - 72, 42, f.face > 0 ? -0.9 : Math.PI - 0.9, f.face > 0 ? 0.9 : Math.PI + 0.9); c.stroke(); c.restore();
    }
    if (f.aura > 0) {
      c.save(); c.globalAlpha = Math.min(1, f.aura / 0.3) * (0.55 + 0.25 * Math.sin(this.time * 20)); c.strokeStyle = f.auraC; c.lineWidth = 4; c.shadowColor = f.auraC; c.shadowBlur = 22;
      c.beginPath(); c.ellipse(f.x, f.y - 65, 52, 84, 0, 0, 7); c.stroke(); c.restore();
    }
    if (sp && sp.charge && a.t < sp.fireAt) {
      const k = a.t / sp.fireAt, x = f.x + f.face * 52, y = f.y - 86, r = sp.charge * k;
      if (a.name === 'purple' || a.name === 'hollowmax') for (let i = 0; i < 2; i++) { const an = this.time * 10 + i * Math.PI, d = r * (1.6 - k); this.drawOrb(x + Math.cos(an) * d, y + Math.sin(an) * d, r * 0.55, i ? '#ff3d3d' : '#40c4ff'); }
      this.drawOrb(x, y, r, sp.color);
    }
    if (a && (a.name === 'blackflash' || a.name === 'maxbf') && a.t < 0.32) this.zaps.length < 12 && this.zaps.push({ x: f.rig.hF.x, y: f.rig.hF.y, t: 0.05, color: '#ff1744' });
    if (a && (a.name === 'cleave' || a.name === 'malevolentcut') && a.t > 0.12 && a.t < 0.32) this.drawOrb(f.rig.hF.x, f.rig.hF.y, 30, sp.color || '#ffffff');
  }
  drawPlatformsAndClimbs() {
    const c = this.c, climbs = this.arena.climbs || [], plats = this.arena.platforms || [];
    climbs.forEach((cl) => {
      c.save();
      if (cl.kind === 'vine') {
        c.strokeStyle = '#388e3c'; c.lineWidth = 7; c.lineCap = 'round';
        c.beginPath();
        for (let y = cl.y1; y <= cl.y2; y += 14) { const wx = cl.x + Math.sin(y * 0.06 + this.time * 2) * 4; y === cl.y1 ? c.moveTo(wx, y) : c.lineTo(wx, y); }
        c.stroke(); c.fillStyle = '#81c784';
        for (let y = cl.y1 + 22; y < cl.y2 - 14; y += 30) { const s = (y % 60 < 30 ? 1 : -1), wx = cl.x + Math.sin(y * 0.06 + this.time * 2) * 4; c.beginPath(); c.ellipse(wx + s * 9, y, 8, 4, s * 0.4, 0, 7); c.fill(); }
      } else {
        c.strokeStyle = '#ffd24a'; c.shadowColor = '#ffd24a'; c.shadowBlur = 10; c.lineWidth = 3;
        for (let y = cl.y1 + 8; y < cl.y2; y += 18) { c.beginPath(); c.ellipse(cl.x, y, 5, 9, 0, 0, 7); c.stroke(); }
      }
      c.restore();
    });
    plats.forEach((p, idx) => {
      const w = p.x2 - p.x1, cx = (p.x1 + p.x2) / 2, bob = Math.sin(this.time * 1.8 + idx) * 2;
      c.save();
      const rg = c.createLinearGradient(0, p.y, 0, p.y + 44);
      rg.addColorStop(0, p.theme === 'shrine' ? '#455a64' : '#37474f'); rg.addColorStop(1, '#101820');
      c.fillStyle = rg; c.beginPath();
      c.moveTo(p.x1 + 4, p.y + 6); c.lineTo(p.x2 - 4, p.y + 6); c.lineTo(cx + w * 0.24, p.y + 38 + bob); c.lineTo(cx, p.y + 48 + bob); c.lineTo(cx - w * 0.26, p.y + 34 + bob); c.closePath(); c.fill();
      c.fillStyle = p.theme === 'shrine' ? '#546e7a' : '#2e7d32'; c.fillRect(p.x1, p.y - 3, w, 11);
      c.shadowColor = this.arena.edge; c.shadowBlur = 14; c.fillStyle = this.arena.edge; c.fillRect(p.x1, p.y - 3, w, 4);
      c.restore();
    });
  }
  drawBg() {
    const c = this.c, A = this.arena, t = this.time, D = this.deco;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, A.top); g.addColorStop(0.78, A.bot); g.addColorStop(1, A.top);
    c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
    if (A.stars) { c.fillStyle = '#fff'; D.st.forEach((s) => { c.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.3 + s.x)); c.fillRect(s.x, s.y, s.s, s.s); }); c.globalAlpha = 1; }
    (A.orbs || []).forEach((o) => this.drawOrb(o.x, o.y, o.r, o.c));
    if (A.extra === 'aurora') ['#00ffa6', '#7c4dff', '#00e5ff'].forEach((col, k) => {
      c.globalAlpha = 0.22; c.fillStyle = col; c.beginPath(); c.moveTo(0, 0);
      for (let x = 0; x <= W; x += 40) c.lineTo(x, 110 + k * 45 + Math.sin(x * 0.006 + t * 0.6 + k) * 40);
      for (let x = W; x >= 0; x -= 40) c.lineTo(x, 200 + k * 45 + Math.sin(x * 0.005 + t * 0.4 + k * 2) * 50); c.fill();
    });
    c.globalAlpha = 1;
    if (A.clouds) { c.fillStyle = 'rgba(255,255,255,.75)'; D.cl.forEach((k) => { const x = ((k.x + t * k.v) % (W + 400)) - 200; c.beginPath(); c.ellipse(x, k.y, k.s, k.s * 0.3, 0, 0, 7); c.ellipse(x + k.s * 0.5, k.y - 10, k.s * 0.6, k.s * 0.3, 0, 0, 7); c.fill(); }); }
    (A.mount || []).forEach((m) => {
      c.fillStyle = m.c; c.beginPath(); c.moveTo(0, GROUND);
      for (let x = 0; x <= W; x += 16) c.lineTo(x, GROUND - m.base - m.amp * (0.6 * Math.sin(x * m.f + m.s) + 0.4 * Math.sin(x * m.f * 2.3 + m.s * 2)) * 0.5 - m.amp * 0.5);
      c.lineTo(W, GROUND); c.fill();
    });
    if (A.city) D.b.forEach((b, bi) => {
      const top = GROUND - b.h, sl = A.city.broken ? (bi % 3) * 26 : 0; c.fillStyle = A.city.c; c.beginPath();
      c.moveTo(b.x, GROUND); c.lineTo(b.x, top + sl); c.lineTo(b.x + b.w * 0.5, top - sl * 0.3); c.lineTo(b.x + b.w, top + sl * 1.7); c.lineTo(b.x + b.w, GROUND); c.fill();
      for (let yy = top + 50; yy < GROUND - 20; yy += 22) for (let xx = b.x + 8; xx < b.x + b.w - 12; xx += 16)
        if (((xx * 7 + yy * 3 + bi) | 0) % 5 < 2) { c.fillStyle = (xx + yy) % 2 ? A.city.w[0] : A.city.w[1]; c.fillRect(xx, yy, 7, 10); }
      c.fillStyle = A.city.w[bi % 2]; c.fillRect(b.x, top + sl, b.w, 3);
    });
    this.drawExtra(A.extra, t);
    if (A.parts) D.e.forEach((e) => {
      const fall = A.parts.t !== 'ember', y = (((fall ? e.y + t * e.v : e.y - t * e.v) % H) + H) % H;
      c.globalAlpha = 0.8; c.fillStyle = A.parts.c; const x = e.x + Math.sin(t + e.y) * 14;
      if (A.parts.t === 'data') c.fillRect(x, y, 2, e.s * 5); else if (A.parts.t === 'petal') { c.beginPath(); c.ellipse(x, y, e.s * 1.6, e.s, t + e.x, 0, 7); c.fill(); } else c.fillRect(x, y, e.s, e.s);
      c.globalAlpha = 1;
    });
  }
  drawExtra(x, t) {
    const c = this.c;
    if (x === 'sanctum') {
      [[90, 180, 70], [380, 145, 55], [910, 155, 65], [1180, 210, 75]].forEach(([ix, iy, iw], k) => {
        const yy = iy + Math.sin(t * 1.1 + k) * 6;
        c.fillStyle = '#1b2c44'; c.beginPath(); c.moveTo(ix - iw, yy); c.lineTo(ix + iw, yy); c.lineTo(ix + iw * 0.3, yy + 36); c.lineTo(ix - iw * 0.4, yy + 28); c.closePath(); c.fill();
        c.fillStyle = '#2e7d32'; c.fillRect(ix - iw, yy - 4, iw * 2, 6);
      });
      c.fillStyle = 'rgba(128, 222, 234, 0.25)'; c.fillRect(615, 245, 50, H - 245);
      c.fillStyle = '#1f2d3d'; c.fillRect(585, 165, 16, 80); c.fillRect(679, 165, 16, 80); c.fillRect(565, 155, 150, 14);
    } else if (x === 'columns') {
      c.fillStyle = '#efe5d1'; c.fillRect(200, GROUND - 300, 880, 26); c.beginPath(); c.moveTo(180, GROUND - 300); c.lineTo(640, GROUND - 400); c.lineTo(1100, GROUND - 300); c.fill();
      for (let i = 0; i < 7; i++) { c.fillStyle = '#efe5d1'; c.fillRect(230 + i * 135, GROUND - 275, 34, 275); c.fillStyle = '#c9bca4'; c.fillRect(256 + i * 135, GROUND - 275, 8, 275); }
    } else if (x === 'torii') {
      c.fillStyle = '#12091c'; for (let i = 0; i < 5; i++) c.fillRect(60 + i * 8, GROUND - 50 - i * 46, 150 - i * 16, 46);
      c.fillStyle = '#c62828'; c.shadowColor = '#ff5252'; c.shadowBlur = 20;
      c.fillRect(440, GROUND - 300, 30, 300); c.fillRect(810, GROUND - 300, 30, 300); c.fillRect(400, GROUND - 305, 480, 26); c.fillRect(425, GROUND - 255, 430, 16); c.shadowBlur = 0;
    } else if (x === 'grid') {
      c.strokeStyle = this.arena.edge; c.globalAlpha = 0.3; c.lineWidth = 1;
      for (let xx = -600; xx <= W + 600; xx += 90) { c.beginPath(); c.moveTo(W / 2, 250); c.lineTo(xx, GROUND); c.stroke(); }
      for (let k = 0; k < 9; k++) { const y = 250 + (GROUND - 250) * Math.pow((k + ((t * 0.3) % 1)) / 9, 2); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.globalAlpha = 1;
    } else if (x === 'graves') {
      c.fillStyle = '#0d0714'; this.deco.g.forEach((g) => {
        c.beginPath(); c.moveTo(g.x - 18, GROUND); c.lineTo(g.x - 18, GROUND - g.h + 14); c.arc(g.x, GROUND - g.h + 14, 18, Math.PI, 0); c.lineTo(g.x + 18, GROUND); c.fill();
        if (g.k === 0) { c.fillRect(g.x - 3, GROUND - g.h - 40, 6, 44); c.fillRect(g.x - 14, GROUND - g.h - 28, 28, 6); }
      });
      for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(179,136,255,.10)'; c.beginPath(); c.ellipse(((i * 300 + t * 20) % (W + 400)) - 200, GROUND - 25, 220, 28, 0, 0, 7); c.fill(); }
    } else if (x === 'lava') {
      const lg = c.createLinearGradient(0, GROUND + 40, 0, H); lg.addColorStop(0, '#ff6d0000'); lg.addColorStop(1, '#ff6d00'); c.fillStyle = lg; c.fillRect(0, GROUND + 40, W, H);
    }
  }
  drawFloor() {
    const c = this.c, A = this.arena, g = c.createLinearGradient(0, GROUND, 0, GROUND + 130); g.addColorStop(0, A.floor); g.addColorStop(1, 'rgba(0,0,0,.85)');
    c.fillStyle = g; c.beginPath(); c.moveTo(STAGE_L, GROUND); c.lineTo(STAGE_R, GROUND); c.lineTo(STAGE_R - 90, GROUND + 130); c.lineTo(STAGE_L + 90, GROUND + 130); c.fill();
    c.fillStyle = A.floor; c.fillRect(STAGE_L, GROUND, STAGE_R - STAGE_L, 30);
    c.shadowColor = A.edge; c.shadowBlur = 22; c.fillStyle = A.edge; c.fillRect(STAGE_L, GROUND - 3, STAGE_R - STAGE_L, 6);
    c.fillRect(STAGE_L - 6, GROUND - 14, 8, 44); c.fillRect(STAGE_R - 2, GROUND - 14, 8, 44); c.shadowBlur = 0;
  }
  drawDomain() {
    const d = this.dom, c = this.c;
    if (d.st === 'clash') {
      const x = W * d.clash.share;
      c.save(); c.beginPath(); c.rect(-30, -30, x + 30, H + 60); c.clip(); this.drawDomainBg(this.fighters[0].dom, this.time, 1); c.restore();
      c.save(); c.beginPath(); c.rect(x, -30, W + 30 - x, H + 60); c.clip(); this.drawDomainBg(this.fighters[1].dom, this.time, 1); c.restore();
      c.save(); c.shadowColor = '#fff'; c.shadowBlur = 30; c.fillStyle = '#fff'; c.fillRect(x - 3, 0, 6, H); c.restore();
      return;
    }
    if (d.st === 'open') {
      const f = this.fighters[d.owner], p = clamp((d.t - 0.15) / (OPEN - 0.25), 0, 1);
      if (p > 0) {
        c.save(); c.beginPath(); c.arc(f.x, f.y - 70, p * 1550, 0, 7); c.clip();
        this.drawDomainBg(d.id, d.t, 0.92); c.restore();
        c.save(); c.strokeStyle = DOMAINS[d.id].color; c.shadowColor = DOMAINS[d.id].color; c.shadowBlur = 28; c.lineWidth = 6;
        c.beginPath(); c.arc(f.x, f.y - 70, p * 1550, 0, 7); c.stroke(); c.restore();
      }
      return;
    }
    if (d.st === 'linger') {
      const fade = clamp(Math.min(1, (d.lingerDur - d.lingerT) / 0.45), 0, 1);
      this.drawDomainBg(d.id, this.time, 0.72 * fade);
      return;
    }
    const t = d.t; this.drawDomainBg(d.id, t, clamp(Math.min(t / 0.4, (d.dur - t) / 0.4), 0, 1));
  }
  drawDomainBg(id, t, a) {
    const c = this.c, D = this.deco;
    c.save(); c.globalAlpha = a;
    if (id === 'void') {
      c.fillStyle = '#04001a'; c.fillRect(-30, -30, W + 60, H + 60);
      const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 600); g.addColorStop(0, '#7c4dffaa'); g.addColorStop(1, '#00000000'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#e1f5fe'; c.lineWidth = 1.5; D.s.forEach((s) => { const x = (((s.x - t * s.v * 6) % W) + W) % W; c.globalAlpha = a * 0.7; c.beginPath(); c.moveTo(x, s.y); c.lineTo(x + s.l, s.y); c.stroke(); });
      c.globalAlpha = a * 0.5; c.strokeStyle = '#80d8ff'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { const r = (t * 260 + i * 110) % 770; c.beginPath(); c.ellipse(W / 2, H / 2 - 40, r, r * 0.45, 0, 0, 7); c.stroke(); }
      c.globalAlpha = a; c.fillStyle = '#e1f5ff'; c.fillRect(0, GROUND, W, 3);
    } else if (id === 'shrine') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120000'); g.addColorStop(1, '#8b0000'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      this.drawOrb(W / 2, 260, 190, '#ff1744'); c.fillStyle = '#000';
      c.fillRect(380, GROUND - 60, 520, 60); for (let i = 0; i < 5; i++) c.fillRect(410 + i * 105, GROUND - 190, 28, 130);
      c.beginPath(); c.moveTo(330, GROUND - 190); c.quadraticCurveTo(640, GROUND - 300, 950, GROUND - 190); c.lineTo(900, GROUND - 160); c.quadraticCurveTo(640, GROUND - 250, 380, GROUND - 160); c.fill();
      c.beginPath(); c.moveTo(450, GROUND - 235); c.quadraticCurveTo(640, GROUND - 330, 830, GROUND - 235); c.lineTo(790, GROUND - 205); c.quadraticCurveTo(640, GROUND - 285, 490, GROUND - 205); c.fill();
      for (let i = 0, x = 0; x < W; i++, x += 50) { c.beginPath(); c.moveTo(x, GROUND + 4); c.lineTo(x + 25, GROUND - 40 - (i % 3) * 22); c.lineTo(x + 50, GROUND + 4); c.fill(); }
    } else if (id === 'coffin') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0500'); g.addColorStop(1, '#ff6d00'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      c.fillStyle = '#0d0200'; c.beginPath(); c.moveTo(60, GROUND); c.lineTo(520, 230); c.lineTo(760, 230); c.lineTo(1220, GROUND); c.fill();
      this.drawOrb(640, 225, 170, '#ffab00'); c.strokeStyle = '#ff6d00'; c.lineWidth = 4; c.beginPath(); c.moveTo(600, 240); c.lineTo(520, 380); c.lineTo(420, GROUND); c.moveTo(680, 240); c.lineTo(760, 360); c.lineTo(860, GROUND); c.stroke();
      c.fillStyle = '#ffab40'; D.e.forEach((e) => { const y = (((e.y - t * e.v * 3) % H) + H) % H; c.fillRect(e.x, y, e.s, e.s); });
      const lv = c.createLinearGradient(0, GROUND, 0, H); lv.addColorStop(0, '#ff9100'); lv.addColorStop(1, '#bf360c'); c.fillStyle = lv; c.fillRect(0, GROUND, W, H);
    } else if (id === 'chimera') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#02020a'); g.addColorStop(1, '#1b0f2e'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      this.drawOrb(W / 2, 250, 170, '#4a2a9c');
      c.strokeStyle = '#8c6bff'; c.lineWidth = 2; c.globalAlpha = a * 0.55;
      for (let i = 0; i < 16; i++) { const x = 30 + i * 80, top = GROUND - 170 - ((i * 37) % 120); c.beginPath(); c.moveTo(x, GROUND); c.bezierCurveTo(x + Math.sin(t * 2 + i) * 40, GROUND - 60, x - Math.sin(t * 1.7 + i) * 50, top + 60, x + Math.sin(t * 2.3 + i) * 30, top); c.stroke(); }
      c.globalAlpha = a; c.fillStyle = '#000';
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 20) c.lineTo(x, GROUND - 36 + k * 26 + Math.sin(x * 0.012 + t * (1.5 + k) + k) * 16); c.lineTo(W, H); c.fill(); }
      c.fillStyle = '#fff'; D.e.slice(0, 18).forEach((e, i) => { if (Math.sin(t * 1.6 + i * 2) > -0.7) { c.beginPath(); c.ellipse(e.x, 120 + (e.y % 300), 7, 3, 0, 0, 7); c.fill(); } });
    } else if (id === 'sentence') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#080000'); g.addColorStop(1, '#3a0a0a'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      const sp = c.createRadialGradient(W / 2, 0, 20, W / 2, 0, 640); sp.addColorStop(0, '#ffd54f66'); sp.addColorStop(1, '#00000000'); c.fillStyle = sp; c.fillRect(0, 0, W, H);
      c.fillStyle = '#1a0606'; for (let x = 0; x < W; x += 110) c.fillRect(x, 0, 74, GROUND);
      c.strokeStyle = '#ffca28'; c.lineWidth = 3; c.globalAlpha = a * 0.85;
      const sw = Math.sin(t * 2) * 14; c.beginPath(); c.moveTo(W / 2, 90); c.lineTo(W / 2, 330); c.moveTo(W / 2 - 190, 150 + sw); c.lineTo(W / 2 + 190, 150 - sw); c.stroke();
      [[-190, sw], [190, -sw]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(W / 2 + dx, 150 + dy); c.lineTo(W / 2 + dx - 46, 235 + dy); c.lineTo(W / 2 + dx + 46, 235 + dy); c.closePath(); c.stroke(); c.beginPath(); c.ellipse(W / 2 + dx, 235 + dy, 52, 10, 0, 0, 7); c.stroke(); });
      c.globalAlpha = a; c.fillStyle = '#0d0202'; c.fillRect(300, GROUND - 100, 680, 100); c.fillStyle = '#ffca28'; c.fillRect(300, GROUND - 104, 680, 6);
      c.fillStyle = '#000'; c.fillRect(0, GROUND, W, H - GROUND);
    } else if (id === 'skandha') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#00111f'); g.addColorStop(1, '#00518f'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      c.fillStyle = '#b3e5fc'; for (let i = 0; i < 6; i++) { c.globalAlpha = a * 0.09; const x = 100 + i * 220 + Math.sin(t * 0.6 + i) * 40; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 90, 0); c.lineTo(x + 260, GROUND); c.lineTo(x + 60, GROUND); c.fill(); }
      c.globalAlpha = a * 0.7; c.fillStyle = '#e1f5fe'; D.e.forEach((e) => { const y = (((e.y - t * e.v * 1.5) % H) + H) % H; c.beginPath(); c.arc(e.x + Math.sin(t + e.y) * 8, y, e.s, 0, 7); c.fill(); });
      c.globalAlpha = a; c.fillStyle = '#00192e';
      for (let i = 0; i < 9; i++) { const x = ((i * 170 + t * (70 + i * 9)) % (W + 240)) - 120, y = 150 + ((i * 61) % 330); c.beginPath(); c.ellipse(x, y, 30, 11, 0, 0, 7); c.moveTo(x - 24, y); c.lineTo(x - 50, y - 14); c.lineTo(x - 50, y + 14); c.fill(); }
      c.strokeStyle = '#4fc3f7'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); for (let x = 0; x <= W; x += 20) c.lineTo(x, 60 + k * 18 + Math.sin(x * 0.01 + t * 2 + k) * 10); c.stroke(); }
      c.fillStyle = '#00203a'; c.fillRect(0, GROUND, W, H - GROUND);
    } else if (id === 'mutual') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0a2e'); g.addColorStop(1, '#ff5ca8'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      this.drawOrb(W / 2, 270, 230 + Math.sin(t * 3) * 14, '#ffffff');
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.globalAlpha = a * 0.4; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(W / 2, 270, 90 + i * 70 + Math.sin(t * 2 + i) * 6, t * (i % 2 ? 0.4 : -0.4), t * (i % 2 ? 0.4 : -0.4) + 4.2); c.stroke(); }
      c.globalAlpha = a * 0.8; c.fillStyle = '#ffd6ef';
      D.e.slice(0, 20).forEach((e, i) => { const y = (((e.y - t * e.v * 2) % H) + H) % H, x = e.x + Math.sin(t + i) * 20, s2 = 8 + (i % 4) * 4; c.beginPath(); c.moveTo(x, y + s2 * 0.35); c.bezierCurveTo(x - s2, y - s2 * 0.3, x - s2 * 0.5, y - s2, x, y - s2 * 0.45); c.bezierCurveTo(x + s2 * 0.5, y - s2, x + s2, y - s2 * 0.3, x, y + s2 * 0.35); c.fill(); });
      c.globalAlpha = a; c.fillStyle = '#12001f'; c.fillRect(0, GROUND, W, H - GROUND);
    } else if (id === 'moon') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141008'); g.addColorStop(1, '#4a3509'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      this.drawOrb(W / 2, 240, 175, '#ffee58');
      c.strokeStyle = '#ffd54f'; c.lineWidth = 2; c.globalAlpha = a * 0.5;
      for (let i = 0; i < 6; i++) c.strokeRect(120 + i * 180, 120 + ((i % 2) * 35), 140, 190);
      c.globalAlpha = a; c.fillStyle = '#18130a'; c.fillRect(0, GROUND, W, H - GROUND);
    } else if (id === 'womb') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d0318'); g.addColorStop(1, '#3c1556'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      this.drawOrb(W / 2, 250, 200, '#b388ff');
      c.fillStyle = '#1e0a2e'; for (let i = 0; i < 7; i++) c.fillRect(140 + i * 165, 160 + (i % 2) * 40, 38, GROUND - 160);
      c.fillStyle = '#09020f'; c.fillRect(0, GROUND, W, H - GROUND);
    } else if (id === 'sphere') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0c10'); g.addColorStop(1, '#2b303a'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      c.fillStyle = '#000'; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(W / 2, 260, 125, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#111318'; c.fillRect(0, GROUND, W, H - GROUND);
    } else if (id === 'singularity') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#00040f'); g.addColorStop(1, '#002c4d'); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      this.drawOrb(W / 2, 270, 210, '#00e5ff');
      c.fillStyle = '#000'; c.beginPath(); c.arc(W / 2, 270, 72, 0, 7); c.fill();
      c.strokeStyle = '#00e5ff'; c.lineWidth = 3; c.beginPath(); c.ellipse(W / 2, 270, 190, 42, -0.25, 0, 7); c.stroke();
      c.fillStyle = '#000814'; c.fillRect(0, GROUND, W, H - GROUND);
    } else {
      const info = DOMAINS[id], g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, info.bg[0]); g.addColorStop(1, info.bg[1]); c.fillStyle = g; c.fillRect(-30, -30, W + 60, H + 60);
      this.drawOrb(W / 2, 280, 200 + Math.sin(t * 6) * 12, info.color);
      c.strokeStyle = info.color; c.lineWidth = 3; c.globalAlpha = a * 0.5; for (let i = 0; i < 6; i++) { const r = (t * 220 + i * 120) % 720; c.beginPath(); c.ellipse(W / 2, 280, r, r * 0.5, 0, 0, 7); c.stroke(); }
      c.globalAlpha = a * 0.8; c.fillStyle = info.color; D.e.forEach((e) => { const y = (((e.y - t * e.v * 2) % H) + H) % H; c.fillRect(e.x, y, e.s, e.s * 3); });
      c.globalAlpha = a; c.fillStyle = '#000'; c.fillRect(0, GROUND, W, H - GROUND);
    }
    c.restore();
  }
  pg(x, y, w, h, sk) { const c = this.c; c.beginPath(); c.moveTo(x + Math.max(sk, 0), y); c.lineTo(x + w + Math.min(sk, 0), y); c.lineTo(x + w - Math.max(sk, 0), y + h); c.lineTo(x - Math.min(sk, 0), y + h); c.closePath(); }
  drawDomainIntro() {
    const d = this.dom, c = this.c, t = d.t, info = DOMAINS[d.id];
    if (d.st === 'clash' || d.st === 'linger' || t > OPEN + 0.25) return;
    const f = this.fighters[d.owner], a = t < OPEN ? 1 : clamp(1 - (t - OPEN) / 0.25, 0, 1);
    c.save();
    if (t < OPEN) {
      const pulse = 36 + Math.sin(t * 22) * 8;
      c.globalAlpha = a * 0.9; c.strokeStyle = info.color; c.shadowColor = info.color; c.shadowBlur = 24; c.lineWidth = 3;
      c.beginPath(); c.arc(f.x, f.y - 75, pulse, 0, 7); c.stroke();
      c.save(); c.translate(W / 2, H / 2 - 20); c.rotate(t * 1.4);
      c.globalAlpha = a * 0.28; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 210, 0, 7); c.stroke();
      c.strokeRect(-148, -148, 296, 296); c.rotate(Math.PI / 4); c.strokeRect(-148, -148, 296, 296); c.restore();
    }
    const bar = clamp(t / 0.2, 0, 1) * 56;
    c.globalAlpha = a; c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    c.globalAlpha = a * 0.5; c.strokeStyle = info.color; c.lineWidth = 2;
    for (let i = 0; i < 48; i++) {
      const an = (i / 48) * Math.PI * 2 + 0.3, r0 = 240 + ((i * 53) % 90) + t * 55;
      c.beginPath(); c.moveTo(W / 2 + Math.cos(an) * r0, H / 2 + Math.sin(an) * r0 * 0.7);
      c.lineTo(W / 2 + Math.cos(an) * (r0 + 520), H / 2 + Math.sin(an) * (r0 + 520) * 0.7); c.stroke();
    }
    c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.translate(W / 2, H / 2 - 14);
    const s = 1 + (1 - Math.min(1, t / 0.24)) * 0.75; c.scale(s, s); c.rotate(-0.035);
    c.font = `24px ${FONT}`; c.lineWidth = 6; c.strokeStyle = '#000';
    c.strokeText('領域展開 · DOMAIN EXPANSION', 0, -124); c.fillStyle = info.color; c.fillText('領域展開 · DOMAIN EXPANSION', 0, -124);
    c.lineJoin = 'round'; c.lineWidth = 18; c.strokeStyle = '#000'; c.shadowColor = info.color; c.shadowBlur = 50; c.font = `126px ${FONT}`;
    c.strokeText(info.jp, 0, -34); c.fillStyle = '#fff'; c.fillText(info.jp, 0, -34); c.shadowBlur = 0;
    c.fillStyle = info.color; c.beginPath(); c.moveTo(-450, 48); c.lineTo(462, 32); c.lineTo(440, 108); c.lineTo(-472, 118); c.fill();
    const txt = info.name.toUpperCase(); c.font = `32px ${FONT}`; const w = c.measureText(txt).width; if (w > 820) c.font = `${Math.floor((32 * 820) / w)}px ${FONT}`;
    c.fillStyle = '#000'; c.fillText(txt, 0, 74);
    if (info.sub) { c.font = `22px ${FONT}`; c.lineWidth = 5; c.strokeStyle = '#000'; c.strokeText(info.sub, 0, 148); c.fillStyle = '#ffd24a'; c.fillText(info.sub, 0, 148); }
    c.restore();
  }
  drawClashHud() {
    const d = this.dom; if (!d) return; const c = this.c;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    if (d.st === 'open') {
      const o = this.fighters[1 - d.owner];
      if (o.ce >= 100) {
        const x = o.i ? W * 0.75 : W * 0.25, k = clamp(1 - d.t / OPEN, 0, 1);
        c.globalAlpha = 0.75 + 0.25 * Math.sin(this.time * 26); c.shadowColor = o.color; c.shadowBlur = 24; c.fillStyle = '#fff'; c.font = `30px ${FONT}`;
        c.fillText(`COUNTER! PRESS [${this.hints[o.i][3]}]`, x, 640); c.fillStyle = o.color; c.fillRect(x - 170, 664, 340 * k, 8);
      }
    } else if (d.st === 'clash') {
      const k = d.clash, bw = 760, bx = W / 2 - bw / 2, by = 205, bh = 34, [a, b] = this.fighters;
      c.shadowColor = '#fff'; c.shadowBlur = 30; c.fillStyle = '#fff'; c.font = `52px ${FONT}`; c.fillText('DOMAIN CLASH!', W / 2, 160); c.shadowBlur = 0;
      c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(bx - 6, by - 6, bw + 12, bh + 12);
      c.fillStyle = a.color; c.fillRect(bx, by, bw * k.share, bh); c.fillStyle = b.color; c.fillRect(bx + bw * k.share, by, bw * (1 - k.share), bh);
      c.fillStyle = '#fff'; c.fillRect(bx + bw * k.share - 3, by - 10, 6, bh + 20); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(bx, by, bw, bh);
      c.font = `30px ${FONT}`; c.fillStyle = '#fff'; c.fillText(Math.max(0, k.dur - k.t).toFixed(1), W / 2, by + bh + 36);
      this.fighters.forEach((f, i) => {
        c.save(); c.translate(i ? W * 0.8 : W * 0.2, 350); c.scale(1 + k.pulse[i] * 0.25, 1 + k.pulse[i] * 0.25);
        c.fillStyle = f.color; c.shadowColor = f.color; c.shadowBlur = 24; c.font = `96px ${FONT}`; c.fillText(String(k.n[i]), 0, 0);
        c.shadowBlur = 0; c.fillStyle = '#fff'; c.font = `24px ${FONT}`; c.fillText(`MASH [${this.hints[i][3]}] !!!`, 0, 72); c.restore();
      });
    } else if (d.st === 'linger') {
      const info = DOMAINS[d.id], rem = Math.max(0, d.lingerDur - d.lingerT);
      c.fillStyle = 'rgba(7, 4, 14, 0.78)'; this.pg(W / 2 - 220, 112, 440, 38, 12); c.fill();
      c.strokeStyle = info.color; c.lineWidth = 2; c.stroke();
      c.font = `14px ${FONT}`; c.fillStyle = info.color; c.fillText(`${info.jp} ${info.name.toUpperCase()} · ${rem.toFixed(1)}s`, W / 2, 131);
    }
    if (d.st === 'run') this.drawRhythm(d);
    if (d.res && d.res.t > 0) {
      c.globalAlpha = Math.min(1, d.res.t / 0.4); c.shadowColor = d.res.color; c.shadowBlur = 30; c.fillStyle = d.res.color; c.font = `44px ${FONT}`;
      c.fillText(d.res.txt, W / 2, 230); c.fillStyle = '#fff'; c.font = `28px ${FONT}`; c.fillText(d.res.sub, W / 2, 285);
    }
    c.restore();
  }
  drawRhythm(d) {
    const c = this.c, F = this.fighters[d.owner], O = this.fighters[1 - d.owner], A = DOMAINS[d.id].art, HF = this.hints[d.owner], HO = this.hints[1 - d.owner];
    const cx = W / 2, y = 640, hz = cx - 230, spd = 430, left = cx - 330, right = cx + 340, on = d.st === 'run';
    const txt = (s, x, yy, size, col, al) => { c.textAlign = al; c.font = `${size}px ${FONT}`; c.lineWidth = 4; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(s, x, yy); c.fillStyle = col; c.fillText(s, x, yy); };
    c.save(); c.textBaseline = 'middle';
    c.globalAlpha = 0.88; c.fillStyle = '#05030a'; this.pg(left - 36, y - 40, right - left + 72, 80, 24); c.fill();
    c.globalAlpha = 1; c.strokeStyle = F.color; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 2; c.beginPath(); c.moveTo(left, y); c.lineTo(right, y); c.stroke();
    const jf = d.judge ? clamp(d.judge.t / 0.6, 0, 1) : 0;
    c.shadowColor = F.color; c.shadowBlur = 14 + jf * 26; c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.arc(hz, y, 25, 0, 7); c.stroke(); c.shadowBlur = 0;
    d.beats.forEach((b, i) => {
      const x = hz + (b.t - d.t) * spd; if (x > right + 12 || x < left - 12 || b.r === 'perfect' || b.r === 'good') return;
      const fin = i === d.beats.length - 1;
      c.globalAlpha = clamp((right - x) / 50, 0, 1) * (b.r === 'miss' ? 0.4 : 1); c.fillStyle = '#0a0612'; c.strokeStyle = b.r === 'miss' ? '#777' : fin ? '#ffd24a' : F.color; c.lineWidth = 5;
      c.beginPath(); c.arc(x, y, fin ? 22 : 17, 0, 7); c.fill(); c.stroke(); c.globalAlpha = 1;
    });
    txt(`${on ? 'BEAT' : 'GET READY'} [${HF[3]}]`, right + 30, y - 54, 14, '#fff', 'right');
    txt(`ART [${HF[4]}] ${A.name.toUpperCase()} x${d.arts}`, left - 30, y + 54, 14, d.arts > 0 ? '#ffd24a' : '#888', 'left');
    txt(`x${d.streak}`, right + 6, y - 2, 34, d.streak >= 3 ? '#ffd24a' : '#fff', 'right');
    txt('STREAK', right + 6, y + 24, 11, '#fffa', 'right');
    if (d.judge && d.judge.t > 0) { c.globalAlpha = clamp(d.judge.t / 0.25, 0, 1); txt(d.judge.txt, hz, y - 60 - (0.6 - d.judge.t) * 40, 30, d.judge.color, 'center'); c.globalAlpha = 1; }
    if (on) {
      const bx = O.x - 60, by = O.y - 205; txt(`RESIST [${HO[5]}] MASH`, O.x, by, 13, '#fff', 'center');
      c.fillStyle = '#0009'; c.fillRect(bx, by + 12, 120, 8); c.fillStyle = '#4fc3f7'; c.fillRect(bx, by + 12, (120 * d.resist) / 0.4, 8);
    }
    c.restore();
  }
  drawHud() {
    const c = this.c, T = this.cfg.target; c.textBaseline = 'middle';
    this.fighters.forEach((f, i) => {
      const w = 500, x = i ? W - 40 - w : 40, sk = i ? -20 : 20, at = (wd) => (i ? x + w - wd : x), hpw = (v) => (w * v) / 100, low = f.hp < 30;
      const label = (s, tx, ty, size, col, al) => { c.textAlign = al; c.font = `${size}px ${FONT}`; c.lineWidth = 5; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(s, tx, ty); c.fillStyle = col; c.fillText(s, tx, ty); };
      this.pg(x - 4, 42, w + 8, 36, sk); c.fillStyle = '#000'; c.fill();
      c.save(); this.pg(x, 46, w, 28, sk); c.clip();
      c.fillStyle = '#1a1226'; c.fillRect(x - 30, 46, w + 60, 28);
      c.fillStyle = '#ffd24a'; c.fillRect(at(hpw(f.hpShow)), 46, hpw(f.hpShow), 28);
      c.fillStyle = f.color; c.fillRect(at(hpw(f.hp)), 46, hpw(f.hp), 28);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(at(hpw(f.hp)), 46, hpw(f.hp), 8);
      c.restore();
      this.pg(x - 4, 42, w + 8, 36, sk); c.strokeStyle = low ? `rgba(255,45,85,${0.6 + 0.4 * Math.sin(this.time * 12)})` : '#fff'; c.lineWidth = 3; c.stroke();
      const tx = i ? x + w - 6 : x + 6; c.font = `24px ${FONT}`; const nw = c.measureText(f.name).width;
      label(f.name, tx, 26, 24, '#fff', i ? 'right' : 'left');
      if (f.jp) label(f.jp, tx + (i ? -(nw + 12) : nw + 12), 28, 15, f.color, i ? 'right' : 'left');
      for (let k = 0; k < T; k++) { const px = i ? x + 16 + k * 24 : x + w - 16 - k * 24; c.beginPath(); c.moveTo(px, 17); c.lineTo(px + 8, 26); c.lineTo(px, 35); c.lineTo(px - 8, 26); c.closePath(); if (k < f.wins) { c.fillStyle = f.color; c.fill(); } c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
      const cw = 380, cx0 = i ? x + w - cw : x, full = f.ce >= 100, pulse = full ? 0.65 + 0.35 * Math.sin(this.time * 10) : 1, ce = (cw * f.ce) / 100;
      c.save(); this.pg(cx0, 82, cw, 10, sk * 0.5); c.clip(); c.fillStyle = '#120a22'; c.fillRect(cx0 - 20, 82, cw + 40, 10);
      c.globalAlpha = pulse; c.fillStyle = full ? '#ffd24a' : '#8b5cf6'; c.fillRect(i ? cx0 + cw - ce : cx0, 82, ce, 10); c.restore();
      this.pg(cx0, 82, cw, 10, sk * 0.5); c.strokeStyle = '#b388ff'; c.lineWidth = 1.5; c.stroke();
      label(full ? `領域展開 [${this.hints[i][3]}]` : `${Math.floor(f.ce)}%`, i ? cx0 - 8 : cx0 + cw + 8, 88, 12, full ? '#ffd24a' : '#d1c4e9', i ? 'right' : 'left');
      const off = i ? w - 466 : 0;
      for (let s = 0; s < 3; s++) {
        const id = f.skills[s], sk2 = id && SKILLS[id], tw = 150, sx = x + off + s * 158; if (!sk2) continue;
        const r = 1 - f.cd[s] / (sk2.cd * (f.pas.cd || 1)), ready = r >= 1;
        c.save(); this.pg(sx, 98, tw, 26, 8); c.clip(); c.fillStyle = '#120a22'; c.fillRect(sx - 10, 98, tw + 20, 26);
        c.fillStyle = ready ? sk2.color : sk2.color + '55'; c.fillRect(sx - 10, 98, (tw + 20) * Math.min(1, r), 26); c.restore();
        this.pg(sx, 98, tw, 26, 8); c.strokeStyle = sk2.color; c.lineWidth = 2; c.stroke();
        c.textAlign = 'center'; c.font = `10px ${FONT}`; c.fillStyle = ready ? '#000' : '#fff'; c.fillText(`[${this.hints[i][s]}] ${sk2.short}${ready ? '' : ' ' + f.cd[s].toFixed(1)}`, sx + tw / 2, 112);
      }
      if (f.amp > 0) label(`BUFF ${f.amp.toFixed(1)}s`, i ? x + w : x, 140, 13, f.auraC, i ? 'right' : 'left');
      if (f.combo >= 2 && f.comboT > 0) { c.shadowColor = '#ff6d00'; c.shadowBlur = 16; label(`${f.combo} HIT COMBO!`, i ? x + w : x, 168, 30, '#ffeb3b', i ? 'right' : 'left'); c.shadowBlur = 0; }
    });
    const tcx = W / 2, tcy = 60, frac = clamp(this.timer / 99, 0, 1), urgent = this.timer < 10;
    c.beginPath(); c.arc(tcx, tcy, 38, 0, 7); c.fillStyle = '#000'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#ffffff33'; c.stroke();
    c.beginPath(); c.arc(tcx, tcy, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); c.strokeStyle = urgent ? '#ff2d55' : '#fff'; c.stroke();
    c.textAlign = 'center'; c.font = `32px ${FONT}`; c.fillStyle = urgent ? '#ff2d55' : '#fff'; c.fillText(String(Math.max(0, Math.ceil(this.timer))), tcx, tcy + 2);
    const big = (txt, y, size, col) => { c.save(); c.translate(W / 2, y); c.rotate(-0.05); c.textAlign = 'center'; c.font = `${size}px ${FONT}`; c.lineWidth = Math.max(6, size / 8); c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(txt, 0, 0); c.shadowColor = col; c.shadowBlur = 28; c.fillStyle = col; c.fillText(txt, 0, 0); c.restore(); };
    if (this.phase === 'countdown') { big(`ROUND ${this.round}`, H / 2 - 110, 40, '#fff'); big(String(Math.max(1, Math.ceil(this.phaseT))), H / 2, 170, '#ffd24a'); }
    else if (this.banner > 0) big('FIGHT!', H / 2, 150, '#ff2d55');
    else if (this.phase === 'ko') { big(this.label || 'K.O.', H / 2 - 40, 120, '#ff2d55'); big(this.msg, H / 2 + 50, 32, '#fff'); }
  }
}
