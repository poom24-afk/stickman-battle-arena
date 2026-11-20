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
  `${L(c, 's1')} / ${L(c, 's2')} / ${L(c, 's3')} สกิล 1-3 · ${L(c, 'dom')} Domain · ${L(c, 'fin')} ปิดฉาก`,
];
const Lines = ({ c }) => lines(c).map((t, i) => <span key={i}>{t}<br /></span>);

const start = (id) => ({ ch: CHARACTERS[id], id });
const fighterName = (cfg, i) => CHARACTERS[cfg.chars[i]]?.name || `PLAYER ${i + 1}`;
const curModeIs1v1 = (c) => (c?.mode || '1v1') !== '2v2';
const defaultCfg = () => {
  const [a, b, c, d] = [start('gojo'), start('sukuna'), start('yuji'), start('mahito')];
  return {
    mode: '1v1', p2Ai: false, aiDiff: 'medium',
    teams: [0, 1, 0, 1],
    slotModes: ['human', 'human', 'bot', 'bot'],
    occupied: [true, false, false, false],
    chars: [a.id, b.id, c.id, d.id],
    colors: [a.ch.color, b.ch.color, c.ch.color, d.ch.color],
    skins: ['default', 'default', 'default', 'default'],
    loadouts: [[...a.ch.skills], [...b.ch.skills], [...c.ch.skills], [...d.ch.skills]],
    domains: [a.ch.domain, b.ch.domain, c.ch.domain, d.ch.domain],
    arena: 1, target: 2,
  };
};
const normCfg = (raw) => {
  const base = defaultCfg();
  if (!raw) return base;
  const pad4 = (arr, def) => Array.from({ length: 4 }, (_, i) => (arr && arr[i] !== undefined ? arr[i] : def[i]));
  return {
    ...base, ...raw,
    teams: pad4(raw.teams, base.teams),
    slotModes: pad4(raw.slotModes, base.slotModes),
    occupied: pad4(raw.occupied, base.occupied),
    chars: pad4(raw.chars, base.chars),
    colors: pad4(raw.colors, base.colors),
    skins: pad4(raw.skins, base.skins),
    loadouts: pad4(raw.loadouts, base.loadouts),
    domains: pad4(raw.domains, base.domains),
  };
};

