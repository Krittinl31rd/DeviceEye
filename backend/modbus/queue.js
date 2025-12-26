export class ModbusQueue {
  constructor(socket) {
    this.socket = socket;
    this.queue = [];
    this.processing = false;
    this.pending = new Map();

    socket.on('data', data => this.handleData(data));
  }

  enqueue(tx, buffer, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const item = { tx, buffer, resolve, reject };

      if (priority === 'high') {
        this.queue.unshift(item); // write first
      } else {
        this.queue.push(item);
      }

      this.process();
    });
  }

  process() {
    if (this.processing) return;
    const item = this.queue.shift();
    if (!item) return;

    this.processing = true;
    this.pending.set(item.tx, item);
    this.socket.write(item.buffer);

    item.timer = setTimeout(() => {
      this.pending.delete(item.tx);
      this.processing = false;
      item.reject('timeout');
      this.process();
    }, 1000);
  }

  handleData(data) {
    const tx = data.readUInt16BE(0);
    const item = this.pending.get(tx);
    if (!item) return;

    clearTimeout(item.timer);
    this.pending.delete(tx);
    this.processing = false;
    item.resolve(data);
    this.process();
  }
}
