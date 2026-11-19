import { useEffect, useRef, useState } from 'react';
import Arena from './components/Arena.jsx';
import Select from './components/Select.jsx';
import Settings from './components/Settings.jsx';
import OnlineLobby from './components/OnlineLobby.jsx';
import { MenuBgCanvas, OpeningIntro } from './components/MenuScene.jsx';
import { loadControls, keyLabel } from './game/keys.js';
import { CHARACTERS } from './game/constants.js';
import { sfx, unlockAudio } from './game/audio.js';
import { NetClient } from './game/net.js';

const L = (c, k) => keyLabel(c[k][0]);
const lines = (c) => [
  `${L(c, 'left')} / ${L(c, 'right')} เดิน · ${L(c, 'jump')} กระโดด/ปีน · ${L(c, 'block')} ป้องกัน/Parry`,
  `${L(c, 'punch')} ต่อย · ${L(c, 'kick')} เตะ`,
  `${L(c, 's1')} / ${L(c, 's2')} / ${L(c, 's3')} สกิล 1-3 · ${L(c, 'dom')} Domain`,
];
const Lines = ({ c }) => lines(c).map((t, i) => <span key={i}>{t}<br /></span>);

const start = (id) => ({ ch: CHARACTERS[id], id });
const fighterName = (cfg, i) => CHARACTERS[cfg.chars[i]]?.name || `PLAYER ${i + 1}`;

