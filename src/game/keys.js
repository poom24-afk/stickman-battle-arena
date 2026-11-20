import { CONTROLS as DEFAULT } from './constants.js';

const STORES = {
  '1v1': 'stickman-controls-v1',
  '2v2_offline': 'stickman-controls-2v2-offline-v1',
  '2v2_online': 'stickman-controls-2v2-online-v1',
};
export const PROFILE_IDS = ['1v1', '2v2_offline', '2v2_online'];
export const controlProfileOf = (cfg, isOnline) => (cfg?.mode === '2v2' ? (isOnline ? '2v2_online' : '2v2_offline') : '1v1');
export const RESERVED = new Set(['Escape']); // Pause หลัก (KeyP ใช้เป็น Pause เฉพาะตอนที่ไม่ได้ตั้งเป็นปุ่มเล่น)
export const ACTIONS = [
  ['left', 'เดินซ้าย'], ['right', 'เดินขวา'], ['jump', 'กระโดด / ปีนขึ้น'], ['block', 'ป้องกัน / กดจังหวะ Parry / ต้านโดเมน'],
  ['punch', 'ต่อย / Domain Art'], ['kick', 'เตะ'], ['s1', 'สกิล 1'], ['s2', 'สกิล 2'], ['s3', 'สกิล 3'],
  ['dom', 'Domain / กดตามจังหวะ / กดรัวตอนปะทะ'],
  ['fin', 'ท่าปิดฉาก (เข้าประชิดศัตรูที่ติดมึน 1%)'],
];

const clone = (o) => JSON.parse(JSON.stringify(o));

export const PRESETS = [
  {
    id: 'default',
    name: '💻 มาตรฐาน',
    desc: 'คีย์บอร์ดเดียว / ปุ่มเริ่มต้น (P1: WASD · P2: ลูกศร + NP1-6/Digit1-6)',
    controls: DEFAULT,
  },
  {
    id: 'ext_numpad',
    name: '⌨️+⌨️ คีย์บอร์ดเสริม (มี Numpad)',
    desc: 'แยกคีย์บอร์ด 1 (โซนซ้าย WASD+FGHJKLR) กับคีย์บอร์ดเสริม 2 (ลูกศร + Numpad 0-7 ล้วน)',
    controls: [
      DEFAULT[0],
      { left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['ArrowUp'], block: ['ArrowDown'], punch: ['Numpad1'], kick: ['Numpad2'], s1: ['Numpad4'], s2: ['Numpad5'], s3: ['Numpad6'], dom: ['Numpad3'], fin: ['Numpad0'] },
      DEFAULT[2],
      DEFAULT[3],
    ],
  },
  {
    id: 'ext_tkl',
    name: '⌨️+⌨️ คีย์บอร์ดเสริม (ไม่มี Numpad / 60%-TKL)',
    desc: 'คีย์บอร์ด 1 ใช้ WASD+FGZXCVR · คีย์บอร์ดเสริม 2 ใช้ลูกศร + K/L/I/O/P/;/\' (ไม่ต้องมี Numpad)',
    controls: [
      { left: ['KeyA'], right: ['KeyD'], jump: ['KeyW'], block: ['KeyS'], punch: ['KeyF'], kick: ['KeyG'], s1: ['KeyZ'], s2: ['KeyX'], s3: ['KeyC'], dom: ['KeyV'], fin: ['KeyR'] },
      { left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['ArrowUp'], block: ['ArrowDown'], punch: ['KeyK'], kick: ['KeyL'], s1: ['KeyI'], s2: ['KeyO'], s3: ['KeyP'], dom: ['Semicolon'], fin: ['Quote'] },
      { left: ['KeyB'], right: ['KeyM'], jump: ['KeyH'], block: ['KeyN'], punch: ['Comma'], kick: ['Period'], s1: ['Slash'], s2: ['KeyQ'], s3: ['KeyE'], dom: ['KeyT'], fin: ['KeyY'] },
      { left: ['BracketLeft'], right: ['BracketRight'], jump: ['Backslash'], block: ['Equal'], punch: ['Digit7'], kick: ['Digit8'], s1: ['Digit9'], s2: ['Digit0'], s3: ['Minus'], dom: ['Backspace'], fin: ['Enter'] },
    ],
  },
  {
    id: 'split_ijkl',
    name: '⌨️ คีย์บอร์ดคู่ ซ้าย (WASD) vs ขวา (IJKL)',
    desc: 'เล่นสะดวก 2 คนบน 2 คีย์บอร์ดที่ถนัดเดิน IJKL แทนปุ่มลูกศร',
    controls: [
      { left: ['KeyA'], right: ['KeyD'], jump: ['KeyW'], block: ['KeyS'], punch: ['KeyF'], kick: ['KeyG'], s1: ['KeyC'], s2: ['KeyV'], s3: ['KeyB'], dom: ['KeyN'], fin: ['KeyR'] },
      { left: ['KeyJ'], right: ['KeyL'], jump: ['KeyI'], block: ['KeyK'], punch: ['KeyU'], kick: ['KeyO'], s1: ['KeyP'], s2: ['Semicolon'], s3: ['Quote'], dom: ['BracketLeft'], fin: ['KeyH'] },
      DEFAULT[2],
      DEFAULT[3],
    ],
  },
];

