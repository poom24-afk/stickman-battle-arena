import PeerPkg from 'peerjs';
const Peer = PeerPkg.Peer || PeerPkg.default || PeerPkg;

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX = 'jjk-stickman-arena-';
const RELAY_PREFIX = 'jjk-stickman-arena/v1/';
const RELAY_URLS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];
const ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];
const randCode = () => Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
const te = new TextEncoder();
const td = new TextDecoder();

function encLen(n) {
  const out = [];
  do {
    let d = n % 128;
    n = Math.floor(n / 128);
    if (n > 0) d |= 128;
    out.push(d);
  } while (n > 0);
  return out;
}

function encStr(s) {
  const b = te.encode(s);
  return [(b.length >> 8) & 255, b.length & 255, ...b];
}

/* MQTT 3.1.1 บน WebSocket แบบไร้ dependency เพื่อเป็น Cloud Relay ทะลุทุก NAT / 4G / Symmetric Router */
class RelayClient {
  constructor() {
    this.ws = null;
    this.cid = 'jjk_' + Math.random().toString(36).slice(2, 10);
    this.pktId = 1;
    this.rx = new Uint8Array(0);
    this.pingId = null;
    this.closed = false;
    this.onMsg = null;
    this.onClose = null;
  }

  connect(will = null) {
    return this._tryUrl(0, will);
  }

  _tryUrl(idx, will) {
    if (this.closed || idx >= RELAY_URLS.length) {
      return Promise.reject(new Error('เชื่อมต่อ Cloud Relay ไม่สำเร็จ'));
    }
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(RELAY_URLS[idx], 'mqtt');
      ws.binaryType = 'arraybuffer';
      this.ws = ws;
      let done = false;
      const tmo = setTimeout(() => {
        if (!done) {
          done = true;
          try { ws.close(); } catch { /* ignore */ }
          this._tryUrl(idx + 1, will).then(resolve, reject);
        }
      }, 4500);

      ws.onopen = () => {
        const flags = 0x02 | (will ? 0x04 : 0);
        const vh = [0, 4, 77, 81, 84, 84, 4, flags, 0, 25, ...encStr(this.cid)];
        if (will) {
          vh.push(...encStr(will.topic), ...encStr(will.msg));
        }
        ws.send(Uint8Array.from([0x10, ...encLen(vh.length), ...vh]));
      };

      ws.onmessage = (ev) => {
        const chunk = new Uint8Array(ev.data);
        const merged = new Uint8Array(this.rx.length + chunk.length);
        merged.set(this.rx);
        merged.set(chunk, this.rx.length);
        this.rx = merged;

        while (this.rx.length >= 2) {
          let mul = 1, rem = 0, pos = 1, b = 0;
          let needMore = false;
          do {
            if (pos >= this.rx.length) { needMore = true; break; }
            b = this.rx[pos++];
            rem += (b & 127) * mul;
            mul *= 128;
          } while (b & 128);
          if (needMore || this.rx.length < pos + rem) break;

          const type = this.rx[0] >> 4;
          const body = this.rx.slice(pos, pos + rem);
          this.rx = this.rx.slice(pos + rem);

          if (type === 2 && !done) {
            done = true;
            clearTimeout(tmo);
            if (body[1] === 0) {
              clearInterval(this.pingId);
              this.pingId = setInterval(() => {
                if (this.ws && this.ws.readyState === 1) this.ws.send(Uint8Array.from([0xc0, 0x00]));
              }, 18000);
              resolve();
            } else {
              try { ws.close(); } catch { /* ignore */ }
              this._tryUrl(idx + 1, will).then(resolve, reject);
            }
          } else if (type === 3) {
            const tlen = (body[0] << 8) | body[1];
            const topic = td.decode(body.slice(2, 2 + tlen));
            const raw = td.decode(body.slice(2 + tlen));
            try { this.onMsg?.(topic, JSON.parse(raw)); } catch { /* ignore */ }
          }
        }
      };

      ws.onerror = () => {
        if (!done) {
          done = true;
          clearTimeout(tmo);
          try { ws.close(); } catch { /* ignore */ }
          this._tryUrl(idx + 1, will).then(resolve, reject);
        }
      };

      ws.onclose = () => {
        clearInterval(this.pingId);
        if (!done) {
          done = true;
          clearTimeout(tmo);
          this._tryUrl(idx + 1, will).then(resolve, reject);
        } else if (this.ws === ws && !this.closed) {
          this.onClose?.();
        }
      };
    });
  }

  sub(topics) {
    if (!this.ws || this.ws.readyState !== 1) return;
    const pid = this.pktId++ & 0xffff;
    const pl = [pid >> 8, pid & 255];
    topics.forEach((t) => pl.push(...encStr(t), 0));
    this.ws.send(Uint8Array.from([0x82, ...encLen(pl.length), ...pl]));
  }

  pub(topic, obj, checkBuffer = false) {
    if (!this.ws || this.ws.readyState !== 1) return false;
    if (checkBuffer && this.ws.bufferedAmount > 49152) return false;
    const payload = te.encode(JSON.stringify(obj));
    const tBytes = encStr(topic);
    const remLen = tBytes.length + payload.length;
    const hdr = Uint8Array.from([0x30, ...encLen(remLen), ...tBytes]);
    const pkt = new Uint8Array(hdr.length + payload.length);
    pkt.set(hdr);
    pkt.set(payload, hdr.length);
    this.ws.send(pkt);
    return true;
  }

  close() {
    this.closed = true;
    clearInterval(this.pingId);
    if (this.ws) {
      const w = this.ws;
      this.ws = null;
      try { if (w.readyState === 1) w.send(Uint8Array.from([0xe0, 0x00])); } catch { /* ignore */ }
      try { w.close(); } catch { /* ignore */ }
    }
  }
}

