import { useState } from 'react';

export default function OnlineLobby({ onCreate, onJoin, onBack, connecting, error }) {
  const params = new URLSearchParams(location.search);
  const [code, setCode] = useState(() => params.get('room')?.toUpperCase() || '');
  const [mode, setMode] = useState(() => (['ws', 'relay', 'p2p'].includes(params.get('mode')) ? params.get('mode') : 'p2p'));

  const submitJoin = (e) => {
    e.preventDefault();
    if (code.trim().length >= 4 && !connecting) onJoin(mode, code.trim().toUpperCase());
  };

  return (
    <div className="screen">
      <div className="ghost-kanji" aria-hidden="true">網</div>
      <h2 className="title sm">เล่นออนไลน์</h2>
      <p className="hint">
        เลือกโหมดเชื่อมต่อ: <b>P2P + Auto Relay (แนะนำ)</b> ลองเชื่อมต่อตรงก่อน และถ้าเน็ต/NAT บล็อกจะสลับผ่าน Cloud Relay อัตโนมัติ
        · หรือเลือก <b>Cloud Relay</b> ทันทีหากเล่นผ่าน 4G/หอพัก
      </p>
      <div className="chips">
        <button className={'chip' + (mode === 'p2p' ? ' on' : '')} onClick={() => setMode('p2p')}>
          🌐 P2P + Auto Relay (แนะนำ)
        </button>
        <button className={'chip' + (mode === 'relay' ? ' on' : '')} onClick={() => setMode('relay')}>
          ⚡ Cloud Relay (ทะลุทุกเน็ต 100%)
        </button>
        <button className={'chip' + (mode === 'ws' ? ' on' : '')} onClick={() => setMode('ws')}>
          🔌 Server Room (/ws · LAN)
        </button>
      </div>
      <div className="players">
        <section className="panel cut" style={{ '--c': 'var(--blue)' }}>
          <h3>สร้างห้องใหม่ (HOST)</h3>
          <p className="trait">คุณจะเป็น <b>PLAYER 1</b> รับรหัสห้อง 5 ตัวส่งให้เพื่อนเล่นข้ามเน็ตได้เลย</p>
          <div className="row" style={{ marginTop: 18, justifyContent: 'flex-start' }}>
            <button className="btn" disabled={connecting} onClick={() => onCreate(mode)}>
              {connecting ? 'กำลังสร้างห้อง…' : 'สร้างห้อง'}
            </button>
          </div>
        </section>

        <section className="panel cut" style={{ '--c': 'var(--red)' }}>
          <h3>เข้าห้องเพื่อน (GUEST)</h3>
          <p className="trait">เข้าห้อง 1v1 (2 คน) หรือ 2v2 (สูงสุด 4 คน P2–P4) ใช้ปุ่มฝั่งคุณจากเครื่องของคุณได้เลย</p>
          <form onSubmit={submitJoin} className="row" style={{ marginTop: 16, justifyContent: 'flex-start' }}>
            <input
              className="code-input"
              maxLength={6}
              placeholder="รหัสห้อง เช่น JJK7A"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button type="submit" className="btn ghost" disabled={connecting || code.trim().length < 4}>
              {connecting ? 'กำลังเข้า…' : 'เข้าห้อง'}
            </button>
          </form>
        </section>
      </div>
      {error && <p className="hint" style={{ opacity: 1, color: '#ff5252', fontWeight: 700 }}>{error}</p>}
      <div className="row">
        <button className="btn ghost" onClick={onBack}>กลับเมนูหลัก</button>
      </div>
    </div>
  );
}