export default function App() {
  const [screen, setScreen] = useState(() => (new URLSearchParams(location.search).get('room') ? 'lobby' : 'intro'));
  const screenRef = useRef(screen); screenRef.current = screen;
  const [menuRevealed, setMenuRevealed] = useState(false);
  const [cfg, setCfg] = useState(defaultCfg);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const [settingsProf, setSettingsProf] = useState(null);

  /* สถานะโหมดออนไลน์ (รองรับสูงสุด 4 คนสำหรับ 2v2!) */
  const netRef = useRef(null);
  const [netState, setNetState] = useState(null); // { role, mySlot, code, occupied, ready, myReady, pingMs }
  const cfgRef = useRef(cfg); cfgRef.current = cfg;
  const netStateRef = useRef(netState); netStateRef.current = netState;
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
        const occ = [true, false, false, false], rdy = [true, false, false, false];
        setCfg((cur) => { const n = normCfg({ ...cur, occupied: occ }); net.setHostCfg(n); return n; });
        setNetState({ role: 'host', mySlot: 0, mode: msg.mode || net.mode, code: msg.code, occupied: occ, ready: rdy, myReady: true, pingMs: net.pingMs });
        setScreen('select');
      } else if (msg.type === 'joined') {
        setConnecting(false);
        const mySlot = msg.slot ?? 1, occ = msg.occupied || [true, true, false, false];
        if (msg.cfg) setCfg(normCfg({ ...msg.cfg, occupied: occ }));
        setNetState({ role: 'guest', mySlot, mode: msg.mode || net.mode, code: msg.code, occupied: occ, ready: [true, false, false, false], myReady: false, pingMs: net.pingMs });
        setScreen('select');
      } else if (msg.type === 'peer-joined') {
        const slot = msg.slot ?? 1;
        const occ = msg.occupied || [true, true, false, false];
        const curNs = netStateRef.current;
        const nextReady = [...(curNs?.ready || [true, false, false, false])];
        nextReady[slot] = false;
        setNetState((s) => (s ? { ...s, occupied: occ, ready: nextReady } : s));
        const curCfg = cfgRef.current;
        const sm = [...curCfg.slotModes]; sm[slot] = 'human';
        const nextCfg = normCfg({ ...curCfg, slotModes: sm, occupied: occ, p2Ai: slot === 1 ? false : curCfg.p2Ai });
        setCfg(nextCfg);
        net.setHostCfg(nextCfg);
        net.send({ type: 'cfg-sync', cfg: nextCfg, occupied: occ, ready: nextReady });
      } else if (msg.type === 'peer-left') {
        const leftSlot = msg.slot ?? 0;
        if (leftSlot === 0 || net.role === 'guest') {
          leaveOnline(msg.reason || 'หัวหน้าห้องออกจากห้องแล้ว');
          return;
        }
        const occ = msg.occupied || net.getOccupied();
        if (screenRef.current === 'arena' && curModeIs1v1(net.hostCfg)) {
          leaveOnline(msg.reason || 'คู่ต่อสู้หลุดการเชื่อมต่อ');
          return;
        }
        const curNs = netStateRef.current;
        const nextReady = [...(curNs?.ready || [true, false, false, false])];
        nextReady[leftSlot] = false;
        setNetState((s) => (s ? { ...s, occupied: occ, ready: nextReady } : s));
        const curCfg = cfgRef.current;
        const sm = [...curCfg.slotModes]; sm[leftSlot] = leftSlot >= 2 ? 'bot' : 'human';
        const nextCfg = normCfg({ ...curCfg, slotModes: sm, occupied: occ });
        setCfg(nextCfg);
        net.setHostCfg(nextCfg);
        net.send({ type: 'cfg-sync', cfg: nextCfg, occupied: occ, ready: nextReady });
      } else if (msg.type === 'error') {
        setConnecting(false);
        setNetErr(msg.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } else if (msg.type === 'cfg-sync') {
        if (msg.cfg) setCfg(normCfg({ ...msg.cfg, occupied: msg.occupied || msg.cfg.occupied }));
        if (msg.occupied || msg.ready) {
          setNetState((s) => (s ? { ...s, occupied: msg.occupied || s.occupied, ready: msg.ready || s.ready } : s));
        }
      } else if (msg.type === 'room-meta') {
        setNetState((s) => (s ? { ...s, occupied: msg.occupied || s.occupied, ready: msg.ready || s.ready } : s));
      } else if (msg.type === 'cfg-slot' || msg.type === 'cfg-p2') {
        const slot = msg.type === 'cfg-p2' ? 1 : (msg.slot ?? 1);
        const p = msg.patch || {};
        const curCfg = cfgRef.current;
        const repl = (arr, v) => arr.map((x, idx) => (idx === slot && v !== undefined ? v : x));
        const nextCfg = normCfg({
          ...curCfg,
          chars: repl(curCfg.chars, p.char),
          colors: repl(curCfg.colors, p.color),
          skins: repl(curCfg.skins, p.skin),
          loadouts: repl(curCfg.loadouts, p.loadout),
          domains: repl(curCfg.domains, p.domain),
          teams: repl(curCfg.teams, p.team),
        });
        setCfg(nextCfg);
        net.setHostCfg(nextCfg);
        net.send({ type: 'cfg-sync', cfg: nextCfg, occupied: nextCfg.occupied });
      } else if (msg.type === 'ready') {
        const slot = msg.slot ?? 1;
        const curNs = netStateRef.current;
        const rdy = [...(curNs?.ready || [true, false, false, false])];
        rdy[slot] = !!msg.v;
        setNetState((s) => (s ? { ...s, ready: rdy } : s));
        if (curNs?.role === 'host') net.send({ type: 'room-meta', occupied: curNs.occupied, ready: rdy });
      } else if (msg.type === 'start-fight') {
        if (msg.cfg) setCfg(normCfg(msg.cfg));
        setRound((r) => r + 1);
        setScreen('arena');
      } else if (msg.type === 'back-select') {
        setNetState((s) => (s ? { ...s, myReady: s.role === 'host', ready: [true, false, false, false] } : s));
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
    const next = normCfg(typeof updater === 'function' ? updater(cfgRef.current) : updater);
    cfgRef.current = next;
    setCfg(next);
    const curNs = netStateRef.current;
    if (curNs?.role === 'host') {
      netRef.current.setHostCfg(next);
      netRef.current.send({ type: 'cfg-sync', cfg: next, occupied: curNs.occupied, ready: curNs.ready });
    } else if (curNs?.role === 'guest') {
      const s = curNs.mySlot ?? 1;
      netRef.current.send({
        type: 'cfg-slot',
        slot: s,
        patch: {
          char: next.chars[s], color: next.colors[s], skin: next.skins[s],
          loadout: next.loadouts[s], domain: next.domains[s], team: next.teams[s],
        },
      });
    }
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
    netRef.current.send({ type: 'ready', slot: netState.mySlot ?? 1, v });
    sfx.click();
  };

  const copyInvite = async () => {
    if (!netState) return;
    const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|26\.)/.test(location.hostname);
    const base = isLocal && (netState.mode || 'p2p') !== 'ws'
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
        online={netState ? { role: netState.role, mySlot: netState.mySlot ?? 0, occupied: netState.occupied, code: netState.code, pingMs: netState.pingMs, net: netRef.current, onPeerLeft: (r) => leaveOnline(r) } : null}
        onEnd={(r) => { setResult(r); setScreen('result'); }}
        onExit={() => (netState ? leaveOnline() : go('menu'))}
      />
    );
  }
  if (settingsProf) return <Settings initialProfile={settingsProf} onBack={() => { unlockAudio(); sfx.click(); setSettingsProf(null); }} />;
  if (screen === 'settings') return <Settings onBack={() => go('menu')} />;
  if (screen === 'lobby') return <OnlineLobby onCreate={createRoom} onJoin={joinRoom} onBack={() => go('menu')} connecting={connecting} error={netErr} />;
  if (screen === 'select') {
    return (
      <Select
        cfg={cfg}
        setCfg={netState ? updateCfgOnline : setCfg}
        onBack={() => (netState ? leaveOnline() : go('menu'))}
        onSettings={(prof) => { unlockAudio(); sfx.click(); setSettingsProf(prof || '1v1'); }}
        onStart={fight}
        online={netState ? { ...netState, error: netErr, copied, onToggleReady: toggleReady, onCopyLink: copyInvite } : null}
      />
    );
  }
  if (screen === 'result') {
    const w = result.winner, is2v2 = cfg.mode === '2v2', ch = CHARACTERS[cfg.chars[w]];
    const isGuest = netState?.role === 'guest';
    const winNames = is2v2 ? [0, 1, 2, 3].filter((idx) => (cfg.teams?.[idx] ?? (idx % 2)) === w).map((idx) => fighterName(cfg, idx)).join(' & ') : fighterName(cfg, w);
    const firstWinIdx = is2v2 ? Math.max(0, (cfg.teams || [0, 1, 0, 1]).indexOf(w)) : w;
    return (
      <div className="screen result" style={{ '--c': cfg.colors[firstWinIdx] || '#ffd24a' }}>
        <div className="ghost-kanji" aria-hidden="true">{CHARACTERS[cfg.chars[firstWinIdx]]?.jp.slice(0, 2) || ch?.jp.slice(0, 2) || '勝'}</div>
        <h1 className="ko">K.O.</h1>
        <h2 className="winner">{is2v2 ? `TEAM ${w === 0 ? 'A' : 'B'} (${winNames}) ชนะ!` : `${fighterName(cfg, w)} ชนะ!`}</h2>
        <p className="score">{result.scores[0]} <i>-</i> {result.scores[1]}</p>
        <div className="row">
          {!isGuest && <button className="btn" onClick={fight}>สู้อีกรอบ</button>}
          {!isGuest && (
            <button className="btn ghost" onClick={() => {
              if (netState) {
                netRef.current.send({ type: 'back-select' });
                setNetState((s) => (s ? { ...s, ready: [true, false, false, false] } : s));
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
        <button className="btn big" onClick={() => { setCfg((c) => ({ ...c, p2Ai: false })); go('select'); }}>เล่น 2 คน (เครื่องเดียว)</button>
        <button className="btn big" style={{ background: 'var(--gold)', color: '#000' }} onClick={() => { setCfg((c) => ({ ...c, p2Ai: true })); go('select'); }}>🤖 เล่นกับบอท</button>
        <button className="btn big" style={{ background: 'var(--violet)' }} onClick={() => go('lobby')}>เล่นออนไลน์</button>
        <button className="btn big ghost" onClick={() => { unlockAudio(); sfx.click(); setSettingsProf('1v1'); }}>ตั้งปุ่ม</button>
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
