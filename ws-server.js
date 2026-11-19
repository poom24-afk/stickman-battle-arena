import { WebSocketServer } from 'ws';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode(rooms) {
  let code = '';
  do {
    code = Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function safeSend(ws, obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function getOccupied(room) {
  return [true, room.guests.has(1), room.guests.has(2), room.guests.has(3)];
}

export function attachWsServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const rooms = new Map();

  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname !== '/ws') return;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws) => {
    ws.role = null;
    ws.slot = null;
    ws.roomCode = null;

    const leaveRoom = () => {
      const code = ws.roomCode;
      if (!code || !rooms.has(code)) return;
      const room = rooms.get(code);
      if (ws.role === 'host') {
        room.guests.forEach((g) => {
          safeSend(g, { type: 'peer-left', slot: 0, reason: 'หัวหน้าห้องออกจากห้องแล้ว' });
          g.roomCode = null; g.role = null; g.slot = null;
        });
        rooms.delete(code);
      } else if (ws.role === 'guest' && room.guests.get(ws.slot) === ws) {
        room.guests.delete(ws.slot);
        safeSend(room.host, { type: 'peer-left', slot: ws.slot, occupied: getOccupied(room), reason: `ผู้เล่น P${ws.slot + 1} ออกจากห้องแล้ว` });
      }
      ws.roomCode = null;
      ws.role = null;
      ws.slot = null;
    };

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(String(raw)); } catch { return; }
      if (!msg || typeof msg.type !== 'string') return;

      if (msg.type === 'ping') {
        safeSend(ws, { type: 'pong', t: msg.t });
        return;
      }

      if (msg.type === 'create') {
        leaveRoom();
        const code = makeCode(rooms);
        rooms.set(code, { host: ws, guests: new Map(), cfg: msg.cfg || null });
        ws.role = 'host';
        ws.slot = 0;
        ws.roomCode = code;
        safeSend(ws, { type: 'created', code, slot: 0 });
        return;
      }

      if (msg.type === 'join') {
        leaveRoom();
        const code = String(msg.code || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          safeSend(ws, { type: 'error', message: `ไม่พบห้อง "${code}"` });
          return;
        }
        const candidates = room.cfg?.mode === '2v2' ? [1, 2, 3] : [1];
        const freeSlot = candidates.find((s) => !room.guests.has(s));
        if (!freeSlot) {
          const cap = candidates.length + 1;
          safeSend(ws, { type: 'error', message: `ห้องนี้เต็มแล้ว (${cap}/${cap})` });
          return;
        }
        room.guests.set(freeSlot, ws);
        ws.role = 'guest';
        ws.slot = freeSlot;
        ws.roomCode = code;
        const occ = getOccupied(room);
        safeSend(ws, { type: 'joined', code, slot: freeSlot, cfg: room.cfg, occupied: occ });
        safeSend(room.host, { type: 'peer-joined', slot: freeSlot, occupied: occ });
        return;
      }

      if (msg.type === 'leave') {
        leaveRoom();
        return;
      }

      const room = ws.roomCode && rooms.get(ws.roomCode);
      if (!room) return;
      if (msg.type === 'cfg-sync' && ws.role === 'host') room.cfg = msg.cfg;
      if (ws.role === 'host') {
        room.guests.forEach((g) => safeSend(g, msg));
      } else {
        safeSend(room.host, { ...msg, slot: ws.slot });
      }
    });

    ws.on('close', leaveRoom);
    ws.on('error', leaveRoom);
  });

  return wss;
}