export function loadControls(profile = '1v1') {
  const c = clone(DEFAULT);
  const key = STORES[profile] || STORES['1v1'];
  try {
    const raw = localStorage.getItem(key);
    const s = JSON.parse(raw || 'null');
    if (Array.isArray(s)) s.forEach((p, i) => {
      if (!p || !c[i]) return;
      for (const k in c[i]) if (Array.isArray(p[k]) && p[k].length && p[k].every((x) => typeof x === 'string')) c[i][k] = p[k];
    });
  } catch { /* ใช้ค่าเริ่มต้น */ }
  return c;
}
export function saveControls(c, profile = '1v1') {
  const key = STORES[profile] || STORES['1v1'];
  try { localStorage.setItem(key, JSON.stringify(c)); } catch { /* ignore */ }
}
export function resetControls(profile = '1v1') {
  const key = STORES[profile] || STORES['1v1'];
  try { localStorage.removeItem(key); } catch { /* ignore */ }
  return clone(DEFAULT);
}
export function applyPreset(presetId, profile = '1v1') {
  const found = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
  const next = clone(found.controls);
  saveControls(next, profile);
  return next;
}

/* ตั้งปุ่มใหม่ (รองรับทั้งปุ่มหลัก slotIdx=0 และปุ่มเสริม slotIdx=1) — ไม่ให้ปุ่มชนกันระหว่างผู้เล่น */
export function rebind(controls, p, action, code, onlySelf = false, slotIdx = 0) {
  const next = clone(controls);
  const curList = [...(next[p][action] || [])];
  const old = curList[slotIdx] || curList[0];
  if (old === code) return next;
  next.forEach((pl, pi) => {
    if (onlySelf && pi !== p) return;
    for (const k in pl) {
      if (pi === p && k === action) continue;
      if (pl[k].includes(code)) {
        pl[k] = pl[k].filter((x) => x !== code);
        if (!pl[k].length) pl[k] = [old];
      }
    }
  });
  if (slotIdx === 1) {
    if (curList[0] === code) return next;
    next[p][action] = [curList[0], code];
  } else {
    const alt = curList[1] && curList[1] !== code ? [curList[1]] : [];
    next[p][action] = [code, ...alt];
  }
  return next;
}

export function clearAltKey(controls, p, action) {
  const next = clone(controls);
  if (next[p]?.[action]?.length > 1) next[p][action] = [next[p][action][0]];
  return next;
}

const SPECIAL = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'SPACE',
  ShiftLeft: 'L-SHIFT', ShiftRight: 'R-SHIFT', ControlLeft: 'L-CTRL', ControlRight: 'R-CTRL',
  AltLeft: 'L-ALT', AltRight: 'R-ALT', Enter: 'ENTER', Backspace: 'BKSP', Tab: 'TAB',
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'",
  BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`',
};
const NUMPAD = { Add: '+', Subtract: '-', Multiply: '*', Divide: '/', Decimal: '.', Enter: 'ENT' };
export function keyLabel(code = '') {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) { const r = code.slice(6); return 'NP' + (NUMPAD[r] || r); }
  return SPECIAL[code] || code.toUpperCase();
}
export const keyHints = (c) => c.map((p) => ['s1', 's2', 's3', 'dom', 'punch', 'block', 'fin'].map((k) => keyLabel(p[k][0])));
