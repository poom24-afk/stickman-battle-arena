import { Peer } from 'peerjs';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX = 'jjk-stickman-arena-';
const ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:openrelay.metered.ca:80' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
];
const randCode = () => Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

/* รองรับทั้ง P2P ข้ามอินเทอร์เน็ต (PeerJS WebRTC + TURN Relay) และ WebSocket Server (/ws) */
export class NetClient {
  constructor() {
    this.mode = 'p2p';
    this.ws = null;
    this.peer = null;
    this.conn = null;
    this.fastConn = null;
    this.conns = new Map(); // Host: slot (1..3) -> reliable conn
    this.fastConns = new Map(); // Host: slot (1..3) -> unreliable fast conn
    this.hostCfg = null;
    this.role = null;
    this.mySlot = 0;
    this.code = '';
    this.pingMs = null;
    this.handlers = new Set();
    this.pingTimer = null;
  }

  setHostCfg(cfg) {
    this.hostCfg = cfg;
  }

  getOccupied() {
    return [true, this.conns.has(1), this.conns.has(2), this.conns.has(3)];
  }

  emit(msg) {
    this.handlers.forEach((fn) => fn(msg));
  }

  onMessage(fn) {
    this.handlers.add(fn);
    return () => this.handlers.delete(fn);
  }

