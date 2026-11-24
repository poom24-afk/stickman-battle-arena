import { W, H, GROUND, STAGE_L, STAGE_R, SKILLS, DOMAINS, ARENAS, CHARACTERS, SKINS, FONT } from './constants.js';
import { loadControls, keyHints, controlProfileOf } from './keys.js';
import { sfx as rawSfx } from './audio.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const withAlpha = (col, aHex) => {
  if (typeof col !== 'string') return '#ffffff' + aHex;
  if (col.startsWith('#')) {
    if (col.length === 4) return `#${col[1]}${col[1]}${col[2]}${col[2]}${col[3]}${col[3]}${aHex}`;
    if (col.length === 7) return col + aHex;
    if (col.length === 9) return col.slice(0, 7) + aHex;
  }
  return col;
};
const ACTS = {
  punch: { kind: 'melee', pose: 'punch', dur: 0.34, win: [0.08, 0.21], dmg: 6, kb: 280, stun: 0.26, reach: 68, y: [-120, -45], lunge: 140 },
  kick: { kind: 'melee', pose: 'kick', dur: 0.46, win: [0.14, 0.30], dmg: 9, kb: 540, stun: 0.42, reach: 84, y: [-95, 0], lunge: 180, ragdoll: 0.72 },
  domain: { kind: 'domain', pose: 'clap', dur: 9 },
};
const spec = (n) => ACTS[n] || SKILLS[n];
const OPEN = 1.35, CLASH_T = 4;
const DOM_DUR = 4.1, BEAT_T0 = 1.15, BEAT_GAP = 0.38, BEAT_N = 7, PERFECT = 0.075, GOOD = 0.17;
const CUT_DUR = 1.85;
const AI_TUNING = {
  easy:   { mash: 3.2, qte: 1.8, block: 0.14, parry: 0.0,  dom: 0.10, counter: 1.5, skill: 0.30, waitMin: 0.65, waitMax: 1.25, atkMin: 0.55, atkMax: 0.95, dodge: 0.15 },
  medium: { mash: 7.0, qte: 5.0, block: 0.38, parry: 0.14, dom: 0.28, counter: 4.5, skill: 0.58, waitMin: 0.38, waitMax: 0.78, atkMin: 0.28, atkMax: 0.50, dodge: 0.45 },
  hard:   { mash: 12.0, qte: 14.0, block: 0.78, parry: 0.35, dom: 0.65, counter: 10.0, skill: 0.88, waitMin: 0.12, waitMax: 0.32, atkMin: 0.14, atkMax: 0.28, dodge: 0.85 },
};
const WIN_QUOTES = {
  gojo: '天上天下唯我独尊 · ทั้งฟ้าและดิน มีเพียงข้าผู้ไร้เทียมทาน',
  sukuna: 'Stand proud. You were strong.',
  yuji: 'ฉันจะไม่แพ้... เพื่อปกป้องทุกคน!',
  megumi: 'จงสยายปีกออก... เงาทั้งสิบอยู่ในกำมือแล้ว',
  mahoraga: 'กงล้อธรรมจักรหมุนครบรอบ · ไม่มีอาคมใดหยุดข้าได้!',
  nobara: 'ความงามและความแข็งแกร่ง ไม่มีคำว่าปราณี!',
  nanami: 'งานล่วงเวลาจบลงแล้ว · ได้เวลาเลิกงาน',
  maki: 'ต่อให้ไร้พลังคำสาป ฉันก็จะฟันผ่านทุกอย่าง!',
  toji: 'พวกนักไสยเวท... ก็แค่นั้นแหละ',
  toge: 'โอคากะ! · คำสาปเสียงสัมฤทธิ์ผล',
  todo: 'MY BESTO FRIENDO! การต่อสู้ที่เร่าร้อนที่สุด!',
  yuta: 'นี่แหละ... พลังแห่งรักแท้ของพวกเรา',
  mahito: 'วิญญาณของแก... แตกสลายคามือฉันแล้ว!',
  jogo: 'เปลวเพลิงภัยพิบัติ จะเผาผลาญทุกสรรพสิ่ง!',
  hakari: 'FEVER TIME 777! ดวงของฉันไม่มีวันหมด!',
  choso: 'สายเลือดพี่น้อง... จะไม่มีวันขาดสะบั้น',
  higuruma: 'ศาลตัดสินแล้ว... มีความผิดสถานหนัก!',
  dagon: 'คลื่นทะเลลึกแห่งภัยพิบัติกลืนกินหมดแล้ว!',
  geto: 'วิญญาณคำสาปทั้งหมด จงสยบแทบเท้าข้า',
};
const FINISHERS = {
  gojo: { jp: '虚式・茈', title: 'HOLLOW PURPLE · UNLIMITED', style: 'gojo', color: '#d500f9', range: 580 },
  sukuna: { jp: '世界を断つ斬撃', title: 'WORLD CUTTING SLASH', style: 'sukuna', color: '#ff2d55', range: 580 },
  yuji: { jp: '黒閃・極', title: 'CONSECUTIVE BLACK FLASH', style: 'yuji', color: '#ff1744' },
  megumi: { jp: '嵌合暗翳庭', title: 'CHIMERA SHADOW ABYSS', style: 'megumi', color: '#c46bff', range: 580 },
  mahoraga: { jp: '八握剣・魔虚羅', title: 'DIVINE WHEEL OBLITERATION', style: 'mahoraga', color: '#ffd54f' },
  nobara: { jp: '芻霊呪法・共鳴り', title: 'STRAW DOLL RESONANCE', style: 'nobara', color: '#ff6bd6', range: 580 },
  nanami: { jp: '十劃呪法・７：３', title: 'OVERTIME RATIO 7:3', style: 'nanami', color: '#ffd24a' },
  maki: { jp: '呪具・游雲', title: 'PLAYFUL CLOUD TYPHOON', style: 'maki', color: '#7dff6b' },
  toji: { jp: '天逆鉾・鎖万里', title: 'INVERTED SPEAR EXECUTION', style: 'toji', color: '#ffffff' },
  toge: { jp: '呪言・爆ぜろ', title: 'CURSED SPEECH: EXPLODE', style: 'toge', color: '#3dd6ff', range: 580 },
  todo: { jp: '不義遊戯・黒閃', title: 'BOOGIE WOOGIE BLACK FLASH', style: 'todo', color: '#ff8a3d' },
  yuta: { jp: '純愛・リカ顕現', title: 'RIKA · PURE LOVE BEAM', style: 'yuta', color: '#ff80ab', range: 580 },
  mahito: { jp: '無為転変・魂砕', title: 'IDLE SOUL CRUSH', style: 'mahito', color: '#7dff6b' },
  jogo: { jp: '極ノ番・隕', title: 'MAXIMUM METEOR ERUPTION', style: 'jogo', color: '#ff6d00', range: 580 },
  hakari: { jp: '坐殺博徒・７７７', title: '777 JACKPOT BARRAGE', style: 'hakari', color: '#ffd24a' },
  choso: { jp: '穿血・超新星', title: 'CONVERGENCE SUPERNOVA', style: 'choso', color: '#ff1744', range: 580 },
  higuruma: { jp: '処刑人の剣', title: 'EXECUTIONER SWORD', style: 'higuruma', color: '#ffd24a' },
  dagon: { jp: '死累累湧軍', title: 'ABYSSAL SHARK SWARM', style: 'dagon', color: '#3dd6ff', range: 580 },
  geto: { jp: '極ノ番・うずまき', title: 'MAXIMUM: UZUMAKI', style: 'geto', color: '#c46bff', range: 580 },
};
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
    this.is2v2 = cfg.mode === '2v2';
    this.aiDiff = cfg.aiDiff || 'medium';
    this.worldW = this.is2v2 ? 2400 : W;
    this.stageL = this.is2v2 ? 180 : STAGE_L;
    this.stageR = this.is2v2 ? 2220 : STAGE_R;
    this.platforms = this.is2v2 ? [
      { x1: 310, x2: 590, y: 425, theme: this.arena.extra === 'sanctum' ? 'vine' : 'shrine' },
      { x1: 720, x2: 1020, y: 315, theme: 'shrine' },
      { x1: 1080, x2: 1320, y: 425, theme: this.arena.extra === 'sanctum' ? 'vine' : 'shrine' },
      { x1: 1380, x2: 1680, y: 315, theme: 'shrine' },
      { x1: 1810, x2: 2090, y: 425, theme: this.arena.extra === 'sanctum' ? 'vine' : 'shrine' },
    ] : (this.arena.platforms || []);
    this.climbs = this.is2v2 ? [
      { x: 450, y1: 425, y2: GROUND, kind: this.arena.extra === 'sanctum' ? 'vine' : 'chain' },
      { x: 870, y1: 315, y2: GROUND, kind: 'chain' },
      { x: 1200, y1: 425, y2: GROUND, kind: this.arena.extra === 'sanctum' ? 'vine' : 'chain' },
      { x: 1530, y1: 315, y2: GROUND, kind: 'chain' },
      { x: 1950, y1: 425, y2: GROUND, kind: this.arena.extra === 'sanctum' ? 'vine' : 'chain' },
    ] : (this.arena.climbs || []);
    this.keys = new Set();
    this.net = cb.net || null;
    this.netRole = this.net?.role || null;
    this.mySlot = cb.mySlot ?? (this.netRole === 'guest' ? 1 : 0);
    this.ctlProfile = controlProfileOf(cfg, !!this.net);
    this.controls = loadControls(this.ctlProfile);
    const rawHints = keyHints(this.controls);
    this.hints = Array.from({ length: 4 }, (_, i) => (this.net ? rawHints[0] : (rawHints[i] || rawHints[0])));
    this.netEvents = []; this.remoteHeld = [{}, {}, {}, {}]; this.remotePulse = [{}, {}, {}, {}]; this.lastSync = 0; this.lastSentHeld = ''; this._lastShake = 0;
    this.netSeq = 0; this.lastStateSeq = 0; this.lastInputSeq = [0, 0, 0, 0]; this.inputSeq = 0; this.remoteFreeze = false; this._lastSentRound = 0; this._lastSentPhase = '';
    this.sfx = this.netRole === 'host'
      ? Object.fromEntries(Object.keys(rawSfx).map((k) => [k, () => { rawSfx[k](); this.netEvents.push(['sfx', k]); }]))
      : rawSfx;
    this.allKeys = new Set((this.netRole ? [this.controls[0]] : this.controls).flatMap((c) => Object.values(c).flat()));
    const mkFighter = (i, team, chId, skinId, load, domId, color, ai, tag) => {
      const ch = CHARACTERS[chId] || null;
      const skinList = (chId && SKINS[chId]) || [];
      const skin = skinList.find((s) => s.id === (skinId || 'default')) || skinList[0] || null;
      return {
        i, team, ai, tag, chId, color: color || ch?.color || '#fff',
        skills: load || ch?.skills || ['punch', 'kick', 'punch'], dom: domId || ch?.domain || 'void',
        wins: 0, rig: null, rag: 0, lastAfter: 0, aiAtkT: 0, aiJumpT: 0,
        mahoraga: 0, adapt: {}, adaptSpin: 0, qte: null, qteMul: 1,
        ch, pas: ch ? ch.pas : {}, name: ch ? ch.name : `PLAYER ${i + 1}`, jp: ch ? ch.jp : '', skin, gear: skin?.gear || null,
      };
    };
    const teams = cfg.teams || [0, 1, 0, 1];
    const slotModes = cfg.slotModes || ['human', cfg.p2Ai ? 'bot' : 'human', 'bot', 'bot'];
    const occ = cb.occupied || cfg.occupied || [true, false, false, false];
    const count = this.is2v2 ? 4 : 2;
    this.fighters = Array.from({ length: count }, (_, i) => {
      const team = this.is2v2 ? (teams[i] ?? (i % 2)) : i;
      const isBot = this.is2v2
        ? (slotModes[i] === 'bot' || (!!this.net && i > 0 && !occ[i]))
        : (i === 1 && !this.net && (!!cfg.p2Ai || slotModes[1] === 'bot'));
      const tag = this.is2v2
        ? (isBot ? `P${i + 1} BOT` : `P${i + 1}`)
        : (isBot ? 'CPU' : `P${i + 1}`);
      return mkFighter(i, team, cfg.chars?.[i], cfg.skins?.[i], cfg.loadouts?.[i], cfg.domains?.[i], cfg.colors?.[i], isBot, tag);
    });
    this.prev = this.fighters.map(() => ({}));
    this.wins = [0, 0];
    this.cam = { x: this.worldW / 2, y: H / 2, z: this.is2v2 ? 0.62 : 1 };
    this.round = 1; this.paused = false; this.shake = 0; this.freeze = 0; this.time = 0;
    this.banner = 0; this.reported = false; this.matchWinner = null; this.dom = null; this.cutscene = null;
    const pad = 650, wSpan = this.worldW + pad * 2, wScale = wSpan / W;
    this.deco = {
      b: Array.from({ length: Math.ceil(wSpan / 80) + 2 }, (_, i) => ({ x: -pad + i * 82, w: 60 + rnd(0, 20), h: 150 + rnd(0, 230), ant: (i % 3) === 0 ? rnd(25, 58) : 0, sign: (i % 4) === 1 })),
      e: Array.from({ length: Math.round(58 * wScale) }, () => ({ x: rnd(-pad, this.worldW + pad), y: rnd(-200, H + 200), s: rnd(1.5, 4), v: rnd(20, 70) })),
      cl: Array.from({ length: Math.round(8 * wScale) }, () => ({ x: rnd(-pad, this.worldW + pad), y: rnd(40, 330), s: rnd(50, 120), v: rnd(6, 20) })),
      st: Array.from({ length: Math.round(110 * wScale) }, () => ({ x: rnd(-pad, this.worldW + pad), y: rnd(-200, 480), s: rnd(1, 3) })),
      s: Array.from({ length: Math.round(90 * wScale) }, () => ({ x: rnd(-pad, this.worldW + pad), y: rnd(-200, H + 200), l: rnd(30, 140), v: rnd(30, 120) })),
      g: Array.from({ length: Math.ceil(wSpan / 92) + 2 }, (_, i) => ({ x: -pad + 40 + i * 92 + rnd(-20, 20), h: rnd(40, 75), k: i % 3 })),
      bam: Array.from({ length: Math.ceil(wSpan / 58) + 2 }, (_, i) => ({ x: -pad + i * 58 + rnd(-12, 12), w: rnd(7, 13), tilt: rnd(-0.04, 0.04), ph: rnd(0, 6.28) })),
      sw: Array.from({ length: Math.ceil(wSpan / 110) + 2 }, (_, i) => ({ x: -pad + 50 + i * 110 + rnd(-22, 22), h: rnd(48, 95), ang: rnd(-0.24, 0.24) })),
      sh: Array.from({ length: Math.round(14 * wScale) }, () => ({ x: rnd(-200, this.worldW + 200), y: rnd(70, 420), r: rnd(16, 44), a: rnd(0, 6.28), sp: rnd(-0.5, 0.5) })),
    };
    this.resetRound();
    this.onKeyDown = (e) => {
      if (e.code === 'Escape' || (e.code === 'KeyP' && !this.allKeys.has('KeyP'))) { if (!e.repeat) this.setPaused(!this.paused); e.preventDefault(); return; }
      if (this.allKeys.has(e.code)) { e.preventDefault(); this.keys.add(e.code); if (this.netRole === 'guest') this.sendGuestInput(); }
    };
    this.onKeyUp = (e) => {
      if (this.allKeys.has(e.code)) { e.preventDefault(); this.keys.delete(e.code); if (this.netRole === 'guest') this.sendGuestInput(); }
    };
    this.clearKeys = () => { this.keys.clear(); if (this.netRole === 'guest') this.sendGuestInput(); };
    this.onVis = () => { if (document.hidden) { this.keys.clear(); if (!this.net) this.setPaused(true); else if (this.netRole === 'guest') this.sendGuestInput(); } };
    this.unsubNet = this.net ? this.net.onMessage((msg) => {
      if (this.netRole === 'host' && msg.type === 'input') {
        const s = msg.slot ?? 1;
        if (s >= 1 && s < 4) {
          const seq = msg.seq || 0;
          if (!seq || seq > this.lastInputSeq[s]) {
            if (seq) this.lastInputSeq[s] = seq;
            this.remoteHeld[s] = msg.held || {};
          }
          if (msg.pulse) for (const k in msg.pulse) if (msg.pulse[k]) this.remotePulse[s][k] = true;
        }
      } else if (this.netRole === 'guest' && msg.type === 'state') {
        this.applySnapshot(msg);
      } else if (this.netRole === 'guest' && msg.type === 'ev') {
        this.applyEvents(msg.ev);
      } else if (msg.type === 'pause') {
        if (!this.over) { this.paused = !!msg.v; this.keys.clear(); this.cb.onPause?.(this.paused); }
      } else if (msg.type === 'peer-left' || msg.type === 'closed') {
        const s = msg.slot ?? 0;
        const stillHumanGuest = this.netRole === 'host' && this.is2v2 && msg.type === 'peer-left' && s >= 1
          && this.fighters.some((f, idx) => idx > 0 && idx !== s && !f.ai);
        if (stillHumanGuest && this.fighters[s]) {
          this.fighters[s].ai = true;
          this.fighters[s].tag = `P${s + 1} BOT`;
          this.texts.push({ txt: `P${s + 1} LEFT · BOT TAKEOVER`, x: this.fighters[s].x, y: this.fighters[s].y - 160, t: 1.6, max: 1.6, color: '#ffd24a', size: 22 });
        } else {
          this.cb.onPeerLeft?.(msg.reason || 'คู่ต่อสู้หลุดการเชื่อมต่อ');
        }
      }
    }) : null;
  }
  fitCanvas() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = Math.round(r.width * dpr), ch = Math.round(r.height * dpr);
    if (this.cv.width !== cw || this.cv.height !== ch) {
      this.cv.width = cw; this.cv.height = ch;
    }
  }
  setKey(code, v) { v ? this.keys.add(code) : this.keys.delete(code); if (this.netRole === 'guest') this.sendGuestInput(); }
  setPaused(v) { if (this.over) return; this.paused = v; this.keys.clear(); this.cb.onPause?.(v); if (this.net) this.net.send({ type: 'pause', v }); }
  start() {
    this.fitCanvas();
    this.onResize = () => this.fitCanvas();
    addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(this.onResize);
      this.ro.observe(this.cv);
    }
    addEventListener('keydown', this.onKeyDown); addEventListener('keyup', this.onKeyUp);
    addEventListener('blur', this.clearKeys); document.addEventListener('visibilitychange', this.onVis);
    this.last = performance.now();
    const tick = (now) => {
      this.raf = requestAnimationFrame(tick);
      const dt = Math.min(0.033, (now - this.last) / 1000); this.last = now;
      this.update(dt); this.render();
    };
    this.raf = requestAnimationFrame(tick);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    this.unsubNet?.();
    if (this.ro) { this.ro.disconnect(); this.ro = null; }
    if (this.onResize) removeEventListener('resize', this.onResize);
    removeEventListener('keydown', this.onKeyDown); removeEventListener('keyup', this.onKeyUp);
    removeEventListener('blur', this.clearKeys); document.removeEventListener('visibilitychange', this.onVis);
  }
  resetRound() {
    const spA = this.is2v2 ? [480, 300, 190, 110] : [380, 280];
    const spB = this.is2v2 ? [1920, 2100, 2210, 2290] : [900, 1000];
    const tIdx = [0, 0];
    this.fighters.forEach((f) => {
      const n = tIdx[f.team]++;
      const sx = f.team === 0 ? (spA[n] ?? 480) : (spB[n] ?? 1920);
      Object.assign(f, {
        x: sx, y: GROUND, _tx: sx, _ty: GROUND, vx: 0, vy: 0, face: f.team ? -1 : 1, hp: 100, hpShow: 100, act: null, stun: 0, inv: 0, blocking: false,
        parryT: 0, parryCd: 0, dropT: 0, dropCool: 0, climbing: false, floorY: GROUND, ragdollT: 0, ledge: null, ledgeCd: 0,
        aiAtkT: rnd(0.2, 0.5), aiJumpT: 0, mahoraga: 0, adapt: {}, adaptSpin: 0, qte: null, qteMul: 1, lastHitBy: null, dizzy: 0,
        nails: 0, nailT: 0, landT: 0, skidT: 0,
        cd: [0, 0, 0], amp: 0, ampMul: 1, ampSpd: 1, ce: f.ce > 0 && this.round > 1 ? Math.min(60, f.ce) : 0, combo: 0, comboT: 0, flash: 0, anim: 0, grounded: true, ghost: false, ko: false, rag: 0, aura: 0, auraC: '#fff',
      });
      const T = this.targets(f, this.pose(f)); f.rig = {};
      NAMES.forEach((n) => (f.rig[n] = { x: T[n].x, y: T[n].y, ox: T[n].x, oy: T[n].y }));
    });
    this.phase = 'countdown'; this.phaseT = 3; this.cnt = 4; this.timer = 99; this.msg = ''; this.dom = null; this.cutscene = null; this.finisher = null; this.victory = null;
    this.parts = []; this.proj = []; this.rings = []; this.beams = []; this.slashes = []; this.arcs = []; this.orbs = []; this.zaps = [];
    this.pillars = []; this.decals = []; this.texts = []; this.afters = []; this.warns = []; this.sched = []; this.flash = null;
  }
  later(t, fn) { this.sched.push({ t, fn }); }
  effectiveSkill(f, idx) {
    const id = f.skills[idx];
    return f.mahoraga > 0 && id === 'summon_mahoraga' ? (SKILLS[id]?.altSkill || 'mahoraga') : id;
  }
  adaptHit(def, srcKey, rawDmg) {
    if (!def || def.mahoraga <= 0 || !srcKey) return rawDmg;
    const lv = def.adapt?.[srcKey] || 0;
    const curMul = Math.max(0.15, Math.pow(0.7, lv));
    const nextLv = lv + 1;
    def.adapt[srcKey] = nextLv;
    const nextMul = Math.max(0.15, Math.pow(0.7, nextLv));
    if ((def.adaptSpin || 0) <= 0.08) {
      def.adaptSpin = 0.48;
      this.sfx.wheel();
      this.ring(def.x, def.y - 95, 115, '#ffd54f');
      this.spark(def.x, def.y - 135, 12, '#ffd54f', 240, 0.45, 4, 0);
      const pct = Math.round(nextMul * 100);
      this.texts.push({
        txt: pct <= 15 ? 'ADAPTED MAX! (15% DMG)' : `ADAPT x${nextLv} (${pct}% DMG)`,
        x: def.x, y: def.y - 178, t: 0.78, max: 0.78, color: '#ffd54f', size: 22,
      });
    }
    return rawDmg * curMul;
  }
  surfaceBelow(x, y) {
    let best = x > this.stageL && x < this.stageR && y <= GROUND + 6 ? GROUND : null;
    for (const p of this.platforms) {
      if (x >= p.x1 && x <= p.x2 && y <= p.y + 6 && (best === null || p.y < best)) best = p.y;
    }
    return best;
  }
  enemiesOf(f) {
    const alive = this.fighters.filter((x) => x.team !== f.team && !x.ko);
    return alive.length ? alive : this.fighters.filter((x) => x.team !== f.team);
  }
  nearestEnemy(f) {
    let best = null, bd = Infinity;
    for (const x of this.enemiesOf(f)) {
      const d = Math.hypot(x.x - f.x, x.y - f.y);
      if (d < bd) { bd = d; best = x; }
    }
    return best || this.fighters.find((x) => x.team !== f.team) || this.fighters[0];
  }
  domAbility(f) {
    const d = this.dom;
    if (!d || d.st !== 'linger') return null;
    return { ability: DOMAINS[d.id].ability, isOwner: (d.ownerTeam ?? (this.fighters[d.owner]?.team)) === f.team, dom: d };
  }
  updateCamera(dt) {
    if (this.finisher) {
      const ff = this.fighters[this.finisher.owner], fo = this.fighters[this.finisher.target];
      if (ff && fo) {
        const tz = clamp(W / (Math.abs(ff.x - fo.x) + 340), 0.72, 1.32);
        const cx = clamp((ff.x + fo.x) / 2, W / (2 * tz) - 40, Math.max(W / (2 * tz) - 40, this.worldW - W / (2 * tz) + 40));
        const cy = clamp((ff.y + fo.y) / 2 - 75, H / (2 * tz) - 20, H + 40 - H / (2 * tz));
        const k = Math.min(1, dt * 8);
        this.cam.z += (tz - this.cam.z) * k;
        this.cam.x += (cx - this.cam.x) * k;
        this.cam.y += (cy - this.cam.y) * k;
        return;
      }
    }
    if (this.victory) {
      const wf = this.fighters[this.victory.idx];
      if (wf) {
        const tz = 1.38;
        const tx = clamp(wf.x, W / (2 * tz) - 60, Math.max(W / (2 * tz) - 60, this.worldW - W / (2 * tz) + 60));
        const ty = clamp(wf.y - 72, H / (2 * tz) - 30, H + 40 - H / (2 * tz));
        const k = Math.min(1, dt * 6.5);
        this.cam.z += (tz - this.cam.z) * k;
        this.cam.x += (tx - this.cam.x) * k;
        this.cam.y += (ty - this.cam.y) * k;
        return;
      }
    }
    if (!this.is2v2) { this.cam.x = W / 2; this.cam.y = H / 2; this.cam.z = 1; return; }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    if (this.cutscene) {
      const cf = this.fighters[this.cutscene.owner], co = this.fighters[this.cutscene.target];
      minX = Math.min(cf.x, co.x) - 140; maxX = Math.max(cf.x, co.x) + 140;
      minY = Math.min(cf.y, co.y) - 220; maxY = Math.max(cf.y, co.y) + 60;
    } else {
      const act = this.fighters.filter((f) => !f.ko);
      const list = act.length ? act : this.fighters;
      for (const f of list) {
        if (f.x < minX) minX = f.x; if (f.x > maxX) maxX = f.x;
        if (f.y - 130 < minY) minY = f.y - 130; if (f.y + 30 > maxY) maxY = f.y + 30;
      }
      minX -= 220; maxX += 220; minY -= 110; maxY += 70;
    }
    const spanW = Math.max(680, maxX - minX), spanH = Math.max(380, maxY - minY);
    const tz = clamp(Math.min(W / spanW, H / spanH), 0.52, 0.96);
    const vw = W / (2 * tz), vh = H / (2 * tz);
    let tx = (minX + maxX) / 2, ty = (minY + maxY) / 2;
    if (vw * 2 >= this.worldW + 120) tx = this.worldW / 2;
    else tx = clamp(tx, vw - 40, this.worldW - vw + 40);
    ty = clamp(ty, vh - 40, Math.max(vh - 40, H + 60 - vh));
    const k = Math.min(1, dt * 6);
    this.cam.z += (tz - this.cam.z) * k;
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
  }
  aiInput(f, o, dt, can) {
    const inp = { _left: false, _right: false, _jump: false, _block: false };
    const ai = AI_TUNING[this.aiDiff] || AI_TUNING.medium;
    f.aiAtkT = Math.max(0, (f.aiAtkT || 0) - dt);
    f.aiJumpT = Math.max(0, (f.aiJumpT || 0) - dt);
    if (this.dom?.st === 'clash' && (f.i === this.dom.clash?.f0 || f.i === this.dom.clash?.f1)) {
      if (Math.random() < dt * ai.mash) inp.dom = true;
      return inp;
    }
    if (f.ledge) {
      if (Math.random() < dt * ai.mash) inp.jump = true;
      return inp;
    }
    if (this.cutscene?.owner === f.i && this.cutscene.qte && !this.cutscene.qte.done && this.cutscene.t >= this.cutscene.qte.t0) {
      if (Math.random() < dt * ai.qte) inp.punch = true;
      return inp;
    }
    if (f.qte && !f.qte.done && f.qte.t >= f.qte.start) {
      if (Math.random() < dt * ai.qte) inp.punch = true;
      return inp;
    }
    if (!can || !o || f.ko || f.dizzy > 0) return inp;
    const ft = this.finishTarget(f);
    if (ft && Math.random() < dt * (ft.dizzy > 0 ? 3.2 : 0.85)) {
      inp.fin = true;
      return inp;
    }
    if (this.dom?.st === 'open' && this.dom.ownerTeam !== f.team && f.ce >= 100 && Math.random() < dt * ai.counter) {
      inp.dom = true;
      return inp;
    }
    if (f.x < this.stageL + 65) { inp._right = true; if (f.grounded) inp.jump = true; return inp; }
    if (f.x > this.stageR - 65) { inp._left = true; if (f.grounded) inp.jump = true; return inp; }
    const dx = o.x - f.x, adx = Math.abs(dx), dy = o.y - f.y;
    if (adx > 64) { if (dx > 0) inp._right = true; else inp._left = true; }
    else if (adx < 40) { if (dx > 0) inp._left = true; else inp._right = true; }
    if (dy < -65 && f.aiJumpT <= 0 && f.grounded) { inp.jump = true; inp._jump = true; f.aiJumpT = 0.7; }
    if (f.aiJumpT <= 0 && f.grounded && this.proj.some((p) => {
      const pf = this.fighters[p.owner];
      return pf && pf.team !== f.team && Math.abs(p.x - f.x) < 155 && Math.sign(p.vx) === Math.sign(f.x - p.x) && Math.abs(p.y - (f.y - 50)) < 75;
    }) && Math.random() < ai.dodge) {
      inp.jump = true; inp._jump = true; f.aiJumpT = 0.55;
      return inp;
    }
    if (o.act && adx < 140 && Math.abs(dy) < 95 && Math.random() < ai.block && f.grounded) {
      inp._block = true;
      if (Math.random() < dt * (ai.parry * 22)) inp.block = true;
      return inp;
    }
    if (f.aiAtkT <= 0) {
      if (f.ce >= 100 && !this.dom && adx < 520 && Math.random() < ai.dom) {
        inp.dom = true; f.aiAtkT = 0.6;
      } else {
        const ready = [0, 1, 2].filter((s) => this.effectiveSkill(f, s) && f.cd[s] <= 0);
        const usable = ready.filter((s) => {
          const sp = spec(this.effectiveSkill(f, s));
          if (!sp) return false;
          if (sp.kind === 'heal') return f.hp < 72;
          if (sp.kind === 'morph') return f.mahoraga <= 0;
          if (sp.kind === 'buff' || sp.kind === 'amp' || sp.kind === 'jackpot') return adx < 340;
          if (sp.kind === 'melee' || sp.kind === 'cutmelee') return adx < (sp.reach || 100) + 45 && Math.abs(dy) < 95;
          return adx < 680;
        });
        if (usable.length && Math.random() < ai.skill) {
          const pick = usable[(Math.random() * usable.length) | 0];
          inp['s' + (pick + 1)] = true;
          f.aiAtkT = rnd(ai.waitMin, ai.waitMax);
        } else if (adx < 85 && Math.abs(dy) < 85) {
          inp[Math.random() < 0.62 ? 'punch' : 'kick'] = true;
          f.aiAtkT = rnd(ai.atkMin, ai.atkMax);
        } else {
          f.aiAtkT = 0.14;
        }
      }
    }
    return inp;
  }
  readGamepad(idx) {
    const pads = navigator.getGamepads?.();
    const gp = pads ? Array.from(pads).filter(Boolean)[idx] : null;
    if (!gp) return null;
    const b = (n) => !!gp.buttons[n]?.pressed;
    const ax0 = gp.axes[0] || 0, ax1 = gp.axes[1] || 0;
    return {
      left: b(14) || ax0 < -0.35, right: b(15) || ax0 > 0.35,
      jump: b(12) || b(0) || ax1 < -0.5, block: b(13) || b(4) || ax1 > 0.5,
      punch: b(2), kick: b(1), s1: b(3), s2: b(5), s3: b(7), dom: b(6), fin: b(8) || (b(10) && b(11)),
    };
  }
  /* ---------------- ONLINE SYNC ---------------- */
  sendGuestInput() {
    const c = this.controls[0], gp = this.readGamepad(0), held = {}, pulse = {};
    let hasPulse = false;
    for (const k in c) {
      const d = c[k].some((x) => this.keys.has(x)) || !!gp?.[k];
      held[k] = d;
      if (d && !this.prev[0][k]) { pulse[k] = true; hasPulse = true; }
      this.prev[0][k] = d;
    }
    const sig = JSON.stringify(held);
    if (sig !== this.lastSentHeld || hasPulse) {
      this.lastSentHeld = sig;
      this.net.send({ type: 'input', slot: this.mySlot, seq: ++this.inputSeq, held, pulse });
    }
  }
  collectEvents() {
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
    collect(this.pillars, 'pillars'); collect(this.decals, 'decals'); collect(this.texts, 'texts'); collect(this.rings, 'rings');
    if (this.flash && !this.flash._s) { this.flash._s = true; this.netEvents.push(['flash', { t: this.flash.t, max: this.flash.max, c: this.flash.c }]); }
    if (this.shake > 2 && this.shake > this._lastShake + 1.5) this.netEvents.push(['shake', this.shake]);
    this._lastShake = this.shake;
  }
  flushNetEvents() {
    this.collectEvents();
    if (this.netEvents.length > 0) this.net.send({ type: 'ev', ev: this.netEvents.splice(0) });
  }
  syncNet() {
    this.flushNetEvents();
    const crucial = this.round !== this._lastSentRound || this.phase !== this._lastSentPhase || this.matchWinner !== null;
    const rate = this.net.hasRelay?.() ? 0.032 : 0.025;
    if (crucial || this.time - this.lastSync >= rate) {
      this.lastSync = this.time;
      this.sendSnapshot(crucial);
    }
  }
  sendSnapshot(reliable = false) {
    this._lastSentRound = this.round;
    this._lastSentPhase = this.phase;
    const snap = {
      type: 'state',
      seq: ++this.netSeq,
      round: this.round, phase: this.phase, phaseT: Math.round(this.phaseT * 100) / 100, cnt: this.cnt, timer: Math.round(this.timer * 10) / 10,
      banner: Math.round(this.banner * 100) / 100, label: this.label, msg: this.msg, matchWinner: this.matchWinner, wins: this.wins,
      freeze: this.freeze > 0 ? 1 : 0,
      fighters: this.fighters.map((f) => ({
        x: Math.round(f.x * 10) / 10, y: Math.round(f.y * 10) / 10, vx: Math.round(f.vx), vy: Math.round(f.vy),
        face: f.face, hp: Math.round(f.hp * 10) / 10, ce: Math.round(f.ce * 10) / 10,
        cd: f.cd.map((v) => Math.round(v * 10) / 10), amp: Math.round(f.amp * 10) / 10, ampMul: f.ampMul, ampSpd: f.ampSpd,
        aura: Math.round(f.aura * 10) / 10, auraC: f.auraC, combo: f.combo, comboT: Math.round(f.comboT * 100) / 100,
        stun: Math.round(f.stun * 100) / 100, inv: Math.round(f.inv * 100) / 100, flash: Math.round(f.flash * 100) / 100,
        blocking: f.blocking, parryT: Math.round(f.parryT * 100) / 100, climbing: f.climbing,
        ragdollT: Math.round(f.ragdollT * 100) / 100, ko: f.ko, dizzy: Math.round((f.dizzy || 0) * 100) / 100, grounded: f.grounded, ghost: f.ghost,
        wins: f.wins, anim: Math.round(f.anim * 100) / 100, act: f.act, ledge: f.ledge, ai: f.ai, tag: f.tag,
        mahoraga: Math.round((f.mahoraga || 0) * 10) / 10, adaptSpin: Math.round((f.adaptSpin || 0) * 100) / 100,
        nails: f.nails || 0, qte: f.qte, adaptN: Object.keys(f.adapt || {}).length,
      })),
    };
    if (this.victory) snap.victory = this.victory;
    if (this.finisher) snap.finisher = this.finisher;
    if (this.proj.length) snap.proj = this.proj;
    if (this.orbs.length) snap.orbs = this.orbs;
    if (this.beams.length) snap.beams = this.beams;
    if (this.warns.length) snap.warns = this.warns;
    if (this.dom) snap.dom = { ...this.dom, ticks: undefined };
    if (this.cutscene) snap.cutscene = { owner: this.cutscene.owner, target: this.cutscene.target, name: this.cutscene.name, t: this.cutscene.t, dur: this.cutscene.dur, step: this.cutscene.step, qte: this.cutscene.qte };
    if (reliable) this.net.send(snap);
    else this.net.sendFast(snap);
  }
  applyEvents(ev) {
    if (!ev || !ev.length) return;
    ev.forEach((item) => {
      const [kind, a1, a2, a3, a4, a5, a6, a7, a8] = item;
      if (kind === 'sfx') rawSfx[a1]?.();
      else if (kind === 'spark') this.spark(a1, a2, a3, a4, a5, a6, a7, a8);
      else if (kind === 'sparkDir') this.sparkDir(a1, a2, a3, a4, a5, a6, a7, a8);
      else if (kind === 'flash') this.flash = a1;
      else if (kind === 'shake') this.shake = Math.max(this.shake, a1);
      else if (kind === 'fx') this[a1]?.push(a2);
      else if (kind === 'after') this.pushAfter(this.fighters[a1], a2);
    });
  }
  applySnapshot(s) {
    if (s.seq) {
      if (s.seq <= this.lastStateSeq) return;
      this.lastStateSeq = s.seq;
    }
    const roundChanged = s.round !== this.round;
    if (roundChanged) {
      this.round = s.round;
      this.parts = []; this.proj = []; this.rings = []; this.beams = []; this.slashes = []; this.arcs = [];
      this.orbs = []; this.zaps = []; this.pillars = []; this.decals = []; this.texts = []; this.afters = []; this.warns = []; this.flash = null;
    }
    this.phase = s.phase; this.phaseT = s.phaseT; this.cnt = s.cnt; this.timer = s.timer;
    this.banner = s.banner; this.label = s.label; this.msg = s.msg; this.matchWinner = s.matchWinner;
    this.victory = s.victory || null;
    this.finisher = s.finisher || null;
    this.remoteFreeze = !!s.freeze;
    if (s.wins) this.wins = s.wins;
    s.fighters.forEach((sf, i) => {
      const f = this.fighters[i];
      if (!f) return;
      f._tx = sf.x; f._ty = sf.y;
      if (roundChanged || !Number.isFinite(f.x) || Math.hypot(sf.x - f.x, sf.y - f.y) > 140) {
        f.x = sf.x; f.y = sf.y;
      }
      Object.assign(f, {
        vx: sf.vx, vy: sf.vy, face: sf.face, hp: sf.hp, ce: sf.ce, cd: sf.cd, amp: sf.amp, ampMul: sf.ampMul, ampSpd: sf.ampSpd,
        aura: sf.aura, auraC: sf.auraC, combo: sf.combo, comboT: sf.comboT, stun: sf.stun, inv: sf.inv, flash: sf.flash,
        blocking: sf.blocking, parryT: sf.parryT, climbing: sf.climbing, ragdollT: sf.ragdollT, ko: sf.ko, dizzy: sf.dizzy || 0,
        grounded: sf.grounded, ghost: sf.ghost, wins: sf.wins, anim: sf.anim, act: sf.act, ledge: sf.ledge, ai: sf.ai, tag: sf.tag,
        mahoraga: sf.mahoraga || 0, adaptSpin: sf.adaptSpin || 0, nails: sf.nails || 0, qte: sf.qte || null, adaptN: sf.adaptN || 0,
      });
    });
    this.proj = s.proj || []; this.orbs = s.orbs || []; this.beams = s.beams || []; this.warns = s.warns || [];
    this.dom = s.dom || null;
    this.cutscene = s.cutscene ? { ...s.cutscene, sp: spec(s.cutscene.name) } : null;
    if (s.ev) this.applyEvents(s.ev);
    if (this.matchWinner !== null && !this.reported) {
      this.reported = true; this.over = true;
      this.cb.onEnd?.({ winner: this.matchWinner, scores: [...this.wins] });
    }
  }
  stepFx(dt) {
    [this.beams, this.slashes, this.arcs, this.zaps, this.pillars, this.texts, this.rings, this.afters, this.warns, this.decals].forEach((arr, k) => {
      arr.forEach((x) => { x.t -= dt; if (k === 5) x.y -= 40 * dt; });
    });
    this.beams = this.beams.filter((x) => { if (x.t > 0 && this.netRole !== 'guest') { this.spark(x.x + x.d * rnd(0, this.worldW * 0.8), x.y + rnd(-x.th / 2, x.th / 2), 1, x.color, 120, 0.3, 5, 0); } return x.t > 0; });
    this.slashes = this.slashes.filter((x) => x.t > 0); this.arcs = this.arcs.filter((x) => x.t > 0);
    this.zaps = this.zaps.filter((x) => x.t > 0); this.pillars = this.pillars.filter((x) => x.t > 0);
    this.decals = this.decals.filter((x) => x.t > 0);
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
      this.time += dt; this.shake = Math.max(0, this.shake - dt * 40);
      if (this.remoteFreeze) { this.updateCamera(dt); return; }
      this.banner = Math.max(0, this.banner - dt);
      if (this.victory) this.victory.t += dt;
      if (this.finisher) this.finisher.t += dt;
      this.proj.forEach((p) => { p.x += p.vx * dt; if (p.pvy) p.y += p.pvy * dt; });
      this.orbs.forEach((o) => { o.x += (o.vx || 0) * dt; o.y += (o.vy || 0) * dt; });
      const blend = 1 - Math.exp(-18 * dt);
      this.fighters.forEach((f) => {
        if (!f.ledge && !this.cutscene) {
          if (!f.grounded && !f.climbing && !f.ko && (!f.act || f.act.name !== 'domain')) f.vy += 2200 * dt;
          const prevY = f.y;
          f.x = clamp(f.x + f.vx * dt, -250, this.worldW + 250);
          f.y = Math.min(H + 300, f.y + f.vy * dt);
          if (f._tx !== undefined) {
            f._tx = clamp(f._tx + f.vx * dt, -250, this.worldW + 250);
            f._ty = Math.min(H + 300, f._ty + f.vy * dt);
            f.x += (f._tx - f.x) * blend;
            f.y += (f._ty - f.y) * blend;
          }
          if (f.vy >= 0 && f.x > this.stageL && f.x < this.stageR && prevY <= GROUND + 8 && f.y > GROUND) {
            f.y = GROUND; f.vy = 0; f.grounded = true;
            if (f._ty > GROUND) f._ty = GROUND;
          }
          if (Math.abs(f.vx) > 20 && f.grounded) f.anim += dt;
        }
      });
      this.stepFx(dt);
      this.updateCamera(dt);
      return;
    }
    if (this.paused) return;
    this.time += dt; this.shake = Math.max(0, this.shake - dt * 40);
    if (this.freeze > 0) { this.freeze -= dt; this.updateCamera(dt); if (this.netRole === 'host') this.syncNet(); return; }
    this.banner = Math.max(0, this.banner - dt); this.phaseT -= dt;
    if (this.phase === 'countdown') {
      const n = Math.ceil(this.phaseT);
      if (n !== this.cnt && n > 0) { this.cnt = n; this.sfx.count(); }
      if (this.phaseT <= 0) { this.phase = 'fight'; this.banner = 0.9; this.sfx.fight(); }
    } else if (this.phase === 'fight') {
      const anyDizzy = this.fighters.some((x) => x.dizzy > 0 && !x.ko);
      if ((!this.dom || this.dom.st === 'linger') && !this.cutscene && !anyDizzy) {
        this.timer -= dt;
        if (this.timer <= 0) {
          const hp0 = this.fighters.filter((f) => f.team === 0).reduce((s, f) => s + f.hp, 0);
          const hp1 = this.fighters.filter((f) => f.team === 1).reduce((s, f) => s + f.hp, 0);
          this.endRound(hp0 > hp1 ? 0 : hp1 > hp0 ? 1 : -1, 'TIME UP');
        }
      }
    } else if (this.phase === 'finisher') {
      if (this.finisher) this.updateFinisher(dt);
    } else if (this.phase === 'ko') {
      if (this.victory) {
        this.victory.t += dt;
        const wf = this.fighters[this.victory.idx];
        if (wf && Math.random() < 0.45) {
          this.spark(wf.x + rnd(-45, 45), wf.y - rnd(20, 140), 1, this.victory.color, 130, 0.55, 4, -80);
        }
      }
      if (this.phaseT <= 0) {
        if (this.matchWinner !== null) {
          if (!this.reported) { this.reported = true; this.over = true; this.cb.onEnd?.({ winner: this.matchWinner, scores: [...this.wins] }); }
        } else { this.round++; this.resetRound(); }
      }
    }
    const can = this.phase === 'fight' && (!this.dom || this.dom.st === 'linger') && !this.cutscene;
    if (this.phase !== 'finisher') for (const f of this.fighters) this.step(f, this.nearestEnemy(f), dt, can);
    if (this.dom) this.updateDomain(dt);
    if (this.cutscene) this.updateCutscene(dt);
    if (can) {
      for (let i = 0; i < this.fighters.length; i++) {
        const a = this.fighters[i];
        if (a.ghost || a.ko || a.ledge) continue;
        for (let j = i + 1; j < this.fighters.length; j++) {
          const b = this.fighters[j];
          if (b.ghost || b.ko || b.ledge) continue;
          const dx = b.x - a.x;
          if (Math.abs(dx) < 38 && Math.abs(a.y - b.y) < 90) { const p = (38 - Math.abs(dx)) / 2, s = dx === 0 ? (a.i % 2 ? 1 : -1) : Math.sign(dx); a.x -= p * s; b.x += p * s; }
        }
      }
    }
    const due = []; this.sched = this.sched.filter((s) => { s.t -= dt; if (s.t <= 0) { due.push(s); return false; } return true; });
    due.forEach((s) => s.fn());
    this.proj = this.proj.filter((p) => {
      const att = this.fighters[p.owner];
      if (p.style === 'insect' && att) {
        const aim = this.nearestEnemy(att);
        if (aim && !aim.ko && !aim.ghost) p.pvy = clamp((aim.y - 75 - p.y) * 3.4, -260, 260);
      }
      p.x += p.vx * dt; if (p.pvy) p.y += p.pvy * dt; p.life -= dt;
      if (p.kind !== 'dog' && p.style !== 'chain') this.spark(p.x, p.y, 2, p.color, 70, 0.3, p.arrow ? 7 : 5, 0);
      const t = att ? this.enemiesOf(att).find((e) => !e.ghost && !e.ko && Math.abs(p.x - e.x) < p.r + 18 && p.y > e.y - 130 - p.r && p.y < e.y + p.r) : null;
      if (can && t) {
        const ok = this.hit(att, t, { dmg: p.dmg, kb: p.kb, stun: p.stun, vy: p.vy, big: !p.small, color: p.color, drainCe: p.drainCe, cdAdd: p.cdAdd, src: p.src || p.kind || 'proj' });
        if (p.echo && ok === true) this.later(p.echo, () => {
          if (this.phase !== 'fight' || (this.dom && this.dom.st !== 'linger') || this.cutscene || t.ko) return;
          t.inv = 0;
          const stacks = t.nails || 0;
          if (stacks > 0) t.nails = 0;
          this.hit(att, t, { dmg: p.dmg2 + stacks * 1.1, kb: p.kb2, stun: 0.5, vy: 300, big: true, color: p.color, src: p.src || 'resonance' });
          this.ring(t.x, t.y - 80, 140 + stacks * 24, p.color);
          this.texts.push({ txt: stacks > 0 ? `RESONANCE ×${stacks}!` : 'RESONANCE!', x: t.x, y: t.y - 150, t: 0.7, max: 0.7, color: p.color, size: 38 });
        });
        if (p.boom) {
          this.ring(p.x, p.y, p.boom * 1.7, p.color); this.ring(p.x, p.y, p.boom, '#fff');
          this.spark(p.x, p.y, 36, p.color, 450, 0.7, 7, 300); this.shake = Math.max(this.shake, p.boom > 150 ? 20 : 12); this.sfx.boom();
          const sy = this.surfaceBelow(p.x, p.y);
          if (sy !== null && Math.abs(sy - p.y) < 160) this.addDecal(p.x, sy, 'scorch', p.color, Math.min(95, p.boom * 0.55));
        }
        return false;
      }
      return p.life > 0 && p.x > -250 && p.x < this.worldW + 250;
    });
    this.orbs = this.orbs.filter((o) => this.updateOrb(o, dt, can));
    this.stepFx(dt);
    this.updateCamera(dt);
    if (this.phase === 'fight' && !this.cutscene) {
      const gone = (f) => f.ko || f.y > H + 100;
      for (const f of this.fighters) {
        if (!f.ko) {
          if (f.y > H + 100) {
            f.ko = true; f.hp = 0; f.dizzy = 0; f.act = null; f.blocking = false; f.parryT = 0; f.climbing = false; f.ledge = null;
            this.sfx.ko(); this.texts.push({ txt: `${f.tag} K.O.!`, x: clamp(f.x, 120, this.worldW - 120), y: Math.min(f.y - 120, H - 80), t: 1.1, max: 1.1, color: '#ff5252', size: 34 });
          } else if (f.hp <= 1 && f.dizzy <= 0) {
            f.dizzy = 3.2; f.hp = 1; f.inv = 0.45; f.act = null; f.blocking = false; f.parryT = 0; f.climbing = false; f.ledge = null;
            f.stun = 0; f.ragdollT = 0; f.vx = 0; f.vy = Math.min(0, f.vy);
            this.sfx.clash(); this.ring(f.x, f.y - 80, 190, '#ffd24a');
            this.texts.push({ txt: 'DIZZY 1%! FINISH THEM!', x: clamp(f.x, 120, this.worldW - 120), y: Math.max(150, f.y - 165), t: 1.3, max: 1.3, color: '#ffd24a', size: 32 });
          }
        }
      }
      const d0 = this.fighters.filter((f) => f.team === 0).every(gone);
      const d1 = this.fighters.filter((f) => f.team === 1).every(gone);
      if (d0 && d1) this.endRound(-1, 'K.O.');
      else if (d0 || d1) this.endRound(d0 ? 1 : 0, 'K.O.');
    }
    if (this.netRole === 'host') this.syncNet();
  }
  endRound(w, label) {
    this.phase = 'ko'; this.phaseT = w >= 0 ? 3.2 : 2.4; this.label = label; this.dom = null; this.cutscene = null; this.finisher = null;
    this.fighters.forEach((f) => { f.act = null; f.qte = null; f.blocking = false; f.parryT = 0; f.climbing = false; f.ledge = null; f.ragdollT = 0; f.stun = Math.max(f.stun, 0.5); });
    if (w >= 0) {
      this.wins[w]++;
      this.fighters.forEach((f) => { if (f.team === w) f.wins = this.wins[w]; else f.ko = true; });
      if (this.wins[w] >= this.cfg.target) this.matchWinner = w;
      const wf = this.fighters.find((f) => f.team === w && !f.ko) || this.fighters[w];
      if (wf) {
        wf.stun = 0; wf.ragdollT = 0; wf.inv = 9; wf.vx = 0; wf.vy = Math.min(wf.vy, 0);
        if (wf.y > GROUND + 20) { wf.x = clamp(wf.x, this.stageL + 60, this.stageR - 60); wf.y = GROUND; wf.grounded = true; }
        const col = wf.mahoraga > 0 ? '#ffd54f' : wf.color;
        const line = wf.mahoraga > 0 ? WIN_QUOTES.mahoraga : (WIN_QUOTES[wf.chId] || 'THE BATTLE IS DECIDED!');
        this.victory = {
          team: w, idx: wf.i, t: 0, dur: 3.2, label, color: col,
          name: wf.mahoraga > 0 ? 'MAHORAGA' : wf.name, jp: wf.mahoraga > 0 ? '八握剣・魔虚羅' : (wf.jp || ''),
          sub: this.is2v2 ? `TEAM ${w ? 'B' : 'A'} VICTORY` : (this.wins[w] >= this.cfg.target ? 'FINAL VICTORY' : `ROUND ${this.round} WINNER`),
          line,
        };
        this.ring(wf.x, wf.y - 80, 320, col); this.ring(wf.x, wf.y - 80, 180, '#fff');
        this.spark(wf.x, wf.y - 80, 38, col, 480, 0.75, 6, 120);
        this.flash = { t: 0.28, max: 0.28, c: '#fff' };
        this.sfx.victory();
      }
    } else {
      this.fighters.forEach((f) => (f.ko = true));
      this.victory = null;
    }
    this.msg = w >= 0 ? `${this.is2v2 ? `TEAM ${w ? 'B' : 'A'}` : `PLAYER ${w + 1}`} WINS ROUND ${this.round}` : 'DRAW - REPLAY';
    this.shake = 18; this.freeze = 0.14; this.sfx.ko();
  }
  finisherDef(f) {
    if (!f) return null;
    const key = f.mahoraga > 0 ? 'mahoraga' : f.chId;
    return FINISHERS[key] || { jp: '終極奥義', title: 'ULTIMATE FINISHER', style: 'yuji', color: f.color };
  }
  finisherRange(f) {
    const def = this.finisherDef(f);
    return def?.range ? { rx: def.range, ry: 220, isRanged: true } : { rx: 95, ry: 95, isRanged: false };
  }
  finishTarget(f) {
    if (!f || f.ko || f.dizzy > 0) return null;
    const r = this.finisherRange(f);
    const list = this.fighters.filter((e) => e.team !== f.team && !e.ko && e.dizzy > 0 && Math.abs(e.x - f.x) <= r.rx && Math.abs(e.y - f.y) <= r.ry);
    if (!list.length) return null;
    list.sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x));
    return list[0];
  }
  step(f, o, dt, can) {
    const c = this.controls[this.net ? 0 : f.i] || this.controls[0];
    let inp = {};
    if (f.ai) {
      inp = this.aiInput(f, o, dt, can && !f.ko);
    } else if (this.netRole === 'host' && f.i > 0) {
      const rh = this.remoteHeld[f.i] || {}, rp = this.remotePulse[f.i] || {};
      for (const k in c) {
        const d = !!rh[k] || !!rp[k];
        inp[k] = (d && !this.prev[f.i][k]) || !!rp[k];
        this.prev[f.i][k] = !!rh[k];
        inp['_' + k] = !!rh[k];
        rp[k] = false;
      }
    } else {
      const gp = this.readGamepad(this.net ? 0 : f.i);
      for (const k in c) { const d = c[k].some((x) => this.keys.has(x)) || !!gp?.[k]; inp[k] = d && !this.prev[f.i][k]; this.prev[f.i][k] = d; inp['_' + k] = d; }
    }
    f.inp = inp; f.aura = Math.max(0, f.aura - dt);
    if (f.dizzy > 0 && !f.ko) {
      f.dizzy = Math.max(0, f.dizzy - dt);
      f.vx *= Math.exp(-10 * dt); f.vy += 2200 * dt;
      f.x = clamp(f.x + f.vx * dt, this.stageL + 20, this.stageR - 20);
      f.y = Math.min(GROUND, f.y + f.vy * dt);
      if (f.y >= GROUND) { f.y = GROUND; f.vy = 0; f.grounded = true; }
      if (f.dizzy <= 0) { f.ko = true; this.sfx.ko(); }
      return;
    }
    if (can && !f.ko && !f.ledge && !f.act && f.stun <= 0 && f.ragdollT <= 0 && inp.fin) {
      const ft = this.finishTarget(f);
      if (ft) { this.pushAfter(f, f.color); this.startFinisher(f, ft, f.team); return; }
    }
    const wasMorph = f.mahoraga > 0;
    f.mahoraga = Math.max(0, (f.mahoraga || 0) - dt);
    f.adaptSpin = Math.max(0, (f.adaptSpin || 0) - dt);
    if (wasMorph && f.mahoraga <= 0) {
      f.cd = f.cd.map((v, idx) => (f.skills[idx] === 'summon_mahoraga' ? Math.min(v, 8) : v));
      this.texts.push({ txt: 'MAHORAGA DISMISSED', x: f.x, y: f.y - 160, t: 0.85, max: 0.85, color: '#c46bff', size: 24 });
    }
    if (f.qte) {
      f.qte.t += dt;
      if (!f.qte.done && f.act && can && (inp.punch || inp.kick || inp.s1 || inp.s2 || inp.s3)) {
        if (f.qte.t >= f.qte.start && f.qte.t <= f.qte.end) {
          f.qte.done = true; f.qte.ok = true; f.qteMul = f.qte.mul;
          this.sfx.perfect(); this.ring(f.x, f.y - 80, 125, '#ffd24a');
          this.spark(f.x, f.y - 80, 18, '#ffd24a', 260, 0.4, 5, 0);
          this.texts.push({ txt: `QTE BOOST ×${f.qte.mul}!`, x: f.x, y: f.y - 175, t: 0.75, max: 0.75, color: '#ffd24a', size: 30 });
        } else {
          f.qte.done = true; f.qte.ok = false; f.qteMul = 1;
          this.sfx.miss(); this.texts.push({ txt: 'QTE MISS', x: f.x, y: f.y - 165, t: 0.55, max: 0.55, color: '#9e9e9e', size: 22 });
        }
      }
      if (!f.act || f.qte.t >= f.qte.dur) {
        if (!f.qte.done) f.qte.done = true;
        if (!f.act) f.qte = null;
      }
    }
    const da = this.domAbility(f);
    const cdRate = da ? (da.ability === 'shadow' && da.isOwner ? 2.0 : da.ability === 'slow' && !da.isOwner ? 0.5 : 1) : 1;
    f.cd = f.cd.map((v) => Math.max(0, v - dt * cdRate));
    f.inv -= dt; f.flash -= dt; f.comboT -= dt;
    f.parryT = Math.max(0, f.parryT - dt); f.parryCd = Math.max(0, f.parryCd - dt);
    f.dropT = Math.max(0, f.dropT - dt); f.dropCool = Math.max(0, f.dropCool - dt);
    f.ledgeCd = Math.max(0, f.ledgeCd - dt);
    f.ragdollT = Math.max(0, f.ragdollT - dt);
    f.landT = Math.max(0, (f.landT || 0) - dt);
    if (f.nailT > 0) { f.nailT -= dt; if (f.nailT <= 0) f.nails = 0; }
    if (f.comboT <= 0) f.combo = 0;
    if (f.stun > 0) f.stun -= dt;
    if (can) { f.ce = Math.min(100, f.ce + dt * 1.5 * (f.pas.ce ?? 1)); if (f.pas.regen) f.hp = Math.min(100, f.hp + f.pas.regen * dt); }
    f.amp = Math.max(0, f.amp - dt);

    /* QTE เกาะขอบสนามเมื่อกำลังจะตกแมพ! */
    if (f.ledge && !f.ko && !this.cutscene) {
      const L = f.ledge;
      L.t += dt; L.tug = Math.max(0, (L.tug || 0) - dt); L.shield = Math.max(0, (L.shield || 0) - dt);
      f.vx = 0; f.vy = 0; f.x = L.x + L.side * 12; f.y = GROUND + 46 - (L.progress / L.need) * 14; f.face = -L.side;
      if (can && (inp.jump || inp.punch || inp.kick)) {
        L.progress++; L.tug = 0.14; this.sfx.qte();
        this.spark(L.x, GROUND + 4, 6, '#ffd24a', 180, 0.25, 4, 220);
      }
      if (L.progress >= L.need) {
        const side = L.side, ex = L.x; f.ledge = null; f.y = GROUND; f.x = ex - side * 50; f.vy = -310; f.vx = -side * 170; f.inv = 0.9; f.grounded = false;
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

    const climbs = this.climbs;
    const cl = climbs.find((clm) => Math.abs(f.x - clm.x) < 28 && f.y >= clm.y1 - 4 && f.y <= clm.y2 + 12);
    if (can && !busy && !f.ko && cl && !f.climbing && inp._jump && Math.abs(f.x - cl.x) < 22 && f.y > cl.y1 + 10) {
      f.climbing = true; f.grounded = false; f.vy = -260;
    }

    if (this.cutscene) return;

    const domSpd = da
      ? (da.ability === 'slow' && !da.isOwner ? 0.55 : da.ability === 'fever' && da.isOwner ? 1.25 : da.ability === 'fps' && da.isOwner ? 1.35 : da.ability === 'blitz' && da.isOwner ? 1.45 : 1)
      : 1;

    if (can && !busy && !f.ko && f.climbing) {
      const dir = (inp._right ? 1 : 0) - (inp._left ? 1 : 0);
      f.vx = dir * 220;
      if (dir === 0) f.x += (cl ? cl.x - f.x : 0) * Math.min(1, dt * 10);
      if (inp._jump) { f.vy = -290; f.anim += dt * 1.6; f.grounded = false; }
      else if (inp._block) { f.vy = 290; f.anim += dt * 1.6; f.dropT = 0.18; f.grounded = false; }
      else f.vy = 0;
      const si = ['s1', 's2', 's3'].findIndex((k) => inp[k]);
      const effSk = si >= 0 ? this.effectiveSkill(f, si) : null;
      if (inp.punch) this.begin(f, o, 'punch');
      else if (inp.kick) this.begin(f, o, 'kick');
      else if (effSk && f.cd[si] <= 0) { this.begin(f, o, effSk); f.cd[si] = SKILLS[effSk].cd * (f.pas.cd || 1); }
      else if (inp.dom && f.ce >= 100) this.startDomain(f, o);
    } else if (can && !busy && !f.ko && !f.blocking) {
      const dir = (inp._right ? 1 : 0) - (inp._left ? 1 : 0);
      f.vx = dir * 320 * (f.pas.speed || 1) * (f.mahoraga > 0 ? 1.15 : 1) * (f.amp > 0 ? f.ampSpd : 1) * domSpd; if (dir) f.anim += dt;
      if (inp.jump && f.grounded && !dropped) { f.vy = -840; f.grounded = false; this.sfx.jump(); this.dust(f); }
      const si = ['s1', 's2', 's3'].findIndex((k) => inp[k]);
      const effSk = si >= 0 ? this.effectiveSkill(f, si) : null;
      if (inp.punch) this.begin(f, o, 'punch');
      else if (inp.kick) this.begin(f, o, 'kick');
      else if (effSk && f.cd[si] <= 0) { this.begin(f, o, effSk); f.cd[si] = SKILLS[effSk].cd * (f.pas.cd || 1); }
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
      f.x += Math.sign(this.worldW / 2 - f.x) * Math.min(Math.abs(this.worldW / 2 - f.x), 155 * dt);
    }
    f.x = clamp(f.x + f.vx * dt, -250, this.worldW + 250);
    const py = f.y; f.y = Math.min(H + 300, f.y + f.vy * dt);

    if (f.climbing) {
      const cl2 = climbs.find((clm) => Math.abs(f.x - clm.x) < 26 && f.y >= clm.y1 - 4 && f.y <= clm.y2 + 12);
      if (!cl2) f.climbing = false;
      else if (f.y <= cl2.y1 && (inp._jump || inp._left || inp._right)) { f.y = cl2.y1; f.vy = 0; f.grounded = true; f.climbing = false; f.dropT = 0; }
      else if (f.y >= GROUND && f.x > this.stageL && f.x < this.stageR) { f.y = GROUND; f.vy = 0; f.grounded = true; f.climbing = false; f.dropT = 0; }
      else if (f.y >= cl2.y2) { f.y = cl2.y2; f.vy = 0; f.dropT = 0; }
      return;
    }

    const onStage = f.x > this.stageL && f.x < this.stageR; f.grounded = false;
    if (f.vy >= 0) {
      if (f.dropT <= 0) {
        for (const p of this.platforms) {
          if (f.x >= p.x1 && f.x <= p.x2 && py <= p.y + 4 && f.y >= p.y) {
            if (f.ragdollT > 0 && vyB > 240) { f.y = p.y; f.vy = -vyB * 0.32; f.vx *= 0.65; this.dust(f); }
            else { f.y = p.y; f.vy = 0; f.grounded = true; }
            break;
          }
        }
      }
      if (!f.grounded && onStage && py <= GROUND + 1 && f.y >= GROUND) {
        if (f.ragdollT > 0 && vyB > 240) { f.y = GROUND; f.vy = -vyB * 0.34; f.vx *= 0.65; this.dust(f); this.sfx.land(); this.addDecal(f.x, GROUND, 'crack', '#90a4ae', 34); }
        else { f.y = GROUND; f.vy = 0; f.grounded = true; }
      }
    }
    if (!wasG && f.grounded) {
      f.landT = clamp(vyB / 1500, 0.08, 0.22);
      if (vyB > 380) { this.dust(f); this.sfx.land(); }
      if (vyB > 760) {
        this.shake = Math.max(this.shake, 7);
        this.addDecal(f.x, f.y, 'crack', '#b0bec5', 42);
        this.spark(f.x, f.y, 10, '#cfd8dc', 240, 0.45, 5, 420);
      }
    }
    if (f.grounded && !f.ko && Math.abs(f.vx) > (f.ragdollT > 0 ? 180 : 280) && this.time - (f.skidT || 0) > (f.ragdollT > 0 ? 0.06 : 0.13)) {
      f.skidT = this.time;
      this.spark(f.x - Math.sign(f.vx) * 14, f.y - 2, f.ragdollT > 0 ? 4 : 2, f.ragdollT > 0 ? '#ffd54f' : '#b0bec5', f.ragdollT > 0 ? 180 : 90, 0.28, 4, 220);
    }

    /* ตรวจจับการคว้าขอบสนามตอนจะตกแมพ */
    if (can && !f.grounded && !f.climbing && !f.ko && !f.ledge && f.ledgeCd <= 0 && !f.act && f.vy > 0 && f.y >= GROUND + 4 && f.y <= GROUND + 115) {
      const nearL = Math.abs(f.x - this.stageL) < 46 && f.x <= this.stageL + 16;
      const nearR = Math.abs(f.x - this.stageR) < 46 && f.x >= this.stageR - 16;
      if (nearL || nearR) {
        const side = nearL ? -1 : 1, edgeX = nearL ? this.stageL : this.stageR;
        f.ledge = { side, x: edgeX, t: 0, dur: 2.3, progress: 0, need: 6, tug: 0, shield: 1.4 };
        f.vx = 0; f.vy = 0; f.stun = 0; f.ragdollT = 0; f.x = edgeX + side * 12; f.y = GROUND + 46;
        this.sfx.ledge(); this.spark(edgeX, GROUND, 10, '#fff', 180, 0.3, 4, 200);
      }
    }
  }
  begin(f, o, name) {
    const sp = spec(name); f.act = { name, t: 0, hit: false, fired: false, arc: false }; f.climbing = false; f.parryT = 0;
    f.qteMul = 1;
    f.qte = sp.qte ? { t: 0, start: sp.qte.t0, end: sp.qte.t1, dur: sp.qte.dur, mul: sp.qte.mul || 1.4, done: false, ok: false } : null;
    if (sp.blinkBehind && o && !o.ko && !o.ghost) {
      this.pushAfter(f, sp.color || f.color);
      this.ring(f.x, f.y - 75, 90, sp.color || f.color);
      f.x = clamp(o.x - o.face * 56, this.stageL + 30, this.stageR - 30);
      f.y = o.y; f.grounded = o.grounded; f.face = o.x >= f.x ? 1 : -1;
      this.sfx.warp(); this.ring(f.x, f.y - 75, 110, sp.color || f.color);
      this.texts.push({ txt: 'CLAP FEINT!', x: f.x, y: f.y - 160, t: 0.65, max: 0.65, color: sp.color || '#ff8a3d', size: 28 });
    }
    if (sp.lunge) { f.vx = f.face * sp.lunge; if (sp.lunge >= 500) this.sfx.whoosh(); }
    if (name === 'kick') this.sfx.kick(); else if (sp.kind === 'melee' || sp.kind === 'cutmelee') this.sfx.punch(); else this.sfx.charge();
  }
  actUpdate(f, o, dt) {
    const a = f.act, sp = spec(a.name), col = sp.color || f.color, can = this.phase === 'fight' && (!this.dom || this.dom.st === 'linger') && !this.cutscene; a.t += dt;
    const qm = f.qteMul || 1;
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
        const tgt = can ? this.enemiesOf(f).find((e) => !e.ko && !e.ghost && x2 > e.x - 20 && x1 < e.x + 20 && y2 > e.y - 130 && y1 < e.y) : null;
        if (tgt) {
          a.hit = true;
          if (sp.fx === 'slash' || sp.fx === 'ratio' || sp.fx === 'nullify' || sp.fx === 'soulsplit' || sp.fx === 'collapse' || sp.fx === 'gavel') {
            this.arcs.push({ x: f.x + f.face * 32, y: f.y - 72, r: sp.reach * 0.85, face: f.face, t: 0.26, max: 0.26, color: col });
          }
          if (sp.kind === 'cutmelee' && tgt.inv <= 0 && !tgt.ko && !tgt.blocking && tgt.parryT <= 0) {
            this.startCutscene(f, tgt, sp, a.name);
            return;
          }
          const ok = this.hit(f, tgt, { dmg: sp.dmg * qm, kb: sp.kb * (qm > 1 ? 1.15 : 1), stun: sp.stun, vy: a.name === 'kick' ? 330 : undefined, big: sp.dmg >= 9 || qm > 1, color: qm > 1 ? '#ffd24a' : col, fx: sp.fx, pierceBlock: sp.pierceBlock, ragdoll: sp.ragdoll, basic: a.name === 'punch' || a.name === 'kick', src: a.name });
          if (sp.delay && ok === true) this.later(sp.delay, () => {
            if (this.phase !== 'fight' || (this.dom && this.dom.st !== 'linger') || this.cutscene || tgt.ko) return;
            tgt.inv = 0; this.hit(f, tgt, { dmg: sp.dmg2 * qm, kb: sp.kb2, stun: 0.65, vy: 430, big: true, ragdoll: 0.85, color: col, src: a.name });
            this.ring(tgt.x, tgt.y - 80, 130, col); this.texts.push({ txt: 'IMPACT!', x: tgt.x, y: tgt.y - 150, t: 0.7, max: 0.7, color: col, size: 40 });
          });
        }
      }
    } else if (sp.kind === 'cutblast') {
      if (a.t < sp.fireAt) this.spark(f.x + f.face * 52 + rnd(-45, 45), f.y - 85 + rnd(-45, 45), 2, col, 60, 0.3, 4, 0);
      if (!a.fired && a.t >= sp.fireAt) {
        a.fired = true;
        if (can) {
          const tgt = this.enemiesOf(f).find((e) => !e.ko && Math.abs(e.x - f.x) <= sp.range && Math.abs(e.y - f.y) <= 260);
          if (tgt && (tgt.parryT > 0 || tgt.blocking)) {
            this.ring(f.x + f.face * 50, f.y - 80, 220, col);
            this.hit(f, tgt, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, vy: 450, big: true, color: col, src: a.name });
          } else if (tgt && tgt.inv <= 0 && !tgt.ko) {
            this.startCutscene(f, tgt, sp, a.name);
            return;
          } else {
            this.sfx.boom(); this.ring(f.x + f.face * 60, f.y - 80, 320, col); this.spark(f.x + f.face * 60, f.y - 80, 34, col, 450, 0.6, 6, 150);
          }
        }
      }
    } else if (sp.kind !== 'domain') {
      if ((sp.charge || sp.kind === 'heal' || sp.kind === 'buff' || sp.kind === 'amp' || sp.kind === 'morph') && a.t < sp.fireAt) this.spark(f.x + f.face * 50 + rnd(-40, 40), f.y - 85 + rnd(-40, 40), 1, col, 50, 0.3, 4, 0);
      if (!a.fired && a.t >= sp.fireAt) { a.fired = true; if (can) this.fire(f, o, a.name, sp); }
    }
    if (a.t >= sp.dur) { f.act = null; f.qte = null; f.qteMul = 1; }
  }
  fire(f, o, name, sp) {
    const col = sp.color, x0 = f.x + f.face * 35, y0 = f.y - 80, qm = f.qteMul || 1;
    if (sp.kind === 'proj') {
      if (sp.heal) {
        f.hp = Math.min(100, f.hp + sp.heal);
        this.texts.push({ txt: `+${sp.heal} HP`, x: f.x, y: f.y - 165, t: 0.75, max: 0.75, color: col, size: 28 });
      }
      if (sp.style === 'red') {
        this.arcs.push({ x: f.x + f.face * 24, y: f.y - 80, r: 58, face: f.face, t: 0.22, max: 0.22, color: '#ff3d3d' });
        this.sfx.blast();
      }
      for (let i = 0; i < (sp.n || 1); i++) {
        const shot = () => {
          if (this.phase !== 'fight' || (this.dom && this.dom.st !== 'linger') || this.cutscene || f.stun > 0 || f.ko) return;
          this.shoot(f, sp, { kind: 'orb', src: name, dmg: sp.dmg * qm, dmg2: sp.dmg2 ? sp.dmg2 * qm : undefined, y: f.y - 80 + (sp.offs ? sp.offs[i % sp.offs.length] : 0) });
          this.sfx.shoot(); this.ring(f.x + f.face * 35, f.y - 80, 70, col);
        };
        if (i === 0) shot(); else this.later(i * sp.gap, shot);
      }
    }
    else if (sp.kind === 'dogs') {
      this.sfx.howl(); [0, 0.18].forEach((d, i) => this.later(d, () => this.proj.push({ x: f.x + f.face * 30, y: f.y - 24, vx: f.face * (i ? 840 : 620), owner: f.i, src: name, color: col, life: 1.7, r: 30, dmg: sp.dmg * qm, kb: sp.kb, stun: sp.stun, kind: 'dog', face: f.face })));
    } else if (sp.kind === 'beam') {
      this.beams.push({ x: x0, y: y0, d: f.face, th: sp.th * (qm > 1 ? 1.15 : 1), t: sp.vis, max: sp.vis, color: col, name, style: sp.style }); this.sfx.beam();
      this.ring(x0, y0, sp.th + 80, col); this.shake = Math.max(this.shake, sp.th > 50 ? 24 : 9); if (sp.th > 50) this.flash = { t: 0.2, max: 0.2, c: qm > 1 ? '#ffd24a' : '#e1bee7' };
      this.enemiesOf(f).forEach((t) => {
        if (!t.ko && !t.ghost && t.y - 130 < y0 + sp.th / 2 && t.y > y0 - sp.th / 2 && (t.x - x0) * f.face > -20) {
          this.hit(f, t, { dmg: sp.dmg * qm, kb: sp.kb, stun: sp.stun, vy: sp.vy || 300, big: true, color: col, src: name });
        }
      });
    } else if (sp.kind === 'slashes') {
      this.sfx.slash(); const x1 = f.x + f.face * 40, x2 = f.x + f.face * sp.range, xv = f.x + f.face * Math.min(sp.range, 900);
      const isRika = sp.style === 'rikaclaw';
      if (isRika) {
        this.ring(f.x + f.face * 65, f.y - 80, 140, col);
        this.arcs.push({ x: f.x + f.face * 44, y: f.y - 75, r: 135, face: f.face, t: 0.3, max: 0.3, color: col });
        if (sp.heal) { f.hp = Math.min(100, f.hp + sp.heal); this.texts.push({ txt: `+${sp.heal} HP`, x: f.x, y: f.y - 165, t: 0.75, max: 0.75, color: col, size: 28 }); }
      }
      for (let i = 0; i < sp.n; i++) this.later(i * 0.04, () => {
        this.slashes.push({ x: x1 + (xv - x1) * Math.random(), y: f.y - rnd(10, 140), a: isRika ? (-0.7 + i * 0.26) * f.face : rnd(-1.1, 1.1), len: isRika ? rnd(210, 340) : rnd(160, 300), t: 0.3, max: 0.3, color: name === 'worldslash' ? '#ff5252' : (isRika ? '#ff80ab' : '#80deea') });
        this.sfx.slash();
      });
      this.enemiesOf(f).forEach((t) => {
        if (!t.ko && !t.ghost && (t.x - x1) * f.face > -20 && (t.x - x2) * f.face < 20) {
          this.later(0.08, () => this.phase === 'fight' && !this.cutscene && !t.ko && this.hit(f, t, { dmg: sp.dmg * qm, kb: sp.kb, stun: sp.stun, big: true, color: col, src: name }));
        }
      });
    } else if (sp.kind === 'blue') {
      this.sfx.blue(); this.orbs.push({ x: f.x + f.face * 150, y: f.y - 70, t: 0, hold: sp.hold, owner: f.i, src: name, color: col, tick: 0.2, dmg: sp.dmg * qm, kb: sp.kb });
    } else if (sp.kind === 'warp') {
      this.sfx.warp(); this.ring(f.x, f.y - 70, 110, col);
      const t = o;
      if (!t || t.inv > 0 || t.ko || t.ghost) return;
      if (t.parryT > 0 || t.blocking) {
        this.ring(t.x, t.y - 70, 110, '#4fc3f7');
        this.hit(f, t, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, big: false, color: col, src: name });
        if (t.blocking) this.texts.push({ txt: 'SWAP BLOCKED!', x: t.x, y: t.y - 150, t: 0.65, max: 0.65, color: '#4fc3f7', size: 28 });
        return;
      }
      this.pushAfter(f, col); this.pushAfter(t, col);
      const tx = t.x, ty = t.y; t.x = f.x; t.y = f.y; f.x = tx; f.y = ty; f.face = t.x >= f.x ? 1 : -1;
      this.ring(f.x, f.y - 70, 110, col); this.ring(t.x, t.y - 70, 110, col); this.spark(f.x, f.y - 70, 20, col, 300, 0.5, 5, 0);
      this.hit(f, t, { dmg: sp.dmg, kb: sp.kb, stun: sp.stun, big: false, color: col, src: name });
      this.texts.push({ txt: 'CLAP!', x: f.x, y: f.y - 150, t: 0.6, max: 0.6, color: col, size: 36 });
    } else if (sp.kind === 'speech') {
      this.sfx.speech(); this.ring(f.x, f.y - 80, 160, col); this.ring(f.x, f.y - 80, 320, col);
      this.texts.push({ txt: '「動くな」', x: f.x, y: f.y - 165, t: 0.75, max: 0.75, color: col, size: 34 });
      this.enemiesOf(f).forEach((t) => {
        if (Math.abs(t.x - f.x) < sp.range && t.inv <= 0 && !t.ko && !t.ghost) {
          const sdmg = this.adaptHit(t, name, sp.dmg * qm);
          t.lastHitBy = f.i;
          t.act = null; t.stun = Math.max(t.stun, sp.stunTime); t.vx = 0; t.hp = Math.max(0, t.hp - sdmg); t.flash = 0.12;
          this.ring(t.x, t.y - 80, 140, '#fff'); this.spark(t.x, t.y - 80, 16, '#fff', 260, 0.5, 5, 0);
          this.texts.push({ txt: "DON'T MOVE!", x: t.x, y: t.y - 170, t: 1, max: 1, color: '#fff', size: 38 });
        }
      });
    } else if (sp.kind === 'morph') {
      f.mahoraga = sp.morphDur || 22; f.inv = Math.max(f.inv, 1.2); f.hp = Math.min(100, f.hp + 12);
      f.aura = 2.0; f.auraC = '#ffd54f';
      const s3 = f.skills.indexOf('summon_mahoraga');
      if (s3 >= 0) f.cd[s3] = 1.0;
      this.sfx.domainOpen(); this.sfx.wheel(); this.shake = Math.max(this.shake, 18);
      this.flash = { t: 0.24, max: 0.24, c: '#ffd54f' };
      this.pillars.push({ x: f.x, y: f.y, t: 0.65, max: 0.65, color: '#ffd54f', w: 110 });
      this.ring(f.x, f.y - 80, 260, '#ffd54f'); this.ring(f.x, f.y - 80, 150, '#fff');
      this.spark(f.x, f.y - 80, 34, '#ffd54f', 420, 0.7, 6, 120);
      this.texts.push({ txt: 'WITH THIS TREASURE...', x: f.x, y: f.y - 195, t: 1.0, max: 1.0, color: '#ffd54f', size: 24 });
      this.texts.push({ txt: 'MAHORAGA UNLEASHED!', x: f.x, y: f.y - 160, t: 1.15, max: 1.15, color: '#fff', size: 34 });
      this.enemiesOf(f).forEach((t) => {
        if (!t.ko && !t.ghost && Math.abs(t.x - f.x) < 190 && Math.abs(t.y - f.y) < 150) {
          this.hit(f, t, { dmg: 6, kb: 520, stun: 0.4, vy: 280, big: true, color: '#ffd54f', src: name });
        }
      });
    } else if (sp.kind === 'buff') {
      f.inv = Math.max(f.inv, sp.time); f.aura = sp.time; f.auraC = col;
      if (sp.style === 'waterwall') {
        this.sfx.splash();
        if (sp.heal) f.hp = Math.min(100, f.hp + sp.heal);
        this.ring(f.x, f.y - 75, sp.pushRadius || 175, col);
        this.ring(f.x, f.y - 75, 110, '#fff');
        this.spark(f.x, f.y - 75, 28, col, 360, 0.6, 5, 260);
        this.texts.push({ txt: `ABYSSAL BARRIER! +${sp.heal || 0}`, x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 32 });
        this.enemiesOf(f).forEach((t) => {
          if (!t.ko && !t.ghost && Math.hypot(t.x - f.x, t.y - f.y) < (sp.pushRadius || 175)) {
            this.hit(f, t, { dmg: (sp.dmg || 7) * qm, kb: sp.kb || 740, stun: 0.5, vy: 260, big: true, color: col, src: name });
          }
        });
      } else {
        this.sfx.buff(); this.ring(f.x, f.y - 80, 150, col);
        this.texts.push({ txt: 'INFINITY', x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 38 });
      }
    } else if (sp.kind === 'heal') {
      this.sfx.heal(); f.hp = Math.min(100, f.hp + sp.heal); this.spark(f.x, f.y - 60, 30, col, 200, 0.8, 6, -300); this.ring(f.x, f.y - 80, 120, col);
      this.texts.push({ txt: `+${sp.heal} HP`, x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 36 });
    } else if (sp.kind === 'amp') {
      this.sfx.buff(); f.amp = sp.time; f.ampMul = sp.mul; f.ampSpd = sp.spd || 1; if (sp.inv) f.inv = Math.max(f.inv, sp.inv);
      f.aura = sp.time; f.auraC = col; this.ring(f.x, f.y - 80, 150, col); this.spark(f.x, f.y - 60, 22, col, 260, 0.7, 5, -200);
      if (sp.style === 'train') {
        this.sfx.clang();
        this.pillars.push({ x: f.x - 52, y: f.y, t: 0.55, max: 0.55, color: '#7dff6b', w: 18 });
        this.pillars.push({ x: f.x + 52, y: f.y, t: 0.55, max: 0.55, color: '#ff4081', w: 18 });
      }
      this.texts.push({ txt: sp.short, x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 34 });
    } else if (sp.kind === 'jackpot') {
      this.sfx.jackpot(); this.ring(f.x, f.y - 80, 140, col);
      if (Math.random() < 0.3) {
        f.hp = Math.min(100, f.hp + 22); f.inv = Math.max(f.inv, 2.2); f.aura = 2.2; f.auraC = col; this.spark(f.x, f.y - 80, 40, col, 500, 0.8, 7, 200);
        this.texts.push({ txt: '777 JACKPOT!', x: f.x, y: f.y - 170, t: 1.2, max: 1.2, color: col, size: 46 });
      } else { f.ce = Math.min(100, f.ce + 35); this.texts.push({ txt: 'CE +35', x: f.x, y: f.y - 170, t: 0.9, max: 0.9, color: col, size: 34 }); }
    } else if (sp.kind === 'strike') {
      const tx = o.x, ty = o.floorY !== null ? o.floorY : GROUND;
      this.sfx.charge(); this.warns.push({ x: tx, y: ty, r: sp.radius, t: sp.delay, max: sp.delay, color: col, name });
      this.later(sp.delay, () => {
        if (this.phase !== 'fight' || (this.dom && this.dom.st !== 'linger') || this.cutscene) return;
        this.pillars.push({ x: tx, y: ty, t: 0.5, max: 0.5, color: col, w: sp.radius * 0.7 });
        this.sfx[sp.style === 'maw' ? 'howl' : 'thunder'](); this.shake = Math.max(this.shake, 16);
        this.spark(tx, ty, 26, col, 420, 0.6, 6, 400); this.ring(tx, ty, sp.radius * 2.2, '#fff'); this.zaps.push({ x: tx, y: ty - 150, t: 0.3, color: col });
        if (name === 'eruption' || name === 'meteor' || sp.style === 'maw') this.addDecal(tx, ty, name === 'eruption' || name === 'meteor' ? 'scorch' : 'crack', col, sp.radius * 0.72);
        this.enemiesOf(f).forEach((t) => {
          if (!t.ko && !t.ghost && Math.abs(t.x - tx) < sp.radius && Math.abs(t.y - ty) < 160) this.hit(f, t, { dmg: sp.dmg * qm, kb: sp.kb, stun: sp.stun, vy: sp.vy, big: true, color: col, src: name });
        });
      });
    }
  }
  shoot(f, sp, over) {
    this.proj.push({ x: f.x + f.face * 45, y: f.y - 80, sx: f.x + f.face * 20, sy: f.y - 80, vx: f.face * sp.speed, owner: f.i, color: sp.color, style: sp.style, life: sp.life, r: sp.r, dmg: sp.dmg, kb: sp.kb, stun: sp.stun, boom: sp.boom, vy: sp.vy, drainCe: sp.drainCe, cdAdd: sp.cdAdd, arrow: sp.arrow, face: f.face, echo: sp.echo, dmg2: sp.dmg2, kb2: sp.kb2, small: sp.small, ...over });
  }
  updateOrb(o, dt, can) {
    o.t += dt; const att = this.fighters[o.owner];
    if (!can) return o.t < o.hold + 0.1;
    const enemies = att ? this.enemiesOf(att) : [];
    enemies.forEach((t) => {
      if (!t.ghost && !t.ko) {
        const dx = o.x - t.x; t.x += Math.sign(dx) * Math.min(Math.abs(dx), 480 * dt);
        if (t.grounded && Math.abs(dx) < 160) { t.vx = 0; t.vy = -120; t.grounded = false; }
      }
    });
    this.spark(o.x + rnd(-60, 60), o.y + rnd(-60, 60), 1, o.color, 40, 0.3, 4, 0);
    o.tick -= dt;
    if (o.tick <= 0) {
      o.tick = 0.25;
      enemies.forEach((t) => { if (!t.ko && Math.abs(t.x - o.x) < 110) this.hit(att, t, { dmg: 2, kb: 0, stun: 0.12, vy: 0, color: o.color, src: o.src || 'blue' }); });
    }
    if (o.t >= o.hold) {
      this.ring(o.x, o.y, 220, o.color); this.ring(o.x, o.y, 120, '#fff'); this.spark(o.x, o.y, 34, o.color, 420, 0.6, 6, 200); this.shake = 14; this.sfx.boom();
      enemies.forEach((t) => { if (!t.ko && Math.abs(t.x - o.x) < 150) { t.inv = 0; this.hit(att, t, { dmg: o.dmg, kb: o.kb, stun: 0.5, vy: 400, big: true, color: o.color, src: o.src || 'blue' }); } });
      return false;
    }
    return true;
  }
  /* ---------------- CUTSCENE SYSTEM (10 ท่าคัตซีน!) ---------------- */
  startCutscene(f, o, sp, name) {
    this.cutscene = { owner: f.i, target: o.i, sp, name, t: 0, dur: CUT_DUR, step: 0, ox: o.x, oy: o.y, qte: { t0: 0.50, t1: 1.08, done: false, ok: false, mul: 1.25 } };
    f.act = { name, t: 0, fired: true, hit: true }; f.vx = 0; f.vy = 0; f.inv = CUT_DUR + 0.4; f.climbing = false; f.ledge = null; f.qte = null;
    o.act = null; o.vx = 0; o.vy = 0; o.stun = CUT_DUR + 0.4; o.inv = 0; o.climbing = false; o.ledge = null; o.ragdollT = 0;
    this.sfx.cutscene(); this.flash = { t: 0.24, max: 0.24, c: '#fff' }; this.shake = 14;
    this.ring(o.x, o.y - 80, 220, sp.color);
  }
  updateCutscene(dt) {
    const cs = this.cutscene, f = this.fighters[cs.owner], o = this.fighters[cs.target], sp = cs.sp;
    cs.t += dt; f.inv = 0.5; f.vx = 0; f.vy = 0; o.vx = 0; o.vy = 0; o.stun = Math.max(o.stun, 0.5);
    if (cs.qte && !cs.qte.done) {
      const pi = f.inp || {};
      if (cs.t <= cs.qte.t1 && (pi.punch || pi.kick || pi.s1 || pi.s2 || pi.s3)) {
        if (cs.t >= cs.qte.t0) {
          cs.qte.done = true; cs.qte.ok = true;
          this.sfx.perfect(); this.ring(f.x, f.y - 80, 210, '#ffd24a');
          this.spark(o.x, o.y - 80, 22, '#ffd24a', 340, 0.45, 5, 0);
          this.texts.push({ txt: `CRITICAL QTE ×${cs.qte.mul}!`, x: (f.x + o.x) / 2, y: o.y - 185, t: 0.8, max: 0.8, color: '#ffd24a', size: 36 });
        } else {
          cs.qte.done = true; cs.qte.ok = false;
          this.sfx.miss(); this.texts.push({ txt: 'QTE MISS', x: f.x, y: f.y - 165, t: 0.5, max: 0.5, color: '#9e9e9e', size: 24 });
        }
      } else if (cs.t > cs.qte.t1) {
        cs.qte.done = true;
      }
    }
    const qm = cs.qte?.ok ? cs.qte.mul : 1;
    const dmgScale = sp.dmg * (f.pas.dmg || 1) * (f.mahoraga > 0 ? 1.12 : 1) * (f.amp > 0 ? f.ampMul : 1) * (o.pas.guard || 1);
    const dir = o.x >= f.x ? 1 : -1;
    const beats = [0.40, 0.72, 1.02];

    if (cs.step < 3 && cs.t >= beats[cs.step]) {
      const k = cs.step++;
      const side = k % 2 ? -1 : 1;
      const bDmg = this.adaptHit(o, cs.name, dmgScale * 0.12);
      o.lastHitBy = f.i; o.hp = Math.max(0, o.hp - bDmg); o.flash = 0.12;
      if (sp.cut === 'bf3' || sp.cut === 'gamble') {
        this.pushAfter(f, sp.color);
        f.x = clamp(o.x - side * 72, 80, this.worldW - 80); f.y = o.y; f.face = side; f.act = { name: cs.name, t: 0.14 };
        this.impulse(o, side * 160, 140);
        for (let i = 0; i < 4; i++) this.zaps.push({ x: o.x, y: o.y - 80, t: 0.25, color: i % 2 ? sp.color : '#111' });
        this.ring(o.x, o.y - 80, 140 + k * 35, sp.color);
        this.texts.push({ txt: sp.cut === 'gamble' ? ['7', '7', '7'][k] : `黒閃 ${k + 1}!`, x: o.x + rnd(-50, 50), y: o.y - 160 - k * 14, t: 0.65, max: 0.65, color: sp.color, size: 36 });
        if (sp.cut === 'gamble' && k === 2) { f.hp = Math.min(100, f.hp + 10); this.texts.push({ txt: '+10 HP JACKPOT!', x: f.x, y: f.y - 160, t: 0.9, max: 0.9, color: '#ffd24a', size: 32 }); this.sfx.jackpot(); }
        else this.sfx.bf();
        this.shake = 16; this.freeze = 0.07;
      } else if (sp.cut === 'bisect' || sp.cut === 'mahoraga') {
        this.pushAfter(f, sp.color);
        f.x = clamp(o.x + (k % 2 ? 120 : -120), 80, this.worldW - 80); f.y = o.y; f.face = o.x >= f.x ? 1 : -1;
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
      const finDmg = this.adaptHit(o, cs.name, dmgScale * 0.64 * qm);
      o.lastHitBy = f.i; o.hp = Math.max(0, o.hp - finDmg); o.flash = 0.24; o.stun = Math.max(sp.stun, 0.9); o.ragdollT = 0.95;
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
      this.texts.push({ txt: `${sp.short}!`, x: cx, y: Math.max(170, o.y - 200), t: 1.0, max: 1.0, color: sp.color, size: 46 });
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
    c.restore();
  }
  drawCutsceneBars() {
    const cs = this.cutscene; if (!cs) return;
    const c = this.c, sp = cs.sp, t = cs.t, bar = Math.min(1, t / 0.18) * 76;
    const vx0 = this.vx0 ?? 0, vy0 = this.vy0 ?? 0, vw = this.vw ?? W, vy1 = this.vy1 ?? H;
    c.save();
    c.globalAlpha = 1; c.fillStyle = '#000';
    c.fillRect(vx0, vy0, vw, Math.max(0, bar - vy0)); c.fillRect(vx0, H - bar, vw, Math.max(0, vy1 - (H - bar)));
    c.fillStyle = sp.color; c.fillRect(vx0, bar - 3, vw, 3); c.fillRect(vx0, H - bar, vw, 3);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `44px ${FONT}`; c.lineWidth = 6; c.strokeStyle = '#000';
    c.strokeText(sp.jp || sp.short, W / 2, bar / 2); c.fillStyle = '#fff'; c.fillText(sp.jp || sp.short, W / 2, bar / 2);
    c.font = `24px ${FONT}`; c.fillStyle = sp.color; c.fillText(sp.name.toUpperCase(), W / 2, H - bar / 2);
    if (cs.qte && t < 1.3) {
      const q = cs.qte, f = this.fighters[cs.owner], qx = W / 2, qy = H - bar - 58;
      if (!q.done) {
        const inWin = t >= q.t0 && t <= q.t1;
        const p = clamp(t / q.t1, 0, 1);
        c.fillStyle = 'rgba(6, 4, 14, 0.85)'; c.fillRect(qx - 170, qy - 24, 340, 48);
        c.strokeStyle = inWin ? '#ffd24a' : '#fff'; c.lineWidth = inWin ? 3 : 2; c.strokeRect(qx - 170, qy - 24, 340, 48);
        c.fillStyle = '#1b142c'; c.fillRect(qx - 150, qy + 6, 300, 10);
        const w0 = (q.t0 / q.t1) * 300;
        c.fillStyle = inWin ? '#ffd24a' : '#ffa726aa'; c.fillRect(qx - 150 + w0, qy + 5, 300 - w0, 12);
        c.fillStyle = '#fff'; c.fillRect(qx - 150 + p * 300 - 3, qy + 2, 6, 18);
        c.font = `14px ${FONT}`; c.fillStyle = inWin ? '#ffd24a' : '#fff';
        c.fillText(`QTE ×${q.mul}! TAP [${(this.hints[f.i] || this.hints[0])[4]}]`, qx, qy - 8);
      } else if (q.ok) {
        c.font = `20px ${FONT}`; c.fillStyle = '#ffd24a'; c.shadowColor = '#ffd24a'; c.shadowBlur = 16;
        c.fillText(`OVERDRIVE QTE ACTIVATED ×${q.mul}!`, qx, qy);
      }
    }
    c.restore();
  }
  /* ---------------- SIGNATURE FINISHER ATTACK (19 ท่าปิดฉากเฉพาะตัวละคร ไม่ซ้ำกัน!) ---------------- */
  startFinisher(f, o, winTeam) {
    if (!f || !o) { this.endRound(winTeam, 'K.O.'); return; }
    const def = this.finisherDef(f);
    const maxDist = def.range || 220;
    const continueFight = this.fighters.some((m) => m.team !== winTeam && m !== o && !m.ko && (m.hp > 0 || m.dizzy > 0) && m.y <= H + 100);
    this.dom = null; this.cutscene = null;
    this.proj = []; this.orbs = []; this.beams = []; this.warns = [];
    this.fighters.forEach((x) => {
      if (x !== o && x !== f) { x.vx = 0; x.vy = 0; x.act = null; x.ledge = null; x.climbing = false; }
    });
    o.x = clamp(o.x, this.stageL + 60, this.stageR - 60);
    if (o.y > GROUND) o.y = GROUND;
    o.grounded = o.y >= GROUND - 2;
    o.hp = 0; o.dizzy = 0;
    o.vx = 0; o.vy = 0; o.ko = false; o.ragdollT = 0; o.stun = 3.2; o.act = null; o.ledge = null; o.climbing = false; o.inv = 0;
    const dir = o.x >= f.x ? 1 : -1;
    if (Math.abs(o.x - f.x) > maxDist || f.y > GROUND + 20) f.x = clamp(o.x - dir * (def.range ? Math.min(340, def.range) : 130), this.stageL + 40, this.stageR - 40);
    else if (!def.range && Math.abs(o.x - f.x) > 220) f.x = clamp(o.x - dir * 130, this.stageL + 40, this.stageR - 40);
    if (!def.range || Math.abs(f.y - o.y) > 220) f.y = o.y;
    f.grounded = f.y >= GROUND - 2; f.face = o.x >= f.x ? 1 : -1;
    f.act = { name: 'punch', t: 0 }; f.vx = 0; f.vy = 0; f.climbing = false; f.ledge = null; f.qte = null; f.inv = 4; f.ko = false;
    this.phase = 'finisher';
    this.finisher = { owner: f.i, target: o.i, team: winTeam, continueFight, jp: def.jp, title: def.title, style: def.style, color: def.color, t: 0, dur: 2.15, step: 0, ox: o.x, fx: f.x };
    this.sfx.cutscene();
    this.flash = { t: 0.22, max: 0.22, c: '#fff' };
    this.shake = 18;
    this.freeze = 0.08;
    this.ring(o.x, o.y - 80, 240, def.color);
    this.texts.push({ txt: 'FINISHER!', x: (f.x + o.x) / 2, y: Math.max(150, o.y - 185), t: 0.75, max: 0.75, color: '#ffd24a', size: 38 });
  }
  updateFinisher(dt) {
    const fn = this.finisher; if (!fn) return;
    const f = this.fighters[fn.owner], o = this.fighters[fn.target];
    if (!f || !o) { const w = fn.team; this.finisher = null; this.endRound(w, 'K.O.'); return; }
    fn.t += dt;
    f.inv = 2; f.vx = 0; f.vy = 0;
    const dir = o.x >= f.x ? 1 : -1;
    const beats = [0.32, 0.62, 0.92];
    if (fn.step < 3 && fn.t >= beats[fn.step]) {
      const k = fn.step++, side = k % 2 ? -1 : 1;
      o.flash = 0.14;
      switch (fn.style) {
        case 'gojo':
          f.act = { name: 'blue', t: 0.3 };
          this.ring((f.x + o.x) / 2, o.y - 95, 160 + k * 45, k === 0 ? '#40c4ff' : k === 1 ? '#ff3d3d' : '#d500f9');
          this.spark(o.x, o.y - 85, 18, k === 2 ? '#d500f9' : '#40c4ff', 300, 0.45, 5, 0);
          if (k === 1) this.texts.push({ txt: '虚式「茈」', x: f.x, y: f.y - 165, t: 0.55, max: 0.55, color: '#d500f9', size: 30 });
          this.sfx.blue(); this.shake = 12 + k * 4;
          break;
        case 'sukuna':
          this.pushAfter(f, '#ff2d55');
          f.x = clamp(o.x + (k % 2 ? 125 : -125), this.stageL + 30, this.stageR - 30);
          f.y = o.y; f.face = o.x >= f.x ? 1 : -1; f.act = { name: 'cleave', t: 0.16 };
          for (let i = 0; i < 3; i++) this.slashes.push({ x: o.x + rnd(-50, 50), y: o.y - 75 + rnd(-45, 45), a: rnd(-1.2, 1.2), len: 860, t: 0.32, max: 0.32, color: i ? '#ff2d55' : '#fff' });
          if (k === 1) this.texts.push({ txt: '龍鱗・反発・番の流星', x: f.x, y: f.y - 165, t: 0.55, max: 0.55, color: '#ff5252', size: 22 });
          this.sfx.slash(); this.shake = 18;
          break;
        case 'yuji':
          this.pushAfter(f, '#ff1744');
          f.x = clamp(o.x - side * 68, this.stageL + 30, this.stageR - 30);
          f.y = o.y; f.face = side; f.act = { name: k === 1 ? 'kick' : 'punch', t: 0.14 };
          this.impulse(o, side * 220, 150);
          for (let i = 0; i < 5; i++) this.zaps.push({ x: o.x, y: o.y - 80, t: 0.28, color: i % 2 ? '#ff1744' : '#111' });
          this.ring(o.x, o.y - 80, 155 + k * 40, '#ff1744');
          this.texts.push({ txt: `黒閃 ×${k + 1}!`, x: o.x + rnd(-40, 40), y: o.y - 155 - k * 14, t: 0.55, max: 0.55, color: '#ff1744', size: 36 });
          this.sfx.bf(); this.shake = 20;
          break;
        case 'megumi':
          f.act = { name: 'cast', t: 0.28 };
          this.pillars.push({ x: o.x + (k - 1) * 65, y: GROUND, t: 0.45, max: 0.45, color: '#311b92', w: 46 });
          this.zaps.push({ x: o.x, y: o.y - 95, t: 0.28, color: '#b388ff' });
          this.ring(o.x, GROUND - 10, 170 + k * 40, '#c46bff');
          if (k === 1) this.texts.push({ txt: 'NUE THUNDER!', x: o.x, y: o.y - 170, t: 0.55, max: 0.55, color: '#b388ff', size: 28 });
          this.sfx[k === 1 ? 'thunder' : 'howl'](); this.shake = 16;
          break;
        case 'mahoraga':
          this.pushAfter(f, '#ffd54f');
          f.x = clamp(o.x - side * 95, this.stageL + 30, this.stageR - 30);
          f.y = o.y; f.face = side; f.act = { name: 'cleave', t: 0.18 };
          this.slashes.push({ x: o.x, y: o.y - 80, a: [-0.65, 0.65, 0][k], len: 900, t: 0.35, max: 0.35, color: '#ffd54f' });
          this.ring(o.x, o.y - 80, 160 + k * 45, '#ffd54f');
          this.sfx[k < 2 ? 'wheel' : 'slash'](); this.shake = 17;
          break;
        case 'nobara':
          f.act = { name: 'punch', t: 0.16 };
          this.ring(o.x + (k - 1) * 35, o.y - 75, 95, '#ff6bd6');
          this.spark(o.x + (k - 1) * 30, o.y - 75, 14, '#ff6bd6', 240, 0.4, 4, 0);
          this.texts.push({ txt: k < 2 ? 'HAIRPIN!' : 'RESONANCE!', x: o.x, y: o.y - 155, t: 0.5, max: 0.5, color: '#ff6bd6', size: 30 });
          this.sfx.parry(); this.shake = 13;
          break;
        case 'nanami':
          this.pushAfter(f, '#ffd24a');
          f.x = clamp(o.x - dir * 82, this.stageL + 30, this.stageR - 30);
          f.y = o.y; f.face = dir; f.act = { name: 'cleave', t: 0.16 };
          this.arcs.push({ x: o.x, y: o.y - 75, r: 145, face: dir, t: 0.25, max: 0.25, color: '#ffd24a' });
          this.texts.push({ txt: ['3 : 7', '6 : 4', '7 : 3 CRITICAL!'][k], x: o.x, y: o.y - 165, t: 0.5, max: 0.5, color: '#ffd24a', size: 30 });
          this.sfx[k === 2 ? 'perfect' : 'slash'](); this.shake = 14 + k * 3;
          break;
        case 'maki':
          this.pushAfter(f, '#7dff6b');
          f.x = clamp(o.x - side * 78, this.stageL + 30, this.stageR - 30);
          f.y = o.y; f.face = side; f.act = { name: 'kick', t: 0.15 };
          this.arcs.push({ x: o.x, y: o.y - 75, r: 165, face: side, t: 0.24, max: 0.24, color: '#7dff6b' });
          this.spark(o.x, o.y - 75, 18, '#ef5350', 340, 0.35, 5, 0);
          this.sfx.hit(); this.shake = 17;
          break;
        case 'toji':
          this.pushAfter(f, '#fff');
          f.x = clamp(o.x + (k % 2 ? 120 : -120), this.stageL + 30, this.stageR - 30);
          f.y = o.y; f.face = o.x >= f.x ? 1 : -1; f.act = { name: 'fire', t: 0.16 };
          this.slashes.push({ x: o.x, y: o.y - 75, a: [-0.35, 0.35, 0][k], len: 780, t: 0.3, max: 0.3, color: '#e0f7fa' });
          this.sfx.dash(); this.sfx.slash(); this.shake = 16;
          break;
        case 'toge':
          f.act = { name: 'cast', t: 0.22 };
          this.ring(o.x, o.y - 80, 150 + k * 65, '#3dd6ff');
          this.texts.push({ txt: ['「止まれ」', '「堕ちろ」', '「爆ぜろ!!」'][k], x: o.x, y: o.y - 165, t: 0.6, max: 0.6, color: '#3dd6ff', size: 34 });
          this.sfx.speech(); this.shake = 15 + k * 3;
          break;
        case 'todo': {
          this.pushAfter(f, '#ff8a3d');
          this.pushAfter(o, '#3dd6ff');
          const ox0 = o.x; o.x = f.x; f.x = ox0;
          f.face = o.x >= f.x ? 1 : -1; f.act = { name: k === 2 ? 'kick' : 'clap', t: 0.18 };
          this.ring(f.x, f.y - 80, 130, '#3dd6ff'); this.ring(o.x, o.y - 80, 130, '#ff8a3d');
          this.texts.push({ txt: 'CLAP! 👏', x: (f.x + o.x) / 2, y: o.y - 165, t: 0.5, max: 0.5, color: '#ffd24a', size: 34 });
          this.sfx.warp(); this.sfx.bf(); this.shake = 18;
          break;
        }
        case 'yuta':
          f.act = { name: 'cast', t: 0.25 };
          this.arcs.push({ x: o.x, y: o.y - 80, r: 175, face: dir, t: 0.26, max: 0.26, color: '#ff80ab' });
          this.zaps.push({ x: o.x, y: o.y - 80, t: 0.3, color: '#fff' });
          if (k === 1) this.texts.push({ txt: 'COME, RIKA!', x: f.x, y: f.y - 170, t: 0.6, max: 0.6, color: '#ff80ab', size: 30 });
          this.sfx[k === 0 ? 'slash' : 'charge'](); this.shake = 16;
          break;
        case 'mahito':
          f.act = { name: 'cast', t: 0.25 };
          this.ring(o.x, o.y - 80, 130 + k * 45, '#7dff6b');
          this.spark(o.x, o.y - 80, 18, '#b2ff59', 260, 0.5, 5, -140);
          if (k === 1) this.texts.push({ txt: 'IDLE TRANSFIGURATION', x: o.x, y: o.y - 165, t: 0.6, max: 0.6, color: '#7dff6b', size: 24 });
          this.sfx.warp(); this.shake = 14;
          break;
        case 'jogo':
          f.act = { name: 'cast', t: 0.28 };
          this.pillars.push({ x: o.x + (k - 1) * 90, y: GROUND, t: 0.55, max: 0.55, color: '#ff6d00', w: 58 });
          this.spark(o.x, GROUND - 20, 22, '#ffab40', 360, 0.55, 6, 200);
          this.sfx.fire(); this.shake = 16;
          break;
        case 'hakari':
          f.act = { name: k === 2 ? 'punch' : 'clap', t: 0.16 };
          this.ring(o.x, o.y - 80, 150 + k * 40, k === 2 ? '#ffd24a' : '#7dff6b');
          this.texts.push({ txt: k === 2 ? '7 · 7 · 7!' : `${['7', '7 · 7'][k]}`, x: o.x, y: o.y - 165, t: 0.55, max: 0.55, color: '#ffd24a', size: 38 });
          this.sfx[k === 2 ? 'jackpot' : 'perfect'](); this.shake = 15 + k * 3;
          break;
        case 'choso':
          f.act = { name: 'cast', t: 0.25 };
          this.ring(o.x, o.y - 80, 135 + k * 35, '#ff1744');
          this.spark(o.x, o.y - 80, 16, '#ff1744', 320, 0.45, 5, 0);
          if (k === 1) this.texts.push({ txt: '百斂 · CONVERGENCE', x: f.x, y: f.y - 165, t: 0.55, max: 0.55, color: '#ff5252', size: 26 });
          this.sfx.charge(); this.shake = 14;
          break;
        case 'higuruma':
          f.act = { name: 'cleave', t: 0.2 };
          this.pillars.push({ x: o.x + (k - 1) * 60, y: GROUND, t: 0.42, max: 0.42, color: '#ffe57f', w: 48 });
          this.texts.push({ txt: ['CONFISCATION!', 'GUILTY!', 'DEATH PENALTY!'][k], x: o.x, y: o.y - 170, t: 0.55, max: 0.55, color: '#ffd24a', size: 28 });
          this.sfx.gavel(); this.shake = 16;
          break;
        case 'dagon':
          f.act = { name: 'cast', t: 0.25 };
          this.pushAfter(o, '#3dd6ff');
          this.slashes.push({ x: o.x, y: o.y - 60 - k * 15, a: k % 2 ? 0.18 : -0.18, len: 640, t: 0.28, max: 0.28, color: '#3dd6ff' });
          this.spark(o.x, o.y - 70, 18, '#80d8ff', 320, 0.45, 5, 120);
          this.sfx.hit(); this.shake = 15;
          break;
        default: // 'geto'
          f.act = { name: 'blue', t: 0.3 };
          this.ring(o.x, o.y - 85, 150 + k * 45, '#c46bff');
          this.spark(o.x, o.y - 80, 20, '#7c4dff', 340, 0.45, 5, 0);
          this.sfx.blue(); this.shake = 13 + k * 4;
          break;
      }
    } else if (fn.step === 3 && fn.t >= 1.24) {
      fn.step = 4;
      f.act = { name: 'fuga', t: 0.28 }; f.face = dir;
      const cx = (fn.style === 'gojo' || fn.style === 'geto' || fn.style === 'choso') ? (f.x + o.x) / 2 : o.x;
      for (let i = 0; i < 6; i++) this.zaps.push({ x: o.x + rnd(-45, 45), y: o.y - 80 + rnd(-45, 45), t: 0.45, color: i % 2 ? fn.color : '#fff' });
      if (['sukuna', 'mahoraga', 'nanami', 'toji', 'choso'].includes(fn.style)) {
        for (let i = 0; i < 7; i++) this.slashes.push({ x: o.x + rnd(-90, 90), y: o.y - 80 + rnd(-60, 60), a: fn.style === 'sukuna' ? 0 : rnd(-1.4, 1.4), len: 1300, t: 0.55, max: 0.55, color: fn.color });
      }
      if (['yuta', 'jogo', 'higuruma', 'megumi', 'dagon'].includes(fn.style)) {
        this.pillars.push({ x: o.x, y: GROUND, t: 0.82, max: 0.82, color: fn.color, w: 175 });
      }
      if (fn.style === 'choso' || fn.style === 'yuta' || fn.style === 'gojo') {
        this.beams.push({ x: f.x + dir * 24, y: o.y - 75, d: dir, th: fn.style === 'choso' ? 38 : 110, color: fn.color, t: 0.42, max: 0.42, style: fn.style === 'gojo' ? 'purple' : fn.style === 'choso' ? 'piercing' : '' });
      }
      this.ring(cx, o.y - 80, 500, fn.color);
      this.ring(cx, o.y - 80, 290, '#fff');
      this.spark(cx, o.y - 80, 64, fn.color, 660, 0.85, 8, 160);
      this.flash = { t: 0.36, max: 0.36, c: (fn.style === 'yuji' || fn.style === 'todo') ? '#000' : '#fff' };
      this.shake = 36; this.freeze = 0.14;
      this.sfx[fn.style === 'toge' ? 'speech' : fn.style === 'hakari' ? 'jackpot' : fn.style === 'higuruma' ? 'gavel' : 'heavy']();
      this.sfx.boom();
      this.texts.push({ txt: `${fn.title}!`, x: cx, y: Math.max(165, o.y - 205), t: 1.0, max: 1.0, color: fn.color, size: 42 });
      o.ko = true; o.ragdollT = 1.4; o.vx = dir * 880; o.vy = -500; o.grounded = false;
      this.impulse(o, dir * 820, 480);
    }
    if (fn.step < 4) {
      o.vx = 0; o.vy = 0; o.stun = 1;
    } else {
      o.vy += 1900 * dt;
      o.x = clamp(o.x + o.vx * dt, -200, this.worldW + 200);
      o.y = Math.min(H + 260, o.y + o.vy * dt);
      if (o.vy >= 0 && o.y >= GROUND && o.x > this.stageL && o.x < this.stageR) {
        o.y = GROUND; o.vy = -Math.abs(o.vy) * 0.25; o.vx *= 0.65;
      }
    }
    if (fn.t >= fn.dur) {
      const w = fn.team, cont = fn.continueFight;
      this.finisher = null;
      if (cont) {
        this.phase = 'fight';
        f.act = null; f.inv = 0.5;
      } else {
        this.endRound(w, 'FINISHER!');
      }
    }
  }
  drawFinisherOverlay() {
    const fn = this.finisher; if (!fn) return;
    const c = this.c, f = this.fighters[fn.owner], o = this.fighters[fn.target], t = fn.t;
    if (!f || !o) return;
    c.save();
    const dir = o.x >= f.x ? 1 : -1;
    const cx = (fn.style === 'gojo' || fn.style === 'geto') ? (f.x + o.x) / 2 : o.x, cy = o.y - 80;
    c.globalAlpha = 0.55; c.strokeStyle = fn.color; c.lineWidth = 2.5;
    for (let i = 0; i < 40; i++) {
      const an = (i / 40) * Math.PI * 2 + t * 3.0, r0 = 120 + ((i * 31) % 75);
      c.beginPath(); c.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0);
      c.lineTo(cx + Math.cos(an) * (r0 + 760), cy + Math.sin(an) * (r0 + 760)); c.stroke();
    }
    c.globalAlpha = 1;
    switch (fn.style) {
      case 'gojo':
        if (t < 1.3) {
          const k = clamp((t - 0.15) / 0.72, 0, 1), dist = (1 - k) * 165, an = t * 10;
          if (t < 0.96) {
            this.drawOrb(cx + Math.cos(an) * dist, cy - 20 + Math.sin(an) * dist * 0.45, 44, '#40c4ff');
            this.drawOrb(cx - Math.cos(an) * dist, cy - 20 - Math.sin(an) * dist * 0.45, 44, '#ff3d3d');
          } else this.drawOrb(cx, cy - 20, 75 + (t - 0.96) * 340, '#d500f9');
        }
        break;
      case 'sukuna':
        if (t >= 1.1) {
          const a = clamp(1 - (t - 1.1) / 0.7, 0, 1);
          c.globalAlpha = a; c.shadowColor = '#ff2d55'; c.shadowBlur = 30;
          c.strokeStyle = '#fff'; c.lineWidth = 7 * a;
          c.beginPath(); c.moveTo(o.x - 950, cy - 12); c.lineTo(o.x + 950, cy + 12); c.stroke();
        }
        break;
      case 'yuji':
        if (t > 0.25 && t < 1.45) {
          c.strokeStyle = '#ff1744'; c.lineWidth = 4;
          for (let i = 0; i < 4; i++) {
            const r = 65 + i * 32 + Math.sin(t * 25 + i) * 10;
            c.beginPath(); c.arc(o.x, cy, r, t * 8 + i, t * 8 + i + 2.2); c.stroke();
          }
        }
        break;
      case 'megumi':
        c.fillStyle = '#070212'; c.beginPath(); c.ellipse(o.x, GROUND + 4, 210, 26, 0, 0, 7); c.fill();
        c.strokeStyle = '#c46bff'; c.lineWidth = 3; c.stroke();
        break;
      case 'mahoraga':
        if (t < 1.35) {
          c.save(); c.translate(f.x, f.y - 142); c.rotate(t * 5.2);
          c.strokeStyle = '#ffd54f'; c.lineWidth = 4.5; c.beginPath(); c.arc(0, 0, 44, 0, 7); c.stroke();
          for (let i = 0; i < 8; i++) { const a2 = (i * Math.PI) / 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a2) * 58, Math.sin(a2) * 58); c.stroke(); }
          c.restore();
        }
        break;
      case 'nobara':
        if (t < 1.3) {
          for (let i = 0; i < 3; i++) {
            const nx = o.x + (i - 1) * 44, ny = cy - 18 + (i % 2 ? -18 : 14);
            c.strokeStyle = '#ff6bd6'; c.lineWidth = 5; c.beginPath(); c.moveTo(nx - 22, ny - 14); c.lineTo(nx + 12, ny + 8); c.stroke();
          }
          c.save(); c.translate(f.x + f.face * 54, f.y - 95);
          c.fillStyle = '#d7ccc8'; c.beginPath(); c.arc(0, -14, 12, 0, 7); c.fill(); c.fillRect(-10, -2, 20, 26);
          c.strokeStyle = '#ff1744'; c.lineWidth = 3; c.beginPath(); c.moveTo(-18, 6); c.lineTo(18, 6); c.stroke();
          c.restore();
        }
        break;
      case 'nanami':
        if (t < 1.35) {
          const rw = 240, rx = o.x - rw / 2, ry = o.y - 155;
          c.fillStyle = '#090612cc'; c.fillRect(rx, ry, rw, 16);
          c.strokeStyle = '#ffd24a'; c.lineWidth = 2; c.strokeRect(rx, ry, rw, 16);
          for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo(rx + (rw * i) / 10, ry); c.lineTo(rx + (rw * i) / 10, ry + 16); c.stroke(); }
          c.fillStyle = '#ff1744'; c.fillRect(rx + rw * 0.7 - 3, ry - 6, 6, 28);
        }
        break;
      case 'maki':
        if (t < 1.3) {
          c.save(); c.translate(f.x + f.face * 22, f.y - 78); c.rotate(t * 14);
          c.strokeStyle = '#ff5252'; c.lineWidth = 7; c.beginPath(); c.moveTo(-62, 0); c.lineTo(62, 0); c.stroke();
          c.fillStyle = '#ffd24a'; c.fillRect(-20, -4, 40, 8);
          c.restore();
        }
        break;
      case 'toji':
        if (t < 1.35) {
          c.strokeStyle = '#cfd8dc'; c.lineWidth = 4; c.setLineDash([8, 6]);
          c.beginPath(); c.moveTo(f.x, f.y - 70); c.lineTo(o.x, cy); c.stroke(); c.setLineDash([]);
          c.save(); c.translate(f.x + f.face * 36, f.y - 72); c.rotate(f.face * -0.3);
          c.fillStyle = '#e0f7fa'; c.fillRect(0, -6, f.face * 54, 12); c.restore();
        }
        break;
      case 'toge':
        if (t < 1.3) {
          for (let i = 0; i < 3; i++) {
            const r = ((t * 280 + i * 70) % 210) + 25;
            c.strokeStyle = '#3dd6ff'; c.lineWidth = 4; c.globalAlpha = 1 - r / 235;
            c.beginPath(); c.arc(o.x, cy, r, 0, 7); c.stroke();
          }
          c.globalAlpha = 1;
        }
        break;
      case 'todo':
        c.strokeStyle = '#ff8a3d'; c.lineWidth = 3;
        c.beginPath(); c.arc(f.x, f.y - 70, 52, 0, 7); c.stroke();
        c.strokeStyle = '#3dd6ff';
        c.beginPath(); c.arc(o.x, cy, 52, 0, 7); c.stroke();
        break;
      case 'yuta':
        if (t < 1.45) {
          c.save(); c.translate(f.x - dir * 34, f.y - 115); c.globalAlpha = 0.68;
          c.fillStyle = '#1a0a2e'; c.strokeStyle = '#ff80ab'; c.lineWidth = 4;
          c.beginPath(); c.arc(0, -18, 48, 0, 7); c.fill(); c.stroke();
          c.fillStyle = '#ff1744'; c.beginPath(); c.arc(dir * 16, -24, 9, 0, 7); c.fill();
          c.restore();
        }
        break;
      case 'mahito':
        if (t < 1.32) {
          const gap = clamp(1 - t / 1.24, 0, 1) * 145;
          [-1, 1].forEach((s) => {
            c.save(); c.translate(o.x + s * (36 + gap), cy); c.scale(s, 1);
            c.fillStyle = '#7dff6b33'; c.strokeStyle = '#7dff6b'; c.lineWidth = 4;
            c.beginPath(); c.roundRect(-24, -52, 48, 104, 14); c.fill(); c.stroke();
            c.restore();
          });
        }
        break;
      case 'jogo':
        if (t < 1.3) {
          const my = -80 + clamp(t / 1.24, 0, 1) * (o.y + 10);
          this.drawOrb(o.x, my, 132, '#ff6d00');
          c.fillStyle = '#3e1a0d'; c.beginPath(); c.arc(o.x, my, 74, 0, 7); c.fill();
        }
        break;
      case 'hakari':
        if (t < 1.4) {
          for (let i = 0; i < 3; i++) {
            const locked = fn.step > i;
            const bx = o.x - 75 + i * 75, by = o.y - 190;
            c.fillStyle = '#140826'; c.fillRect(bx - 22, by - 22, 44, 44);
            c.strokeStyle = locked ? '#ffd24a' : '#7dff6b'; c.lineWidth = 3; c.strokeRect(bx - 22, by - 22, 44, 44);
            c.fillStyle = locked ? '#ffd24a' : '#fff'; c.font = `24px ${FONT}`; c.textAlign = 'center';
            c.fillText(locked ? '7' : String(((t * 18 + i) | 0) % 9 + 1), bx, by + 8);
          }
        }
        break;
      case 'choso':
        if (t < 1.28) {
          for (let i = 0; i < 6; i++) {
            const an = t * 7 + (i * Math.PI) / 3, rad = clamp(1 - t / 1.24, 0.15, 1) * 115;
            this.drawOrb(f.x + dir * 24 + Math.cos(an) * rad * 0.4, f.y - 75 + Math.sin(an) * rad, 14, '#ff1744');
          }
        }
        break;
      case 'higuruma':
        if (t < 1.35) {
          c.save(); c.translate(f.x, f.y - 80); c.rotate(f.face * (t < 0.9 ? -0.9 : 0.7));
          c.shadowColor = '#ffd24a'; c.shadowBlur = 24; c.strokeStyle = '#fff'; c.lineWidth = 10;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(f.face * 155, -115); c.stroke();
          c.strokeStyle = '#ffd24a'; c.lineWidth = 5; c.stroke(); c.restore();
          c.strokeStyle = '#ffd24a'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(o.x - 50, o.y - 175); c.lineTo(o.x + 50, o.y - 175); c.stroke();
        }
        break;
      case 'dagon':
        c.fillStyle = '#00838f66'; c.beginPath(); c.ellipse(o.x, GROUND + 4, 240, 28, 0, 0, 7); c.fill();
        if (t < 1.35) {
          for (let i = 0; i < 4; i++) {
            const sx = o.x + Math.cos(t * 9 + i * 1.5) * 130, sy = cy + Math.sin(t * 7 + i) * 45;
            c.fillStyle = '#3dd6ff'; c.beginPath(); c.moveTo(sx + 18, sy); c.lineTo(sx - 16, sy - 9); c.lineTo(sx - 16, sy + 9); c.closePath(); c.fill();
          }
        }
        break;
      default: // 'geto'
        if (t < 1.3) {
          c.strokeStyle = '#c46bff'; c.lineWidth = 6;
          for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(cx, cy - 30, 32 + i * 28, t * 9 + i, t * 9 + i + 4.6); c.stroke(); }
        }
        break;
    }
    c.restore();
  }
  drawFinisherBars() {
    const fn = this.finisher; if (!fn) return;
    const c = this.c, t = fn.t, bar = Math.min(1, t / 0.16) * 76;
    const vx0 = this.vx0 ?? 0, vy0 = this.vy0 ?? 0, vw = this.vw ?? W, vy1 = this.vy1 ?? H;
    c.save();
    c.globalAlpha = 1; c.fillStyle = '#000';
    c.fillRect(vx0, vy0, vw, Math.max(0, bar - vy0)); c.fillRect(vx0, H - bar, vw, Math.max(0, vy1 - (H - bar)));
    c.fillStyle = fn.color; c.fillRect(vx0, bar - 3, vw, 3); c.fillRect(vx0, H - bar, vw, 3);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `44px ${FONT}`; c.lineWidth = 6; c.strokeStyle = '#000';
    c.strokeText(fn.jp, W / 2, bar / 2); c.fillStyle = '#fff'; c.fillText(fn.jp, W / 2, bar / 2);
    c.font = `24px ${FONT}`; c.fillStyle = fn.color;
    c.fillText(`FINISHER · ${fn.title}`, W / 2, H - bar / 2);
    c.restore();
  }
  /* ---------------- DOMAIN SYSTEM (+ Linger Battleground) ---------------- */
  startDomain(f, o) {
    if (this.dom && this.dom.st !== 'linger') return;
    const d = DOMAINS[f.dom]; f.ce = 0; f.act = { name: 'domain', t: 0 }; f.vx = 0; f.inv = 5; f.climbing = false; f.ledge = null;
    this.fighters.forEach((x) => {
      if (x.i !== f.i) { x.act = null; x.stun = 5; x.vx = 0; x.climbing = false; x.ledge = null; x.ragdollT = 0; if (x.team === f.team) x.inv = Math.max(x.inv, 5); }
    });
    this.dom = { owner: f.i, ownerTeam: f.team, caster: f.i, id: f.dom, t: 0, dur: DOM_DUR, idx: 0, ticks: d.ticks, st: 'open', mult: 1, clash: null, res: null,
      lingerT: 0, lingerDur: d.lingerDur || 4.2, dotT: 0.55, specT: 0.9, ...this.rhythmInit() };
    this.flash = { t: 0.3, max: 0.3, c: '#fff' }; this.sfx.domainOpen(); this.shake = 10;
  }
  startClash(opp) {
    const d = this.dom, f0 = this.fighters[d.owner], f1 = opp || this.nearestEnemy(f0);
    d.st = 'clash'; d.clash = { t: 0, dur: CLASH_T, f0: f0.i, f1: f1.i, n: [1, 1], share: 0.5, pulse: [0, 0] };
    this.fighters.forEach((f) => { f.act = (f.i === f0.i || f.i === f1.i) ? { name: 'domain', t: 0 } : null; f.vx = 0; f.inv = 9; f.stun = 0; });
    f0.ce = 0; f1.ce = 0;
    this.flash = { t: 0.4, max: 0.4, c: '#fff' }; this.freeze = 0.15; this.shake = 24; this.sfx.clash(); this.ring(this.worldW / 2, GROUND - 90, 500, '#fff');
  }
  updateClash(dt) {
    const k = this.dom.clash; k.t += dt;
    [this.fighters[k.f0], this.fighters[k.f1]].forEach((f, idx) => {
      if (!f) return;
      f.stun = 0; f.inv = Math.max(f.inv, 0.3); f.vx = 0; k.pulse[idx] = Math.max(0, k.pulse[idx] - dt * 6);
      if (f.inp && f.inp.dom) { k.n[idx]++; k.pulse[idx] = 1; this.sfx.mash(); this.spark(f.x + f.face * 40, f.y - 90, 3, DOMAINS[this.dom.id].color, 260, 0.35, 5, 0); }
    });
    k.share += ((k.n[0] + 2) / (k.n[0] + k.n[1] + 4) - k.share) * Math.min(1, dt * 12);
    this.shake = Math.max(this.shake, 4); this.spark(this.worldW * k.share, rnd(120, GROUND), 2, '#fff', 300, 0.4, 5, 0);
    if (k.t >= k.dur) this.resolveClash();
  }
  resolveClash() {
    const d = this.dom, k = d.clash, [n0, n1] = k.n, winSlot = n0 >= n1 ? 0 : 1, wi = winSlot ? k.f1 : k.f0, li = winSlot ? k.f0 : k.f1;
    const F = this.fighters[wi], L = this.fighters[li], share = k.n[winSlot] / (n0 + n1), D = DOMAINS[F.dom];
    Object.assign(d, { st: 'run', owner: F.i, ownerTeam: F.team, id: F.dom, ticks: D.ticks, idx: 0, t: 0, dur: DOM_DUR, lingerT: 0, lingerDur: D.lingerDur || 4.2, dotT: 0.55, specT: 0.9,
      ...this.rhythmInit(), mult: clamp(0.9 + (share - 0.5), 0.9, 1.4), clash: null,
      res: { t: 1.8, txt: `${this.is2v2 ? F.tag : `PLAYER ${F.i + 1}`} WINS THE CLASH!`, sub: `${k.n[winSlot]} : ${k.n[1 - winSlot]}`, color: F.color } });
    F.act = { name: 'domain', t: 0 }; F.inv = 5; F.vx = 0; F.stun = 0;
    this.fighters.forEach((x) => { if (x.i !== F.i) { x.act = null; x.stun = 5; x.vx = 0; x.inv = x.team === F.team ? 5 : 0; } });
    this.flash = { t: 0.35, max: 0.35, c: '#fff' }; this.freeze = 0.12; this.shake = 20; this.sfx.domain();
  }
  rhythmInit() {
    return { beats: Array.from({ length: BEAT_N }, (_, i) => ({ t: BEAT_T0 + i * BEAT_GAP, r: null })), streak: 0, best: 0, perfect: 0, lock: 0, arts: 3, artCd: 0, resist: 0, judge: null };
  }
  judgeTxt(d, txt, color) { d.judge = { txt, color, t: 0.6 }; }
  updateDomain(dt) {
    const d = this.dom; if (d.res) d.res.t -= dt;
    if (d.st === 'clash') return this.updateClash(dt);
    const f = this.fighters[d.owner], enemies = this.enemiesOf(f).filter((e) => !e.ko), o = enemies[0] || this.nearestEnemy(f), D = DOMAINS[d.id];
    d.t += dt;
    if (d.st === 'linger') {
      if (this.cutscene) return;
      d.lingerT += dt; d.dotT -= dt; d.specT -= dt;
      /* ดาเมจเล็กๆ ต่อเนื่องทุก 0.55 วิ + ความสามารถพิเศษแต่ละโดเมน */
      if (d.dotT <= 0) {
        d.dotT = 0.55;
        enemies.forEach((t) => {
          if (t.dizzy > 0) return;
          const blkMul = D.ability === 'slash' ? (t.blocking ? 0.85 : 1) : (t.blocking ? 0.5 : 1);
          const chip = this.adaptHit(t, `dom:${d.id}`, (D.dot || 1.4) * (d.mult || 1) * (f.pas.dmg || 1) * blkMul);
          t.lastHitBy = f.i;
          t.hp = Math.max(0, t.hp - chip); t.flash = 0.06;
          this.spark(t.x, t.y - 80, 6, D.color, 200, 0.35, 4, 0);
          if (D.ability === 'drain') { t.ce = Math.max(0, t.ce - 6); f.hp = Math.min(100, f.hp + 0.9); }
          if (D.ability === 'guilty' || D.ability === 'nullzone') { t.ce = 0; }
        });
      }
      if (D.ability === 'fever') f.hp = Math.min(100, f.hp + 2.6 * dt);
      if (D.ability === 'mutual' || D.ability === 'bloodorb') f.hp = Math.min(100, f.hp + 1.5 * dt);
      if (d.specT <= 0 && o && !o.ko) {
        if (D.ability === 'slash') {
          d.specT = 0.7;
          enemies.forEach((t) => this.slashes.push({ x: t.x + rnd(-50, 50), y: t.y - rnd(20, 120), a: rnd(-1.4, 1.4), len: 240, t: 0.22, max: 0.22, color: '#ff1744' }));
          this.sfx.slash();
        } else if (D.ability === 'blitz') {
          d.specT = 0.85;
          enemies.forEach((t) => this.slashes.push({ x: t.x + rnd(-40, 40), y: t.y - rnd(30, 110), a: rnd(-1.2, 1.2), len: 260, t: 0.24, max: 0.24, color: '#7dff6b' }));
          this.sfx.slash();
        } else if (D.ability === 'nails') {
          d.specT = 1.15;
          const fromL = Math.random() < 0.5, sx = fromL ? 90 : this.worldW - 90, dir = fromL ? 1 : -1;
          this.proj.push({ x: sx, y: o.y - 75, sx, sy: o.y - 75, vx: dir * 820, owner: f.i, src: `dom:${d.id}`, color: '#ff6bd6', style: 'nail', life: 2.8, r: 16, dmg: 5, kb: 220, stun: 0.2, small: true, face: dir, arrow: true });
          this.sfx.shoot();
        } else if (D.ability === 'bloodorb') {
          d.specT = 1.25;
          const fromL = o.x > this.worldW / 2, sx = fromL ? 100 : this.worldW - 100, dir = fromL ? 1 : -1;
          this.proj.push({ x: sx, y: o.y - 75, sx, sy: o.y - 75, vx: dir * 640, owner: f.i, src: `dom:${d.id}`, color: '#ff2d55', style: 'red', life: 3.0, r: 22, dmg: 5, kb: 320, stun: 0.25, small: true, face: dir, boom: 55 });
          this.sfx.shoot();
        } else if (D.ability === 'echo') {
          d.specT = 1.5;
          enemies.forEach((t) => {
            t.stun = Math.max(t.stun, 0.45); t.vx = 0; this.ring(t.x, t.y - 80, 140, '#3dd6ff');
            this.texts.push({ txt: 'STOP!', x: t.x, y: t.y - 165, t: 0.55, max: 0.55, color: '#fff', size: 26 });
          });
          this.sfx.speech();
        } else if (D.ability === 'clapfest') {
          d.specT = 1.65;
          if (!o.blocking && o.inv <= 0 && !o.ledge) {
            this.sfx.warp(); this.pushAfter(f, '#ff8a3d'); this.pushAfter(o, '#ff8a3d');
            const tx = o.x, ty = o.y; o.x = f.x; o.y = f.y; f.x = tx; f.y = ty; f.face = o.x >= f.x ? 1 : -1;
            this.ring(f.x, f.y - 70, 100, '#ff8a3d'); this.ring(o.x, o.y - 70, 100, '#ff8a3d');
            this.texts.push({ txt: 'CLAP!', x: f.x, y: f.y - 150, t: 0.5, max: 0.5, color: '#ff8a3d', size: 28 });
          }
        } else if (D.ability === 'lava') {
          d.specT = 1.35;
          const tx = o.x, ty = o.floorY !== null ? o.floorY : GROUND;
          this.warns.push({ x: tx, y: ty, r: 75, t: 0.55, max: 0.55, color: '#ff6d00', name: 'eruption' });
          this.later(0.55, () => {
            if (this.phase !== 'fight' || !this.dom || this.dom.st !== 'linger') return;
            this.pillars.push({ x: tx, y: ty, t: 0.45, max: 0.45, color: '#ff6d00', w: 50 }); this.sfx.boom();
            enemies.forEach((t) => { if (!t.ko && Math.abs(t.x - tx) < 75 && Math.abs(t.y - ty) < 120) this.hit(f, t, { dmg: 5, kb: 320, stun: 0.3, vy: 360, color: '#ff6d00', src: `dom:${d.id}` }); });
          });
        } else if (D.ability === 'shadow') {
          d.specT = 1.4;
          const dir = o.x >= f.x ? 1 : -1;
          this.proj.push({ x: clamp(f.x, this.stageL + 30, this.stageR - 30), y: f.y - 24, vx: dir * 680, owner: f.i, src: `dom:${d.id}`, color: '#7c4dff', life: 2.0, r: 26, dmg: 5, kb: 260, stun: 0.28, kind: 'dog', face: dir, small: true });
          this.sfx.howl();
        } else if (D.ability === 'tide') {
          d.specT = 1.25;
          const fromL = Math.random() < 0.5, sx = fromL ? 80 : this.worldW - 80, dir = fromL ? 1 : -1;
          this.proj.push({ x: sx, y: o.y - 70, sx, sy: o.y - 70, vx: dir * 760, owner: f.i, src: `dom:${d.id}`, color: '#29b6f6', style: 'fish', life: 2.8, r: 20, dmg: 5, kb: 340, stun: 0.25, small: true, face: dir });
        } else if (D.ability === 'fps') {
          d.specT = 1.65;
          enemies.forEach((t) => {
            t.stun = Math.max(t.stun, 0.55); t.vx = 0; this.ring(t.x, t.y - 80, 120, '#ffee58');
            this.texts.push({ txt: '24 FPS FREEZE!', x: t.x, y: t.y - 165, t: 0.6, max: 0.6, color: '#ffee58', size: 24 });
          });
        } else if (D.ability === 'gravity') {
          d.specT = 1.35;
          enemies.forEach((t) => { t.vy += 480; this.ring(t.x, t.y - 20, 180, '#b388ff'); });
          this.sfx.gavel();
        } else if (D.ability === 'sphere') {
          d.specT = 1.25;
          const fromL = o.x > this.worldW / 2, sx = fromL ? 120 : this.worldW - 120, dir = fromL ? 1 : -1;
          this.proj.push({ x: sx, y: o.y - 75, sx, sy: o.y - 75, vx: dir * 700, owner: f.i, src: `dom:${d.id}`, color: '#e0e0e0', style: 'red', life: 3.0, r: 22, dmg: 6, kb: 360, stun: 0.3, small: true, face: dir });
        } else { d.specT = 1.2; }
      }
      if (d.lingerT >= d.lingerDur) { this.dom = null; }
      return;
    }
    this.fighters.forEach((x) => { if (x.i !== f.i) { x.stun = Math.max(x.stun, 0.3); if (x.team === f.team) x.inv = Math.max(x.inv, 0.3); } });
    f.inv = Math.max(f.inv, 0.3);
    if (d.judge) d.judge.t -= dt;
    if (d.st === 'open') {
      if (d.t < 0.7 && Math.random() < 0.55) this.spark(f.x + rnd(-26, 26), f.y - 75 + rnd(-20, 20), 1, D.color, 90, 0.35, 4, -80);
      const counter = enemies.find((e) => e.ce >= 100 && e.inp && e.inp.dom);
      if (counter) return this.startClash(counter);
      if (d.t >= OPEN) { d.st = 'run'; this.sfx.domain(); this.ring(f.x, f.y - 70, 520, D.color); this.shake = 18; }
    }
    if (d.st === 'run') {
      this.updateRhythm(d, f, o, enemies, dt);
      while (d.idx < d.ticks.length && d.t >= d.ticks[d.idx].t) this.domTick(d, d.ticks[d.idx++], f, enemies);
      if (d.t >= d.dur) {
        d.st = 'linger'; d.lingerT = 0; f.act = null; f.inv = 0.25;
        this.fighters.forEach((x) => { if (x.i !== f.i) { x.stun = 0.15; if (x.team === f.team) x.inv = 0.25; } });
        this.texts.push({ txt: 'FIGHT IN DOMAIN!', x: this.worldW / 2, y: 190, t: 1.0, max: 1.0, color: D.color, size: 36 });
      }
    }
  }
  updateRhythm(d, f, o, enemies, dt) {
    d.lock = Math.max(0, d.lock - dt); d.artCd = Math.max(0, d.artCd - dt); d.resist = Math.max(0, d.resist - dt * 0.12);
    const pi = f.inp || {}, col = DOMAINS[d.id].color;
    enemies.forEach((e) => {
      if (e.inp && e.inp.block) { d.resist = Math.min(0.4, d.resist + 0.05); this.sfx.resist(); this.spark(e.x, e.y - 80, 3, '#fff', 180, 0.25, 4, 0); }
    });
    d.beats.forEach((b) => { if (b.r === null && d.t > b.t + GOOD) { b.r = 'miss'; d.streak = 0; this.judgeTxt(d, 'MISS', '#9e9e9e'); this.sfx.miss(); } });
    if (pi.dom && d.lock <= 0) {
      let best = null;
      d.beats.forEach((b) => { if (b.r === null) { const e = Math.abs(d.t - b.t); if (e <= GOOD && (!best || e < best.e)) best = { b, e }; } });
      if (best) {
        const perfect = best.e <= PERFECT; best.b.r = perfect ? 'perfect' : 'good'; d.streak++; d.best = Math.max(d.best, d.streak); if (perfect) d.perfect++;
        enemies.forEach((t) => {
          const beatDmg = this.adaptHit(t, `dom:${d.id}`, (perfect ? 1.4 : 0.7) * (d.mult || 1) * (1 - d.resist) * (f.pas.dmg || 1));
          t.lastHitBy = f.i; t.hp = Math.max(0, t.hp - beatDmg); t.flash = 0.08;
          this.spark(t.x, t.y - 80, perfect ? 16 : 8, perfect ? '#ffd24a' : col, 320, 0.4, 5, 0); this.ring(t.x, t.y - 80, perfect ? 140 : 90, perfect ? '#ffd24a' : col);
        });
        this.judgeTxt(d, perfect ? 'PERFECT!' : 'GOOD', perfect ? '#ffd24a' : '#3dd6ff'); perfect ? this.sfx.perfect() : this.sfx.good();
        this.shake = Math.max(this.shake, perfect ? 9 : 4);
      } else { d.lock = 0.28; d.streak = 0; this.judgeTxt(d, 'OFF BEAT', '#ff5252'); this.sfx.miss(); }
    }
    if (pi.punch && d.arts > 0 && d.artCd <= 0 && d.t < d.dur - 0.5) { d.arts--; d.artCd = 0.75; enemies.forEach((t) => this.domainArt(d, f, t)); }
  }
  domainArt(d, f, o) {
    const D = DOMAINS[d.id], A = D.art, col = D.color, dir = o.x >= f.x ? 1 : -1, fx = A.fx;
    const artDmg = this.adaptHit(o, `dom:${d.id}`, A.dmg * 0.7 * (d.mult || 1) * (1 - d.resist) * (f.pas.dmg || 1));
    o.lastHitBy = f.i; o.hp = Math.max(0, o.hp - artDmg); o.flash = 0.1; this.impulse(o, dir * 160, 140);
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
  domTick(d, tk, f, enemies) {
    const col = DOMAINS[d.id].color;
    let rm = 1 + Math.min(d.streak, BEAT_N) * 0.03;
    if (tk.final) rm *= d.perfect >= BEAT_N ? 1.25 : 1 + d.best * 0.015;
    f.ce = 0;
    this.sfx.hit(); this.shake = tk.final ? 22 : 6;
    enemies.forEach((o) => {
      if (o.dizzy > 0) return;
      const dir = o.x >= f.x ? 1 : -1;
      const tickDmg = this.adaptHit(o, `dom:${d.id}`, tk.dmg * (d.mult || 1) * rm * (1 - d.resist) * (f.pas.dmg || 1));
      o.lastHitBy = f.i; o.hp = Math.max(0, o.hp - tickDmg); o.flash = 0.1; o.inv = 0;
      this.impulse(o, dir * (tk.final ? 520 : 80), tk.final ? 420 : 120);
      this.spark(o.x, o.y - 80, tk.final ? 40 : 12, col, tk.final ? 500 : 280, 0.5, 5);
      if (d.id === 'void' || d.id === 'moon' || d.id === 'soulhome' || d.id === 'cursedvoice') { this.flash = { t: 0.1, max: 0.1, c: col }; this.zaps.push({ x: o.x, y: o.y - 80, t: 0.2, color: col }); }
      if (d.id === 'shrine' || d.id === 'armory' || d.id === 'zerovoid' || d.id === 'strawfield') for (let i = 0; i < 3; i++) this.slashes.push({ x: o.x + rnd(-120, 120), y: o.y - rnd(0, 130), a: rnd(-1.4, 1.4), len: rnd(300, 520), t: 0.25, max: 0.25, color: col });
      if (d.id === 'coffin' || d.id === 'singularity') { this.pillars.push({ x: o.x + rnd(-30, 30), y: GROUND, t: 0.6, max: 0.6, color: col }); this.sfx.boom(); }
      if (d.id === 'chimera') { this.pillars.push({ x: o.x + rnd(-50, 50), y: GROUND, t: 0.45, max: 0.45, color: '#7c4dff', w: 26 }); this.zaps.push({ x: o.x, y: o.y - 60, t: 0.15, color: '#b388ff' }); }
      if (d.id === 'sentence' || d.id === 'womb' || d.id === 'sphere' || d.id === 'overtime73' || d.id === 'claphall') this.rings.push({ x: o.x, y: GROUND, r: 200, t: 0.3, max: 0.3, color: col });
      if (d.id === 'skandha' || d.id === 'bloodsea') { this.rings.push({ x: o.x + rnd(-80, 80), y: o.y - rnd(20, 120), r: 90, t: 0.3, max: 0.3, color: col }); this.spark(o.x, o.y - 70, 6, col, 220, 0.5, 4, -200); }
      if (d.id === 'mutual') { this.slashes.push({ x: o.x + rnd(-60, 60), y: o.y - rnd(10, 130), a: rnd(-1, 1), len: 320, t: 0.22, max: 0.22, color: '#ff6bd6' }); this.zaps.push({ x: o.x, y: o.y - 80, t: 0.15, color: '#fff' }); }
      if (tk.final) {
        this.ring(o.x, o.y - 80, 260, col); this.freeze = 0.12; this.flash = { t: 0.25, max: 0.25, c: '#fff' };
        o.vx = dir * 480; o.vy = -420; o.grounded = false; o.ragdollT = 0.65;
        const perfect = d.perfect >= BEAT_N;
        this.texts.push({ txt: perfect ? 'PERFECT DOMAIN!' : 'DOMAIN COMPLETE', x: o.x, y: o.y - 170, t: 1.0, max: 1.0, color: perfect ? '#ffd24a' : col, size: perfect ? 42 : 34 });
        if (d.id === 'sentence' || d.id === 'zerovoid') { o.cd = o.cd.map((v) => v + 6); o.ce = 0; this.texts.push({ txt: d.id === 'zerovoid' ? 'TECHNIQUE SEALED!' : 'GUILTY! TECHNIQUE CONFISCATED', x: o.x, y: o.y - 215, t: 1.2, max: 1.2, color: col, size: 26 }); this.sfx.gavel(); }
        if (d.id === 'mutual' || d.id === 'bloodsea') { f.hp = Math.min(100, f.hp + 8); this.texts.push({ txt: '+8 HP', x: f.x, y: f.y - 170, t: 1, max: 1, color: col, size: 32 }); }
      }
    });
  }
  hit(att, def, o) {
    if (def.inv > 0 || def.ko) return undefined;
    const dir = def.x >= att.x ? 1 : -1, hx = def.x, hy = def.y - 80;
    if (def.dizzy > 0) {
      def.dizzy = 0; def.ko = true; def.vx = dir * Math.max(380, o.kb || 380); def.vy = -340; def.grounded = false; def.ragdollT = 0.9;
      this.spark(hx, hy, 22, o.color || '#fff', 380, 0.5, 6); this.ring(hx, hy, 120, '#ff5252'); this.sfx.heavy();
      this.shake = Math.max(this.shake, 16); this.impulse(def, dir * 500, 340);
      return true;
    }
    if (def.ledge) {
      if ((def.ledge.shield || 0) > 0) {
        this.spark(hx, hy, 12, '#4fc3f7', 240, 0.3, 4);
        this.ring(def.x, def.y - 50, 95, '#4fc3f7');
        this.sfx.block();
        this.texts.push({ txt: 'SHIELD!', x: def.x, y: def.y - 125, t: 0.55, max: 0.55, color: '#4fc3f7', size: 26 });
        return false;
      }
      def.ledge = null; def.ledgeCd = 2.5;
    }
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
    if (def.blocking && !o.pierceBlock) {
      def.lastHitBy = att.i;
      def.vx = dir * o.kb * 0.35; def.inv = 0.12; def.hp = Math.max(0, def.hp - o.dmg * 0.2); this.gain(att, def, o.dmg * 0.2);
      this.sparkDir(hx - dir * 20, hy, -dir, 10, '#4fc3f7', 260, 0.3, 4);
      const bladeHit = o.fx === 'slash' || o.fx === 'ratio' || o.fx === 'nullify' || o.fx === 'collapse' || o.fx === 'gavel';
      (bladeHit ? this.sfx.clang : this.sfx.block)();
      this.shake = Math.max(this.shake, 3); this.impulse(def, dir * o.kb * 0.2, 0); return false;
    }
    o = { ...o };
    if (def.blocking && o.pierceBlock) {
      o.dmg *= 0.75;
      this.texts.push({ txt: 'GUARD PIERCE!', x: hx, y: hy - 145, t: 0.7, max: 0.7, color: o.color || '#a7ffeb', size: 28 });
      this.sfx.slash();
    }
    /* คอมโบหมัดที่ 3 ซัดกระเด็นล้มเป็น Ragdoll! */
    const finisher = o.basic && att.combo >= 2;
    if (finisher) { o.dmg *= 1.35; o.kb = Math.max(o.kb, 620); o.vy = 360; o.stun = Math.max(o.stun, 0.65); o.ragdoll = 0.85; o.big = true; }
    const da = this.domAbility(att);
    const bfChance = (att.pas.bf || 0) + (da && da.isOwner && da.ability === 'bfzone' ? 0.35 : 0);
    if (o.basic && bfChance > 0 && Math.random() < bfChance) { o.fx = 'bf'; o.dmg *= 1.75; o.kb = Math.max(o.kb, 750); o.stun = Math.max(o.stun, 0.65); o.ragdoll = 0.9; o.big = true; o.color = '#ff1744'; }
    const domDmg = da && da.isOwner
      ? (da.ability === 'guilty' ? 1.2 : da.ability === 'nullzone' ? 1.25 : da.ability === 'mutual' ? 1.2 : (da.ability === 'pull' || da.ability === 'clapfest') && o.basic ? 1.25 : 1)
      : 1;
    let dmg = o.dmg * (1 + Math.min(att.combo, 4) * 0.06) * (att.pas.dmg || 1) * (att.mahoraga > 0 ? 1.12 : 1) * (att.amp > 0 ? att.ampMul : 1) * domDmg * (def.pas.guard || 1);
    if (o.basic && att.pas.basic) dmg *= att.pas.basic;
    const critChance = da && da.isOwner && da.ability === 'ratio73' ? 1 : (att.pas.crit || 0) + (da && da.isOwner && da.ability === 'nails' ? 0.3 : 0);
    if (critChance > 0 && Math.random() < critChance) { dmg *= 1.4; this.texts.push({ txt: da?.ability === 'ratio73' ? '7:3 CRIT!' : 'CRIT!', x: hx, y: hy - 130, t: 0.6, max: 0.6, color: '#ffeb3b', size: 30 }); }
    if (o.src === 'hairpin' || o.src === 'nailhammer') {
      def.nails = Math.min(5, (def.nails || 0) + (o.src === 'nailhammer' ? 2 : 1));
      def.nailT = 6.0;
      if (o.src === 'nailhammer' && def.nails >= 3) {
        const stacks = def.nails; def.nails = 0; dmg += stacks * 1.1;
        this.ring(hx, hy, 125, '#ff6bd6');
        this.texts.push({ txt: `NAIL BURST ×${stacks}!`, x: hx, y: hy - 145, t: 0.75, max: 0.75, color: '#ff6bd6', size: 30 });
      }
    }
    dmg = Math.min(28, this.adaptHit(def, o.src || (o.basic ? 'basic' : 'skill'), dmg));
    def.lastHitBy = att.i;
    def.hp = Math.max(0, def.hp - dmg); def.vx = dir * o.kb; def.vy = -(o.vy === undefined ? 260 : o.vy); if (o.vy !== 0) def.grounded = false;
    def.stun = Math.max(def.stun, o.stun); def.act = null; def.inv = 0.2; def.flash = 0.12;
    if (o.ragdoll || o.kb >= 520) def.ragdollT = Math.max(def.ragdollT, o.ragdoll || 0.72);
    att.combo++; att.comboT = 1.3; this.gain(att, def, dmg);
    this.impulse(def, dir * o.kb * (def.ragdollT > 0 ? 1.4 : 1), o.vy === undefined ? 260 : o.vy);
    this.sparkDir(hx, hy, dir, o.big ? 22 : 12, o.color || '#fff', o.big ? 480 : 300, 0.48, 5, 520);
    if (o.big && def.y > GROUND - 45) {
      this.spark(def.x, GROUND, 8, '#b0bec5', 220, 0.42, 5, 360);
    }
    this.ring(hx, hy, o.big ? 115 : 65, o.big ? (o.color || '#fff') : '#fff');
    (o.big ? (o.kb >= 600 ? this.sfx.heavy : this.sfx.hit) : this.sfx.punch)();
    this.shake = Math.max(this.shake, o.big ? 16 : 8); this.freeze = o.big ? 0.10 : 0.045;
    if (finisher && o.fx !== 'bf') this.texts.push({ txt: 'KNOCKDOWN!', x: hx, y: hy - 95, t: 0.7, max: 0.7, color: '#ffd24a', size: 32 });
    if (o.fx === 'bf') {
      this.sfx.bf(); this.shake = 26; this.freeze = 0.17; this.flash = { t: 0.18, max: 0.18, c: '#000' };
      for (let i = 0; i < 4; i++) this.zaps.push({ x: hx, y: hy, t: 0.35, color: i % 2 ? '#ff1744' : '#111' });
      this.texts.push({ txt: 'BLACK FLASH!', x: hx, y: hy - 90, t: 0.9, max: 0.9, color: '#ff1744', size: 46 });
    } else if (o.fx === 'slash') this.slashes.push({ x: hx, y: hy, a: rnd(-0.7, -0.3), len: 260, t: 0.25, max: 0.25, color: '#fff' });
    else if (o.fx === 'soulsplit') {
      this.sfx.slash(); this.slashes.push({ x: hx, y: hy, a: -0.55 * dir, len: 310, t: 0.28, max: 0.28, color: '#a7ffeb' });
      this.slashes.push({ x: hx, y: hy - 12, a: 0.45 * dir, len: 260, t: 0.26, max: 0.26, color: '#fff' });
      this.texts.push({ txt: 'SOUL CUT!', x: hx, y: hy - 105, t: 0.75, max: 0.75, color: '#a7ffeb', size: 32 });
    } else if (o.fx === 'collapse') {
      const sy = def.floorY ?? GROUND;
      this.sfx.slam(); this.addDecal(def.x, sy, 'crack', '#ffd54f', 76);
      this.spark(def.x, sy, 18, '#90a4ae', 380, 0.55, 7, 680);
      this.slashes.push({ x: hx, y: hy, a: 0.25 * dir, len: 290, t: 0.28, max: 0.28, color: '#ffd54f' });
      this.texts.push({ txt: '7:3 COLLAPSE!', x: hx, y: hy - 105, t: 0.8, max: 0.8, color: '#ffd54f', size: 36 });
    } else if (o.fx === 'gavel') {
      const sy = def.floorY ?? GROUND;
      this.sfx.gavel(); this.addDecal(def.x, sy, 'crack', '#ffd24a', 85);
      this.ring(def.x, sy, 185, '#ffd24a');
      this.texts.push({ txt: 'VERDICT SLAM!', x: hx, y: hy - 105, t: 0.8, max: 0.8, color: '#ffd24a', size: 34 });
    } else if (o.fx === 'speed') {
      this.sfx.whoosh(); this.slashes.push({ x: hx, y: hy, a: 0, len: 340, t: 0.22, max: 0.22, color: o.color || '#7dff6b' });
    } else if (o.fx === 'ratio') {
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
    if (o.drainCe || o.cdAdd) {
      if (o.drainCe) def.ce = Math.max(0, def.ce - o.drainCe);
      if (o.cdAdd) def.cd = def.cd.map((v) => v + o.cdAdd);
      this.sfx.seal();
      this.texts.push({ txt: 'CONFISCATED!', x: hx, y: hy - 125, t: 0.85, max: 0.85, color: '#ffe082', size: 28 });
    }
    return true;
  }
  gain(att, def, d) { att.ce = Math.min(100, att.ce + d * (att.pas.ce ?? 1)); def.ce = Math.min(100, def.ce + d * 1.4 * (def.pas.ce ?? 1)); }
  impulse(f, vx, vy) { NAMES.forEach((n) => { const p = f.rig[n], r = rnd(0.5, 1.35); p.ox = p.x - (vx / 55) * r; p.oy = p.y + (vy / 55) * r * 0.7; }); }
  pushAfter(f, color) { this.afters.push({ rig: Object.fromEntries(NAMES.map((n) => [n, { x: f.rig[n].x, y: f.rig[n].y }])), face: f.face, color, gear: f.gear, t: 0.3, max: 0.3 }); if (this.netRole === 'host') this.netEvents.push(['after', f.i, color]); }
  addDecal(x, y, kind, color, r = 55) {
    this.decals.push({ x, y, kind, color, r, t: 6.5, max: 6.5 });
    if (this.decals.length > 28) this.decals.splice(0, this.decals.length - 28);
  }
  spark(x, y, n, color, spd, life, size, g = 600) {
    if (this.netRole === 'host') this.netEvents.push(['spark', x, y, n, color, spd, life, size, g]);
    for (let i = 0; i < n; i++) { const an = rnd(0, Math.PI * 2), s = rnd(0.2, 1) * spd; this.parts.push({ x, y, vx: Math.cos(an) * s, vy: Math.sin(an) * s, life: rnd(0.5, 1) * life, max: life, color, size: rnd(0.5, 1) * size, g }); }
    if (this.parts.length > 220) this.parts.splice(0, this.parts.length - 220);
  }
  sparkDir(x, y, dir, n, color, spd, life, size, g = 520) {
    if (this.netRole === 'host') this.netEvents.push(['sparkDir', x, y, dir, n, color, spd, life, size, g]);
    const base = dir > 0 ? -0.15 : Math.PI + 0.15;
    for (let i = 0; i < n; i++) {
      const an = base + rnd(-0.75, 0.75), s = rnd(0.35, 1.05) * spd;
      this.parts.push({ x, y, vx: Math.cos(an) * s, vy: Math.sin(an) * s - 45, life: rnd(0.5, 1) * life, max: life, color, size: rnd(0.55, 1.05) * size, g });
    }
    if (this.parts.length > 220) this.parts.splice(0, this.parts.length - 220);
  }
  ring(x, y, r, color) { this.rings.push({ x, y, r, t: 0.35, max: 0.35, color }); }
  dust(f) { this.spark(f.x, f.y, 8, '#cfd8dc', 160, 0.4, 5, 50); }
  /* ---------------- RAGDOLL RIG & NEW ANIMATIONS ---------------- */
  pose(f) {
    const a = f.act, t = this.time; let P = { lean: 0, crouch: 0, hF: [22, 18], hB: [-10, 24], fF: [14, 0], fB: [-14, 0] };
    if (f.ko || f.ragdollT > 0) return P;
    if (f.dizzy > 0) {
      const s = Math.sin(t * 9) * 5;
      return { lean: 14 + s * 0.4, crouch: 20, hF: [18 + s, 26], hB: [-12 - s, 28], fF: [18, 0], fB: [-18, 0] };
    }
    if (this.phase === 'ko' && this.victory && !f.ko) {
      const s = Math.sin(t * 4) * 3;
      return { lean: -5, crouch: 4, hF: [36, -42 + s], hB: [-26, 12 - s * 0.5], fF: [22, 0], fB: [-20, 0] };
    }
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
      const sp = spec(a.name) || { pose: a.name, dur: 0.35 }, k = clamp(a.t / (sp.dur || 0.35), 0, 1), e = Math.sin(k * Math.PI);
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
        case 'slam':
          if (k < 0.34) { P = { lean: -8, crouch: -4, hF: [18, -46], hB: [8, -42], fF: [18, 0], fB: [-18, 0] }; }
          else { P = { lean: 22, crouch: 18, hF: [52, 34], hB: [22, 26], fF: [28, 0], fB: [-26, 0] }; }
          break;
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
    else {
      const low = f.hp <= 30, b = Math.sin(t * (low ? 9 : 5.5) + f.i) * (low ? 4 : 2.5);
      P.lean = low ? 5 : 0; P.crouch = (low ? 6 : 2) + Math.abs(b) * 0.4;
      P.hF = [26, (low ? 18 : 12) + b]; P.hB = [-4, (low ? 24 : 20) - b * 0.5];
    }
    if ((f.landT || 0) > 0 && f.grounded && !a) {
      P.crouch += Math.sin((f.landT / 0.22) * Math.PI) * 14;
    }
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
    const c = this.c, cw = this.cv.width || W, ch = this.cv.height || H, s = this.shake;
    const sc = Math.min(cw / W, ch / H), ox = (cw - W * sc) / 2, oy = (ch - H * sc) / 2;
    this.vx0 = -ox / sc - 6; this.vx1 = this.vx0 + cw / sc + 12; this.vw = cw / sc + 12;
    this.vy0 = -oy / sc - 6; this.vy1 = this.vy0 + ch / sc + 12; this.vh = ch / sc + 12;
    c.save();
    c.translate(ox, oy); c.scale(sc, sc);
    c.save(); c.translate(rnd(-s, s), rnd(-s, s));
    if (this.is2v2 || this.victory || this.finisher) {
      c.translate(W / 2, H / 2);
      c.scale(this.cam.z, this.cam.z);
      c.translate(-this.cam.x, -this.cam.y);
    }
    this.drawBg(); this.drawFloor();
    if (this.dom) this.drawDomain();
    if (this.cutscene || this.finisher) { c.save(); c.fillStyle = 'rgba(4, 2, 12, 0.78)'; c.fillRect(-1400, -1400, this.worldW + 2800, H + 2800); c.restore(); }
    this.drawPlatformsAndClimbs();
    this.decals.forEach((dc) => {
      const fade = clamp(dc.t / dc.max, 0, 1);
      c.save(); c.globalAlpha = fade * 0.72;
      if (dc.kind === 'scorch') {
        const g = c.createRadialGradient(dc.x, dc.y + 3, 4, dc.x, dc.y + 3, Math.max(8, dc.r));
        g.addColorStop(0, withAlpha(dc.color, 'aa')); g.addColorStop(0.45, '#08050acc'); g.addColorStop(1, '#08050a00');
        c.fillStyle = g; c.beginPath(); c.ellipse(dc.x, dc.y + 3, dc.r, dc.r * 0.24, 0, 0, 7); c.fill();
      } else {
        c.strokeStyle = '#09060e'; c.lineWidth = 3.5; c.lineCap = 'round';
        for (let i = -2; i <= 2; i++) {
          c.beginPath(); c.moveTo(dc.x, dc.y + 3);
          c.lineTo(dc.x + i * dc.r * 0.42, dc.y + 3 + (i % 2 ? 7 : 3));
          c.lineTo(dc.x + i * dc.r * 0.68, dc.y + 2);
          c.stroke();
        }
        c.strokeStyle = dc.color; c.lineWidth = 1.4; c.globalAlpha = fade * 0.45;
        c.beginPath(); c.ellipse(dc.x, dc.y + 3, dc.r * 0.75, dc.r * 0.16, 0, 0, 7); c.stroke();
      }
      c.restore();
    });
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
      } else if (w.name === 'cursemaw') {
        c.fillStyle = '#120520';
        for (let i = -3; i <= 3; i++) {
          const fx = w.x + i * (w.r * 0.24), fh = 12 + k * 24;
          c.beginPath(); c.moveTo(fx - 7, w.y + 3); c.lineTo(fx, w.y - fh); c.lineTo(fx + 7, w.y + 3); c.closePath(); c.fill();
        }
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
      g.addColorStop(0, '#fff'); g.addColorStop(0.3, p.color); g.addColorStop(1, withAlpha(p.color, '00')); c.fillStyle = g; c.fillRect(p.x - w, baseY - 460, w * 2, 460);
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
    this.fighters.forEach((f) => f.qte && !f.qte.done && f.act && this.drawSkillQTE(f));
    if (this.phase === 'fight' && !this.cutscene && !this.finisher) this.drawFinisherTargets();
    if (this.cutscene) this.drawCutsceneOverlay();
    if (this.finisher) this.drawFinisherOverlay();
    this.texts.forEach((t) => { c.globalAlpha = Math.min(1, t.t / t.max * 2); c.font = `${t.size}px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = '#000'; c.strokeText(t.txt, t.x, t.y); c.fillStyle = t.color; c.fillText(t.txt, t.x, t.y); });
    c.globalAlpha = 1; c.restore();
    if (this.cutscene) this.drawCutsceneBars();
    if (this.finisher) this.drawFinisherBars();
    if (this.flash) { c.globalAlpha = (this.flash.t / this.flash.max) * 0.7; c.fillStyle = this.flash.c; c.fillRect(this.vx0, this.vy0, this.vw, this.vh); c.globalAlpha = 1; }
    this.drawHud(); if (this.dom) this.drawDomainIntro();
    this.drawClashHud();
    if (this.phase === 'ko' && this.victory) this.drawVictoryCutscene();
    c.restore();
  }
  drawSkillQTE(f) {
    const c = this.c, q = f.qte, x = f.x, y = f.y - 160;
    const inWin = q.t >= q.start && q.t <= q.end;
    const k = clamp(q.t / q.dur, 0, 1);
    const rMax = 46, rTarget = 22, rCur = rMax * (1 - k * 0.68);
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.beginPath(); c.arc(x, y, rTarget, 0, 7);
    c.fillStyle = inWin ? 'rgba(255, 210, 74, 0.28)' : 'rgba(10, 6, 18, 0.65)'; c.fill();
    c.strokeStyle = inWin ? '#ffd24a' : '#fff8'; c.lineWidth = inWin ? 4 : 2.5;
    if (inWin) { c.shadowColor = '#ffd24a'; c.shadowBlur = 18; }
    c.stroke(); c.shadowBlur = 0;
    c.beginPath(); c.arc(x, y, rCur, 0, 7);
    c.strokeStyle = inWin ? '#fff' : '#ffab40'; c.lineWidth = 3; c.stroke();
    c.font = `12px ${FONT}`; c.lineWidth = 4; c.strokeStyle = '#000';
    const txt = `QTE [${(this.hints[f.i] || this.hints[0])[4]}] ×${q.mul}`;
    c.strokeText(txt, x, y - 34); c.fillStyle = inWin ? '#ffd24a' : '#fff'; c.fillText(txt, x, y - 34);
    c.restore();
  }
  drawFinisherTargets() {
    const c = this.c, pulse = 0.72 + 0.28 * Math.sin(this.time * 14);
    this.fighters.forEach((f) => {
      if (f.ko || f.dizzy <= 0) return;
      const att = this.fighters.find((a) => a.team !== f.team && !a.ko && (!this.net || a.i === this.mySlot));
      const key = att ? (this.hints[att.i] || this.hints[0])[6] : this.hints[0][6];
      const r = att ? this.finisherRange(att) : { rx: 95, ry: 95, isRanged: false };
      const inRange = !!att && Math.abs(att.x - f.x) <= r.rx && Math.abs(att.y - f.y) <= r.ry;
      const y = f.y - 145;
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) {
        const an = this.time * 6 + (i * Math.PI * 2) / 3;
        c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(f.x + Math.cos(an) * 24, f.y - 114 + Math.sin(an) * 7, 3.5, 0, 7); c.fill();
      }
      c.globalAlpha = pulse; c.strokeStyle = inRange ? '#ffd24a' : '#ff5252'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(f.x, y - 16); c.lineTo(f.x + 14, y); c.lineTo(f.x, y + 16); c.lineTo(f.x - 14, y); c.closePath(); c.stroke();
      c.font = `13px ${FONT}`; c.lineWidth = 4; c.strokeStyle = '#000';
      const msg = inRange ? (r.isRanged ? `⚡ RANGE FINISH! [${key}]` : `⚡ FINISH! [${key}]`) : (r.isRanged ? `เข้าระยะยิง (${r.rx}px) [${key}]` : `เข้าใกล้เพื่อปิดฉาก [${key}]`);
      c.strokeText(msg, f.x, y - 28); c.fillStyle = inRange ? '#ffd24a' : '#ff8a80'; c.fillText(msg, f.x, y - 28);
      c.restore();
    });
  }
  drawVictoryCutscene() {
    const v = this.victory; if (!v) return;
    const c = this.c, t = v.t, bar = clamp(t / 0.25, 0, 1) * 68;
    const wf = this.fighters[v.idx];
    c.save();
    /* 1) Speedlines & Golden/Signature Finisher Impact Flash at start */
    if (t < 0.65) {
      const a = 1 - t / 0.65;
      c.save();
      c.globalAlpha = a * 0.55; c.strokeStyle = v.color; c.lineWidth = 2.5;
      for (let i = 0; i < 42; i++) {
        const an = (i / 42) * Math.PI * 2 + t * 1.4, r0 = 140 + ((i * 37) % 80);
        c.beginPath(); c.moveTo(W / 2 + Math.cos(an) * r0, H / 2 + Math.sin(an) * r0);
        c.lineTo(W / 2 + Math.cos(an) * (r0 + 780), H / 2 + Math.sin(an) * (r0 + 780)); c.stroke();
      }
      c.restore();
    }
    /* 2) Letterbox bars */
    const vx0 = this.vx0 ?? 0, vy0 = this.vy0 ?? 0, vw = this.vw ?? W, vy1 = this.vy1 ?? H;
    c.fillStyle = '#05030b';
    c.fillRect(vx0, vy0, vw, Math.max(0, bar - vy0)); c.fillRect(vx0, H - bar, vw, Math.max(0, vy1 - (H - bar)));
    c.fillStyle = v.color; c.fillRect(vx0, bar - 3, vw, 3); c.fillRect(vx0, H - bar, vw, 3);

    /* Top bar label */
    const slideIn = clamp((t - 0.12) / 0.25, 0, 1);
    c.globalAlpha = slideIn; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `24px ${FONT}`; c.fillStyle = '#ffd24a';
    c.fillText(`${v.label || 'K.O.'} · ${v.sub}`, W / 2, bar / 2);

    /* 3) Heroic Diagonal Comic Finisher Card (bottom) */
    if (t > 0.22) {
      const k = clamp((t - 0.22) / 0.32, 0, 1);
      const sx = -420 * (1 - k);
      c.save();
      c.translate(sx, 0);
      c.fillStyle = 'rgba(7, 4, 15, 0.9)';
      c.beginPath();
      c.moveTo(vx0 - 20, H - bar - 152); c.lineTo(740, H - bar - 172); c.lineTo(680, H - bar); c.lineTo(vx0 - 20, H - bar); c.closePath();
      c.fill();
      c.strokeStyle = v.color; c.lineWidth = 4; c.stroke();

      c.textAlign = 'left';
      c.font = `15px ${FONT}`; c.fillStyle = '#ffd24a';
      c.fillText('VICTORY FINISHER · 勝者', 44, H - bar - 134);

      c.font = `54px ${FONT}`; c.lineWidth = 8; c.strokeStyle = '#000'; c.shadowColor = v.color; c.shadowBlur = 24;
      c.strokeText(v.name, 44, H - bar - 84); c.fillStyle = '#fff'; c.fillText(v.name, 44, H - bar - 84);
      c.shadowBlur = 0;

      if (v.jp) {
        const nw = c.measureText(v.name).width;
        c.font = `24px ${FONT}`; c.fillStyle = v.color;
        c.fillText(v.jp, Math.min(540, 58 + nw), H - bar - 82);
      }
      c.font = `17px ${FONT}`; c.fillStyle = '#e5def7';
      c.fillText(`"${v.line}"`, 44, H - bar - 30);
      c.restore();
    }

    /* 4) Big K.O. slash burst that settles gracefully */
    if (t < 1.35) {
      const pop = clamp(t / 0.14, 0, 1), fade = t > 0.9 ? clamp(1 - (t - 0.9) / 0.45, 0, 1) : 1;
      const sc = 1.6 - pop * 0.6;
      c.save(); c.globalAlpha = fade; c.translate(W / 2, H * 0.28); c.rotate(-0.06); c.scale(sc, sc);
      c.textAlign = 'center'; c.font = `112px ${FONT}`; c.lineWidth = 14; c.strokeStyle = '#000';
      c.shadowColor = v.color; c.shadowBlur = 36;
      c.strokeText(v.label || 'K.O.!', 0, 0); c.fillStyle = '#ffd24a'; c.fillText(v.label || 'K.O.!', 0, 0);
      c.restore();
    }

    /* 5) Bottom right winner badge */
    if (wf) {
      c.textAlign = 'right'; c.font = `16px ${FONT}`; c.fillStyle = '#fff8';
      c.fillText(`HP REMAINING: ${Math.ceil(wf.hp)}%`, W - 36, H - bar / 2);
    }
    c.restore();
  }
  drawLedgeQTE(f) {
    const c = this.c, L = f.ledge, x = clamp(L.x + L.side * 10, 95, this.worldW - 95), y = GROUND - 58;
    const rem = clamp(1 - L.t / L.dur, 0, 1), prog = clamp(L.progress / L.need, 0, 1);
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,0.82)'; c.fillRect(x - 92, y - 36, 184, 58);
    c.strokeStyle = (L.shield || 0) > 0 ? '#4fc3f7' : '#ffd24a'; c.lineWidth = 2; c.strokeRect(x - 92, y - 36, 184, 58);
    c.font = `13px ${FONT}`; c.fillStyle = '#ffd24a'; c.fillText(`MASH JUMP/PUNCH! (${L.progress}/${L.need})`, x, y - 18);
    c.fillStyle = '#222'; c.fillRect(x - 76, y - 4, 152, 9);
    c.fillStyle = '#7dff6b'; c.fillRect(x - 76, y - 4, 152 * prog, 9);
    c.fillStyle = '#ff5252'; c.fillRect(x - 76, y + 8, 152 * rem, 4);
    if ((L.shield || 0) > 0) {
      c.font = `10px ${FONT}`; c.fillStyle = '#4fc3f7';
      c.fillText(`SHIELD ${L.shield.toFixed(1)}s`, x, y + 17);
    }
    c.restore();
  }
  drawOrb(x, y, r, col) {
    const c = this.c, rr = Math.max(1.5, r || 1.5), g = c.createRadialGradient(x, y, 0.5, x, y, rr);
    g.addColorStop(0, '#fff'); g.addColorStop(0.35, col); g.addColorStop(1, withAlpha(col, '00'));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill();
  }
  drawBeam(b) {
    const c = this.c, k = b.t / b.max, th = b.th * (0.2 + 0.8 * k), x2 = b.d > 0 ? this.worldW + 160 : -160;
    const xMin = Math.min(b.x, x2), len = Math.abs(x2 - b.x);
    const g = c.createLinearGradient(0, b.y - th / 2, 0, b.y + th / 2);
    g.addColorStop(0, withAlpha(b.color, '00')); g.addColorStop(0.3, b.color); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.7, b.color); g.addColorStop(1, withAlpha(b.color, '00'));
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
    const sy = this.surfaceBelow(p.x, p.y);
    if (sy !== null && sy > p.y) {
      const sk = Math.max(0.25, 1 - (sy - p.y) / 280);
      c.save(); c.fillStyle = `rgba(0,0,0,${0.28 * sk})`;
      c.beginPath(); c.ellipse(p.x, sy + 3, Math.max(12, p.r * 1.1) * sk, 5 * sk, 0, 0, 7); c.fill();
      c.restore();
    }
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
    if (p.style === 'gavelseal') {
      c.save(); c.translate(p.x, p.y); c.rotate(this.time * 9); c.shadowColor = '#ffd24a'; c.shadowBlur = 18;
      c.strokeStyle = '#ffd24a'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, p.r, 0, 7); c.stroke();
      c.fillStyle = 'rgba(255,210,74,0.22)'; c.fill();
      c.fillStyle = '#fff'; c.fillRect(-10, -4, 20, 8); c.fillRect(-2, -4, 4, 16);
      c.restore(); return;
    }
    if (p.style === 'repel') {
      this.drawOrb(p.x, p.y, p.r * 1.65, '#9ccc65');
      c.save(); c.translate(p.x, p.y); c.scale(sg, 1);
      c.fillStyle = '#203818'; c.strokeStyle = '#b2ff59'; c.lineWidth = 3; c.shadowColor = '#b2ff59'; c.shadowBlur = 16;
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const an = (i / 8) * Math.PI * 2 + this.time * 6, rr = p.r * (i % 2 ? 0.65 : 1.05);
        i === 0 ? c.moveTo(Math.cos(an) * rr, Math.sin(an) * rr) : c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
      }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(8, -6, 3.5, 0, 7); c.arc(-6, 7, 3, 0, 7); c.fill();
      c.restore(); return;
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
    const g = c.createLinearGradient(p.x, 0, p.x - sg * 120, 0); g.addColorStop(0, p.color); g.addColorStop(1, withAlpha(p.color, '00'));
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
  drawRig(R, col, alpha, face, ko, gear, atk = false) {
    const c = this.c, L = (a, b) => { c.beginPath(); c.moveTo(R[a].x, R[a].y); c.lineTo(R[b].x, R[b].y); c.stroke(); };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    /* Back limbs + dark depth outline for physical silhouette */
    c.strokeStyle = '#07040d'; c.lineWidth = 11.5; c.globalAlpha = alpha * 0.65;
    L('hip', 'kB'); L('kB', 'fB'); L('neck', 'eB'); L('eB', 'hB');
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 7.5; c.shadowColor = col; c.shadowBlur = 14;
    c.globalAlpha = alpha * 0.72; L('hip', 'kB'); L('kB', 'fB'); L('neck', 'eB'); L('eB', 'hB');
    /* Torso outer rim + athletic core */
    c.globalAlpha = alpha;
    c.strokeStyle = '#07040d'; c.lineWidth = 13.5; L('neck', 'hip');
    c.strokeStyle = col; c.lineWidth = 9.5; L('neck', 'hip');
    /* Head + fierce battle eye */
    c.fillStyle = '#0b0b14'; c.lineWidth = 8; c.beginPath(); c.arc(R.head.x, R.head.y, 15, 0, 7); c.fill(); c.stroke();
    c.fillStyle = col;
    if (ko) {
      c.lineWidth = 2.2; c.beginPath(); c.moveTo(R.head.x + face * 3, R.head.y - 5); c.lineTo(R.head.x + face * 9, R.head.y); c.moveTo(R.head.x + face * 9, R.head.y - 5); c.lineTo(R.head.x + face * 3, R.head.y); c.stroke();
    } else if (atk) {
      c.beginPath(); c.moveTo(R.head.x + face * 3, R.head.y - 4); c.lineTo(R.head.x + face * 10, R.head.y - 1.5); c.lineTo(R.head.x + face * 4, R.head.y + 1); c.closePath(); c.fill();
    } else {
      c.beginPath(); c.arc(R.head.x + face * 6, R.head.y - 2, 2.7, 0, 7); c.fill();
    }
    /* Front limbs with depth rim + fists & footwear */
    c.shadowBlur = 0; c.strokeStyle = '#07040d'; c.lineWidth = 11.5; L('hip', 'kF'); L('kF', 'fF'); L('neck', 'eF'); L('eF', 'hF');
    c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.lineWidth = 8; L('hip', 'kF'); L('kF', 'fF'); L('neck', 'eF'); L('eF', 'hF');
    ['kF', 'eF', 'kB', 'eB'].forEach((n) => { c.beginPath(); c.arc(R[n].x, R[n].y, 4.4, 0, 7); c.fill(); });
    /* Footwear & fists */
    c.fillRect(R.fF.x - 4 + face * 2, R.fF.y - 3, 10, 5);
    c.fillRect(R.fB.x - 4 + face * 2, R.fB.y - 3, 9, 4.5);
    c.beginPath(); c.arc(R.hF.x, R.hF.y, 4.8, 0, 7); c.arc(R.hB.x, R.hB.y, 4.2, 0, 7); c.fill();
    this.drawSkinGear(R, col, face, gear);
    c.restore();
  }
  drawWeapon(f) {
    const a = f.act, R = f.rig; if (!a || !R || f.ko) return;
    const c = this.c, ang = Math.atan2(R.hF.y - R.eF.y, R.hF.x - R.eF.x), name = a.name;
    c.save(); c.translate(R.hF.x, R.hF.y); c.rotate(ang);
    if (name === 'soulsplit') {
      c.shadowColor = '#a7ffeb'; c.shadowBlur = 18; c.strokeStyle = '#fff'; c.fillStyle = '#0f2027'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-4, -3); c.lineTo(54, -2); c.lineTo(62, 0); c.lineTo(54, 3); c.lineTo(-4, 3); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#ff6bd6'; c.lineWidth = 4; c.beginPath(); c.arc(-6, 0, 6, 0, 7); c.stroke();
    } else if (name === 'invspear' || name === 'executioner') {
      const col = name === 'executioner' ? '#ffd24a' : '#cfd8dc';
      c.shadowColor = col; c.shadowBlur = 20; c.fillStyle = '#fff'; c.strokeStyle = col; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(0, -6); c.lineTo(58, 0); c.lineTo(0, 6); c.closePath(); c.fill(); c.stroke();
    } else if (name === 'gavel') {
      c.shadowColor = '#ffd24a'; c.shadowBlur = 18; c.strokeStyle = '#d7ccc8'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-6, 0); c.lineTo(36, 0); c.stroke();
      c.fillStyle = '#ffd24a'; c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.fillRect(28, -18, 18, 36); c.strokeRect(28, -18, 18, 36);
    } else if (name === 'cleave' || name === 'ratio' || name === 'collapse') {
      c.shadowColor = '#ffd54f'; c.shadowBlur = 14; c.fillStyle = '#eceff1'; c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.fillRect(2, -7, 36, 13); c.strokeRect(2, -7, 36, 13);
      c.strokeStyle = '#ff2d55'; c.lineWidth = 3; c.beginPath(); c.moveTo(12, -7); c.lineTo(12, 6); c.moveTo(24, -7); c.lineTo(24, 6); c.stroke();
    } else if (name === 'playful') {
      c.shadowColor = '#ff5252'; c.shadowBlur = 14; c.strokeStyle = '#ff1744'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(-18, -10); c.lineTo(10, 0); c.lineTo(38, 14); c.stroke();
    } else if (name === 'nailhammer' || name === 'hairpin' || name === 'resonance') {
      c.shadowColor = '#ff6bd6'; c.shadowBlur = 12; c.strokeStyle = '#8d6e63'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(24, 0); c.stroke();
      c.fillStyle = '#ff6bd6'; c.fillRect(20, -10, 10, 20);
    }
    c.restore();
  }
  drawFighter(f) {
    const c = this.c, col = f.flash > 0 ? '#fff' : (f.mahoraga > 0 ? '#f5efe0' : f.color), a = f.act, sp = a && spec(a.name);
    if (f.floorY !== null && !f.ledge) {
      const k = Math.max(0.3, 1 - Math.max(0, f.floorY - f.y) / 300);
      c.fillStyle = `rgba(0,0,0,${0.42 * k})`; c.beginPath(); c.ellipse(f.x, f.floorY + 4, 32 * k, 8 * k, 0, 0, 7); c.fill();
    }
    if (f.hp > 0 && f.hp <= 30 && !f.ko) {
      c.save(); c.globalAlpha = 0.22 + 0.14 * Math.sin(this.time * 12);
      c.strokeStyle = '#ff1744'; c.lineWidth = 2.5;
      c.beginPath(); c.ellipse(f.x, f.y - 64, 42, 74, 0, 0, 7); c.stroke(); c.restore();
    }
    if (f.mahoraga > 0) {
      c.save();
      c.globalAlpha = 0.25 + 0.12 * Math.sin(this.time * 10); c.strokeStyle = '#ffd54f'; c.shadowColor = '#ffd54f'; c.shadowBlur = 24; c.lineWidth = 3;
      c.beginPath(); c.ellipse(f.x, f.y - 68, 56, 88, 0, 0, 7); c.stroke();
      c.restore();
    }
    this.drawRig(f.rig, col, f.inv > 0 && f.flash <= 0 && f.act?.name !== 'domain' ? 0.65 : 1, f.face, f.ko, f.gear, !!a);
    this.drawWeapon(f);
    if ((f.nails || 0) > 0 && !f.ko && f.rig) {
      c.save(); c.strokeStyle = '#ff6bd6'; c.shadowColor = '#ff6bd6'; c.shadowBlur = 10; c.lineWidth = 2.5;
      for (let i = 0; i < f.nails; i++) {
        const ny = f.rig.hip.y - 28 + (i % 3) * 14, nx = f.x + ((i % 2 ? 1 : -1) * 11);
        c.beginPath(); c.moveTo(nx, ny); c.lineTo(nx + (i % 2 ? 16 : -16), ny - 8); c.stroke();
      }
      c.restore();
    }
    if (f.mahoraga > 0 && !f.ko && f.rig) {
      const R = f.rig, spin = this.time * 1.4 + (f.adaptSpin > 0 ? (0.48 - f.adaptSpin) * 16 : 0);
      c.save();
      /* Spinning Eight-Handled Dharma Wheel above Mahoraga head */
      c.translate(R.head.x, R.head.y - 30); c.rotate(spin);
      c.strokeStyle = f.adaptSpin > 0 ? '#fff' : '#ffd54f'; c.shadowColor = '#ffd54f'; c.shadowBlur = f.adaptSpin > 0 ? 28 : 16; c.lineWidth = 3.5;
      c.beginPath(); c.arc(0, 0, 18, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang) * 24, Math.sin(ang) * 24); c.stroke();
        c.fillStyle = '#ffd54f'; c.beginPath(); c.arc(Math.cos(ang) * 24, Math.sin(ang) * 24, 3, 0, 7); c.fill();
      }
      c.restore();
      /* Sword of Extermination blade attached to front arm */
      c.save();
      const angArm = Math.atan2(R.hF.y - R.eF.y, R.hF.x - R.eF.x);
      c.translate(R.hF.x, R.hF.y); c.rotate(angArm);
      c.strokeStyle = '#ffd54f'; c.fillStyle = '#fff8e1'; c.shadowColor = '#ffd54f'; c.shadowBlur = 14; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-4, -5); c.lineTo(42, 0); c.lineTo(-4, 5); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
    if (f.ledge && (f.ledge.shield || 0) > 0) {
      c.save(); c.strokeStyle = '#4fc3f7'; c.fillStyle = 'rgba(79, 195, 247, 0.16)'; c.shadowColor = '#4fc3f7'; c.shadowBlur = 18;
      c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y - 36, 48, 0, 7); c.fill(); c.stroke(); c.restore();
    }
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
    if (this.is2v2 && !f.ko && !this.cutscene) {
      const ty = (f.rig?.head?.y ?? f.y - 120) - 34, tw = Math.max(40, f.tag.length * 9 + 14);
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(6, 4, 14, 0.85)'; c.fillRect(f.x - tw / 2, ty - 11, tw, 20);
      c.strokeStyle = f.team === 0 ? '#4fc3f7' : '#ff5252'; c.lineWidth = 2; c.strokeRect(f.x - tw / 2, ty - 11, tw, 20);
      c.font = `12px ${FONT}`; c.fillStyle = '#fff'; c.fillText(f.tag, f.x, ty);
      c.restore();
    }
  }
  drawPlatformsAndClimbs() {
    const c = this.c, climbs = this.climbs, plats = this.platforms;
    climbs.forEach((cl) => {
      c.save();
      if (cl.kind === 'vine') {
        c.strokeStyle = '#2e7d32'; c.lineWidth = 7; c.lineCap = 'round';
        c.beginPath();
        for (let y = cl.y1; y <= cl.y2; y += 14) { const wx = cl.x + Math.sin(y * 0.06 + this.time * 2) * 4; y === cl.y1 ? c.moveTo(wx, y) : c.lineTo(wx, y); }
        c.stroke(); c.fillStyle = '#81c784';
        for (let y = cl.y1 + 22; y < cl.y2 - 14; y += 30) { const s = (y % 60 < 30 ? 1 : -1), wx = cl.x + Math.sin(y * 0.06 + this.time * 2) * 4; c.beginPath(); c.ellipse(wx + s * 9, y, 8, 4, s * 0.4, 0, 7); c.fill(); }
      } else if (cl.kind === 'ladder') {
        c.strokeStyle = '#90a4ae'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(cl.x - 10, cl.y1); c.lineTo(cl.x - 10, cl.y2); c.moveTo(cl.x + 10, cl.y1); c.lineTo(cl.x + 10, cl.y2); c.stroke();
        c.strokeStyle = this.arena.edge; c.lineWidth = 2.5;
        for (let y = cl.y1 + 14; y < cl.y2 - 4; y += 22) { c.beginPath(); c.moveTo(cl.x - 10, y); c.lineTo(cl.x + 10, y); c.stroke(); }
      } else {
        c.strokeStyle = this.arena.edge || '#ffd24a'; c.lineWidth = 3;
        for (let y = cl.y1 + 8; y < cl.y2; y += 18) { c.beginPath(); c.ellipse(cl.x, y, 5, 9, 0, 0, 7); c.stroke(); }
      }
      c.restore();
    });
    plats.forEach((p, idx) => {
      const w = p.x2 - p.x1, cx = (p.x1 + p.x2) / 2, bob = Math.sin(this.time * 1.8 + idx) * 2, th = p.theme || 'isle';
      c.save();
      if (th === 'metal') {
        c.fillStyle = '#1b222e'; c.fillRect(p.x1, p.y - 2, w, 14);
        c.strokeStyle = '#455a64'; c.lineWidth = 2;
        for (let xx = p.x1 + 10; xx < p.x2 - 12; xx += 26) { c.beginPath(); c.moveTo(xx, p.y + 12); c.lineTo(xx + 13, p.y + 2); c.lineTo(xx + 26, p.y + 12); c.stroke(); }
        c.fillStyle = '#263238'; c.fillRect(p.x1 - 4, p.y - 4, w + 8, 6);
      } else if (th === 'wood') {
        c.fillStyle = '#4e342e'; c.fillRect(p.x1, p.y - 2, w, 13);
        c.fillStyle = '#6d4c41'; c.fillRect(p.x1 - 3, p.y - 4, w + 6, 5);
        c.strokeStyle = '#2d1b16'; c.lineWidth = 2;
        for (let xx = p.x1 + 22; xx < p.x2 - 8; xx += 28) { c.beginPath(); c.moveTo(xx, p.y - 4); c.lineTo(xx, p.y + 11); c.stroke(); }
      } else if (th === 'ice') {
        const ig = c.createLinearGradient(0, p.y, 0, p.y + 38); ig.addColorStop(0, '#e1f5fe'); ig.addColorStop(1, '#195a85');
        c.fillStyle = ig; c.beginPath();
        c.moveTo(p.x1, p.y + 2); c.lineTo(p.x2, p.y + 2); c.lineTo(cx + w * 0.25, p.y + 34 + bob); c.lineTo(cx - w * 0.1, p.y + 42 + bob); c.lineTo(p.x1 + 18, p.y + 24); c.closePath(); c.fill();
        c.fillStyle = '#ffffff'; c.fillRect(p.x1, p.y - 3, w, 6);
      } else {
        const rg = c.createLinearGradient(0, p.y, 0, p.y + 44);
        const topC = th === 'shrine' ? '#455a64' : th === 'obsidian' ? '#2c1414' : th === 'coral' ? '#006978' : '#2e4d3e';
        const capC = th === 'shrine' ? '#546e7a' : th === 'obsidian' ? '#ff6d00' : th === 'coral' ? '#ff80ab' : '#2e7d32';
        rg.addColorStop(0, topC); rg.addColorStop(1, '#0b0e14');
        c.fillStyle = rg; c.beginPath();
        c.moveTo(p.x1 + 4, p.y + 6); c.lineTo(p.x2 - 4, p.y + 6); c.lineTo(cx + w * 0.24, p.y + 38 + bob); c.lineTo(cx, p.y + 48 + bob); c.lineTo(cx - w * 0.26, p.y + 34 + bob); c.closePath(); c.fill();
        c.fillStyle = capC; c.fillRect(p.x1, p.y - 3, w, 10);
      }
      c.shadowColor = this.arena.edge; c.shadowBlur = 14; c.fillStyle = this.arena.edge; c.fillRect(p.x1, p.y - 3, w, 3.5);
      c.restore();
    });
  }
  drawBg() {
    const c = this.c, A = this.arena, t = this.time, D = this.deco, ww = this.worldW;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, A.top); g.addColorStop(0.76, A.bot); g.addColorStop(1, A.top);
    c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
    if (A.stars) { c.fillStyle = '#fff'; D.st.forEach((s) => { c.globalAlpha = 0.28 + 0.72 * Math.abs(Math.sin(t * 1.3 + s.x)); c.fillRect(s.x, s.y, s.s, s.s); }); c.globalAlpha = 1; }
    const cxOff = (ww - W) / 2;
    (A.orbs || []).forEach((o) => {
      this.drawOrb(o.x + cxOff, o.y, o.r * 1.35, withAlpha(o.c, '66'));
      this.drawOrb(o.x + cxOff, o.y, o.r, o.c);
    });
    if (A.extra === 'aurora') ['#00ffa6', '#7c4dff', '#00e5ff'].forEach((col, k) => {
      c.globalAlpha = 0.24; c.fillStyle = col; c.beginPath(); c.moveTo(-1000, 0);
      for (let x = -1000; x <= ww + 1000; x += 40) c.lineTo(x, 105 + k * 44 + Math.sin(x * 0.006 + t * 0.6 + k) * 42);
      for (let x = ww + 1000; x >= -1000; x -= 40) c.lineTo(x, 205 + k * 44 + Math.sin(x * 0.005 + t * 0.4 + k * 2) * 50); c.fill();
    });
    c.globalAlpha = 1;
    if (A.clouds) {
      D.cl.forEach((k) => {
        const x = (((k.x + t * k.v + 650) % (ww + 1300)) + (ww + 1300)) % (ww + 1300) - 650;
        c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(x + 8, k.y + 8, k.s * 1.08, k.s * 0.34, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.78)'; c.beginPath(); c.ellipse(x, k.y, k.s, k.s * 0.3, 0, 0, 7); c.ellipse(x + k.s * 0.5, k.y - 10, k.s * 0.6, k.s * 0.3, 0, 0, 7); c.fill();
      });
    }
    (A.mount || []).forEach((m, mi) => {
      c.fillStyle = m.c; c.beginPath(); c.moveTo(-1000, GROUND);
      for (let x = -1000; x <= ww + 1000; x += 16) c.lineTo(x, GROUND - m.base - m.amp * (0.6 * Math.sin(x * m.f + m.s) + 0.4 * Math.sin(x * m.f * 2.3 + m.s * 2)) * 0.5 - m.amp * 0.5);
      c.lineTo(ww + 1000, GROUND); c.fill();
      if (A.id === 'volcano' && mi === 0) {
        c.save(); c.strokeStyle = 'rgba(255,109,0,0.45)'; c.lineWidth = 3;
        for (let vx = 180; vx < ww - 120; vx += 340) { c.beginPath(); c.moveTo(vx, GROUND - 260); c.quadraticCurveTo(vx + 18, GROUND - 150, vx - 14, GROUND); c.stroke(); }
        c.restore();
      }
    });
    if (A.city) D.b.forEach((b, bi) => {
      const top = GROUND - b.h, sl = A.city.broken ? (bi % 3) * 26 : 0; c.fillStyle = A.city.c; c.beginPath();
      c.moveTo(b.x, GROUND); c.lineTo(b.x, top + sl); c.lineTo(b.x + b.w * 0.5, top - sl * 0.3); c.lineTo(b.x + b.w, top + sl * 1.7); c.lineTo(b.x + b.w, GROUND); c.fill();
      for (let yy = top + 50; yy < GROUND - 20; yy += 22) for (let xx = b.x + 8; xx < b.x + b.w - 12; xx += 16)
        if (((xx * 7 + yy * 3 + bi) | 0) % 5 < 2) { c.fillStyle = (xx + yy) % 2 ? A.city.w[0] : A.city.w[1]; c.fillRect(xx, yy, 7, 10); }
      c.fillStyle = A.city.w[bi % 2]; c.fillRect(b.x, top + sl, b.w, 3);
      if (A.city.roof && b.ant) {
        c.fillStyle = '#090518'; c.fillRect(b.x + b.w * 0.5, top - b.ant, 3, b.ant);
        c.fillStyle = b.sign ? A.city.w[1] : A.city.w[0];
        c.beginPath(); c.arc(b.x + b.w * 0.5 + 1.5, top - b.ant, 3.5, 0, 7); c.fill();
      }
    });
    this.drawExtra(A.extra, t);
    /* Horizon atmospheric glow blending backdrop softly behind fighters */
    const hg = c.createLinearGradient(0, GROUND - 140, 0, GROUND);
    hg.addColorStop(0, '#00000000'); hg.addColorStop(1, withAlpha(A.edge, '22'));
    c.fillStyle = hg; c.fillRect(-1000, GROUND - 140, ww + 2000, 140);
    if (A.parts) D.e.forEach((e, idx) => {
      const pt = A.parts.t, rise = pt === 'ember' || pt === 'bubble' || pt === 'firefly';
      const spd = pt === 'rain' ? e.v * 6.5 : e.v;
      const y = (((rise ? e.y - t * spd : e.y + t * spd) % H) + H) % H;
      const x = pt === 'rain' ? e.x - ((t * 140 + idx * 17) % 120) : e.x + Math.sin(t + e.y) * (pt === 'firefly' ? 24 : 14);
      c.save(); c.globalAlpha = pt === 'rain' ? 0.45 : pt === 'firefly' ? 0.35 + 0.6 * Math.abs(Math.sin(t * 4 + idx)) : 0.82;
      c.fillStyle = A.parts.c; c.strokeStyle = A.parts.c;
      if (pt === 'data') c.fillRect(x, y, 2, e.s * 5);
      else if (pt === 'rain') { c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y + 18); c.stroke(); }
      else if (pt === 'firefly') {
        c.beginPath(); c.arc(x, y, e.s * 2.2, 0, 7); c.globalAlpha *= 0.28; c.fill();
        c.globalAlpha = 0.9; c.beginPath(); c.arc(x, y, e.s * 0.95, 0, 7); c.fill();
      }
      else if (pt === 'bubble') { c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, e.s * 1.4, 0, 7); c.stroke(); }
      else if (pt === 'petal' || pt === 'feather') { c.beginPath(); c.ellipse(x, y, e.s * (pt === 'feather' ? 2.4 : 1.6), e.s * 0.85, t + e.x, 0, 7); c.fill(); }
      else c.fillRect(x, y, e.s, e.s);
      c.restore();
    });
  }
  drawExtra(x, t) {
    const c = this.c, ww = this.worldW, cx = ww / 2, cxOff = (ww - W) / 2;
    if (x === 'neon') {
      /* Wet cyber-road glow & giant holographic billboard arch */
      c.save(); c.strokeStyle = '#00e5ff66'; c.lineWidth = 3;
      c.strokeRect(cx - 240, GROUND - 255, 480, 110);
      c.fillStyle = 'rgba(0, 229, 255, 0.08)'; c.fillRect(cx - 240, GROUND - 255, 480, 110);
      c.fillStyle = '#ff4081aa'; c.font = `24px ${FONT}`; c.textAlign = 'center';
      c.fillText('呪術廻戦 · SHINJUKU', cx, GROUND - 196);
      const rg = c.createLinearGradient(0, GROUND + 25, 0, GROUND + 180);
      rg.addColorStop(0, '#ff2d9544'); rg.addColorStop(1, '#00000000');
      c.fillStyle = rg; c.fillRect(this.stageL, GROUND + 25, this.stageR - this.stageL, 160);
      c.restore();
    } else if (x === 'sanctum') {
      c.save(); c.globalAlpha = 0.14; c.fillStyle = '#a7ffeb';
      [-260, 0, 260].forEach((ox) => {
        c.beginPath(); c.moveTo(cx + ox - 30, 0); c.lineTo(cx + ox + 40, 0); c.lineTo(cx + ox + 170, GROUND); c.lineTo(cx + ox - 90, GROUND); c.closePath(); c.fill();
      });
      c.restore();
      [[90, 180, 70], [380, 145, 55], [910, 155, 65], [1180, 210, 75]].forEach(([ix, iy, iw], k) => {
        const yy = iy + Math.sin(t * 1.1 + k) * 6;
        c.fillStyle = '#1b2c44'; c.beginPath(); c.moveTo(ix + cxOff - iw, yy); c.lineTo(ix + cxOff + iw, yy); c.lineTo(ix + cxOff + iw * 0.3, yy + 36); c.lineTo(ix + cxOff - iw * 0.4, yy + 28); c.closePath(); c.fill();
        c.fillStyle = '#2e7d32'; c.fillRect(ix + cxOff - iw, yy - 4, iw * 2, 6);
      });
      c.fillStyle = 'rgba(128, 222, 234, 0.25)'; c.fillRect(cx - 25, 245, 50, H - 245);
      c.fillStyle = '#1f2d3d'; c.fillRect(cx - 55, 165, 16, 80); c.fillRect(cx + 39, 165, 16, 80); c.fillRect(cx - 75, 155, 150, 14);
    } else if (x === 'subway') {
      /* Underground metro arches, flickering ceiling lamps & moving/parked train silhouette */
      c.save();
      c.fillStyle = '#161922'; c.fillRect(-1000, 0, ww + 2000, 74);
      for (let xx = 80; xx < ww - 60; xx += 260) {
        c.fillStyle = '#2c3140'; c.fillRect(xx - 16, 74, 32, GROUND - 74);
        c.fillStyle = ((xx + (t * 8 | 0)) % 7 === 0) ? '#ffe08266' : '#fff8e1';
        c.shadowColor = '#ffd54f'; c.shadowBlur = 18; c.fillRect(xx - 50, 62, 100, 8); c.shadowBlur = 0;
      }
      const tx = ((t * 110) % (ww + 900)) - 450;
      c.fillStyle = '#11151e'; c.fillRect(tx, GROUND - 135, 360, 128);
      c.fillStyle = '#ffd24a55'; c.fillRect(tx, GROUND - 88, 360, 7);
      c.fillStyle = '#80d8ff66';
      for (let w = 22; w < 330; w += 56) c.fillRect(tx + w, GROUND - 118, 38, 24);
      c.restore();
    } else if (x === 'columns') {
      c.save();
      c.fillStyle = 'rgba(255, 245, 157, 0.12)';
      c.beginPath(); c.moveTo(cx + 280, 0); c.lineTo(cx + 360, 0); c.lineTo(cx + 60, GROUND); c.lineTo(cx - 210, GROUND); c.closePath(); c.fill();
      c.fillStyle = '#e8dcc6'; c.fillRect(cx - 440, GROUND - 300, 880, 26); c.beginPath(); c.moveTo(cx - 460, GROUND - 300); c.lineTo(cx, GROUND - 405); c.lineTo(cx + 460, GROUND - 300); c.fill();
      for (let i = 0; i < 7; i++) {
        c.fillStyle = '#efe5d1'; c.fillRect(cx - 410 + i * 135, GROUND - 275, 34, 275);
        c.fillStyle = '#b9ab92'; c.fillRect(cx - 384 + i * 135, GROUND - 275, 8, 275);
        c.fillStyle = '#d7cbb5'; c.fillRect(cx - 416 + i * 135, GROUND - 285, 46, 12);
      }
      c.restore();
    } else if (x === 'shibuya') {
      c.save(); c.strokeStyle = 'rgba(255, 82, 82, 0.25)'; c.lineWidth = 2;
      c.beginPath(); c.arc(cx, GROUND + 100, 720, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
      c.fillStyle = '#120718'; c.fillRect(cx - 56, GROUND - 290, 112, 290);
      c.fillStyle = '#ff5252aa'; c.font = `20px ${FONT}`; c.textAlign = 'center'; c.fillText('109', cx, GROUND - 240);
      c.strokeStyle = '#ff1744'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 190, GROUND - 180); c.lineTo(cx - 260, GROUND - 310); c.lineTo(cx - 120, GROUND - 310); c.stroke();
      c.restore();
    } else if (x === 'torii') {
      c.fillStyle = '#12091c'; for (let i = 0; i < 5; i++) c.fillRect(60 + i * 8, GROUND - 50 - i * 46, 150 - i * 16, 46);
      c.fillStyle = '#c62828'; c.shadowColor = '#ff5252'; c.shadowBlur = 20;
      c.fillRect(cx - 200, GROUND - 300, 30, 300); c.fillRect(cx + 170, GROUND - 300, 30, 300); c.fillRect(cx - 245, GROUND - 308, 490, 26); c.fillRect(cx - 215, GROUND - 255, 430, 16); c.shadowBlur = 0;
      [-260, 260].forEach((ox) => {
        c.fillStyle = '#2d2033'; c.fillRect(cx + ox - 8, GROUND - 65, 16, 65); c.fillRect(cx + ox - 16, GROUND - 78, 32, 16);
        c.fillStyle = '#ffd180'; c.fillRect(cx + ox - 6, GROUND - 75, 12, 10);
      });
    } else if (x === 'bamboo') {
      c.save();
      this.deco.bam.forEach((b, i) => {
        const sway = Math.sin(t * 1.4 + b.ph) * 6;
        c.strokeStyle = i % 3 === 0 ? '#0d3b2b' : '#185e43'; c.lineWidth = b.w;
        c.beginPath(); c.moveTo(b.x, GROUND); c.lineTo(b.x + sway + b.tilt * 260, 20); c.stroke();
        c.strokeStyle = '#072219'; c.lineWidth = 2;
        for (let yy = 120; yy < GROUND; yy += 68) {
          const bx = b.x + (sway + b.tilt * 260) * (1 - yy / GROUND);
          c.beginPath(); c.moveTo(bx - b.w * 0.55, yy); c.lineTo(bx + b.w * 0.55, yy); c.stroke();
        }
      });
      c.restore();
    } else if (x === 'ocean') {
      c.save();
      /* Water caustics from surface + gliding Leviathan/Whale shadow */
      for (let i = 0; i < 6; i++) {
        c.globalAlpha = 0.08; c.fillStyle = '#80deea';
        const sx = ((i * 260 + Math.sin(t + i) * 40) % (ww + 200)) - 100;
        c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx + 90, 0); c.lineTo(sx + 210, GROUND); c.lineTo(sx - 60, GROUND); c.closePath(); c.fill();
      }
      const wx = ((t * 55) % (ww + 700)) - 350, wy = 220 + Math.sin(t * 0.9) * 20;
      c.globalAlpha = 0.28; c.fillStyle = '#010d17';
      c.beginPath(); c.ellipse(wx, wy, 150, 36, 0.04, 0, 7); c.moveTo(wx - 140, wy); c.lineTo(wx - 200, wy - 38); c.lineTo(wx - 185, wy); c.lineTo(wx - 200, wy + 34); c.closePath(); c.fill();
      c.restore();
    } else if (x === 'cosmic') {
      /* Accompanied accretion black hole + floating void shards */
      c.save();
      c.translate(cx, 230); c.rotate(t * 0.45);
      c.strokeStyle = '#7c4dff'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 0, 130, 38, 0.22, 0, 7); c.stroke();
      c.strokeStyle = '#00e5ff'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, 0, 170, 50, -0.18, 0, 7); c.stroke();
      c.fillStyle = '#020008'; c.beginPath(); c.arc(0, 0, 44, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      c.restore();
      c.save();
      this.deco.sh.forEach((s) => {
        c.save(); c.translate(s.x, s.y + Math.sin(t + s.a) * 12); c.rotate(s.a + t * s.sp);
        c.fillStyle = 'rgba(124, 77, 255, 0.16)'; c.strokeStyle = 'rgba(0, 229, 255, 0.42)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(0, -s.r); c.lineTo(s.r * 0.65, 0); c.lineTo(0, s.r); c.lineTo(-s.r * 0.65, 0); c.closePath(); c.fill(); c.stroke();
        c.restore();
      });
      c.restore();
    } else if (x === 'grid') {
      c.strokeStyle = this.arena.edge; c.globalAlpha = 0.32; c.lineWidth = 1;
      for (let xx = -1200; xx <= ww + 1200; xx += 90) { c.beginPath(); c.moveTo(cx, 250); c.lineTo(xx, GROUND); c.stroke(); }
      for (let k = 0; k < 9; k++) { const y = 250 + (GROUND - 250) * Math.pow((k + ((t * 0.3) % 1)) / 9, 2); c.beginPath(); c.moveTo(-1200, y); c.lineTo(ww + 1200, y); c.stroke(); }
      c.globalAlpha = 1;
    } else if (x === 'graves') {
      c.fillStyle = '#0d0714'; this.deco.g.forEach((g) => {
        c.beginPath(); c.moveTo(g.x - 18, GROUND); c.lineTo(g.x - 18, GROUND - g.h + 14); c.arc(g.x, GROUND - g.h + 14, 18, Math.PI, 0); c.lineTo(g.x + 18, GROUND); c.fill();
        if (g.k === 0) { c.fillRect(g.x - 3, GROUND - g.h - 40, 6, 44); c.fillRect(g.x - 14, GROUND - g.h - 28, 28, 6); }
      });
      for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(179,136,255,.12)'; c.beginPath(); c.ellipse(((i * 340 + t * 20) % (ww + 1300)) - 650, GROUND - 25, 220, 28, 0, 0, 7); c.fill(); }
    } else if (x === 'eclipse') {
      c.save();
      this.drawOrb(cx, 190, 210, '#ff6d00');
      c.fillStyle = '#120206'; c.beginPath(); c.arc(cx, 190, 72, 0, 7); c.fill();
      c.strokeStyle = '#ffd54f'; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#190509';
      this.deco.sw.forEach((sw) => {
        c.save(); c.translate(sw.x, GROUND); c.rotate(sw.ang);
        c.fillRect(-3, -sw.h, 6, sw.h); c.fillRect(-14, -sw.h + 16, 28, 5);
        c.restore();
      });
      c.restore();
    } else if (x === 'lava') {
      const lg = c.createLinearGradient(0, GROUND + 40, 0, H + 800); lg.addColorStop(0, '#ff6d0000'); lg.addColorStop(1, '#ff6d00'); c.fillStyle = lg; c.fillRect(-1400, GROUND + 40, ww + 2800, H + 1400);
    }
  }
  drawFloor() {
    const c = this.c, A = this.arena, L = this.stageL, R = this.stageR, w = R - L;
    const g = c.createLinearGradient(0, GROUND, 0, GROUND + 140); g.addColorStop(0, A.floor); g.addColorStop(1, 'rgba(0,0,0,.92)');
    c.fillStyle = g; c.beginPath(); c.moveTo(L, GROUND); c.lineTo(R, GROUND); c.lineTo(R - 95, GROUND + 140); c.lineTo(L + 95, GROUND + 140); c.fill();
    /* Layered arena stone/steel texture slab & pillars */
    c.fillStyle = A.floor; c.fillRect(L, GROUND, w, 32);
    c.fillStyle = 'rgba(0,0,0,0.28)';
    for (let xx = L + 52; xx < R - 20; xx += 64) c.fillRect(xx, GROUND + 5, 2, 22);
    c.fillRect(L + 18, GROUND + 16, w - 36, 2);
    if (A.id === 'subway') {
      c.fillStyle = '#ffd24a'; c.fillRect(L + 14, GROUND + 2, w - 28, 4);
    }
    c.shadowColor = A.edge; c.shadowBlur = 24; c.fillStyle = A.edge; c.fillRect(L, GROUND - 3, w, 5.5);
    c.fillRect(L - 6, GROUND - 16, 9, 48); c.fillRect(R - 3, GROUND - 16, 9, 48); c.shadowBlur = 0;
  }
  drawDomain() {
    const d = this.dom, c = this.c, ww = this.worldW;
    if (d.st === 'clash') {
      const x = ww * d.clash.share, f0 = this.fighters[d.clash.f0 ?? 0], f1 = this.fighters[d.clash.f1 ?? 1];
      c.save(); c.beginPath(); c.rect(-1400, -1400, x + 1400, H + 2800); c.clip(); this.drawDomainBg(f0.dom, this.time, 1); c.restore();
      c.save(); c.beginPath(); c.rect(x, -1400, ww + 1400 - x, H + 2800); c.clip(); this.drawDomainBg(f1.dom, this.time, 1); c.restore();
      c.save(); c.shadowColor = '#fff'; c.shadowBlur = 30; c.fillStyle = '#fff'; c.fillRect(x - 3, -1200, 6, H + 2400); c.restore();
      return;
    }
    if (d.st === 'open') {
      const f = this.fighters[d.owner], p = clamp((d.t - 0.15) / (OPEN - 0.25), 0, 1);
      if (p > 0) {
        c.save(); c.beginPath(); c.arc(f.x, f.y - 70, p * (this.is2v2 ? 2600 : 1550), 0, 7); c.clip();
        this.drawDomainBg(d.id, d.t, 0.92); c.restore();
        c.save(); c.strokeStyle = DOMAINS[d.id].color; c.shadowColor = DOMAINS[d.id].color; c.shadowBlur = 28; c.lineWidth = 6;
        c.beginPath(); c.arc(f.x, f.y - 70, p * (this.is2v2 ? 2600 : 1550), 0, 7); c.stroke(); c.restore();
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
    const c = this.c, D = this.deco, ww = this.worldW, cx = ww / 2;
    c.save(); c.globalAlpha = a;
    if (id === 'void') {
      c.fillStyle = '#04001a'; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      const g = c.createRadialGradient(cx, H / 2, 10, cx, H / 2, 800); g.addColorStop(0, '#7c4dffaa'); g.addColorStop(1, '#00000000'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      c.strokeStyle = '#e1f5fe'; c.lineWidth = 1.5; D.s.forEach((s) => { const x = (((s.x - t * s.v * 6) % ww) + ww) % ww; c.globalAlpha = a * 0.7; c.beginPath(); c.moveTo(x, s.y); c.lineTo(x + s.l, s.y); c.stroke(); });
      c.globalAlpha = a * 0.5; c.strokeStyle = '#80d8ff'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { const r = (t * 260 + i * 110) % 770; c.beginPath(); c.ellipse(cx, H / 2 - 40, r, r * 0.45, 0, 0, 7); c.stroke(); }
      c.globalAlpha = a; c.fillStyle = '#e1f5ff'; c.fillRect(-500, GROUND, ww + 1000, 3);
    } else if (id === 'shrine') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120000'); g.addColorStop(1, '#8b0000'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 260, 190, '#ff1744'); c.fillStyle = '#000';
      c.fillRect(cx - 260, GROUND - 60, 520, 60); for (let i = 0; i < 5; i++) c.fillRect(cx - 230 + i * 105, GROUND - 190, 28, 130);
      c.beginPath(); c.moveTo(cx - 310, GROUND - 190); c.quadraticCurveTo(cx, GROUND - 300, cx + 310, GROUND - 190); c.lineTo(cx + 260, GROUND - 160); c.quadraticCurveTo(cx, GROUND - 250, cx - 260, GROUND - 160); c.fill();
      c.beginPath(); c.moveTo(cx - 190, GROUND - 235); c.quadraticCurveTo(cx, GROUND - 330, cx + 190, GROUND - 235); c.lineTo(cx + 150, GROUND - 205); c.quadraticCurveTo(cx, GROUND - 285, cx - 150, GROUND - 205); c.fill();
      for (let i = 0, x = -400; x < ww + 400; i++, x += 50) { c.beginPath(); c.moveTo(x, GROUND + 4); c.lineTo(x + 25, GROUND - 40 - (i % 3) * 22); c.lineTo(x + 50, GROUND + 4); c.fill(); }
    } else if (id === 'coffin') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0500'); g.addColorStop(1, '#ff6d00'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      c.fillStyle = '#0d0200'; c.beginPath(); c.moveTo(cx - 580, GROUND); c.lineTo(cx - 120, 230); c.lineTo(cx + 120, 230); c.lineTo(cx + 580, GROUND); c.fill();
      this.drawOrb(cx, 225, 170, '#ffab00'); c.strokeStyle = '#ff6d00'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - 40, 240); c.lineTo(cx - 120, 380); c.lineTo(cx - 220, GROUND); c.moveTo(cx + 40, 240); c.lineTo(cx + 120, 360); c.lineTo(cx + 220, GROUND); c.stroke();
      c.fillStyle = '#ffab40'; D.e.forEach((e) => { const y = (((e.y - t * e.v * 3) % H) + H) % H; c.fillRect(e.x, y, e.s, e.s); });
      const lv = c.createLinearGradient(0, GROUND, 0, H + 400); lv.addColorStop(0, '#ff9100'); lv.addColorStop(1, '#bf360c'); c.fillStyle = lv; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'chimera') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#02020a'); g.addColorStop(1, '#1b0f2e'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 250, 170, '#4a2a9c');
      c.strokeStyle = '#8c6bff'; c.lineWidth = 2; c.globalAlpha = a * 0.55;
      for (let i = 0; i < Math.ceil(ww / 80); i++) { const x = 30 + i * 80, top = GROUND - 170 - ((i * 37) % 120); c.beginPath(); c.moveTo(x, GROUND); c.bezierCurveTo(x + Math.sin(t * 2 + i) * 40, GROUND - 60, x - Math.sin(t * 1.7 + i) * 50, top + 60, x + Math.sin(t * 2.3 + i) * 30, top); c.stroke(); }
      c.globalAlpha = a; c.fillStyle = '#000';
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-400, H + 400); for (let x = -400; x <= ww + 400; x += 20) c.lineTo(x, GROUND - 36 + k * 26 + Math.sin(x * 0.012 + t * (1.5 + k) + k) * 16); c.lineTo(ww + 400, H + 400); c.fill(); }
      c.fillStyle = '#fff'; D.e.slice(0, 26).forEach((e, i) => { if (Math.sin(t * 1.6 + i * 2) > -0.7) { c.beginPath(); c.ellipse(e.x, 120 + (e.y % 300), 7, 3, 0, 0, 7); c.fill(); } });
    } else if (id === 'sentence') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#080000'); g.addColorStop(1, '#3a0a0a'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      const sp = c.createRadialGradient(cx, 0, 20, cx, 0, 760); sp.addColorStop(0, '#ffd54f66'); sp.addColorStop(1, '#00000000'); c.fillStyle = sp; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      c.fillStyle = '#1a0606'; for (let x = -400; x < ww + 400; x += 110) c.fillRect(x, -200, 74, GROUND + 200);
      c.strokeStyle = '#ffca28'; c.lineWidth = 3; c.globalAlpha = a * 0.85;
      const sw = Math.sin(t * 2) * 14; c.beginPath(); c.moveTo(cx, 90); c.lineTo(cx, 330); c.moveTo(cx - 190, 150 + sw); c.lineTo(cx + 190, 150 - sw); c.stroke();
      [[-190, sw], [190, -sw]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(cx + dx, 150 + dy); c.lineTo(cx + dx - 46, 235 + dy); c.lineTo(cx + dx + 46, 235 + dy); c.closePath(); c.stroke(); c.beginPath(); c.ellipse(cx + dx, 235 + dy, 52, 10, 0, 0, 7); c.stroke(); });
      c.globalAlpha = a; c.fillStyle = '#0d0202'; c.fillRect(cx - 340, GROUND - 100, 680, 100); c.fillStyle = '#ffca28'; c.fillRect(cx - 340, GROUND - 104, 680, 6);
      c.fillStyle = '#000'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'skandha') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#00111f'); g.addColorStop(1, '#00518f'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      c.fillStyle = '#b3e5fc'; for (let i = 0; i < Math.ceil(ww / 200); i++) { c.globalAlpha = a * 0.09; const x = 100 + i * 220 + Math.sin(t * 0.6 + i) * 40; c.beginPath(); c.moveTo(x, -200); c.lineTo(x + 90, -200); c.lineTo(x + 260, GROUND); c.lineTo(x + 60, GROUND); c.fill(); }
      c.globalAlpha = a * 0.7; c.fillStyle = '#e1f5fe'; D.e.forEach((e) => { const y = (((e.y - t * e.v * 1.5) % H) + H) % H; c.beginPath(); c.arc(e.x + Math.sin(t + e.y) * 8, y, e.s, 0, 7); c.fill(); });
      c.globalAlpha = a; c.fillStyle = '#00192e';
      for (let i = 0; i < Math.ceil(ww / 140); i++) { const x = ((i * 170 + t * (70 + i * 9)) % (ww + 240)) - 120, y = 150 + ((i * 61) % 330); c.beginPath(); c.ellipse(x, y, 30, 11, 0, 0, 7); c.moveTo(x - 24, y); c.lineTo(x - 50, y - 14); c.lineTo(x - 50, y + 14); c.fill(); }
      c.strokeStyle = '#4fc3f7'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); for (let x = -400; x <= ww + 400; x += 20) c.lineTo(x, 60 + k * 18 + Math.sin(x * 0.01 + t * 2 + k) * 10); c.stroke(); }
      c.fillStyle = '#00203a'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'mutual') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0a2e'); g.addColorStop(1, '#ff5ca8'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 270, 230 + Math.sin(t * 3) * 14, '#ffffff');
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.globalAlpha = a * 0.4; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(cx, 270, 90 + i * 70 + Math.sin(t * 2 + i) * 6, t * (i % 2 ? 0.4 : -0.4), t * (i % 2 ? 0.4 : -0.4) + 4.2); c.stroke(); }
      c.globalAlpha = a * 0.8; c.fillStyle = '#ffd6ef';
      D.e.slice(0, 28).forEach((e, i) => { const y = (((e.y - t * e.v * 2) % H) + H) % H, x = e.x + Math.sin(t + i) * 20, s2 = 8 + (i % 4) * 4; c.beginPath(); c.moveTo(x, y + s2 * 0.35); c.bezierCurveTo(x - s2, y - s2 * 0.3, x - s2 * 0.5, y - s2, x, y - s2 * 0.45); c.bezierCurveTo(x + s2 * 0.5, y - s2, x + s2, y - s2 * 0.3, x, y + s2 * 0.35); c.fill(); });
      c.globalAlpha = a; c.fillStyle = '#12001f'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'moon') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141008'); g.addColorStop(1, '#4a3509'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 240, 175, '#ffee58');
      c.strokeStyle = '#ffd54f'; c.lineWidth = 2; c.globalAlpha = a * 0.5;
      for (let i = 0; i < Math.ceil(ww / 180); i++) c.strokeRect(120 + i * 180, 120 + ((i % 2) * 35), 140, 190);
      c.globalAlpha = a; c.fillStyle = '#18130a'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'womb') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d0318'); g.addColorStop(1, '#3c1556'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 250, 200, '#b388ff');
      c.fillStyle = '#1e0a2e'; for (let i = 0; i < Math.ceil(ww / 165); i++) c.fillRect(140 + i * 165, 160 + (i % 2) * 40, 38, GROUND - 160);
      c.fillStyle = '#09020f'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'sphere') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0c10'); g.addColorStop(1, '#2b303a'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      c.fillStyle = '#000'; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(cx, 260, 125, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#111318'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'singularity') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#00040f'); g.addColorStop(1, '#002c4d'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 270, 210, '#00e5ff');
      c.fillStyle = '#000'; c.beginPath(); c.arc(cx, 270, 72, 0, 7); c.fill();
      c.strokeStyle = '#00e5ff'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, 270, 190, 42, -0.25, 0, 7); c.stroke();
      c.fillStyle = '#000814'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'soulhome') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#180c06'); g.addColorStop(1, '#5e2c14'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 250, 190, '#ff8a3d');
      c.strokeStyle = '#ffd24a'; c.lineWidth = 2; c.globalAlpha = a * 0.45;
      for (let i = 0; i < 6; i++) { const y = 140 + i * 70; c.beginPath(); c.moveTo(-400, y); c.lineTo(ww + 400, y); c.stroke(); }
      c.fillStyle = '#120804'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'strawfield') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e071a'); g.addColorStop(1, '#591642'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 260, 180, '#ff6bd6');
      c.strokeStyle = '#ffab91'; c.lineWidth = 3; c.globalAlpha = a * 0.5;
      for (let i = 0; i < Math.ceil(ww / 155); i++) { const x = 100 + i * 155, y = 160 + (i % 3) * 70; c.beginPath(); c.moveTo(x - 16, y - 22); c.lineTo(x + 16, y + 22); c.moveTo(x + 16, y - 22); c.lineTo(x - 16, y + 22); c.stroke(); }
      c.fillStyle = '#140310'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'overtime73') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#151205'); g.addColorStop(1, '#473c0f'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      c.strokeStyle = '#ffd24a'; c.lineWidth = 2; c.globalAlpha = a * 0.45;
      c.beginPath(); c.arc(cx, 240, 140, 0, 7); c.stroke();
      for (let i = -3; i < Math.ceil(ww / 128) + 3; i++) { const x = i * 128 + 64; c.beginPath(); c.moveTo(x, -200); c.lineTo(x, GROUND); c.stroke(); }
      c.fillStyle = '#0f0c03'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'armory' || id === 'zerovoid') {
      const col = id === 'armory' ? '#7dff6b' : '#ffffff';
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#070a0d'); g.addColorStop(1, id === 'armory' ? '#144723' : '#2b2e3b'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      c.strokeStyle = col; c.lineWidth = 4; c.globalAlpha = a * 0.55;
      for (let i = 0; i < Math.ceil(ww / 140); i++) { const x = 90 + i * 140; c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x + (i % 2 ? 18 : -18), GROUND - 150 - (i % 3) * 40); c.stroke(); }
      c.fillStyle = '#05070a'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'cursedvoice') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#03111c'); g.addColorStop(1, '#0b3859'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      c.strokeStyle = '#3dd6ff'; c.lineWidth = 3; c.globalAlpha = a * 0.55;
      for (let i = 0; i < 5; i++) { const r = ((t * 180 + i * 90) % 450) + 40; c.beginPath(); c.arc(cx, 260, r, 0, 7); c.stroke(); }
      c.fillStyle = '#020b14'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'claphall') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0826'); g.addColorStop(1, '#5c2612'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(ww * 0.3, 240, 150, '#ff8a3d'); this.drawOrb(ww * 0.7, 240, 150, '#ff6bd6');
      c.fillStyle = '#12041a'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
    } else if (id === 'bloodsea') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1c0208'); g.addColorStop(1, '#6e0719'); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 250, 190, '#ff2d55');
      c.fillStyle = '#4a000d'; c.fillRect(-500, GROUND - 8, ww + 1000, H + 400);
    } else {
      const info = DOMAINS[id], g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, info.bg[0]); g.addColorStop(1, info.bg[1]); c.fillStyle = g; c.fillRect(-1400, -1400, ww + 2800, H + 2800);
      this.drawOrb(cx, 280, 200 + Math.sin(t * 6) * 12, info.color);
      c.strokeStyle = info.color; c.lineWidth = 3; c.globalAlpha = a * 0.5; for (let i = 0; i < 6; i++) { const r = (t * 220 + i * 120) % 720; c.beginPath(); c.ellipse(cx, 280, r, r * 0.5, 0, 0, 7); c.stroke(); }
      c.globalAlpha = a * 0.8; c.fillStyle = info.color; D.e.forEach((e) => { const y = (((e.y - t * e.v * 2) % H) + H) % H; c.fillRect(e.x, y, e.s, e.s * 3); });
      c.globalAlpha = a; c.fillStyle = '#000'; c.fillRect(-1400, GROUND, ww + 2800, H + 1400);
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
    const bar = clamp(t / 0.2, 0, 1) * 56, vx0 = this.vx0 ?? 0, vy0 = this.vy0 ?? 0, vw = this.vw ?? W, vy1 = this.vy1 ?? H;
    c.globalAlpha = a; c.fillStyle = '#000'; c.fillRect(vx0, vy0, vw, Math.max(0, bar - vy0)); c.fillRect(vx0, H - bar, vw, Math.max(0, vy1 - (H - bar)));
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
      const f = this.fighters[d.owner];
      const o = this.enemiesOf(f).find((e) => !e.ko && e.ce >= 100 && !e.ai) || this.enemiesOf(f).find((e) => !e.ko && e.ce >= 100);
      if (o) {
        const x = o.team ? W * 0.75 : W * 0.25, k = clamp(1 - d.t / OPEN, 0, 1);
        c.globalAlpha = 0.75 + 0.25 * Math.sin(this.time * 26); c.shadowColor = o.color; c.shadowBlur = 24; c.fillStyle = '#fff'; c.font = `30px ${FONT}`;
        c.fillText(`COUNTER! PRESS [${(this.hints[o.i] || this.hints[0])[3]}]`, x, 640); c.fillStyle = o.color; c.fillRect(x - 170, 664, 340 * k, 8);
      }
    } else if (d.st === 'clash') {
      const k = d.clash, bw = 760, bx = W / 2 - bw / 2, by = 205, bh = 34;
      const a = this.fighters[k.f0 ?? 0], b = this.fighters[k.f1 ?? 1];
      c.shadowColor = '#fff'; c.shadowBlur = 30; c.fillStyle = '#fff'; c.font = `52px ${FONT}`; c.fillText('DOMAIN CLASH!', W / 2, 160); c.shadowBlur = 0;
      c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(bx - 6, by - 6, bw + 12, bh + 12);
      c.fillStyle = a.color; c.fillRect(bx, by, bw * k.share, bh); c.fillStyle = b.color; c.fillRect(bx + bw * k.share, by, bw * (1 - k.share), bh);
      c.fillStyle = '#fff'; c.fillRect(bx + bw * k.share - 3, by - 10, 6, bh + 20); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(bx, by, bw, bh);
      c.font = `30px ${FONT}`; c.fillStyle = '#fff'; c.fillText(Math.max(0, k.dur - k.t).toFixed(1), W / 2, by + bh + 36);
      [a, b].forEach((f, idx) => {
        c.save(); c.translate(idx ? W * 0.8 : W * 0.2, 350); c.scale(1 + k.pulse[idx] * 0.25, 1 + k.pulse[idx] * 0.25);
        c.fillStyle = f.color; c.shadowColor = f.color; c.shadowBlur = 24; c.font = `96px ${FONT}`; c.fillText(String(k.n[idx]), 0, 0);
        c.shadowBlur = 0; c.fillStyle = '#fff'; c.font = `24px ${FONT}`; c.fillText(f.ai ? 'CPU MASHING!' : `MASH [${(this.hints[f.i] || this.hints[0])[3]}] !!!`, 0, 72); c.restore();
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
    const c = this.c, F = this.fighters[d.owner], O = this.enemiesOf(F).find((e) => !e.ko) || this.fighters.find((x) => x.team !== F.team) || this.fighters[0];
    const A = DOMAINS[d.id].art, HF = this.hints[F.i] || this.hints[0], HO = this.hints[O.i] || this.hints[0];
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
    if (on && O) {
      const ox = clamp(this.is2v2 ? W / 2 + (O.x - this.cam.x) * this.cam.z : O.x, 90, W - 90);
      const oy = clamp(this.is2v2 ? H / 2 + (O.y - this.cam.y) * this.cam.z : O.y, 240, H - 90);
      const bx = ox - 60, by = oy - 205; txt(`RESIST [${HO[5]}] MASH`, ox, by, 13, '#fff', 'center');
      c.fillStyle = '#0009'; c.fillRect(bx, by + 12, 120, 8); c.fillStyle = '#4fc3f7'; c.fillRect(bx, by + 12, (120 * d.resist) / 0.4, 8);
    }
    c.restore();
  }
  drawHud() {
    const c = this.c, T = this.cfg.target; c.textBaseline = 'middle';
    const label = (s, tx, ty, size, col, al) => { c.textAlign = al; c.font = `${size}px ${FONT}`; c.lineWidth = 5; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(s, tx, ty); c.fillStyle = col; c.fillText(s, tx, ty); };
    const teams = [this.fighters.filter((f) => f.team === 0), this.fighters.filter((f) => f.team === 1)];
    teams.forEach((members, i) => {
      if (!members.length) return;
      const f = (this.net ? members.find((m) => m.i === this.mySlot) : null) || members[0];
      const others = members.filter((m) => m !== f);
      const hf = this.hints[f.i] || this.hints[0];
      const w = 500, x = i ? W - 40 - w : 40, sk = i ? -20 : 20, at = (wd) => (i ? x + w - wd : x), hpw = (v) => (w * v) / 100, low = f.hp < 30;
      const wins = this.wins[i];
      this.pg(x - 4, 42, w + 8, 36, sk); c.fillStyle = '#000'; c.fill();
      c.save(); this.pg(x, 46, w, 28, sk); c.clip();
      c.fillStyle = '#1a1226'; c.fillRect(x - 30, 46, w + 60, 28);
      c.fillStyle = '#ffd24a'; c.fillRect(at(hpw(f.hpShow)), 46, hpw(f.hpShow), 28);
      c.fillStyle = f.ko ? '#555' : f.color; c.fillRect(at(hpw(f.hp)), 46, hpw(f.hp), 28);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(at(hpw(f.hp)), 46, hpw(f.hp), 8);
      c.restore();
      this.pg(x - 4, 42, w + 8, 36, sk); c.strokeStyle = low && !f.ko ? `rgba(255,45,85,${0.6 + 0.4 * Math.sin(this.time * 12)})` : '#fff'; c.lineWidth = 3; c.stroke();
      const tx = i ? x + w - 6 : x + 6, dTag = { easy: 'EASY', medium: 'MED', hard: 'HARD' }[this.aiDiff] || 'CPU';
      const disp = f.ai ? `${f.tag}: ${f.name} [${dTag}]` : `${this.is2v2 ? f.tag + ': ' : ''}${f.name}`; c.font = `24px ${FONT}`; const nw = c.measureText(disp).width;
      label(disp, tx, 26, 24, f.ko ? '#888' : '#fff', i ? 'right' : 'left');
      if (f.jp && !this.is2v2) label(f.jp, tx + (i ? -(nw + 12) : nw + 12), 28, 15, f.color, i ? 'right' : 'left');
      for (let k = 0; k < T; k++) { const px = i ? x + 16 + k * 24 : x + w - 16 - k * 24; c.beginPath(); c.moveTo(px, 17); c.lineTo(px + 8, 26); c.lineTo(px, 35); c.lineTo(px - 8, 26); c.closePath(); if (k < wins) { c.fillStyle = f.color; c.fill(); } c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
      const cw = 380, cx0 = i ? x + w - cw : x, full = f.ce >= 100, pulse = full ? 0.65 + 0.35 * Math.sin(this.time * 10) : 1, ce = (cw * f.ce) / 100;
      c.save(); this.pg(cx0, 82, cw, 10, sk * 0.5); c.clip(); c.fillStyle = '#120a22'; c.fillRect(cx0 - 20, 82, cw + 40, 10);
      c.globalAlpha = pulse; c.fillStyle = full ? '#ffd24a' : '#8b5cf6'; c.fillRect(i ? cx0 + cw - ce : cx0, 82, ce, 10); c.restore();
      this.pg(cx0, 82, cw, 10, sk * 0.5); c.strokeStyle = '#b388ff'; c.lineWidth = 1.5; c.stroke();
      label(full ? `領域展開 [${hf[3]}]` : `${Math.floor(f.ce)}%`, i ? cx0 - 8 : cx0 + cw + 8, 88, 12, full ? '#ffd24a' : '#d1c4e9', i ? 'right' : 'left');
      const off = i ? w - 466 : 0;
      for (let s = 0; s < 3; s++) {
        const id = this.effectiveSkill(f, s), sk2 = id && SKILLS[id], tw = 150, sx = x + off + s * 158; if (!sk2) continue;
        const r = 1 - f.cd[s] / (sk2.cd * (f.pas.cd || 1)), ready = r >= 1;
        c.save(); this.pg(sx, 98, tw, 26, 8); c.clip(); c.fillStyle = '#120a22'; c.fillRect(sx - 10, 98, tw + 20, 26);
        c.fillStyle = ready ? sk2.color : sk2.color + '55'; c.fillRect(sx - 10, 98, (tw + 20) * Math.min(1, r), 26); c.restore();
        this.pg(sx, 98, tw, 26, 8); c.strokeStyle = sk2.color; c.lineWidth = 2; c.stroke();
        c.textAlign = 'center'; c.font = `10px ${FONT}`; c.fillStyle = ready ? '#000' : '#fff'; c.fillText(`[${hf[s]}] ${sk2.short}${ready ? '' : ' ' + f.cd[s].toFixed(1)}`, sx + tw / 2, 112);
      }
      const ft = this.phase === 'fight' ? this.finishTarget(f) : null;
      const anyEnemyDizzy = this.phase === 'fight' && this.fighters.some((e) => e.team !== f.team && !e.ko && e.dizzy > 0);
      const finX = i ? x + w - 210 : x, finW = 210;
      c.save(); this.pg(finX, 130, finW, 20, 6); c.clip();
      c.fillStyle = ft ? (0.65 + 0.35 * Math.sin(this.time * 14) > 0.8 ? '#ffd24a' : '#ff1744') : anyEnemyDizzy ? '#4a1428' : '#120a22aa';
      c.fillRect(finX - 10, 130, finW + 20, 20); c.restore();
      this.pg(finX, 130, finW, 20, 6); c.strokeStyle = ft ? '#ffd24a' : anyEnemyDizzy ? '#ff5252' : '#ffffff44'; c.lineWidth = ft ? 2 : 1; c.stroke();
      label(ft ? `⚡ ปิดฉาก [${hf[6]}] READY!` : anyEnemyDizzy ? `เข้าใกล้เพื่อปิดฉาก [${hf[6]}]` : `☠ ปิดฉาก [${hf[6]}] (ติดมึน 1%)`, finX + finW / 2, 140, 10, ft ? '#000' : anyEnemyDizzy ? '#ffd24a' : '#ffffff88', 'center');
      others.forEach((m, idx) => {
        const mw = 250, mx = i ? W - 40 - mw : 40, msk = i ? -10 : 10, mat = (wd) => (i ? mx + mw - wd : mx), mhpw = (v) => (mw * v) / 100;
        const y0 = 166 + idx * 38;
        label(`${m.tag}: ${m.name}`, i ? mx + mw : mx, y0 - 11, 12, m.ko ? '#777' : '#fff', i ? 'right' : 'left');
        this.pg(mx - 2, y0 - 2, mw + 4, 16, msk); c.fillStyle = '#000'; c.fill();
        c.save(); this.pg(mx, y0, mw, 12, msk); c.clip();
        c.fillStyle = '#1a1226'; c.fillRect(mx - 20, y0, mw + 40, 12);
        c.fillStyle = '#ffd24a'; c.fillRect(mat(mhpw(m.hpShow)), y0, mhpw(m.hpShow), 12);
        c.fillStyle = m.ko ? '#555' : m.color; c.fillRect(mat(mhpw(m.hp)), y0, mhpw(m.hp), 12);
        c.restore();
        this.pg(mx - 2, y0 - 2, mw + 4, 16, msk); c.strokeStyle = m.ko ? '#555' : '#ffffffaa'; c.lineWidth = 2; c.stroke();
        const mcw = 150, mcx0 = i ? mx + mw - mcw : mx, mce = (mcw * m.ce) / 100;
        c.fillStyle = '#120a22'; c.fillRect(mcx0, y0 + 18, mcw, 5);
        c.fillStyle = m.ce >= 100 ? '#ffd24a' : '#8b5cf6'; c.fillRect(i ? mcx0 + mcw - mce : mcx0, y0 + 18, mce, 5);
        label(`${Math.floor(m.ce)}%`, i ? mcx0 - 6 : mcx0 + mcw + 6, y0 + 21, 10, '#d1c4e9', i ? 'right' : 'left');
      });
      const buffY = 160 + others.length * 44, comboY = buffY + 28;
      const adN = f.adaptN ?? Object.keys(f.adapt || {}).length;
      if (f.mahoraga > 0) label(`MAHORAGA ${f.mahoraga.toFixed(1)}s · ADAPT x${adN}`, i ? x + w : x, buffY, 13, '#ffd54f', i ? 'right' : 'left');
      else if (f.amp > 0) label(`BUFF ${f.amp.toFixed(1)}s`, i ? x + w : x, buffY, 13, f.auraC, i ? 'right' : 'left');
      if (f.combo >= 2 && f.comboT > 0) { c.shadowColor = '#ff6d00'; c.shadowBlur = 16; label(`${f.combo} HIT COMBO!`, i ? x + w : x, comboY, 30, '#ffeb3b', i ? 'right' : 'left'); c.shadowBlur = 0; }
    });
    const tcx = W / 2, tcy = 60, frac = clamp(this.timer / 99, 0, 1), urgent = this.timer < 10;
    c.beginPath(); c.arc(tcx, tcy, 38, 0, 7); c.fillStyle = '#000'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#ffffff33'; c.stroke();
    c.beginPath(); c.arc(tcx, tcy, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); c.strokeStyle = urgent ? '#ff2d55' : '#fff'; c.stroke();
    c.textAlign = 'center'; c.font = `32px ${FONT}`; c.fillStyle = urgent ? '#ff2d55' : '#fff'; c.fillText(String(Math.max(0, Math.ceil(this.timer))), tcx, tcy + 2);
    const big = (txt, y, size, col) => { c.save(); c.translate(W / 2, y); c.rotate(-0.05); c.textAlign = 'center'; c.font = `${size}px ${FONT}`; c.lineWidth = Math.max(6, size / 8); c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(txt, 0, 0); c.shadowColor = col; c.shadowBlur = 28; c.fillStyle = col; c.fillText(txt, 0, 0); c.restore(); };
    if (this.phase === 'countdown') { big(`ROUND ${this.round}`, H / 2 - 110, 40, '#fff'); big(String(Math.max(1, Math.ceil(this.phaseT))), H / 2, 170, '#ffd24a'); }
    else if (this.banner > 0) big('FIGHT!', H / 2, 150, '#ff2d55');
    else if (this.phase === 'ko' && !this.victory) { big(this.label || 'K.O.', H / 2 - 40, 120, '#ff2d55'); big(this.msg, H / 2 + 50, 32, '#fff'); }
  }
}
