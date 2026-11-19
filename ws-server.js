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
    ws.roomCode = null;

    const leaveRoom = () => {
      const code = ws.roomCode;
      if (!code || !rooms.has(code)) return;
      const room = rooms.get(code);
      if (ws.role === 'host') {
        safeSend(room.guest, { type: 'peer-left', reason: 'หัวหน้าห้องออกจากห้องแล้ว' });
        if (room.guest) { room.guest.roomCode = null; room.guest.role = null; }
        rooms.delete(code);
      } else if (ws.role === 'guest' && room.guest === ws) {
        room.guest = null;
        safeSend(room.host, { type: 'peer-left', reason: 'ผู้เล่น 2 ออกจากห้องแล้ว' });
      }
      ws.roomCode = null;
      ws.role = null;
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
        rooms.set(code, { host: ws, guest: null, cfg: msg.cfg || null });
        ws.role = 'host';
        ws.roomCode = code;
        safeSend(ws, { type: 'created', code });
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
        if (room.guest) {
          safeSend(ws, { type: 'error', message: 'ห้องนี้เต็มแล้ว (2/2)' });
          return;
        }
        room.guest = ws;
        ws.role = 'guest';
        ws.roomCode = code;
        safeSend(ws, { type: 'joined', code, cfg: room.cfg });
        safeSend(room.host, { type: 'peer-joined' });
        return;
      }

      if (msg.type === 'leave') {
        leaveRoom();
        return;
      }

      const room = ws.roomCode && rooms.get(ws.roomCode);
      if (!room) return;
      if (msg.type === 'cfg-sync' && ws.role === 'host') room.cfg = msg.cfg;
      const peer = ws.role === 'host' ? room.guest : room.host;
      safeSend(peer, msg);
    });

    ws.on('close', leaveRoom);
    ws.on('error', leaveRoom);
  });

  return wss;
}