  startPing() {
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => this.send({ type: 'ping', t: performance.now() }), 2000);
    this.send({ type: 'ping', t: performance.now() });
  }

  handleIncoming(msg, fromSlot = null, srcConn = null) {
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'ping') {
      if (srcConn && srcConn.open) srcConn.send({ type: 'pong', t: msg.t });
      else this.send({ type: 'pong', t: msg.t });
      return;
    }
    if (msg.type === 'pong') {
      this.pingMs = Math.max(1, Math.round(performance.now() - msg.t));
    } else if (msg.type === 'created') {
      this.role = 'host'; this.mySlot = 0; this.code = msg.code;
    } else if (msg.type === 'joined') {
      this.role = 'guest'; this.mySlot = msg.slot ?? 1; this.code = msg.code;
    }
    if (fromSlot !== null && msg.slot === undefined) msg = { ...msg, slot: fromSlot };
    this.emit(msg);
  }

  async create(mode = 'p2p', cfg = null) {
    this.close();
    this.mode = mode;
    this.hostCfg = cfg;
    if (mode === 'ws') {
      await this.connectWs();
      this.send({ type: 'create', cfg });
      return;
    }
    return this.createP2p(cfg);
  }

  async join(mode = 'p2p', code = '') {
    this.close();
    this.mode = mode;
    const clean = String(code || '').trim().toUpperCase();
    if (mode === 'ws') {
      await this.connectWs();
      this.send({ type: 'join', code: clean });
      return;
    }
    return this.joinP2p(clean);
  }

  connectWs() {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${location.host}/ws`);
      this.ws = ws;
      ws.onopen = () => { this.startPing(); resolve(); };
      ws.onerror = () => reject(new Error('เชื่อมต่อ WebSocket เซิร์ฟเวอร์ไม่สำเร็จ (ลองเปลี่ยนเป็นโหมด P2P ข้ามเน็ต)'));
      ws.onmessage = (ev) => {
        try { this.handleIncoming(JSON.parse(ev.data)); } catch { /* ignore */ }
      };
      ws.onclose = () => {
        clearInterval(this.pingTimer);
        if (this.ws === ws) this.emit({ type: 'closed' });
      };
    });
  }

  keepAlivePeer(peer) {
    peer.on('disconnected', () => {
      if (!peer.destroyed && this.peer === peer) {
        try { peer.reconnect(); } catch { /* ignore */ }
      }
    });
  }

  createP2p(cfg, attempt = 0) {
    this.hostCfg = cfg;
    return new Promise((resolve, reject) => {
      const code = randCode();
      const peer = new Peer(PREFIX + code, { config: { iceServers: ICE, iceCandidatePoolSize: 4 } });
      this.peer = peer;
      let opened = false;
      this.keepAlivePeer(peer);

      peer.on('open', () => {
        opened = true;
        this.role = 'host';
        this.mySlot = 0;
        this.code = code;
        this.emit({ type: 'created', code, mode: 'p2p', slot: 0 });
        resolve();
      });

      peer.on('connection', (conn) => {
        const meta = conn.metadata || {};
        if (meta.ch === 'fast') {
          const s = Number(meta.slot);
          if (s >= 1 && s <= 3 && this.conns.has(s)) {
            this.fastConns.set(s, conn);
            conn.on('data', (data) => this.handleIncoming(data, s, conn));
            conn.on('close', () => { if (this.fastConns.get(s) === conn) this.fastConns.delete(s); });
            conn.on('error', () => { if (this.fastConns.get(s) === conn) this.fastConns.delete(s); });
          } else {
            conn.on('open', () => { try { conn.close(); } catch { /* ignore */ } });
          }
          return;
        }
        const curCfg = this.hostCfg || cfg;
        const candidates = curCfg?.mode === '2v2' ? [1, 2, 3] : [1];
        const freeSlot = candidates.find((s) => !this.conns.has(s) || !this.conns.get(s).open);
        if (!freeSlot) {
          const cap = candidates.length + 1;
          const rejectBusy = () => {
            conn.send({ type: 'error', message: `ห้องนี้เต็มแล้ว (${cap}/${cap})` });
            setTimeout(() => conn.close(), 200);
          };
          if (conn.open) rejectBusy(); else conn.on('open', rejectBusy);
          return;
        }
        this.conns.set(freeSlot, conn);
        let readyFired = false;
        const onReady = () => {
          if (readyFired || this.conns.get(freeSlot) !== conn) return;
          readyFired = true;
          const occ = this.getOccupied();
          conn.send({ type: 'welcome', code: this.code, mode: 'p2p', slot: freeSlot, cfg: this.hostCfg || cfg, occupied: occ });
          if (!this.pingTimer) this.startPing();
          this.emit({ type: 'peer-joined', slot: freeSlot, occupied: occ });
        };
        if (conn.open) onReady(); else conn.on('open', onReady);
        conn.on('data', (data) => this.handleIncoming(data, freeSlot, conn));
        conn.on('error', (err) => {
          this.emit({ type: 'error', message: `P${freeSlot + 1} เชื่อมต่อไม่สำเร็จ (${err?.message || 'ICE failed'})` });
        });
        conn.on('close', () => {
          if (this.conns.get(freeSlot) === conn) {
            this.conns.delete(freeSlot);
            const fc = this.fastConns.get(freeSlot);
            if (fc) { this.fastConns.delete(freeSlot); try { fc.close(); } catch { /* ignore */ } }
            if (this.conns.size === 0) clearInterval(this.pingTimer);
            this.emit({ type: 'peer-left', slot: freeSlot, occupied: this.getOccupied(), reason: `ผู้เล่น P${freeSlot + 1} ออกจากห้องแล้ว` });
          }
        });
      });

      peer.on('error', (err) => {
        if (!opened && err.type === 'unavailable-id' && attempt < 4) {
          peer.destroy();
          this.createP2p(cfg, attempt + 1).then(resolve, reject);
          return;
        }
        if (!opened) reject(new Error('เชื่อมต่อเซิร์ฟเวอร์ P2P ข้ามเน็ตไม่สำเร็จ กรุณาลองใหม่'));
        else this.emit({ type: 'error', message: `P2P Error: ${err.type || err.message}` });
      });
    });
  }

  joinP2p(code) {
    return new Promise((resolve, reject) => {
      const peer = new Peer({ config: { iceServers: ICE, iceCandidatePoolSize: 4 } });
      this.peer = peer;
      let connected = false;
      this.keepAlivePeer(peer);

      const timer = setTimeout(() => {
        if (!connected) {
          this.close();
          reject(new Error(`เชื่อมต่อห้อง "${code}" หมดเวลา — ตรวจสอบรหัสห้อง หรือให้หัวหน้าห้องเปิดจากลิงก์ GitHub Pages`));
        }
      }, 20000);

      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json', metadata: { ch: 'rel' } });
        this.conn = conn;
        conn.on('data', (data) => {
          if (data?.type === 'error') {
            clearTimeout(timer);
            reject(new Error(data.message || 'เข้าห้องไม่สำเร็จ'));
            return;
          }
          if (data?.type === 'welcome' && !connected) {
            connected = true;
            clearTimeout(timer);
            this.role = 'guest';
            this.mySlot = data.slot ?? 1;
            this.code = code;
            const fc = peer.connect(PREFIX + code, { reliable: false, serialization: 'json', metadata: { ch: 'fast', slot: this.mySlot } });
            this.fastConn = fc;
            fc.on('data', (d) => this.handleIncoming(d));
            fc.on('close', () => { if (this.fastConn === fc) this.fastConn = null; });
            fc.on('error', () => { if (this.fastConn === fc) this.fastConn = null; });
            this.startPing();
            this.emit({ type: 'joined', code, mode: 'p2p', slot: this.mySlot, cfg: data.cfg, occupied: data.occupied });
            resolve();
            return;
          }
          this.handleIncoming(data);
        });
        conn.on('error', (err) => {
          if (!connected) {
            clearTimeout(timer);
            reject(new Error(`เชื่อมต่อห้อง "${code}" ไม่สำเร็จ (${err?.message || 'WebRTC error'})`));
          }
        });
        conn.on('close', () => {
          clearInterval(this.pingTimer);
          if (this.conn === conn) {
            this.conn = null;
            this.emit({ type: 'peer-left', slot: 0, reason: 'หัวหน้าห้องออกจากห้องแล้ว' });
          }
        });
      });

      peer.on('error', (err) => {
        clearTimeout(timer);
        if (!connected) {
          const msg = err.type === 'peer-unavailable'
            ? `ไม่พบห้อง "${code}" (รหัสผิด หรือหัวหน้าห้องปิดหน้าต่างไปแล้ว)`
            : `เชื่อมต่อ P2P ไม่สำเร็จ (${err.type || err.message})`;
          reject(new Error(msg));
        } else {
          this.emit({ type: 'error', message: `P2P Error: ${err.type || err.message}` });
        }
      });
    });
  }

  send(obj, targetSlot = null) {
    if (this.mode === 'ws') {
      if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
    } else if (this.role === 'host') {
      if (targetSlot !== null) {
        const c = this.conns.get(targetSlot);
        if (c && c.open) c.send(obj);
      } else {
        this.conns.forEach((c) => { if (c && c.open) c.send(obj); });
      }
    } else if (this.conn && this.conn.open) {
      this.conn.send(obj);
    }
  }

  /* ส่งแพ็กเก็ตเรียลไทม์ (state / movement) ผ่านช่อง Unreliable เพื่อลดอาการค้างรอแพ็กเก็ตและตัด bufferbloat */
  sendFast(obj, targetSlot = null) {
    const canPush = (c) => c && c.open && ((c.dataChannel?.bufferedAmount || 0) < 49152);
    if (this.mode === 'ws') {
      if (this.ws && this.ws.readyState === 1 && this.ws.bufferedAmount < 49152) this.ws.send(JSON.stringify(obj));
    } else if (this.role === 'host') {
      if (targetSlot !== null) {
        const c = this.fastConns.get(targetSlot) || this.conns.get(targetSlot);
        if (canPush(c)) c.send(obj);
      } else {
        this.conns.forEach((rel, s) => {
          const fc = this.fastConns.get(s);
          const ch = fc && fc.open ? fc : rel;
          if (canPush(ch)) ch.send(obj);
        });
      }
    } else {
      const ch = this.fastConn && this.fastConn.open ? this.fastConn : this.conn;
      if (canPush(ch)) ch.send(obj);
    }
  }

  close() {
    clearInterval(this.pingTimer);
    this.pingTimer = null;
    if (this.ws) {
      const w = this.ws;
      this.ws = null;
      try { if (w.readyState === 1) w.send(JSON.stringify({ type: 'leave' })); } catch { /* ignore */ }
      try { w.close(); } catch { /* ignore */ }
    }
    if (this.fastConn) {
      const fc = this.fastConn;
      this.fastConn = null;
      try { fc.close(); } catch { /* ignore */ }
    }
    if (this.conn) {
      const c = this.conn;
      this.conn = null;
      try { c.close(); } catch { /* ignore */ }
    }
    if (this.fastConns.size) {
      this.fastConns.forEach((c) => { try { c.close(); } catch { /* ignore */ } });
      this.fastConns.clear();
    }
    if (this.conns.size) {
      this.conns.forEach((c) => { try { c.close(); } catch { /* ignore */ } });
      this.conns.clear();
    }
    if (this.peer) {
      const p = this.peer;
      this.peer = null;
      try { p.destroy(); } catch { /* ignore */ }
    }
    this.role = null;
    this.mySlot = 0;
    this.code = '';
    this.pingMs = null;
  }
}
