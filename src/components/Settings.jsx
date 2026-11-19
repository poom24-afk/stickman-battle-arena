import { useEffect, useState } from 'react';
import { ACTIONS, RESERVED, loadControls, saveControls, resetControls, rebind, keyLabel } from '../game/keys.js';
import { COLORS } from '../game/constants.js';
import { sfx } from '../game/audio.js';

export default function Settings({ onBack }) {
  const [ctl, setCtl] = useState(loadControls);
  const [wait, setWait] = useState(null); // [ผู้เล่น, action] ที่กำลังรอรับปุ่ม
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!wait) return;
    const on = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      if (e.code === 'Escape') { setWait(null); setNote(''); return; }
      if (RESERVED.has(e.code)) { setNote(`ปุ่ม ${keyLabel(e.code)} ถูกใช้เป็น Pause ตั้งไม่ได้`); return; }
      const next = rebind(ctl, wait[0], wait[1], e.code);
      saveControls(next); setCtl(next); sfx.click(); setWait(null); setNote('');
    };
    addEventListener('keydown', on, true);
    return () => removeEventListener('keydown', on, true);
  }, [wait, ctl]);

  const reset = () => { setCtl(resetControls()); setWait(null); setNote('คืนค่าเริ่มต้นแล้ว'); sfx.click(); };

  return (
    <div className="screen select">
      <h2 className="title sm">ตั้งปุ่ม</h2>
      <p className="hint">คลิกที่ปุ่มที่ต้องการเปลี่ยน แล้วกดคีย์ใหม่ · Esc = ยกเลิก · ถ้าคีย์ซ้ำกับปุ่มอื่น ระบบจะสลับให้อัตโนมัติ · ค่าถูกบันทึกในเบราว์เซอร์</p>
      <div className="players">
        {[0, 1].map((p) => (
          <div className="panel" key={p} style={{ '--c': COLORS[p] }}>
            <h3>PLAYER {p + 1}</h3>
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
      <p className="hint">💡 Parry: กด "ป้องกัน" ก่อนโดนตี = ปัดป้อง + ศัตรูติดสตั้น · เกาะขอบ (QTE): ถ้ากำลังจะตกขอบ ตัวละครจะคว้าขอบพื้น กดปุ่มกระโดด/ต่อย/เตะ รัวๆ ให้ทันเพื่อดึงตัวขึ้นมา!</p>
      <div className="row">
        <button className="btn ghost" onClick={reset}>คืนค่าเริ่มต้น</button>
        <button className="btn" onClick={onBack}>กลับ</button>
      </div>
    </div>
  );
}
