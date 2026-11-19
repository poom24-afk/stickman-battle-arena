import { useState } from 'react';
import { COLORS, SKILLS, SKILL_IDS, DOMAINS, DOMAIN_IDS, ARENAS, CHARACTERS, CHAR_IDS, SKINS } from '../game/constants.js';
import { controlProfileOf } from '../game/keys.js';

const RANGED = new Set(['proj', 'beam', 'blue', 'dogs', 'strike', 'slashes', 'cutblast']);
const CLOSE = new Set(['melee', 'cutmelee']);
const isCut = (s) => SKILLS[s].kind === 'cutmelee' || SKILLS[s].kind === 'cutblast';
const groupOf = (s) => (CLOSE.has(SKILLS[s].kind) ? 'close' : RANGED.has(SKILLS[s].kind) ? 'ranged' : 'support');
const FILTERS = [['all', 'ทั้งหมด'], ['close', 'ประชิด'], ['ranged', 'ระยะไกล'], ['support', 'ซัพพอร์ต'], ['cut', 'คัตซีน']];
const TABS = [['char', 'นักสู้'], ['skill', 'สกิล'], ['dom', 'โดเมน']];

const Stick = ({ color, gear }) => (
  <svg viewBox="0 0 60 90" width="58" height="84" aria-hidden="true" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
    {gear === 'halo' && <circle cx="30" cy="14" r="16" fill="none" stroke="#ffd24a" strokeWidth="2" strokeDasharray="4 3" />}
    {gear === 'wheel' && <circle cx="30" cy="4" r="7" fill="none" stroke="#ffd24a" strokeWidth="2.5" />}
    {gear === 'shadowcape' && <path d="M28 25L12 58L22 60L30 34Z" fill="#1b0f2e" stroke={color} strokeWidth="1.5" />}
    {gear === 'whitecoat' && <path d="M22 25L14 62L42 62L36 25Z" fill="#f3efe6" opacity="0.85" />}
    {gear === 'robe' && <path d="M24 25L18 62L40 62L34 25Z" fill="#2c1646" stroke="#ffd24a" strokeWidth="1.5" />}
    <g stroke={color} strokeWidth="5" strokeLinecap="round" fill="none">
      <circle cx="30" cy="14" r="10" /><path d="M30 24V55M30 32L12 50M30 32L50 38M30 55L18 82M30 55L44 80" />
    </g>
    {gear === 'blindfold' && <rect x="19" y="10" width="22" height="5" rx="2" fill="#07040e" />}
    {gear === 'sunglasses' && <rect x="21" y="11" width="18" height="4" rx="1" fill="#000" stroke="#3dd6ff" strokeWidth="0.8" />}
    {gear === 'eyepatch' && <path d="M21 11L32 15M27 11H35V16H27Z" stroke="#000" fill="#111" strokeWidth="1.4" />}
    {(gear === 'tattoos' || gear === 'heian') && <path d="M24 10L26 14M36 10L34 14M26 30H34M26 38H34" stroke="#000" strokeWidth="2" />}
    {gear === 'heian' && <><circle cx="26" cy="12" r="1.5" fill="#ff1744" /><circle cx="34" cy="12" r="1.5" fill="#ff1744" /><circle cx="26" cy="16" r="1.3" fill="#ff1744" /><circle cx="34" cy="16" r="1.3" fill="#ff1744" /></>}
    {gear === 'hoodie' && <path d="M23 23L37 23L33 29H27Z" fill="#ff2d55" />}
    {gear === 'bfwrap' && <><circle cx="12" cy="50" r="3.5" fill="#ff1744" /><circle cx="50" cy="38" r="3.5" fill="#ff1744" /></>}
    {gear === 'claws' && <><path d="M12 50L5 56M50 38L57 40" stroke="#ff1744" strokeWidth="3.5" strokeLinecap="round" /></>}
    {gear === 'scarf' && <path d="M23 23H37M33 23L42 35" stroke="#e53935" strokeWidth="3" strokeLinecap="round" />}
    {gear === 'fur' && <ellipse cx="30" cy="25" rx="12" ry="4" fill="#ff80ab" />}
    {gear === 'tie' && <path d="M30 24V38" stroke="#ffd24a" strokeWidth="2.5" />}
    {gear === 'stitches' && <path d="M22 10H38M25 8V12M30 8V12M35 8V12" stroke="#111" strokeWidth="1.5" />}
    {gear === 'worm' && <path d="M22 25Q30 33 38 24" stroke="#c46bff" strokeWidth="4" fill="none" strokeLinecap="round" />}
  </svg>
);

