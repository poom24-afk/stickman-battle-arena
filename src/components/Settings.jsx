import { useEffect, useState } from 'react';
import { ACTIONS, RESERVED, loadControls, saveControls, resetControls, rebind, keyLabel } from '../game/keys.js';
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
  const [wait, setWait] = useState(null); // [ผู้เล่น, action] ที่กำลังรอรับปุ่ม
  const [note, setNote] = useState('');

  const ctl = ctls[prof];
  const isOnlineProf = prof === '2v2_online';

  useEffect(() => {
    if (!wait) return;
    const on = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      if (e.code === 'Escape') { setWait(null); setNote(''); return; }
      if (RESERVED.has(e.code)) { setNote(`ปุ่ม ${keyLabel(e.code)} ถูกใช้เป็น Pause ตั้งไม่ได้`); return; }
      const next = rebind(ctl, wait[0], wait[1], e.code, isOnlineProf);
      saveControls(next, prof);
      setCtls((s) => ({ ...s, [prof]: next }));
      sfx.click(); setWait(null); setNote('');
    };
    addEventListener('keydown', on, true);
    return () => removeEventListener('keydown', on, true);
  }, [wait, ctl, prof, isOnlineProf]);

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

  const slots = isOnlineProf ? [0] : prof === '2v2_offline' ? [0, 1, 2, 3] : [0, 1];
  const profInfo = PROFILES.find(([id]) => id === prof) || PROFILES[0];

  return (
    <div className="screen select">
      <h2 className="title sm">ตั้งปุ่มแยกตามโหมด</h2>
      <div className="chips" role="tablist" aria-label="เลือกโหมดตั้งปุ่ม">
        {PROFILES.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={prof === id}
            className={'chip' + (prof === id ? ' on' : '')}
            onClick={() => { sfx.click(); setWait(null); setNote(''); setProf(id); }}>
            {label}
          </button>
        ))}
      </div>
      <p className="hint">{profInfo[2]} · คลิกปุ่มเพื่อเปลี่ยน · Esc = ยกเลิก · ค่าถูกบันทึกแยกอัตโนมัติ</p>
      <div className="players">
        {slots.map((p) => (
          <div className="panel" key={p} style={{ '--c': COLORS[p] }}>
            <h3>{isOnlineProf ? 'ปุ่มของเรา (2v2 ONLINE)' : `PLAYER ${p + 1}`}</h3>
            <div className="keyrows">
              {ACTIONS.map(([act, label]) => {
                const on = wait && wait[0] === p && wait[1] === act;
                return (
                  <div className="keyrow" key={act}>
                    <span>{label}</span>
                    <button className={'keybtn' + (on ? ' wait' : '')} onClick={() => { setNote(''); setWait(on ? null : [p, act]); }}>
                      {on ? 'กดปุ่มใหม่…' : keyLabel(ctl[p][act][0])}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {note && <p className="hint" style={{ opacity: 1, color: 'var(--blue)' }}>{note}</p>}
      <p className="hint">💡 Parry: กด "ป้องกัน" ก่อนโดนตี = ปัดป้อง + ศัตรูติดสตั้น · เกาะขอบ (QTE): ถ้ากำลังจะตกขอบ กดปุ่มกระโดด/ต่อย/เตะ รัวๆ ให้ทันเพื่อดึงตัวขึ้นมา!</p>
      <div className="row">
        {prof !== '1v1' && <button className="btn ghost" onClick={copyFrom1v1}>คัดลอกปุ่มจาก 1v1</button>}
        <button className="btn ghost" onClick={reset}>คืนค่าเริ่มต้น</button>
        <button className="btn" onClick={onBack}>กลับ</button>
      </div>
    </div>
  );
}
