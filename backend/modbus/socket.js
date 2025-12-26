import net from "net";
import EventEmitter from "events";

export class ModbusSocket extends EventEmitter {
  constructor(ip, port = 502) {
    super();
    this.ip = ip;
    this.port = port;

    this.socket = null;
    this.state = 'IDLE'; // IDLE | CONNECTING | CONNECTED
    this.retryMs = 2000;
  }

  connect() {
    if (this.state !== 'IDLE') return;

    this.state = 'CONNECTING';
    this.socket = new net.Socket();

    this.socket.connect(this.port, this.ip, () => {
      this.state = 'CONNECTED';
      console.log('[MODBUS] CONNECT', this.ip);
      this.emit('connect');
    });

    this.socket.on('data', data => {
      this.emit('data', data);
    });

    this.socket.on('close', () => {
      console.warn('[MODBUS] CLOSE', this.ip);
      this.cleanup();
      this.scheduleReconnect();
    });

    this.socket.on('error', err => {
      console.error('[MODBUS] ERROR', this.ip, err.code);
      this.cleanup();
      this.scheduleReconnect();
    });
  }

  cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.socket = null;
    }
    this.state = 'IDLE';
  }

  scheduleReconnect() {
    setTimeout(() => this.connect(), this.retryMs);
  }

  write(buffer) {
    if (this.state === 'CONNECTED') {
      this.socket.write(buffer);
    }
  }
}
