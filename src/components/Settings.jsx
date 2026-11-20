import { useEffect, useState } from 'react';
import { ACTIONS, RESERVED, PRESETS, loadControls, saveControls, resetControls, applyPreset, rebind, clearAltKey, keyLabel } from '../game/keys.js';
import { COLORS } from '../game/constants.js';
import { sfx } from '../game/audio.js';

const PROFILES = [
  ['1v1', '1v1 (มาตรฐาน)', 'ใช้สำหรับเล่นโหมด 1 vs 1 ทั้งออฟไลน์และออนไลน์'],
  ['2v2_offline', '2v2 Offline (เครื่องเดียว)', 'ตั้งปุ่มแยกสำหรับ P1, P2, P3, P4 ในโหมด 2v2 บนเครื่องเดียว'],
  ['2v2_online', '2v2 Online (ออนไลน์)', 'ชุดปุ่มแยกเฉพาะตัวเราเมื่อเล่นโหมด 2 vs 2 ออนไลน์ (ใช้ได้ทุกช่อง P1–P4)'],
];

export default function Settings({ onBack, initialProfile = '1v1' }) {
  const [prof, setProf] = useState(initialProfile);
  const [ctls, setCtls] = useState(() => ({
    '1v1': loadControls('1v1'),
    '2v2_offline': loadControls('2v2_offline'),
    '2v2_online': loadControls('2v2_online'),
  }));
  const [wait, setWait] = useState(null); // [ผู้เล่น, action, slotIdx] ที่กำลังรอรับปุ่ม
  const [note, setNote] = useState('');
  const [lastKey, setLastKey] = useState('');
  const [gpCount, setGpCount] = useState(() => (navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean).length : 0));

  const ctl = ctls[prof];
  const isOnlineProf = prof === '2v2_online';

  /* ตรวจจับคีย์บอร์ดเสริมและจอยเกมแบบเรียลไทม์ */
  useEffect(() => {
    const onTest = (e) => { if (!wait && !e.repeat) setLastKey(`${keyLabel(e.code)} (${e.code})`); };
    const syncGp = () => setGpCount(navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean).length : 0);
    addEventListener('keydown', onTest);
    addEventListener('gamepadconnected', syncGp);
    addEventListener('gamepaddisconnected', syncGp);
    return () => {
      removeEventListener('keydown', onTest);
      removeEventListener('gamepadconnected', syncGp);
      removeEventListener('gamepaddisconnected', syncGp);
    };
  }, [wait]);

  useEffect(() => {
    if (!wait) return;
    const on = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      if (e.code === 'Escape') { setWait(null); setNote(''); return; }
      if (RESERVED.has(e.code)) { setNote(`ปุ่ม ${keyLabel(e.code)} ถูกใช้เป็น Pause ตั้งไม่ได้`); return; }
      const next = rebind(ctl, wait[0], wait[1], e.code, isOnlineProf, wait[2] || 0);
      saveControls(next, prof);
      setCtls((s) => ({ ...s, [prof]: next }));
      setLastKey(`${keyLabel(e.code)} (${e.code})`);
      sfx.click(); setWait(null); setNote('');
    };
    addEventListener('keydown', on, true);
    return () => removeEventListener('keydown', on, true);
  }, [wait, ctl, prof, isOnlineProf]);

  const usePreset = (preset) => {
    const next = applyPreset(preset.id, prof);
    setCtls((s) => ({ ...s, [prof]: next }));
    setWait(null); setNote(`ใช้ชุดปุ่ม "${preset.name}" แล้ว: ${preset.desc}`); sfx.click();
  };

  const reset = () => {
    const def = resetControls(prof);
    setCtls((s) => ({ ...s, [prof]: def }));
    setWait(null); setNote('คืนค่าเริ่มต้นแล้ว'); sfx.click();
  };

  const copyFrom1v1 = () => {
    const cloned = JSON.parse(JSON.stringify(ctls['1v1']));
    saveControls(cloned, prof);
    setCtls((s) => ({ ...s, [prof]: cloned }));
    setWait(null); setNote('คัดลอกปุ่มจากโหมด 1v1 มาแล้ว!'); sfx.click();
  };

  const rmAlt = (p, act) => {
    const next = clearAltKey(ctl, p, act);
    saveControls(next, prof);
    setCtls((s) => ({ ...s, [prof]: next }));
    sfx.click();
  };

  const slots = isOnlineProf ? [0] : prof === '2v2_offline' ? [0, 1, 2, 3] : [0, 1];
  const profInfo = PROFILES.find(([id]) => id === prof) || PROFILES[0];

  return (
    <div className="screen select">
      <h2 className="title sm">ตั้งปุ่มแยกคีย์บอร์ด & คีย์บอร์ดเสริม</h2>
      <div className="chips" role="tablist" aria-label="เลือกโหมดตั้งปุ่ม">
        {PROFILES.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={prof === id}
            className={'chip' + (prof === id ? ' on' : '')}
            onClick={() => { sfx.click(); setWait(null); setNote(''); setProf(id); }}>
            {label}
          </button>
        ))}
      </div>
      <div className="hw-bar">
        <span>⌨️ เสียบคีย์บอร์ดเสริม (USB/Bluetooth) แล้วกดทดสอบปุ่มได้เลย: <b>{lastKey || 'ลองกดปุ่มใดก็ได้…'}</b></span>
        <span>🎮 จอยเกม: <b>{gpCount > 0 ? `เชื่อมต่ออยู่ ${gpCount} ตัว (แยก P1–P${Math.min(4, gpCount)})` : 'ยังไม่เชื่อมต่อ'}</b></span>
      </div>
      {!isOnlineProf && (
        <div className="preset-bar">
          <span className="preset-lbl">⚡ ชุดปุ่มแยกคีย์บอร์ดสำเร็จรูป:</span>
          {PRESETS.map((pr) => (
            <button key={pr.id} className="mini" title={pr.desc} onClick={() => usePreset(pr)}>{pr.name}</button>
          ))}
        </div>
      )}
      <p className="hint">
        {profInfo[2]} · คลิกปุ่มหลักหรือ <b>+เสริม</b> เพื่อตั้งปุ่ม (ปุ่มคนละโซนจะไม่ทับกันเมื่อต่อ 2 คีย์บอร์ดพร้อมกัน) · กด Esc ยกเลิก
      </p>
      <div className="players">
        {slots.map((p) => (
          <div className="panel" key={p} style={{ '--c': COLORS[p] }}>
            <h3>{isOnlineProf ? 'ปุ่มของเรา (2v2 ONLINE)' : `PLAYER ${p + 1} · คีย์บอร์ด ${p + 1}`}</h3>
            <div className="keyrows">
              {ACTIONS.map(([act, label]) => {
                const onMain = wait && wait[0] === p && wait[1] === act && wait[2] === 0;
                const onAlt = wait && wait[0] === p && wait[1] === act && wait[2] === 1;
                const keys = ctl[p][act] || [];
                return (
                  <div className="keyrow" key={act}>
                    <span>{label}</span>
                    <div className="keypair">
                      <button className={'keybtn' + (onMain ? ' wait' : '')} onClick={() => { setNote(''); setWait(onMain ? null : [p, act, 0]); }}>
                        {onMain ? 'กดปุ่มใหม่…' : keyLabel(keys[0])}
                      </button>
                      <button className={'keybtn alt' + (onAlt ? ' wait' : '')} title="ตั้งปุ่มเสริม (ปุ่มสำรอง)" onClick={() => { setNote(''); setWait(onAlt ? null : [p, act, 1]); }}>
                        {onAlt ? 'กดปุ่ม…' : (keys[1] ? keyLabel(keys[1]) : '+เสริม')}
                      </button>
                      {keys[1] && <button className="keybtn clr" title="ลบปุ่มเสริม" onClick={() => rmAlt(p, act)}>×</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {note && <p className="hint" style={{ opacity: 1, color: 'var(--blue)' }}>{note}</p>}
      <p className="hint">💡 หมายเหตุเบราว์เซอร์: หากต่อ 2 คีย์บอร์ดบนเครื่องเดียว ให้ตั้งปุ่ม P1 กับ P2 เป็นคนละปุ่มกัน (ใช้ชุด "คีย์บอร์ดเสริม" ด้านบนได้เลย) หรือต่อจอยเกมเพิ่ม</p>
      <div className="row">
        {prof !== '1v1' && <button className="btn ghost" onClick={copyFrom1v1}>คัดลอกปุ่มจาก 1v1</button>}
        <button className="btn ghost" onClick={reset}>คืนค่าเริ่มต้น</button>
        <button className="btn" onClick={onBack}>กลับ</button>
      </div>
    </div>
  );
}
