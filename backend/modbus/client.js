import EventEmitter from "events";
import { ModbusSocket } from "./socket.js";
import { ModbusQueue } from "./queue.js";
import { buildReadPacket, buildWriteSingle, buildWriteMulti } from "./packet.js";
import { parseResponse } from "./parser.js";
import { buildChunks } from "./chunk.js";
import { diffRegisters } from "./cache.js";

export class ModbusClient extends EventEmitter {
  constructor(ip, port) {
    super();
    this.socket = new ModbusSocket(ip, port);
    this.queue = new ModbusQueue(this.socket);
    this.socket.on('state', (state, reason) => {
      this.emit('state', {
        ip,
        state,
        reason,
        ts: Date.now()
      });
    });
    this.socket.connect();
  }

  async readChunk(unitId, fc, start, length, chunkSize = 50) {
    const chunks = buildChunks(start, length, chunkSize);
    const isBit = fc == 1 || fc == 2;

    const result = isBit
      ? new Uint8Array(length)
      : Buffer.alloc(length * 2);

    for (const c of chunks) {
      const { tx, buf } = buildReadPacket(unitId, fc, c.start, c.length);
      const res = await this.queue.enqueue(tx, buf);
      const parsed = parseResponse(res);

      if (isBit) {
        let bitIndex = 0;
        for (const byte of parsed.data) {
          for (let b = 0; b < 8 && bitIndex < c.length; b++) {
            result[c.offset + bitIndex] = (byte >> b) & 1;
            bitIndex++;
          }
        }
      } else {
        parsed.data.copy(result, c.offset * 2);
      }

    }

    return result;
  }

  async readDelta(ip, unitId, fc, start, length, chunkSize = 50) {
    const buffer = await this.readChunk(
      unitId,
      fc,
      start,
      length,
      chunkSize
    );

    return diffRegisters(ip, unitId, fc, start, buffer);
  }

  //[5][6] single ouput coil, holding register
  async writeSingle(unitId, fc, addr, value) {
    if (fc == 5) {
      value = value ? 0xFF00 : 0x0000;
    }
    const { tx, buf } = buildWriteSingle(unitId, fc, addr, value);
    await this.queue.enqueue(tx, buf, 'high');
    return true;
  }

  //[15][16] multiple coil, holding register
  async writeMulti(unitId, fc, start, values) {
    if (fc == 15) {
      values = packCoils(values);
    }

    const { tx, buf } = buildWriteMulti(unitId, fc, start, values);
    await this.queue.enqueue(tx, buf, 'high');
    return true;
  }
}

function packCoils(values) {
  const byteCount = Math.ceil(values.length / 8);
  const buf = Buffer.alloc(byteCount);

  values.forEach((v, i) => {
    if (v) {
      buf[Math.floor(i / 8)] |= 1 << (i % 8);
    }
  });

  return buf;
}


