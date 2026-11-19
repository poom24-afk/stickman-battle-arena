import { useEffect, useRef } from 'react';
import { FONT } from '../game/constants.js';
import { sfx, unlockAudio } from '../game/audio.js';

/* วาด Stickman แบบมีชีวิตชีวาสำหรับหน้า Intro และหน้า Menu */
function drawPoseStick(c, x, y, face, col, t, style) {
  const bob = Math.sin(t * 3.4 + (face > 0 ? 0 : 1.5)) * 3;
  const hip = { x, y: y - 58 + bob };
  const neck = { x: x + face * 10, y: hip.y - 40 };
  const head = { x: neck.x + face * 4, y: neck.y - 18 };
  const kF = { x: x + face * 18, y: y - 30 + bob * 0.4 };
  const fF = { x: x + face * 24, y };
  const kB = { x: x - face * 14, y: y - 30 + bob * 0.4 };
  const fB = { x: x - face * 20, y };
  const lift = style === 'gojo' ? Math.sin(t * 2.1) * 8 : Math.cos(t * 2.5) * 6;
  const hF = { x: neck.x + face * 36, y: neck.y - 4 + lift };
  const eF = { x: (neck.x + hF.x) / 2 - face * 4, y: (neck.y + hF.y) / 2 + 10 };
  const hB = { x: neck.x - face * 18, y: neck.y + 18 - lift * 0.5 };
  const eB = { x: (neck.x + hB.x) / 2 - face * 4, y: (neck.y + hB.y) / 2 + 6 };

  c.save();
  c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  c.shadowColor = col; c.shadowBlur = 22;
  const line = (a, b, w = 8, al = 1) => {
    c.globalAlpha = al; c.lineWidth = w;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  };
  line(hip, kB, 8, 0.55); line(kB, fB, 8, 0.55); line(neck, eB, 7, 0.55); line(eB, hB, 7, 0.55);
  line(neck, hip, 9, 0.92);
  c.globalAlpha = 0.95; c.lineWidth = 8; c.fillStyle = '#07040e';
  c.beginPath(); c.arc(head.x, head.y, 16, 0, 7); c.fill(); c.stroke();
  if (style === 'gojo') {
    c.fillStyle = '#05030a'; c.fillRect(head.x - 14, head.y - 7, 28, 7);
    /* ลูกพลัง Blue + Red ลอยโคจรรอบมือ */
    for (let i = 0; i < 2; i++) {
      const an = t * 2.6 + i * Math.PI, ox = hF.x + Math.cos(an) * 26, oy = hF.y + Math.sin(an) * 14;
      const oc = i ? '#ff2d55' : '#3dd6ff';
      const g = c.createRadialGradient(ox, oy, 1, ox, oy, 22);
      g.addColorStop(0, '#fff'); g.addColorStop(0.35, oc); g.addColorStop(1, oc + '00');
      c.fillStyle = g; c.beginPath(); c.arc(ox, oy, 22, 0, 7); c.fill();
    }
  } else {
    c.fillStyle = col; c.beginPath(); c.arc(head.x + face * 6, head.y - 2, 2.8, 0, 7); c.fill();
    c.strokeStyle = '#000'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(neck.x - 6, neck.y + 12); c.lineTo(neck.x + 6, neck.y + 12); c.moveTo(neck.x - 6, neck.y + 22); c.lineTo(neck.x + 6, neck.y + 22); c.stroke();
    c.strokeStyle = col;
  }
  line(hip, kF, 8, 0.95); line(kF, fF, 8, 0.95); line(neck, eF, 7.5, 0.95); line(eF, hF, 7.5, 0.95);
  c.restore();
}

