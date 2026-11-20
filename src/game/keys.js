import { CONTROLS as DEFAULT } from './constants.js';

const STORES = {
  '1v1': 'stickman-controls-v1',
  '2v2_offline': 'stickman-controls-2v2-offline-v1',
  '2v2_online': 'stickman-controls-2v2-online-v1',
};
export const PROFILE_IDS = ['1v1', '2v2_offline', '2v2_online'];
export const controlProfileOf = (cfg, isOnline) => (cfg?.mode === '2v2' ? (isOnline ? '2v2_online' : '2v2_offline') : '1v1');
export const RESERVED = new Set(['Escape', 'KeyP']); // ใช้เป็น Pause
export const ACTIONS = [
  ['left', 'เดินซ้าย'], ['right', 'เดินขวา'], ['jump', 'กระโดด / ปีนขึ้น'], ['block', 'ป้องกัน / กดจังหวะ Parry / ต้านโดเมน'],
  ['punch', 'ต่อย / Domain Art'], ['kick', 'เตะ'], ['s1', 'สกิล 1'], ['s2', 'สกิล 2'], ['s3', 'สกิล 3'],
  ['dom', 'Domain / กดตามจังหวะ / กดรัวตอนปะทะ'],
  ['fin', 'ท่าปิดฉาก (เข้าประชิดศัตรูที่ติดมึน 1%)'],
];

const clone = (o) => JSON.parse(JSON.stringify(o));

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

/* ตั้งปุ่มใหม่ — ถ้าปุ่มนั้นถูกใช้อยู่ จะสลับปุ่มให้กัน (ไม่ให้ซ้ำ) */
export function rebind(controls, p, action, code, onlySelf = false) {
  const next = clone(controls), old = next[p][action][0];
  if (old === code) return next;
  next.forEach((pl, pi) => {
    if (onlySelf && pi !== p) return;
    for (const k in pl) {
      if (pi === p && k === action) continue;
      if (pl[k].includes(code)) { pl[k] = pl[k].filter((x) => x !== code); if (!pl[k].length) pl[k] = [old]; }
    }
  });
  next[p][action] = [code];
  return next;
}

const SPECIAL = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'SPACE', ShiftLeft: 'L-SHIFT', ShiftRight: 'R-SHIFT',
  ControlLeft: 'L-CTRL', ControlRight: 'R-CTRL', AltLeft: 'L-ALT', AltRight: 'R-ALT', Enter: 'ENTER', Backspace: 'BKSP', Tab: 'TAB',
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`' };
const NUMPAD = { Add: '+', Subtract: '-', Multiply: '*', Divide: '/', Decimal: '.', Enter: 'ENT' };
export function keyLabel(code = '') {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) { const r = code.slice(6); return 'NP' + (NUMPAD[r] || r); }
  return SPECIAL[code] || code.toUpperCase();
}
export const keyHints = (c) => c.map((p) => ['s1', 's2', 's3', 'dom', 'punch', 'block', 'fin'].map((k) => keyLabel(p[k][0])));
