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

function Panel({ i, cfg, setCfg, locked, badge, canPickTeam, canToggleBot, isOnlinePeer }) {
  const [tab, setTab] = useState('char');
  const [filter, setFilter] = useState('all');
  const is2v2 = cfg.mode === '2v2';
  const chId = cfg.chars[i], ch = CHARACTERS[chId] || null, color = cfg.colors[i], loadout = cfg.loadouts[i];
  const team = is2v2 ? (cfg.teams?.[i] ?? (i % 2)) : (i % 2);
  const slotMode = is2v2 ? (cfg.slotModes?.[i] || (i >= 2 ? 'bot' : 'human')) : (i === 1 && cfg.p2Ai ? 'bot' : 'human');
  const skins = (chId && SKINS[chId]) || [];
  const skinId = cfg.skins?.[i] || 'default';
  const curSkin = skins.find((s) => s.id === skinId) || skins[0] || null;
  const upd = (c, k, v) => (c[k] || []).map((x, j) => (j === i ? v : x));

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
        colors: targetCol && (is2v2 || !c.colors.slice(0, 2).includes(targetCol)) ? upd(c, 'colors', targetCol) : c.colors,
      };
    });
  };
  const pickSkin = (sk) => {
    if (locked) return;
    setCfg((c) => ({
      ...c,
      skins: upd(c, 'skins', sk.id),
      colors: sk.color && (is2v2 || c.colors[1 - i] !== sk.color) ? upd(c, 'colors', sk.color) : c.colors,
    }));
  };
  const setTeam = (t) => {
    if (!canPickTeam) return;
    setCfg((c) => ({ ...c, teams: upd(c, 'teams', t) }));
  };
  const toggleBot = () => {
    if (!canToggleBot) return;
    setCfg((c) => {
      const cur = c.slotModes?.[i] || 'human';
      const nxt = cur === 'bot' ? 'human' : 'bot';
      return {
        ...c,
        slotModes: upd(c, 'slotModes', nxt),
        p2Ai: i === 1 ? nxt === 'bot' : c.p2Ai,
      };
    });
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
      {is2v2 && (
        <div className="slot-bar">
          <div className="slot-grp" role="group" aria-label={`เลือกฝั่ง P${i + 1}`}>
            <button className={'slot-btn team-a' + (team === 0 ? ' on' : '')} disabled={!canPickTeam} onClick={() => setTeam(0)}>🔵 ทีม A</button>
            <button className={'slot-btn team-b' + (team === 1 ? ' on' : '')} disabled={!canPickTeam} onClick={() => setTeam(1)}>🔴 ทีม B</button>
          </div>
          {i > 0 || canToggleBot ? (
            <button className={'slot-btn bot' + (slotMode === 'bot' ? ' on' : '')} disabled={!canToggleBot || isOnlinePeer}
              onClick={toggleBot} title={isOnlinePeer ? 'มีผู้เล่นออนไลน์ควบคุมช่องนี้อยู่' : 'สลับระหว่างคนเล่นและบอท'}>
              {isOnlinePeer ? '🌐 ผู้เล่นออนไลน์' : slotMode === 'bot' ? '🤖 บอท (AI)' : '👤 คนเล่น'}
            </button>
          ) : (
            <span className="slot-tag">👤 คนเล่น</span>
          )}
        </div>
      )}
      <div className="swatches">
        {COLORS.map((col) => (
          <button key={col} aria-label={`สี ${col}`} className={'sw' + (color === col ? ' on' : '')} style={{ background: col }}
            disabled={locked || (!is2v2 && cfg.colors[1 - i] === col)} onClick={() => !locked && setCfg((c) => ({ ...c, colors: upd(c, 'colors', col) }))} />
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
    </section>
  );
}

export default function Select({ cfg, setCfg, onStart, onBack, onSettings, online }) {
  const is2v2 = cfg.mode === '2v2';
  const slots = is2v2 ? [0, 1, 2, 3] : [0, 1];
  const readyLoadouts = slots.every((i) => cfg.loadouts[i]?.length === 3);
  const isGuest = online?.role === 'guest';
  const isHost = online?.role === 'host';
  const mySlot = online ? (online.mySlot ?? (isGuest ? 1 : 0)) : 0;
  const occ = online?.occupied || [true, false, false, false];
  const rdyMap = online?.ready || [true, false, false, false];
  const diffLabel = { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' }[cfg.aiDiff || 'medium'];

  const teams = slots.map((i) => (is2v2 ? (cfg.teams?.[i] ?? (i % 2)) : (i % 2)));
  const teamACount = teams.filter((t) => t === 0).length;
  const teamBCount = teams.filter((t) => t === 1).length;
  const teamsValid = teamACount >= 1 && teamBCount >= 1;
  const hasAnyBot = is2v2 ? slots.some((i) => (cfg.slotModes?.[i] || 'human') === 'bot') : cfg.p2Ai;

  const connectedGuests = slots.filter((i) => i > 0 && occ[i]);
  const allGuestsReady = connectedGuests.every((i) => rdyMap[i]);
  const waitingHumans = is2v2
    ? slots.filter((i) => i > 0 && !occ[i] && (cfg.slotModes?.[i] || 'human') === 'human')
    : (!occ[1] && !cfg.p2Ai ? [1] : []);
  const onlineCanStart = isHost && readyLoadouts && teamsValid && allGuestsReady && waitingHumans.length === 0;
  const ready = readyLoadouts && teamsValid;

  const toggleMode = (m) => {
    if (isGuest) return;
    setCfg((c) => {
      const next = { ...c, mode: m };
      if (m === '2v2') {
        next.slotModes = ['human', occ[1] ? 'human' : (c.p2Ai ? 'bot' : 'human'), occ[2] ? 'human' : 'bot', occ[3] ? 'human' : 'bot'];
        next.teams = c.teams || [0, 1, 0, 1];
      }
      return next;
    });
  };

  const slotBadge = (i) => {
    const sm = is2v2 ? (cfg.slotModes?.[i] || 'human') : (i === 1 && cfg.p2Ai ? 'bot' : 'human');
    if (online) {
      if (i === mySlot) return `คุณ (${isHost ? 'HOST' : 'GUEST'})`;
      if (occ[i]) return rdyMap[i] ? 'ออนไลน์ · พร้อม ✓' : 'ออนไลน์ · กำลังเลือก…';
      return sm === 'bot' ? `🤖 บอท · ${diffLabel}` : 'รอเพื่อนเข้าห้อง…';
    }
    return sm === 'bot' ? `🤖 บอท · ${diffLabel}` : '👤 คนเล่น';
  };

  return (
    <div className="screen select">
      <h2 className="title sm">{online ? 'ห้องสู้ต่อสู้ออนไลน์' : is2v2 ? 'โหมด 2v2 · จัดทีม P1–P4' : cfg.p2Ai ? `โหมดปะทะบอท (${diffLabel})` : 'เลือกนักสู้'}</h2>
      <div className="chips">
        {[['1v1', '⚔️ 1 vs 1 (สนามปกติ)'], ['2v2', '🔥 2 vs 2 (แมพใหญ่พิเศษ!)']].map(([m, lbl]) => (
          <button key={m} disabled={isGuest} className={'chip' + ((cfg.mode || '1v1') === m ? ' on' : '')}
            onClick={() => toggleMode(m)}>
            {lbl}
          </button>
        ))}
        {!online && !is2v2 && (
          <button className={'chip' + (cfg.p2Ai ? ' on' : '')} onClick={() => setCfg((c) => ({ ...c, p2Ai: !c.p2Ai, slotModes: (c.slotModes || ['human', 'human', 'bot', 'bot']).map((x, j) => (j === 1 ? (!c.p2Ai ? 'bot' : 'human') : x)) }))}>
            {cfg.p2Ai ? '🤖 คู่ต่อสู้: บอท (CPU)' : '👥 คู่ต่อสู้: P2 (2 คน)'}
          </button>
        )}
      </div>
      {(hasAnyBot || is2v2) && !isGuest && (
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
      {is2v2 && (
        <div className="team-summary">
          <div className="ts-side team-a">
            <b>🔵 ทีม A ({teamACount})</b>
            <span>{slots.filter((i) => teams[i] === 0).map((i) => `P${i + 1} ${CHARACTERS[cfg.chars[i]]?.name || 'STICK'}${(cfg.slotModes?.[i] || 'human') === 'bot' && !(online && occ[i]) ? '(BOT)' : ''}`).join(' · ') || 'ว่าง'}</span>
          </div>
          <div className="ts-vs">VS</div>
          <div className="ts-side team-b">
            <b>🔴 ทีม B ({teamBCount})</b>
            <span>{slots.filter((i) => teams[i] === 1).map((i) => `P${i + 1} ${CHARACTERS[cfg.chars[i]]?.name || 'STICK'}${(cfg.slotModes?.[i] || 'human') === 'bot' && !(online && occ[i]) ? '(BOT)' : ''}`).join(' · ') || 'ว่าง'}</span>
          </div>
        </div>
      )}
      {!teamsValid && <p className="hint" style={{ opacity: 1, color: '#ff5252', fontWeight: 700 }}>⚠ ทั้งทีม A และทีม B ต้องมีผู้เล่น/บอทอย่างน้อยฝั่งละ 1 ตัว!</p>}
      {online && (
        <div className="online-bar">
          <span>รหัสห้อง:</span>
          <span className="room-code">{online.code}</span>
          <button className="mini" onClick={online.onCopyLink}>{online.copied ? 'คัดลอกลิงก์แล้ว ✓' : 'คัดลอกลิงก์เชิญ'}</button>
          {slots.filter((i) => i > 0 && (is2v2 || i === 1)).map((i) => (
            <span key={i} className={'pill ' + (occ[i] ? (rdyMap[i] ? 'ok' : 'wait') : '')}>
              P{i + 1}: {occ[i] ? (rdyMap[i] ? 'พร้อม ✓' : 'กำลังเลือก…') : ((cfg.slotModes?.[i] === 'bot') ? '🤖 บอท' : 'รอเพื่อน…')}
            </span>
          ))}
          {online.pingMs !== null && <span className="pill">Ping {online.pingMs}ms</span>}
        </div>
      )}
      {online?.error && <p className="hint" style={{ opacity: 1, color: '#ff5252', fontWeight: 700 }}>{online.error}</p>}
      <div className={'players' + (is2v2 ? ' four' : '')}>
        {slots.map((i) => {
          const isOnlinePeer = !!online && i > 0 && !!occ[i];
          const isLocked = online ? (isHost ? (i > 0 && occ[i]) : i !== mySlot) : false;
          const canPickTeam = is2v2 && (online ? (isHost || i === mySlot) : true);
          const canToggleBot = is2v2 && (online ? (isHost && i > 0 && !occ[i]) : true);
          return (
            <Panel
              key={i}
              i={i}
              cfg={cfg}
              setCfg={setCfg}
              locked={isLocked}
              canPickTeam={canPickTeam}
              canToggleBot={canToggleBot}
              isOnlinePeer={isOnlinePeer}
              badge={slotBadge(i)}
            />
          );
        })}
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
          <button className="btn big" onClick={onStart} disabled={!onlineCanStart}>
            {waitingHumans.length > 0 ? `รอ P${waitingHumans[0] + 1} เข้าห้อง (หรือตั้งเป็นบอท)` : !allGuestsReady ? 'รอเพื่อนกดพร้อม…' : !teamsValid ? 'ต้องมีอย่างน้อยฝั่งละ 1 คน' : 'สู้เลย!'}
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
