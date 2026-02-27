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
    this.allowReconnect = true;
  }

  connect() {
    if (this.state != 'IDLE') return;

    this.state = 'CONNECTING';
    this.emit('state', this.state);

    this.socket = new net.Socket();

    this.socket.connect(this.port, this.ip, () => {
      this.state = 'CONNECTED';
      this.emit('state', this.state);
      this.emit('connect');
      console.log('[MODBUS] CONNECT', this.ip);
    });

    this.socket.on('data', data => {
      this.emit('data', data);
    });

    this.socket.on('close', () => {
      this.handleDisconnect('CLOSE');
    });

    this.socket.on('error', err => {
      console.error('[MODBUS] ERROR', this.ip, err.code);
      this.handleDisconnect('ERROR');
    });
  }

  // handleDisconnect(reason) {
  //   this.state = 'ERROR';
  //   this.emit('state', this.state, reason);
  //   this.cleanup();
  //   this.scheduleReconnect();
  // }
  handleDisconnect(reason) {
    this.emit('state', 'ERROR', reason);
    this.cleanup();

    if (this.allowReconnect) {
      this.scheduleReconnect();
    }
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
    if (this.state == 'CONNECTED') {
      this.socket.write(buffer);
    }
  }

  disconnect() {
    this.allowReconnect = false;
    this.cleanup();
  }
}
