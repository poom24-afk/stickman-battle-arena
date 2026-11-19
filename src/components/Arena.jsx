import { useEffect, useMemo, useRef, useState } from 'react';
import { Game } from '../game/game.js';
import { loadControls, controlProfileOf } from '../game/keys.js';

const BTN = [['◀', 'left'], ['▶', 'right'], ['▲', 'jump'], ['🛡', 'block'], ['👊', 'punch'], ['🦶', 'kick'], ['①', 's1'], ['②', 's2'], ['③', 's3'], ['領', 'dom']];

export default function Arena({ cfg, onEnd, onExit, online }) {
  const ref = useRef(null), game = useRef(null);
  const [paused, setPaused] = useState(false);
  const profile = controlProfileOf(cfg, !!online);
  const ctl = useMemo(() => loadControls(profile), [profile]);
  useEffect(() => {
    const g = new Game(ref.current, cfg, {
      onEnd,
      onPause: setPaused,
      net: online?.net || null,
      mySlot: online?.mySlot ?? 0,
      occupied: online?.occupied || null,
      onPeerLeft: online?.onPeerLeft,
    });
    game.current = g; g.start();
    return () => g.destroy();
  }, []); // eslint-disable-line
  const key = (code, v) => game.current && game.current.setKey(code, v);
  const pads = online ? [0] : cfg.mode === '2v2' ? [0, 1] : [0, 1];
  const padCol = (p) => cfg.colors[online ? (online.mySlot ?? (online.role === 'guest' ? 1 : 0)) : p];
  return (
    <div className="arena">
      <div className="stage">
        <canvas ref={ref} />
        <button className="pause-btn" onClick={() => game.current.setPaused(true)}>❚❚</button>
        {online && (
          <div className="arena-net">
            ONLINE · P{(online.mySlot ?? 0) + 1} ({online.role === 'host' ? 'HOST' : 'GUEST'}) · ROOM {online.code}
            {online.pingMs !== null ? ` · ${online.pingMs}ms` : ''}
          </div>
        )}
        {paused && (
          <div className="overlay">
            <h2 className="title sm">PAUSED</h2>
            <button className="btn" onClick={() => game.current.setPaused(false)}>RESUME</button>
            <button className="btn ghost" onClick={onExit}>{online ? 'LEAVE ROOM' : 'QUIT TO MENU'}</button>
          </div>
        )}
      </div>
      <div className="touch">
        {pads.map((p) => (
          <div className="pad" key={p} style={{ '--c': padCol(p) }}>
            {BTN.map(([label, name]) => {
              const code = ctl[p][name][0];
              return (
                <button key={name} className="tb"
                  onPointerDown={(e) => { e.preventDefault(); key(code, true); }}
                  onPointerUp={() => key(code, false)} onPointerLeave={() => key(code, false)} onPointerCancel={() => key(code, false)}
                  onContextMenu={(e) => e.preventDefault()}>{label}</button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