function Panel({ i, cfg, setCfg, locked, badge }) {
  const [tab, setTab] = useState('char');
  const [filter, setFilter] = useState('all');
  const chId = cfg.chars[i], ch = CHARACTERS[chId] || null, color = cfg.colors[i], loadout = cfg.loadouts[i];
  const skins = (chId && SKINS[chId]) || [];
  const skinId = cfg.skins?.[i] || 'default';
  const curSkin = skins.find((s) => s.id === skinId) || skins[0] || null;
  const upd = (c, k, v) => (c[k] || ['default', 'default']).map((x, j) => (j === i ? v : x));

  const pick = (id) => {
    if (locked) return;
    setCfg((c) => {
      const n = id ? CHARACTERS[id] : null;
      const defSkin = id && SKINS[id]?.[0] ? SKINS[id][0] : null;
      const targetCol = defSkin?.color || n?.color;
      return {
        ...c, chars: upd(c, 'chars', id),
        skins: upd(c, 'skins', 'default'),
        loadouts: n ? upd(c, 'loadouts', [...n.skills]) : c.loadouts,
        domains: n ? upd(c, 'domains', n.domain) : c.domains,
        colors: targetCol && !c.colors.includes(targetCol) ? upd(c, 'colors', targetCol) : c.colors,
      };
    });
  };
  const pickSkin = (sk) => {
    if (locked) return;
    setCfg((c) => ({
      ...c,
      skins: upd(c, 'skins', sk.id),
      colors: sk.color && c.colors[1 - i] !== sk.color ? upd(c, 'colors', sk.color) : c.colors,
    }));
  };
  const toggle = (s) => {
    if (locked) return;
    setCfg((c) => {
      const cur = c.loadouts[i], next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s].slice(-3);
      return next.length ? { ...c, loadouts: upd(c, 'loadouts', next) } : c;
    });
  };
  const randomize = () => {
    if (locked) return;
    setCfg((c) => ({
      ...c,
      loadouts: upd(c, 'loadouts', [...SKILL_IDS].sort(() => Math.random() - 0.5).slice(0, 3)),
      domains: upd(c, 'domains', DOMAIN_IDS[Math.floor(Math.random() * DOMAIN_IDS.length)]),
    }));
  };
  const pool = SKILL_IDS.filter((s) => filter === 'all' || (filter === 'cut' ? isCut(s) : groupOf(s) === filter));

  return (
    <section className={'panel cut' + (locked ? ' locked' : '')} style={{ '--c': color }}>
      <div className="phead">
        <div className="ghost-kanji sm" aria-hidden="true">{ch ? ch.jp.slice(0, 2) : '棒'}</div>
        <Stick color={color} gear={curSkin?.gear} />
        <div className="who">
          <p className="pno">PLAYER {i + 1} {badge ? `· ${badge}` : ''} {curSkin ? `· ${curSkin.name}` : ''}</p>
          <h3>{ch ? ch.name : 'STICKMAN'}</h3>
          <p className="trait">{ch ? <><b>{ch.pasName}</b> {ch.pasDesc}</> : 'สติ๊กแมนธรรมดา ไม่มีพลังพิเศษประจำตัว'}</p>
        </div>
      </div>
      <div className="swatches">
        {COLORS.map((col) => (
          <button key={col} aria-label={`สี ${col}`} className={'sw' + (color === col ? ' on' : '')} style={{ background: col }}
            disabled={locked || cfg.colors[1 - i] === col} onClick={() => !locked && setCfg((c) => ({ ...c, colors: upd(c, 'colors', col) }))} />
        ))}
      </div>
      {skins.length > 0 && (
        <div className="skins" aria-label="สกินตัวละคร">
          {skins.map((sk) => (
            <button key={sk.id} className={'skin-btn' + (skinId === sk.id ? ' on' : '')} style={{ '--sk': sk.color }}
              title={sk.desc} onClick={() => pickSkin(sk)}>
              ✦ {sk.name}
            </button>
          ))}
        </div>
      )}
      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'char' && (
        <div className="chars">
          <button className={'char' + (!ch ? ' on' : '')} style={{ '--k': '#ffffff' }} onClick={() => pick(null)}><b>棒</b><span>STICKMAN</span></button>
          {CHAR_IDS.map((id) => (
            <button key={id} className={'char' + (cfg.chars[i] === id ? ' on' : '')} style={{ '--k': CHARACTERS[id].color }} onClick={() => pick(id)}>
              <b>{CHARACTERS[id].jp}</b><span>{CHARACTERS[id].name}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'skill' && (
        <>
          <div className="lblrow">
            <p className="lbl">เลือกสกิล 3 จาก {SKILL_IDS.length} ({loadout.length}/3)</p>
            {!locked && <button className="mini" onClick={randomize}>สุ่มสกิลและโดเมน</button>}
          </div>
          <ol className="slots">
            {loadout.map((s, k) => <li key={s} style={{ '--k': SKILLS[s].color }}><em>{k + 1}</em>{SKILLS[s].name}</li>)}
          </ol>
          <div className="chips sm">
            {FILTERS.map(([k, l]) => <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>)}
          </div>
          <div className="skills pool">
            {pool.map((s) => {
              const slot = loadout.indexOf(s);
              return (
                <button key={s} className={'skill' + (slot >= 0 ? ' on' : '')} style={{ '--k': SKILLS[s].color }} onClick={() => toggle(s)}>
                  {slot >= 0 && <em>{slot + 1}</em>}
                  <b>
                    {isCut(s) && <i className="cut-badge">คัตซีน</i>}
                    {SKILLS[s].kind === 'morph' && <i className="cut-badge">แปลงร่าง</i>}
                    {(SKILLS[s].qte || isCut(s)) && <i className="cut-badge">QTE</i>}
                    {SKILLS[s].name}
                  </b>
                  <span>{SKILLS[s].desc}</span><small>คูลดาวน์ {SKILLS[s].cd} วิ</small>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === 'dom' && (
        <>
          <p className="lbl">Domain Expansion ({DOMAIN_IDS.length} แบบ)</p>
          <p className="tip">เปิดเสร็จอาณาเขตจะค้างต่อ ~4 วิ พร้อมความสามารถพิเศษเฉพาะตัว และสู้กันต่อในโดเมนได้ทั้ง 2 ฝ่าย!</p>
          <div className="skills one pool">
            {DOMAIN_IDS.map((d) => (
              <button key={d} className={'skill' + (cfg.domains[i] === d ? ' on' : '')} style={{ '--k': DOMAINS[d].color }}
                onClick={() => !locked && setCfg((c) => ({ ...c, domains: upd(c, 'domains', d) }))}>
                <b>{DOMAINS[d].jp} <small>{DOMAINS[d].name}</small></b>
                <span>{DOMAINS[d].desc}</span>
                <span className="dom-linger">★ ความสามารถพิเศษ: {DOMAINS[d].lingerDesc}</span>
                <span className="art">Domain Art: {DOMAINS[d].art.name} — {DOMAINS[d].art.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {tab !== 'dom' && <p className="dline">โดเมน: <b>{DOMAINS[cfg.domains[i]].jp}</b> {DOMAINS[cfg.domains[i]].name}</p>}
      {cfg.mode === '2v2' && (
        <div className="ally-box">
          <span className="ally-lbl">คู่หู AI ประจำทีม {i === 0 ? 'A' : 'B'}:</span>
          <div className="ally-list">
            {CHAR_IDS.map((id) => (
              <button key={id} disabled={locked}
                className={'ally-chip' + ((cfg.allies?.[i] || 'yuji') === id ? ' on' : '')}
                style={{ '--k': CHARACTERS[id].color }}
                onClick={() => !locked && setCfg((c) => ({ ...c, allies: (c.allies || ['yuji', 'mahito']).map((x, j) => (j === i ? id : x)) }))}>
                {CHARACTERS[id].name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Select({ cfg, setCfg, onStart, onBack, onSettings, online }) {
  const ready = cfg.loadouts.every((l) => l.length === 3);
  const isGuest = online?.role === 'guest';
  const isHost = online?.role === 'host';
  const myIdx = isGuest ? 1 : 0;
  const is2v2 = cfg.mode === '2v2';
  const diffLabel = { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' }[cfg.aiDiff || 'medium'];

  return (
    <div className="screen select">
      <h2 className="title sm">{online ? 'ห้องสู้ต่อสู้ออนไลน์' : cfg.p2Ai ? `โหมดปะทะบอท (${diffLabel})` : 'เลือกนักสู้'}</h2>
      <div className="chips">
        {[['1v1', '⚔️ 1 vs 1 (สนามปกติ)'], ['2v2', '🔥 2 vs 2 (แมพใหญ่พิเศษ!)']].map(([m, lbl]) => (
          <button key={m} disabled={isGuest} className={'chip' + ((cfg.mode || '1v1') === m ? ' on' : '')}
            onClick={() => !isGuest && setCfg((c) => ({ ...c, mode: m }))}>
            {lbl}
          </button>
        ))}
        {!online && (
          <button className={'chip' + (cfg.p2Ai ? ' on' : '')} onClick={() => setCfg((c) => ({ ...c, p2Ai: !c.p2Ai }))}>
            {cfg.p2Ai ? (is2v2 ? '🤖 ฝั่งขวา: บอท 2 ตัว' : '🤖 คู่ต่อสู้: บอท (CPU)') : (is2v2 ? '👥 ฝั่งขวา: P2 + บอท' : '👥 คู่ต่อสู้: P2 (2 คน)')}
          </button>
        )}
      </div>
      {!online && (cfg.p2Ai || is2v2) && (
        <div className="chips" role="group" aria-label="ระดับความยากบอท">
          <span style={{ alignSelf: 'center', fontSize: 13, fontWeight: 700, opacity: 0.85 }}>ระดับบอท:</span>
          {[['easy', '🌱 ง่าย'], ['medium', '⚡ ปานกลาง'], ['hard', '💀 ยาก']].map(([d, lbl]) => (
            <button key={d} className={'chip' + ((cfg.aiDiff || 'medium') === d ? ' on' : '')}
              onClick={() => setCfg((c) => ({ ...c, aiDiff: d }))}>
              {lbl}
            </button>
          ))}
        </div>
      )}
      {online && (
        <div className="online-bar">
          <span>รหัสห้อง:</span>
          <span className="room-code">{online.code}</span>
          <button className="mini" onClick={online.onCopyLink}>{online.copied ? 'คัดลอกลิงก์แล้ว ✓' : 'คัดลอกลิงก์เชิญ'}</button>
          <span className={'pill ' + (online.peerConnected ? 'ok' : 'wait')}>
            {online.peerConnected ? (isHost ? (online.peerReady ? 'P2 พร้อมแล้ว ✓' : 'P2 กำลังเลือกตัว…') : 'เชื่อมต่อกับ Host แล้ว ✓') : 'กำลังรอเพื่อนเข้าห้อง…'}
          </span>
          {online.pingMs !== null && <span className="pill">Ping {online.pingMs}ms</span>}
        </div>
      )}
      {online?.error && <p className="hint" style={{ opacity: 1, color: '#ff5252', fontWeight: 700 }}>{online.error}</p>}
      <div className="players">
        <Panel i={0} cfg={cfg} setCfg={setCfg}
          locked={!!online && myIdx !== 0}
          badge={online ? (myIdx === 0 ? 'คุณ (HOST)' : 'คู่ต่อสู้ (HOST)') : ''} />
        <span className="vs" aria-hidden="true">VS</span>
        <Panel i={1} cfg={cfg} setCfg={setCfg}
          locked={!!online && myIdx !== 1}
          badge={online ? (myIdx === 1 ? 'คุณ (GUEST)' : 'คู่ต่อสู้ (GUEST)') : (cfg.p2Ai ? `บอท · ${diffLabel}` : '')} />
      </div>
      <h3 className="sub">สนามต่อสู้ {isGuest ? '(หัวหน้าห้องเป็นคนเลือก)' : ''}</h3>
      <div className="arenas">
        {ARENAS.map((a, i) => (
          <button key={a.id} disabled={isGuest} className={'arena-card' + (cfg.arena === i ? ' on' : '')} style={{ background: `linear-gradient(${a.top}, ${a.bot})`, '--c': a.edge }}
            onClick={() => !isGuest && setCfg((c) => ({ ...c, arena: i }))}>
            {a.name}{a.climbs ? ' ⛰' : ''}
          </button>
        ))}
      </div>
      <div className="chips">
        {[[2, 'ชนะ 2 ใน 3 ยก'], [3, 'ชนะ 3 ยกก่อน']].map(([v, l]) => (
          <button key={v} disabled={isGuest} className={'chip' + (cfg.target === v ? ' on' : '')} onClick={() => !isGuest && setCfg((c) => ({ ...c, target: v }))}>{l}</button>
        ))}
      </div>
      <div className="row">
        <button className="btn ghost" onClick={onBack}>{online ? 'ออกจากห้อง' : 'กลับ'}</button>
        {onSettings && (
          <button className="btn ghost" onClick={() => onSettings(controlProfileOf(cfg, !!online))}>
            ⚙ ตั้งปุ่ม ({is2v2 ? (online ? '2v2 Online' : '2v2 Offline') : '1v1'})
          </button>
        )}
        {!online && <button className="btn big" onClick={onStart} disabled={!ready}>สู้เลย!</button>}
        {isHost && (
          <button className="btn big" onClick={onStart} disabled={!ready || !online.peerConnected || !online.peerReady}>
            {!online.peerConnected ? 'รอเพื่อนเข้าห้อง…' : !online.peerReady ? 'รอเพื่อนกดพร้อม…' : 'สู้เลย!'}
          </button>
        )}
        {isGuest && (
          <button className={'btn big ' + (online.myReady ? 'ghost' : '')} onClick={online.onToggleReady} disabled={!ready}>
            {online.myReady ? 'ยกเลิกพร้อม (รอเริ่ม…)' : 'พร้อมสู้!'}
          </button>
        )}
      </div>
    </div>
  );
}
