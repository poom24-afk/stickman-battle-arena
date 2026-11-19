import { Peer } from 'peerjs';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX = 'jjk-stickman-arena-';
const ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];
const randCode = () => Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

/* รองรับทั้ง P2P ข้ามอินเทอร์เน็ต (PeerJS WebRTC) และ WebSocket Server (/ws) */
export class NetClient {
  constructor() {
    this.mode = 'p2p';
    this.ws = null;
    this.peer = null;
    this.conn = null;
    this.role = null;
    this.code = '';
    this.pingMs = null;
    this.handlers = new Set();
    this.pingTimer = null;
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

  handleIncoming(msg) {
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'ping') {
      this.send({ type: 'pong', t: msg.t });
      return;
    }
    if (msg.type === 'pong') {
      this.pingMs = Math.max(1, Math.round(performance.now() - msg.t));
    } else if (msg.type === 'created') {
      this.role = 'host'; this.code = msg.code;
    } else if (msg.type === 'joined') {
      this.role = 'guest'; this.code = msg.code;
    }
    this.emit(msg);
  }

  async create(mode = 'p2p', cfg = null) {
    this.close();
    this.mode = mode;
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

  createP2p(cfg, attempt = 0) {
    return new Promise((resolve, reject) => {
      const code = randCode();
      const peer = new Peer(PREFIX + code, { config: { iceServers: ICE } });
      this.peer = peer;
      let opened = false;

      peer.on('open', () => {
        opened = true;
        this.role = 'host';
        this.code = code;
        this.emit({ type: 'created', code, mode: 'p2p' });
        resolve();
      });

      peer.on('connection', (conn) => {
        if (this.conn && this.conn.open) {
          conn.on('open', () => {
            conn.send({ type: 'error', message: 'ห้องนี้เต็มแล้ว (2/2)' });
            setTimeout(() => conn.close(), 200);
          });
          return;
        }
        this.conn = conn;
        conn.on('open', () => {
          this.startPing();
          if (cfg) conn.send({ type: 'cfg-sync', cfg });
          this.emit({ type: 'peer-joined' });
        });
        conn.on('data', (data) => this.handleIncoming(data));
        conn.on('close', () => {
          clearInterval(this.pingTimer);
          if (this.conn === conn) {
            this.conn = null;
            this.emit({ type: 'peer-left', reason: 'ผู้เล่น 2 ออกจากห้องแล้ว' });
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
      const peer = new Peer({ config: { iceServers: ICE } });
      this.peer = peer;
      let connected = false;

      const timer = setTimeout(() => {
        if (!connected) {
          this.close();
          reject(new Error(`เชื่อมต่อห้อง "${code}" หมดเวลา (ตรวจสอบรหัสห้องหรือลองใช้โหมด Tunnel/Server)`));
        }
      }, 12000);

      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { reliable: true });
        this.conn = conn;
        conn.on('open', () => {
          connected = true;
          clearTimeout(timer);
          this.role = 'guest';
          this.code = code;
          this.startPing();
          this.emit({ type: 'joined', code, mode: 'p2p' });
          resolve();
        });
        conn.on('data', (data) => {
          if (data?.type === 'error') {
            clearTimeout(timer);
            reject(new Error(data.message || 'เข้าห้องไม่สำเร็จ'));
            return;
          }
          this.handleIncoming(data);
        });
        conn.on('close', () => {
          clearInterval(this.pingTimer);
          if (this.conn === conn) {
            this.conn = null;
            this.emit({ type: 'peer-left', reason: 'หัวหน้าห้องออกจากห้องแล้ว' });
          }
        });
      });

      peer.on('error', (err) => {
        clearTimeout(timer);
        if (!connected) {
          const msg = err.type === 'peer-unavailable'
            ? `ไม่พบห้อง "${code}" (รหัสผิด หรือหัวหน้าห้องปิดหน้าต่างไปแล้ว)`
            : 'เชื่อมต่อ P2P ไม่สำเร็จ กรุณาลองใหม่';
          reject(new Error(msg));
        } else {
          this.emit({ type: 'error', message: `P2P Error: ${err.type || err.message}` });
        }
      });
    });
  }

  send(obj) {
    if (this.mode === 'ws') {
      if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
    } else if (this.conn && this.conn.open) {
      this.conn.send(obj);
    }
  }

  close() {
    clearInterval(this.pingTimer);
    if (this.ws) {
      const w = this.ws;
      this.ws = null;
      try { if (w.readyState === 1) w.send(JSON.stringify({ type: 'leave' })); } catch { /* ignore */ }
      try { w.close(); } catch { /* ignore */ }
    }
    if (this.conn) {
      const c = this.conn;
      this.conn = null;
      try { c.close(); } catch { /* ignore */ }
    }
    if (this.peer) {
      const p = this.peer;
      this.peer = null;
      try { p.destroy(); } catch { /* ignore */ }
    }
    this.role = null;
    this.code = '';
    this.pingMs = null;
  }
}