/* รองรับทั้ง P2P (PeerJS WebRTC), Cloud Relay อัตโนมัติ (WSS ทะลุทุก NAT), และ Server (/ws) */
export class NetClient {
  constructor() {
    this.mode = 'p2p';
    this.ws = null;
    this.peer = null;
    this.conn = null;
    this.fastConn = null;
    this.conns = new Map();       // Host: slot -> PeerJS reliable conn
    this.fastConns = new Map();   // Host: slot -> PeerJS fast unreliable conn
    this.relay = null;
    this.relayGuests = new Map(); // Host: slot -> guest cid
    this.hostCfg = null;
    this.role = null;
    this.mySlot = 0;
    this.code = '';
    this.pingMs = null;
    this.handlers = new Set();
    this.pingTimer = null;
    this.gen = 0;
  }

  setHostCfg(cfg) {
    this.hostCfg = cfg;
  }

  hasRelay() {
    return this.mode === 'relay' || this.relayGuests.size > 0;
  }

  getOccupied() {
    const has = (s) => this.conns.has(s) || this.relayGuests.has(s);
    return [true, has(1), has(2), has(3)];
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

  handleIncoming(msg, fromSlot = null, srcConn = null, srcCid = null) {
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'ping') {
      if (srcConn && srcConn.open) srcConn.send({ type: 'pong', t: msg.t });
      else if (srcCid && this.relay) this.relay.pub(`${RELAY_PREFIX}${this.code}/to/${srcCid}`, { type: 'pong', t: msg.t });
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
    const myGen = this.gen;
    this.mode = mode;
    this.hostCfg = cfg;
    if (mode === 'ws') {
      await this.connectWs();
      this.send({ type: 'create', cfg });
      return;
    }
    if (mode === 'relay') {
      const code = randCode();
      await this.hostRelay(code, cfg, myGen);
      this.role = 'host';
      this.mySlot = 0;
      this.code = code;
      this.emit({ type: 'created', code, mode: 'relay', slot: 0 });
      return;
    }
    return this.createHybrid(cfg, myGen);
  }

  async join(mode = 'p2p', code = '') {
    this.close();
    const myGen = this.gen;
    this.mode = mode;
    const clean = String(code || '').trim().toUpperCase();
    if (mode === 'ws') {
      await this.connectWs();
      this.send({ type: 'join', code: clean });
      return;
    }
    if (mode === 'relay') {
      return this.joinRelay(clean, myGen);
    }
    /* โหมด P2P: ลองเชื่อม WebRTC ตรงก่อน 4 วินาที ถ้าเน็ต/NAT บล็อกให้สลับเข้า Cloud Relay อัตโนมัติ */
    try {
      await this.joinP2p(clean, myGen, 4000);
    } catch (err) {
      if (this.gen !== myGen) throw err;
      this.cleanupPeer();
      this.mode = 'relay';
      return this.joinRelay(clean, myGen);
    }
  }

  connectWs() {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${location.host}/ws`);
      this.ws = ws;
      ws.onopen = () => { this.startPing(); resolve(); };
      ws.onerror = () => reject(new Error('เชื่อมต่อ WebSocket เซิร์ฟเวอร์ไม่สำเร็จ (ลองใช้โหมด P2P หรือ Cloud Relay)'));
      ws.onmessage = (ev) => {
        try { this.handleIncoming(JSON.parse(ev.data)); } catch { /* ignore */ }
      };
      ws.onclose = () => {
        clearInterval(this.pingTimer);
        if (this.ws === ws) this.emit({ type: 'closed' });
      };
    });
  }

  /* ---------------- CLOUD RELAY (WSS) ---------------- */
  async hostRelay(code, cfg, myGen) {
    const base = RELAY_PREFIX + code;
    const rc = new RelayClient();
    this.relay = rc;
    rc.onMsg = (_topic, data) => {
      if (this.gen !== myGen || !data || typeof data.type !== 'string') return;
      if (data.type === 'relay-join' && data.cid) {
        let slot = null;
        for (const [s, cid] of this.relayGuests.entries()) {
          if (cid === data.cid) { slot = s; break; }
        }
        const curCfg = this.hostCfg || cfg;
        const candidates = curCfg?.mode === '2v2' ? [1, 2, 3] : [1];
        if (!slot) {
          slot = candidates.find((s) => !this.conns.has(s) && !this.relayGuests.has(s)) || null;
          if (!slot) {
            const cap = candidates.length + 1;
            rc.pub(`${base}/to/${data.cid}`, { type: 'error', message: `ห้องนี้เต็มแล้ว (${cap}/${cap})` });
            return;
          }
          this.relayGuests.set(slot, data.cid);
          const occ = this.getOccupied();
          rc.pub(`${base}/to/${data.cid}`, { type: 'welcome', code, mode: 'relay', slot, cfg: curCfg, occupied: occ });
          if (!this.pingTimer) this.startPing();
          this.emit({ type: 'peer-joined', slot, occupied: occ });
        } else {
          rc.pub(`${base}/to/${data.cid}`, { type: 'welcome', code, mode: 'relay', slot, cfg: curCfg, occupied: this.getOccupied() });
        }
        return;
      }
      if (data.type === 'relay-leave') {
        for (const [s, cid] of this.relayGuests.entries()) {
          if (cid === data.cid || (data.slot && s === data.slot)) {
            this.relayGuests.delete(s);
            if (this.conns.size === 0 && this.relayGuests.size === 0) clearInterval(this.pingTimer);
            this.emit({ type: 'peer-left', slot: s, occupied: this.getOccupied(), reason: `ผู้เล่น P${s + 1} ออกจากห้องแล้ว` });
            break;
          }
        }
        return;
      }
      let fromSlot = data.slot ?? null;
      if (fromSlot === null && data.cid) {
        for (const [s, cid] of this.relayGuests.entries()) if (cid === data.cid) { fromSlot = s; break; }
      }
      this.handleIncoming(data, fromSlot, null, data.cid || null);
    };
    rc.onClose = () => {
      if (this.gen === myGen && this.role === 'host') {
        /* เชื่อม Relay ใหม่เงียบๆ ถ้าหลุดชั่วคราว */
        rc.connect({ topic: `${base}/from-host`, msg: JSON.stringify({ type: 'peer-left', slot: 0, reason: 'หัวหน้าห้องออกจากห้องแล้ว' }) })
          .then(() => rc.sub([`${base}/to-host`]))
          .catch(() => {});
      }
    };
    await rc.connect({ topic: `${base}/from-host`, msg: JSON.stringify({ type: 'peer-left', slot: 0, reason: 'หัวหน้าห้องออกจากห้องแล้ว' }) });
    rc.sub([`${base}/to-host`]);
  }

  async joinRelay(code, myGen) {
    const base = RELAY_PREFIX + code;
    const rc = new RelayClient();
    this.relay = rc;
    let connected = false;
    await rc.connect({ topic: `${base}/to-host`, msg: JSON.stringify({ type: 'relay-leave', cid: rc.cid }) });
    if (this.gen !== myGen) { rc.close(); return; }

    return new Promise((resolve, reject) => {
      let joinIv = null;
      const tmo = setTimeout(() => {
        clearInterval(joinIv);
        if (!connected) {
          this.close();
          reject(new Error(`ไม่พบห้อง "${code}" หรือหัวหน้าห้องปิดหน้าต่างไปแล้ว`));
        }
      }, 7500);

      rc.onMsg = (_topic, data) => {
        if (this.gen !== myGen || !data || typeof data.type !== 'string') return;
        if (data.type === 'error' && !connected) {
          clearTimeout(tmo); clearInterval(joinIv);
          this.close();
          reject(new Error(data.message || 'เข้าห้องไม่สำเร็จ'));
          return;
        }
        if (data.type === 'welcome' && !connected) {
          connected = true;
          clearTimeout(tmo); clearInterval(joinIv);
          this.role = 'guest';
          this.mySlot = data.slot ?? 1;
          this.code = code;
          this.startPing();
          this.emit({ type: 'joined', code, mode: 'relay', slot: this.mySlot, cfg: data.cfg, occupied: data.occupied });
          resolve();
          return;
        }
        if (connected) this.handleIncoming(data);
      };

      rc.onClose = () => {
        clearInterval(this.pingTimer);
        clearInterval(joinIv);
        if (connected && this.gen === myGen) {
          this.emit({ type: 'peer-left', slot: 0, reason: 'การเชื่อมต่อ Cloud Relay ขาดหาย' });
        }
      };

      rc.sub([`${base}/from-host`, `${base}/to/${rc.cid}`]);
      const sendJoin = () => rc.pub(`${base}/to-host`, { type: 'relay-join', cid: rc.cid });
      setTimeout(sendJoin, 80);
      joinIv = setInterval(() => { if (!connected) sendJoin(); }, 1200);
    });
  }

  /* ---------------- P2P + HYBRID HOST ---------------- */
  keepAlivePeer(peer) {
    peer.on('disconnected', () => {
      if (!peer.destroyed && this.peer === peer) {
        try { peer.reconnect(); } catch { /* ignore */ }
      }
    });
  }

  async createHybrid(cfg, myGen) {
    const code = randCode();
    /* เปิด Cloud Relay ไว้รอรับเพื่อนที่ติด NAT พร้อมกันทันที */
    const relayReady = this.hostRelay(code, cfg, myGen).then(() => true).catch(() => false);
    const p2pReady = this.createP2pFixed(code, cfg, myGen).then(() => true).catch(() => false);
    const [rOk, pOk] = await Promise.all([relayReady, p2pReady]);
    if (this.gen !== myGen) return;
    if (!rOk && !pOk) {
      throw new Error('ไม่สามารถสร้างห้องออนไลน์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    }
    this.role = 'host';
    this.mySlot = 0;
    this.code = code;
    this.emit({ type: 'created', code, mode: pOk ? 'p2p' : 'relay', slot: 0 });
  }

  createP2pFixed(code, cfg, myGen, attempt = 0) {
    return new Promise((resolve, reject) => {
      const peer = new Peer(PREFIX + code, { config: { iceServers: ICE, iceCandidatePoolSize: 2 } });
      this.peer = peer;
      let opened = false;
      this.keepAlivePeer(peer);
      const tmo = setTimeout(() => { if (!opened) { try { peer.destroy(); } catch { /* ignore */ } reject(new Error('peerjs-timeout')); } }, 7000);

      peer.on('open', () => {
        clearTimeout(tmo);
        if (this.gen !== myGen) { try { peer.destroy(); } catch { /* ignore */ } return; }
        opened = true;
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
        const freeSlot = candidates.find((s) => !this.conns.has(s) && !this.relayGuests.has(s));
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
        conn.on('close', () => {
          if (this.conns.get(freeSlot) === conn) {
            this.conns.delete(freeSlot);
            const fc = this.fastConns.get(freeSlot);
            if (fc) { this.fastConns.delete(freeSlot); try { fc.close(); } catch { /* ignore */ } }
            if (this.conns.size === 0 && this.relayGuests.size === 0) clearInterval(this.pingTimer);
            this.emit({ type: 'peer-left', slot: freeSlot, occupied: this.getOccupied(), reason: `ผู้เล่น P${freeSlot + 1} ออกจากห้องแล้ว` });
          }
        });
      });

      peer.on('error', (err) => {
        clearTimeout(tmo);
        if (!opened) reject(err);
      });
    });
  }

  joinP2p(code, myGen, timeoutMs = 5500) {
    return new Promise((resolve, reject) => {
      const peer = new Peer({ config: { iceServers: ICE, iceCandidatePoolSize: 2 } });
      this.peer = peer;
      let connected = false;
      this.keepAlivePeer(peer);

      const timer = setTimeout(() => {
        if (!connected) {
          this.cleanupPeer();
          reject(new Error('p2p-timeout'));
        }
      }, timeoutMs);

      peer.on('open', () => {
        if (this.gen !== myGen) { clearTimeout(timer); this.cleanupPeer(); return; }
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
        conn.on('error', () => {
          if (!connected) { clearTimeout(timer); this.cleanupPeer(); reject(new Error('p2p-error')); }
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
          this.cleanupPeer();
          reject(err);
        }
      });
    });
  }

  /* ---------------- SEND & CLOSE ---------------- */
  send(obj, targetSlot = null) {
    if (this.mode === 'ws') {
      if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
      return;
    }
    if (this.role === 'host') {
      if (targetSlot !== null) {
        const c = this.conns.get(targetSlot);
        if (c && c.open) c.send(obj);
        const cid = this.relayGuests.get(targetSlot);
        if (cid && this.relay) this.relay.pub(`${RELAY_PREFIX}${this.code}/to/${cid}`, obj);
      } else {
        this.conns.forEach((c) => { if (c && c.open) c.send(obj); });
        if (this.relay && this.relayGuests.size > 0) this.relay.pub(`${RELAY_PREFIX}${this.code}/from-host`, obj);
      }
      return;
    }
    if (this.relay && this.mode === 'relay') {
      this.relay.pub(`${RELAY_PREFIX}${this.code}/to-host`, { ...obj, cid: this.relay.cid, slot: this.mySlot });
    } else if (this.conn && this.conn.open) {
      this.conn.send(obj);
    }
  }

  /* ส่งแพ็กเก็ตเรียลไทม์ (state) ผ่านช่อง Unreliable / ตรวจ buffer กัน bufferbloat */
  sendFast(obj, targetSlot = null) {
    const canPush = (c) => c && c.open && ((c.dataChannel?.bufferedAmount || 0) < 49152);
    if (this.mode === 'ws') {
      if (this.ws && this.ws.readyState === 1 && this.ws.bufferedAmount < 49152) this.ws.send(JSON.stringify(obj));
      return;
    }
    if (this.role === 'host') {
      if (targetSlot !== null) {
        const c = this.fastConns.get(targetSlot) || this.conns.get(targetSlot);
        if (canPush(c)) c.send(obj);
        const cid = this.relayGuests.get(targetSlot);
        if (cid && this.relay) this.relay.pub(`${RELAY_PREFIX}${this.code}/to/${cid}`, obj, true);
      } else {
        this.conns.forEach((rel, s) => {
          const fc = this.fastConns.get(s);
          const ch = fc && fc.open ? fc : rel;
          if (canPush(ch)) ch.send(obj);
        });
        if (this.relay && this.relayGuests.size > 0) this.relay.pub(`${RELAY_PREFIX}${this.code}/from-host`, obj, true);
      }
      return;
    }
    if (this.relay && this.mode === 'relay') {
      this.relay.pub(`${RELAY_PREFIX}${this.code}/to-host`, { ...obj, cid: this.relay.cid, slot: this.mySlot }, true);
    } else {
      const ch = this.fastConn && this.fastConn.open ? this.fastConn : this.conn;
      if (canPush(ch)) ch.send(obj);
    }
  }

  cleanupPeer() {
    if (this.fastConn) {
      const fc = this.fastConn; this.fastConn = null;
      try { fc.close(); } catch { /* ignore */ }
    }
    if (this.conn) {
      const c = this.conn; this.conn = null;
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
      const p = this.peer; this.peer = null;
      try { p.destroy(); } catch { /* ignore */ }
    }
  }

  close() {
    this.gen++;
    clearInterval(this.pingTimer);
    this.pingTimer = null;
    if (this.ws) {
      const w = this.ws; this.ws = null;
      try { if (w.readyState === 1) w.send(JSON.stringify({ type: 'leave' })); } catch { /* ignore */ }
      try { w.close(); } catch { /* ignore */ }
    }
    if (this.relay) {
      const r = this.relay; this.relay = null;
      try {
        if (this.code && this.role === 'host') r.pub(`${RELAY_PREFIX}${this.code}/from-host`, { type: 'peer-left', slot: 0, reason: 'หัวหน้าห้องออกจากห้องแล้ว' });
        else if (this.code && this.role === 'guest') r.pub(`${RELAY_PREFIX}${this.code}/to-host`, { type: 'relay-leave', cid: r.cid, slot: this.mySlot });
      } catch { /* ignore */ }
      r.close();
    }
    this.relayGuests.clear();
    this.cleanupPeer();
    this.role = null;
    this.mySlot = 0;
    this.code = '';
    this.pingMs = null;
  }
}
