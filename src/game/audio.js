let ctx;
const ac = () => {
  if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
function tone(f0, f1, d, type = 'square', v = 0.12) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + d);
}
function noise(d, v = 0.15) {
  const c = ac(); if (!c) return;
  const n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), g = c.createGain();
  g.gain.value = v; s.buffer = buf; s.connect(g).connect(c.destination); s.start();
}
export const unlockAudio = () => ac();
export const sfx = {
  click: () => tone(660, 880, 0.06, 'triangle', 0.1),
  jump: () => tone(260, 520, 0.14, 'sine', 0.12),
  punch: () => { tone(220, 65, 0.13, 'square', 0.15); noise(0.08, 0.14); },
  kick: () => { tone(165, 48, 0.18, 'sawtooth', 0.16); noise(0.11, 0.16); },
  hit: () => { tone(110, 34, 0.19, 'square', 0.22); noise(0.14, 0.24); },
  heavy: () => { tone(95, 24, 0.28, 'sawtooth', 0.26); noise(0.22, 0.28); },
  block: () => tone(900, 500, 0.08, 'triangle', 0.14),
  parry: () => { tone(1400, 2200, 0.18, 'triangle', 0.22); tone(980, 1960, 0.28, 'sine', 0.16); noise(0.08, 0.16); },
  ledge: () => tone(190, 320, 0.09, 'triangle', 0.12),
  qte: () => tone(560, 820, 0.05, 'triangle', 0.09),
  saved: () => { tone(440, 880, 0.18, 'triangle', 0.15); tone(660, 1320, 0.18, 'sine', 0.1); },
  fire: () => { noise(0.35, 0.2); tone(300, 120, 0.35, 'sawtooth', 0.1); },
  dash: () => { noise(0.25, 0.12); tone(200, 600, 0.2, 'sawtooth', 0.08); },
  slam: () => { tone(90, 30, 0.5, 'square', 0.2); noise(0.4, 0.25); },
  thunder: () => { noise(0.6, 0.3); tone(1200, 60, 0.45, 'sawtooth', 0.15); },
  blast: () => tone(400, 1000, 0.3, 'sine', 0.15),
  count: () => tone(520, 520, 0.15, 'square', 0.1),
  fight: () => tone(780, 1040, 0.4, 'square', 0.14),
  slash: () => { noise(0.12, 0.18); tone(1800, 400, 0.12, 'sawtooth', 0.08); },
  blue: () => { tone(200, 800, 0.5, 'sine', 0.15); tone(205, 810, 0.5, 'sine', 0.12); },
  boom: () => { tone(120, 25, 0.5, 'sawtooth', 0.22); noise(0.4, 0.25); },
  beam: () => { tone(80, 600, 0.5, 'sawtooth', 0.2); tone(160, 1200, 0.6, 'square', 0.1); noise(0.5, 0.2); },
  shoot: () => tone(300, 900, 0.25, 'sawtooth', 0.14),
  charge: () => tone(300, 700, 0.25, 'sine', 0.08),
  domain: () => { tone(60, 30, 1.4, 'sawtooth', 0.25); tone(440, 880, 1.0, 'triangle', 0.12); noise(1, 0.15); },
  domainOpen: () => { tone(110, 55, 0.85, 'sawtooth', 0.2); tone(330, 660, 0.65, 'sine', 0.14); noise(0.35, 0.12); },
  cutscene: () => { tone(75, 28, 0.7, 'sawtooth', 0.26); tone(520, 1040, 0.45, 'triangle', 0.16); noise(0.3, 0.18); },
  bf: () => { tone(60, 20, 0.5, 'square', 0.3); noise(0.3, 0.3); },
  warp: () => { tone(1200, 300, 0.15, 'square', 0.1); tone(300, 1200, 0.15, 'square', 0.1); },
  howl: () => tone(300, 520, 0.4, 'sawtooth', 0.1),
  clash: () => { tone(80, 500, 0.7, 'sawtooth', 0.24); tone(500, 80, 0.7, 'square', 0.12); noise(0.6, 0.28); },
  mash: () => tone(480 + Math.random() * 360, 220, 0.04, 'square', 0.06),
  speech: () => { tone(220, 110, 0.5, 'square', 0.18); tone(330, 165, 0.5, 'sawtooth', 0.1); },
  buff: () => tone(300, 1000, 0.4, 'sine', 0.12),
  heal: () => { tone(400, 900, 0.5, 'sine', 0.12); tone(600, 1200, 0.5, 'triangle', 0.08); },
  jackpot: () => { tone(600, 1200, 0.4, 'triangle', 0.14); tone(900, 1800, 0.6, 'sine', 0.1); },
  perfect: () => { tone(880, 1760, 0.12, 'triangle', 0.14); tone(1320, 2640, 0.14, 'sine', 0.08); },
  good: () => tone(660, 990, 0.1, 'triangle', 0.1),
  miss: () => tone(160, 90, 0.14, 'square', 0.07),
  art: () => { tone(200, 900, 0.3, 'sawtooth', 0.14); noise(0.25, 0.18); },
  gavel: () => { tone(110, 40, 0.25, 'square', 0.25); noise(0.2, 0.3); },
  resist: () => tone(400, 300, 0.05, 'triangle', 0.06),
  ko: () => { tone(400, 60, 0.8, 'sawtooth', 0.2); noise(0.5, 0.2); },
};