/* ฉาก Canvas เคลื่อนไหวเบื้องหลังหน้า Menu หลัก */
export function MenuBgCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const c = cv.getContext('2d');
    let raf = 0;
    const sparks = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(), s: 1.5 + Math.random() * 3, v: 0.04 + Math.random() * 0.1,
      col: ['#3dd6ff', '#ff2d55', '#8b5cf6', '#ffd24a'][Math.floor(Math.random() * 4)],
    }));
    const slashes = Array.from({ length: 5 }, (_, i) => ({ phase: i * 1.4 }));

    const draw = (now) => {
      const t = now / 1000;
      const w = (cv.width = cv.clientWidth || window.innerWidth);
      const h = (cv.height = cv.clientHeight || window.innerHeight);
      c.clearRect(0, 0, w, h);

      /* พื้นพลังสาป & เส้นออร่าแนวพื้น */
      const floorY = h * 0.84;
      const fg = c.createLinearGradient(0, floorY - 30, 0, h);
      fg.addColorStop(0, 'rgba(139, 92, 246, 0)'); fg.addColorStop(0.3, 'rgba(61, 214, 255, 0.12)'); fg.addColorStop(1, 'rgba(7, 4, 14, 0.9)');
      c.fillStyle = fg; c.fillRect(0, floorY - 30, w, h - floorY + 30);
      c.strokeStyle = 'rgba(255, 255, 255, 0.14)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(w * 0.06, floorY); c.lineTo(w * 0.94, floorY); c.stroke();

      /* เศษพลังสาปลอยขึ้น */
      sparks.forEach((p, idx) => {
        const y = (((p.y - t * p.v) % 1) + 1) % 1;
        const x = p.x * w + Math.sin(t * 1.3 + idx) * 18;
        c.globalAlpha = 0.55; c.fillStyle = p.col;
        c.fillRect(x, y * h, p.s, p.s * 2.2);
      });
      c.globalAlpha = 1;

      /* รอยฟัน & คลื่นปะทะกลางจอเป็นจังหวะ */
      const clashCycle = t % 3.6;
      if (clashCycle < 0.7) {
        const k = clashCycle / 0.7;
        c.save(); c.globalAlpha = (1 - k) * 0.5; c.strokeStyle = '#ffd24a'; c.lineWidth = 4 * (1 - k) + 1;
        c.beginPath(); c.ellipse(w / 2, floorY - 90, 60 + k * 240, 26 + k * 100, 0, 0, 7); c.stroke(); c.restore();
      }
      slashes.forEach((sl, i) => {
        const k = (t * 0.7 + sl.phase) % 2.4;
        if (k < 0.35) {
          const al = 1 - k / 0.35, sx = w * (0.76 + (i % 2 ? 0.06 : -0.05)), sy = floorY - 70 - (i * 22) % 70;
          c.save(); c.translate(sx, sy); c.rotate(-0.5 + i * 0.35); c.globalAlpha = al * 0.55;
          c.fillStyle = '#ff2d55'; c.fillRect(-70, -1.5, 140, 3); c.restore();
        }
      });

      /* นักสู้ซ้าย-ขวา (ซ่อนอัตโนมัติบนจอมือถือแคบๆ เพื่อไม่บังปุ่ม) */
      if (w >= 760) {
        const sc = clampScale(w, h);
        c.save(); c.translate(w * 0.14, floorY); c.scale(sc, sc);
        drawPoseStick(c, 0, 0, 1, '#3dd6ff', t, 'gojo');
        c.restore();

        c.save(); c.translate(w * 0.86, floorY); c.scale(sc, sc);
        drawPoseStick(c, 0, 0, -1, '#ff2d55', t, 'sukuna');
        c.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    const clampScale = (w, h) => Math.max(0.95, Math.min(1.45, Math.min(w / 1100, h / 650)));
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="menu-canvas" aria-hidden="true" />;
}

/* หน้าตอนเปิดเข้าเกม (Cinematic Opening Splash) */
export function OpeningIntro({ onDone }) {
  const ref = useRef(null);
  const doneRef = useRef(false);

  const finish = (withSound) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (withSound) { unlockAudio(); sfx.fight(); }
    onDone();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (['Enter', 'Space', 'Escape'].includes(e.code)) { e.preventDefault(); finish(true); }
    };
    addEventListener('keydown', onKey);
    const autoTimer = setTimeout(() => finish(false), 3600);

    const cv = ref.current;
    const c = cv?.getContext('2d');
    let raf = 0;
    const start = performance.now();
    const motes = Array.from({ length: 64 }, (_, i) => ({
      an: (i / 64) * Math.PI * 2, r: 220 + (i % 7) * 55, sp: 1.4 + (i % 5) * 0.35,
      col: i % 2 ? '#3dd6ff' : '#ff2d55', sz: 2 + (i % 3),
    }));

    const frame = (now) => {
      if (!cv || !c) return;
      const t = (now - start) / 1000;
      const w = (cv.width = cv.clientWidth || window.innerWidth);
      const h = (cv.height = cv.clientHeight || window.innerHeight);
      const cx = w / 2, cy = h / 2;

      c.fillStyle = '#05020b'; c.fillRect(0, 0, w, h);

      /* วงเวท Domain & พลังสาปรวมศูนย์ */
      c.save(); c.translate(cx, cy);
      const rot = t * 0.7;
      c.rotate(rot);
      c.globalAlpha = Math.min(0.42, t * 0.5);
      c.strokeStyle = '#8b5cf6'; c.lineWidth = 2;
      const R = Math.min(w, h) * 0.34;
      c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke();
      c.beginPath(); c.arc(0, 0, R * 0.76, 0, 7); c.stroke();
      c.strokeRect(-R * 0.65, -R * 0.65, R * 1.3, R * 1.3);
      c.rotate(Math.PI / 4);
      c.strokeRect(-R * 0.65, -R * 0.65, R * 1.3, R * 1.3);
      c.restore();

      /* อนุภาคหมุนเข้าและระเบิดออกตอน 0.85 วิ */
      motes.forEach((m) => {
        const prog = t < 0.85 ? 1 - t / 0.85 : (t - 0.85) * 1.6;
        const rad = Math.max(8, m.r * prog + (t >= 0.85 ? 40 : 0));
        const a = m.an + t * m.sp;
        c.globalAlpha = t < 0.85 ? 0.85 : Math.max(0, 0.9 - (t - 0.85) * 0.4);
        c.fillStyle = m.col;
        c.fillRect(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, m.sz, m.sz);
      });
      c.globalAlpha = 1;

      /* รอยฟันผ่ากลางหน้าจอช่วง 0.75 - 1.35 วิ */
      if (t >= 0.72 && t <= 1.45) {
        const k = (t - 0.72) / 0.73;
        c.save();
        c.globalAlpha = 1 - k;
        c.strokeStyle = '#fff'; c.shadowColor = '#3dd6ff'; c.shadowBlur = 32; c.lineWidth = (1 - k) * 18 + 2;
        c.beginPath(); c.moveTo(0, cy + h * 0.14); c.lineTo(w, cy - h * 0.14); c.stroke();
        c.strokeStyle = '#ff2d55'; c.lineWidth = (1 - k) * 9 + 1;
        c.beginPath(); c.moveTo(0, cy - h * 0.10); c.lineTo(w, cy + h * 0.10); c.stroke();
        c.restore();
      }

      /* ระเบิดแสงวาบตอน 0.85 วิ */
      if (t >= 0.82 && t <= 1.25) {
        const fk = 1 - (t - 0.82) / 0.43;
        c.fillStyle = `rgba(255, 255, 255, ${fk * 0.45})`;
        c.fillRect(0, 0, w, h);
      }

      /* ข้อความกลางจอหลังจากปะทะ */
      if (t >= 0.92) {
        const p = Math.min(1, (t - 0.92) / 0.35);
        const sc = 1 + (1 - p) * 0.6;
        c.save(); c.translate(cx, cy - 10); c.scale(sc, sc);
        c.globalAlpha = p; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `${Math.min(28, w * 0.04)}px ${FONT}`;
        c.fillStyle = '#3dd6ff'; c.shadowColor = '#3dd6ff'; c.shadowBlur = 18;
        c.fillText('呪 力 闘 技 場', 0, -86);
        c.shadowBlur = 0; c.lineJoin = 'round'; c.lineWidth = 10; c.strokeStyle = '#000';
        const big = Math.min(92, w * 0.11);
        c.font = `${big}px ${FONT}`;
        c.strokeText('STICKMAN', 0, -24); c.fillStyle = '#f3efe6'; c.fillText('STICKMAN', 0, -24);
        c.shadowColor = '#ff2d55'; c.shadowBlur = 24;
        c.strokeText('BATTLE', 0, big * 0.72); c.fillStyle = '#ffffff'; c.fillText('BATTLE', 0, big * 0.72);
        c.restore();
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(autoTimer);
      removeEventListener('keydown', onKey);
    };
  }, []); // eslint-disable-line

  return (
    <div className="intro-screen" onClick={() => finish(true)} role="button" tabIndex={0} aria-label="เข้าสู่หน้าหลักเกม">
      <canvas ref={ref} className="intro-canvas" />
      <p className="intro-skip">คลิกหรือกด Enter / Space เพื่อเข้าสู่เกม</p>
    </div>
  );
}
