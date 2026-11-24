import { useEffect, useMemo, useState } from 'react';
import { loadControls, keyLabel } from '../game/keys.js';

const TABS = [
  ['basic', '1. ปุ่มบังคับ & พื้นฐาน'],
  ['combat', '2. สกิล · QTE · โดเมน · ปิดฉาก'],
  ['multi', '3. ออนไลน์ & คีย์บอร์ดเสริม'],
];

const ACTION_TH = {
  left: 'เดินซ้าย',
  right: 'เดินขวา',
  jump: 'กระโดด / ปีน',
  block: 'ป้องกัน / Parry',
  punch: 'ต่อย (คอมโบ 3 ฮิต)',
  kick: 'เตะ (ซัดล้ม Ragdoll)',
  s1: 'สกิล 1',
  s2: 'สกิล 2',
  s3: 'สกิล 3',
  dom: 'กาง Domain / กดจังหวะ',
  fin: 'ท่าปิดฉาก (1%)',
};

export default function Tutorial({ onBack, onPractice, onSettings }) {
  const [tab, setTab] = useState('basic');
  const [pressed, setPressed] = useState('');
  const [c1, c2] = useMemo(() => loadControls('1v1'), []);
  const fmt = (ctl, k) => (ctl[k] || []).map(keyLabel).filter(Boolean).join(' / ');

  useEffect(() => {
    const down = (e) => {
      if (e.code === 'Escape') return;
      const hits = [];
      for (const k of Object.keys(ACTION_TH)) {
        if (c1[k]?.includes(e.code)) hits.push(`P1: ${ACTION_TH[k]}`);
        if (c2[k]?.includes(e.code)) hits.push(`P2: ${ACTION_TH[k]}`);
      }
      setPressed(`${keyLabel(e.code)} (${hits.length ? hits.join(' · ') : 'ยังไม่ผูกกับท่าใด'})`);
    };
    addEventListener('keydown', down);
    return () => removeEventListener('keydown', down);
  }, [c1, c2]);

  return (
    <div className="screen tutorial">
      <div className="ghost-kanji" aria-hidden="true">教</div>
      <h2 className="title sm">📖 คู่มือสอนเล่น</h2>
      <p className="hint">
        เรียนรู้การบังคับ คอมโบ การป้องกัน/Parry การปีนแท่น การกางอาณาเขต และท่าปิดฉาก 1% แบบเข้าใจง่าย
      </p>

      <div className="chips">
        {TABS.map(([id, label]) => (
          <button key={id} className={'chip' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <div className="tut-grid">
          <section className="panel cut" style={{ '--c': 'var(--blue)' }}>
            <h3>🎮 ปุ่มบังคับปัจจุบัน (P1 / P2)</h3>
            <div className="tut-keys">
              {Object.entries(ACTION_TH).map(([k, label]) => (
                <div className="tut-krow" key={k}>
                  <span>{label}</span>
                  <span className="tut-binds">
                    <b style={{ color: 'var(--blue)' }}>{fmt(c1, k)}</b>
                    <i>|</i>
                    <b style={{ color: 'var(--red)' }}>{fmt(c2, k)}</b>
                  </span>
                </div>
              ))}
            </div>
            <div className="tut-tester">
              🧪 ทดสอบกดปุ่มบนคีย์บอร์ด: <b>{pressed || 'ลองกดปุ่มใดก็ได้บนคีย์บอร์ดเลย!'}</b>
            </div>
          </section>

          <section className="panel cut" style={{ '--c': 'var(--gold)' }}>
            <h3>🏃 การเคลื่อนที่ การปีน & การป้องกัน</h3>
            <ul className="tut-list">
              <li><b>เดิน / กระโดด:</b> กดซ้าย-ขวา และกระโดดขึ้นแท่นชั้นลอยได้ในด่านหลายชั้น</li>
              <li><b>ปีนเชือก / บันได / โซ่:</b> เดินเข้าไปตรงเส้นเชือก/บันได แล้วกด <b>กระโดดค้าง</b> เพื่อไต่ขึ้น และกด <b>ป้องกันค้าง</b> เพื่อไต่ลง (ลงสุดจะไม่ร่วงทะลุพื้น)</li>
              <li><b>ลงจากแท่นลอย:</b> กด <b>ป้องกัน 2 ครั้งเร็วๆ</b> หรือกด <b>ป้องกัน + กระโดด</b> เพื่อทิ้งตัวลงด้านล่าง</li>
              <li><b>ป้องกัน & Parry (สะท้อนสตัน):</b> กดป้องกันค้างลดดาเมจเหลือ 20% แต่ถ้ากด <b>ป้องกันตรงจังหวะก่อนโดนตี (0.22 วิ)</b> จะติด <b>PARRY!</b> ศัตรูสตันนาน 1.35 วิ</li>
              <li><b>คว้าขอบสนาม (Ledge QTE):</b> ถ้ากำลังจะตกเหวตรงขอบเวที ตัวละครจะเกาะขอบอัตโนมัติ — ให้กด <b>กระโดด หรือ ต่อย รัวๆ</b> เพื่อปีนกลับขึ้นมา!</li>
            </ul>
          </section>
        </div>
      )}

      {tab === 'combat' && (
        <div className="tut-grid">
          <section className="panel cut" style={{ '--c': 'var(--red)' }}>
            <h3>💥 คอมโบ · สกิลเฉพาะตัว · QTE</h3>
            <ul className="tut-list">
              <li><b>คอมโบพื้นฐาน:</b> กด <b>ต่อย 3 ครั้งติด</b> หรือปิดด้วย <b>เตะ</b> จะซัดศัตรูกระเด็นล้มเป็น Ragdoll</li>
              <li><b>สกิล 1 / 2 / 3:</b> ทุกตัวละครมีเอกลักษณ์ต่างกัน เช่น <b>Nobara</b> ปักตะปูสะสมแล้วระเบิด, <b>Maki</b> ฟันทะลุบล็อกด้วย Soul Split, <b>Todo</b> วาร์ปอ้อมหลัง, <b>Nanami</b> ทุบพื้น 7:3</li>
              <li><b>QTE ทอง (กดซ้ำให้แรงขึ้น):</b> ท่าใหญ่บางท่าจะมีวงแหวน QTE สีทองหดตัว — กด <b>ต่อย / เตะ / สกิล</b> ตอนวงแหวนเข้าเป้า จะคูณดาเมจ ×1.25–1.3!</li>
              <li><b>ท่าคัตซีน:</b> สกิลระดับสูงสุดบางท่าเมื่อโดนตรงๆ (ไม่ได้บล็อก) จะตัดเข้าคัตซีนโจมตีต่อเนื่องสุดอลังการ</li>
            </ul>
          </section>

          <section className="panel cut" style={{ '--c': 'var(--violet)' }}>
            <h3>🌌 กางอาณาเขต (Domain) & ☠ ปิดฉาก 1%</h3>
            <ul className="tut-list">
              <li><b>สะสม Cursed Energy (CE 100%):</b> ตีโดนหรือโดนตีเกจ CE จะเพิ่ม (ตัวละครอย่าง Gojo / Yuta เกรดขึ้นไวกว่าปกติ, Toji ไม่มี CE)</li>
              <li><b>Domain Clash (ปะทะโดเมน):</b> ถ้าศัตรูกางโดเมนแล้วเรามี CE 100% กดปุ่ม Domain สู้กัน — <b>กดรัวปุ่ม Domain</b> ใครกดเยอะกว่าชนะครับ!</li>
              <li><b>จังหวะโดเมน (Rhythm + ไม้ตาย):</b> ขณะโดเมนเปิด ให้กดปุ่ม <b>Domain</b> ตอนวงกลมวิ่งตรงเป้าเพื่อเก็บ <b>PERFECT</b> และกด <b>ต่อย</b> ใช้ท่าไม้ตายประจำโดเมนได้ 2 ครั้ง (หลังจบจะค้างเป็นสนามบัฟอีก ~4 วิ)</li>
              <li><b>☠ ท่าปิดฉากเฉพาะตัว (Finisher):</b> เมื่อลดเลือดศัตรูเหลือ <b>1%</b> ศัตรูจะติดมึน <b>DIZZY 3.2 วิ</b> — สายประชิด (Yuji, Maki, Toji, Nanami, Mahito, Todo, Hakari, Higuruma) ต้องเข้าประชิดตัว ส่วนสายระยะไกล (Gojo, Sukuna, Yuta, Jogo, Choso, Nobara, Toge, Megumi, Dagon, Geto) สามารถกด <b>ปิดฉากจากระยะไกล (580px)</b> ได้ทันที!</li>
            </ul>
          </section>
        </div>
      )}

      {tab === 'multi' && (
        <div className="tut-grid">
          <section className="panel cut" style={{ '--c': 'var(--violet)' }}>
            <h3>🌐 วิธีเล่นออนไลน์กับเพื่อน</h3>
            <ul className="tut-list">
              <li><b>สร้างห้อง (Host):</b> เข้า <b>เล่นออนไลน์ → เลือก P2P + Auto Relay (แนะนำ) หรือ Cloud Relay → สร้างห้อง</b> จะได้รหัส 5 ตัว (เช่น <code>JJK7A</code>) พร้อมปุ่มคัดลอกลิงก์เชิญ</li>
              <li><b>เข้าห้อง (Guest):</b> เพื่อนเปิดลิงก์หรือนำรหัส 5 ตัวมาใส่หน้าเข้าห้องแล้วกด <b>พร้อมสู้!</b></li>
              <li><b>รองรับทั้ง 1v1 และ 2v2:</b> ในหน้าเลือกตัวละครสามารถสลับโหมด 1v1 / 2v2 ปรับทีม A/B หรือให้บอทเติมช่องว่างได้</li>
              <li><b>ปุ่มเล่นออนไลน์:</b> ทั้ง Host และ Guest ใช้ <b>ปุ่มฝั่ง Player 1</b> ของเครื่องตัวเองเล่นได้เลย</li>
            </ul>
          </section>

          <section className="panel cut" style={{ '--c': 'var(--gold)' }}>
            <h3>⌨ ต่อคีย์บอร์ดเสริมหลายอัน / จอยเกม</h3>
            <ul className="tut-list">
              <li><b>ต่อคีย์บอร์ด USB/Bluetooth 2 ตัวขึ้นไปในคอมเครื่องเดียว:</b> เข้า <b>ตั้งปุ่ม</b> แล้วเลือก <b>Preset “คีย์บอร์ดเสริม (P1=WASD | P2=Numpad)”</b> หรือแบบแยกโซนซ้าย-ขวา</li>
              <li><b>Numpad แยกอิสระ:</b> คีย์บอร์ดเสริมที่กด Numpad จะไม่ชนกับปุ่มลูกศรหรือปุ่มตัวอักษรของเพื่อน (กดพร้อมกันได้เต็มที่)</li>
              <li><b>แยกปุ่มช่อง 1 / ช่อง 2:</b> ตั้งปุ่มสำรองให้ทุกท่า หรือเสียบ <b>จอยเกม (Controller)</b> ก็พร้อมบังคับอัตโนมัติ</li>
              <li><b>เล่นเป็นแอพบนคอม:</b> กดปุ่ม <b>⬇ โหลดเป็นแอพลงคอม</b> ในหน้าเมนูหลักเพื่อติดตั้งเป็นแอพแยกหน้าต่างเล่นลื่นๆ</li>
            </ul>
          </section>
        </div>
      )}

      <div className="row">
        <button className="btn ghost" onClick={onBack}>กลับเมนูหลัก</button>
        {onSettings && <button className="btn ghost" onClick={onSettings}>⚙ ตั้งปุ่มควบคุม</button>}
        <button className="btn big" style={{ background: 'var(--gold)', color: '#000' }} onClick={onPractice}>
          ⚔ เข้าสนามซ้อม (สู้บอทง่าย)
        </button>
      </div>
    </div>
  );
}