export default function App() {
  const [screen, setScreen] = useState(() => (new URLSearchParams(location.search).get('room') ? 'lobby' : 'intro'));
  const [menuRevealed, setMenuRevealed] = useState(false);
  const [cfg, setCfg] = useState(() => {
    const [a, b] = [start('gojo'), start('sukuna')];
    return {
      mode: '1v1', p2Ai: false,
      chars: [a.id, b.id], colors: [a.ch.color, b.ch.color], skins: ['default', 'default'],
      allies: ['yuji', 'mahito'],
      loadouts: [[...a.ch.skills], [...b.ch.skills]], domains: [a.ch.domain, b.ch.domain], arena: 1, target: 2,
    };
  });
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);

  /* สถานะโหมดออนไลน์ */
  const netRef = useRef(null);
  const [netState, setNetState] = useState(null); // { role, code, peerConnected, peerReady, myReady, pingMs }
  const [netErr, setNetErr] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const ensureNet = () => {
    if (!netRef.current) netRef.current = new NetClient();
    return netRef.current;
  };

  const leaveOnline = (msg = '') => {
    netRef.current?.close();
    setNetState(null);
    setNetErr(msg);
    setConnecting(false);
    setScreen(msg ? 'lobby' : 'menu');
  };

  useEffect(() => {
    const net = ensureNet();
    const unsub = net.onMessage((msg) => {
      if (msg.type === 'created') {
        setConnecting(false);
        setNetState({ role: 'host', mode: msg.mode || net.mode, code: msg.code, peerConnected: false, peerReady: false, myReady: true, pingMs: net.pingMs });
        setScreen('select');
      } else if (msg.type === 'joined') {
        setConnecting(false);
        if (msg.cfg) setCfg(msg.cfg);
        setNetState({ role: 'guest', mode: msg.mode || net.mode, code: msg.code, peerConnected: true, peerReady: true, myReady: false, pingMs: net.pingMs });
        setScreen('select');
      } else if (msg.type === 'peer-joined') {
        setNetState((s) => (s ? { ...s, peerConnected: true, peerReady: false } : s));
        setCfg((cur) => { net.send({ type: 'cfg-sync', cfg: cur }); return cur; });
      } else if (msg.type === 'peer-left') {
        leaveOnline(msg.reason || 'คู่ต่อสู้หลุดการเชื่อมต่อ');
      } else if (msg.type === 'error') {
        setConnecting(false);
        setNetErr(msg.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } else if (msg.type === 'cfg-sync') {
        if (msg.cfg) setCfg(msg.cfg);
      } else if (msg.type === 'cfg-p2') {
        setCfg((c) => ({
          ...c,
          chars: [c.chars[0], msg.patch.char],
          colors: [c.colors[0], msg.patch.color],
          skins: [c.skins[0], msg.patch.skin],
          allies: [c.allies?.[0] || 'yuji', msg.patch.ally ?? (c.allies?.[1] || 'mahito')],
          loadouts: [c.loadouts[0], msg.patch.loadout],
          domains: [c.domains[0], msg.patch.domain],
        }));
      } else if (msg.type === 'ready') {
        setNetState((s) => (s ? { ...s, peerReady: !!msg.v } : s));
      } else if (msg.type === 'start-fight') {
        if (msg.cfg) setCfg(msg.cfg);
        setRound((r) => r + 1);
        setScreen('arena');
      } else if (msg.type === 'back-select') {
        setNetState((s) => (s ? { ...s, myReady: s.role === 'host', peerReady: false } : s));
        setScreen('select');
      } else if (msg.type === 'pong') {
        setNetState((s) => (s ? { ...s, pingMs: net.pingMs } : s));
      }
    });
    return () => { unsub(); net.close(); };
  }, []);

  /* ถ้าเปิดเว็บมาพร้อม ?room=XXXXX ให้เด้งไปหน้า Online Lobby ทันที */
  useEffect(() => {
    const r = new URLSearchParams(location.search).get('room');
    if (r) setScreen('lobby');
  }, []);

  const go = (s) => { unlockAudio(); sfx.click(); setNetErr(''); setScreen(s); };
  const fight = () => {
    if (netState) {
      if (netState.role !== 'host') return;
      netRef.current.send({ type: 'start-fight', cfg });
    }
    setRound((r) => r + 1);
    go('arena');
  };

  const updateCfgOnline = (updater) => {
    setCfg((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (netState?.role === 'host') {
        netRef.current.send({ type: 'cfg-sync', cfg: next });
      } else if (netState?.role === 'guest') {
        netRef.current.send({
          type: 'cfg-p2',
          patch: {
            char: next.chars[1], color: next.colors[1], skin: next.skins[1],
            ally: next.allies?.[1] || 'mahito',
            loadout: next.loadouts[1], domain: next.domains[1],
          },
        });
      }
      return next;
    });
  };

  const createRoom = async (mode = 'p2p') => {
    unlockAudio(); sfx.click(); setNetErr(''); setConnecting(true);
    try {
      const net = ensureNet();
      await net.create(mode, cfg);
    } catch (err) { setConnecting(false); setNetErr(err.message); }
  };

  const joinRoom = async (mode = 'p2p', code) => {
    unlockAudio(); sfx.click(); setNetErr(''); setConnecting(true);
    try {
      const net = ensureNet();
      await net.join(mode, code);
    } catch (err) { setConnecting(false); setNetErr(err.message); }
  };

  const toggleReady = () => {
    if (!netState || netState.role !== 'guest') return;
    const v = !netState.myReady;
    setNetState((s) => (s ? { ...s, myReady: v } : s));
    netRef.current.send({ type: 'ready', v });
    sfx.click();
  };

  const copyInvite = async () => {
    if (!netState) return;
    const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|26\.)/.test(location.hostname);
    const base = isLocal && (netState.mode || 'p2p') === 'p2p'
      ? 'https://poom24-afk.github.io/stickman-battle-arena/'
      : `${location.origin}${location.pathname}`;
    const url = `${base}?room=${netState.code}&mode=${netState.mode || 'p2p'}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  if (screen === 'arena') {
    return (
      <Arena
        key={round}
        cfg={cfg}
        online={netState ? { role: netState.role, code: netState.code, pingMs: netState.pingMs, net: netRef.current, onPeerLeft: (r) => leaveOnline(r) } : null}
        onEnd={(r) => { setResult(r); setScreen('result'); }}
        onExit={() => (netState ? leaveOnline() : go('menu'))}
      />
    );
  }
  if (screen === 'settings') return <Settings onBack={() => go('menu')} />;
  if (screen === 'lobby') return <OnlineLobby onCreate={createRoom} onJoin={joinRoom} onBack={() => go('menu')} connecting={connecting} error={netErr} />;
  if (screen === 'select') {
    return (
      <Select
        cfg={cfg}
        setCfg={netState ? updateCfgOnline : setCfg}
        onBack={() => (netState ? leaveOnline() : go('menu'))}
        onStart={fight}
        online={netState ? { ...netState, error: netErr, copied, onToggleReady: toggleReady, onCopyLink: copyInvite } : null}
      />
    );
  }
  if (screen === 'result') {
    const w = result.winner, is2v2 = cfg.mode === '2v2', ch = CHARACTERS[cfg.chars[w]];
    const isGuest = netState?.role === 'guest';
    return (
      <div className="screen result" style={{ '--c': cfg.colors[w] || '#ffd24a' }}>
        <div className="ghost-kanji" aria-hidden="true">{ch ? ch.jp.slice(0, 2) : '勝'}</div>
        <h1 className="ko">K.O.</h1>
        <h2 className="winner">{is2v2 ? `TEAM ${w === 0 ? 'A' : 'B'} (${fighterName(cfg, w)}) ชนะ!` : `${fighterName(cfg, w)} ชนะ!`}</h2>
        <p className="score">{result.scores[0]} <i>-</i> {result.scores[1]}</p>
        <div className="row">
          {!isGuest && <button className="btn" onClick={fight}>สู้อีกรอบ</button>}
          {!isGuest && (
            <button className="btn ghost" onClick={() => {
              if (netState) {
                netRef.current.send({ type: 'back-select' });
                setNetState((s) => (s ? { ...s, peerReady: false } : s));
              }
              go('select');
            }}>เปลี่ยนนักสู้</button>
          )}
          <button className="btn ghost" onClick={() => (netState ? leaveOnline() : go('menu'))}>
            {netState ? 'ออกจากห้อง' : 'เมนูหลัก'}
          </button>
        </div>
        {isGuest && <p className="hint">รอหัวหน้าห้องกดสู้อีกรอบ หรือกลับไปหน้าเลือกนักสู้…</p>}
      </div>
    );
  }
  const [c1, c2] = loadControls();
  const inIntro = screen === 'intro';
  return (
    <div className={'screen menu' + (menuRevealed ? ' revealed' : '')}>
      <MenuBgCanvas />
      <div className="ghost-kanji" aria-hidden="true">呪</div>
      <svg className="sigil" viewBox="0 0 400 400" aria-hidden="true">
        <g fill="none" stroke="currentColor">
          <circle cx="200" cy="200" r="190" strokeWidth="3" />
          <circle cx="200" cy="200" r="170" strokeWidth="1.5" strokeDasharray="4 10" />
          <circle cx="200" cy="200" r="120" strokeWidth="2" />
          <path d="M200 10V390M10 200H390M65 65L335 335M335 65L65 335" strokeWidth="1" />
          <rect x="95" y="95" width="210" height="210" strokeWidth="2" transform="rotate(45 200 200)" />
        </g>
      </svg>
      <button className="intro-replay" onClick={() => { unlockAudio(); sfx.click(); setMenuRevealed(false); setScreen('intro'); }}>▶ ดู Intro</button>
      <header className="lockup">
        <p className="jp-sub">呪力闘技場</p>
        <h1 className="logo"><span className="l1">STICKMAN</span><span className="l2">BATTLE</span></h1>
        <p className="tag">LOCAL & ONLINE ARENA · สู้กันได้ทั้งเครื่องเดียวและออนไลน์</p>
      </header>
      <div className="row menu-actions">
        <button className="btn big" onClick={() => go('select')}>เล่น 2 คน (เครื่องเดียว)</button>
        <button className="btn big" style={{ background: 'var(--violet)' }} onClick={() => go('lobby')}>เล่นออนไลน์</button>
        <button className="btn big ghost" onClick={() => go('settings')}>ตั้งปุ่ม</button>
      </div>
      <div className="controls menu-controls">
        <div><h4>PLAYER 1</h4><p><Lines c={c1} /></p></div>
        <div><h4>PLAYER 2</h4><p><Lines c={c2} />(เล่นออนไลน์ใช้ปุ่ม P1 ได้เลย)</p></div>
      </div>
      <p className="hint menu-hint">
        กดป้องกันตรงจังหวะ = Parry · ใกล้ตกขอบแมพ กดกระโดด/ต่อยรัวๆ (QTE) เพื่อดึงตัวขึ้น ·
        เปิด Domain เสร็จอาณาเขตจะค้างต่อ 4 วิ พร้อมความสามารถพิเศษและสู้กันต่อข้างในได้! · Esc / P = หยุดเกม
      </p>
      {inIntro && <OpeningIntro onReveal={() => setMenuRevealed(true)} onDone={() => { setMenuRevealed(false); setScreen('menu'); }} />}
    </div>
  );
}
