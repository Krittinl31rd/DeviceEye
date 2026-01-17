import EventEmitter from "events";
import { ModbusSocket } from "./socket.js";
import { ModbusQueue } from "./queue.js";
import { buildReadPacket, buildWriteSingle, buildWriteMultiHolding, buildWriteMutilCoil } from "./packet.js";
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

  //[16]
  async writeMultiHolding(unitId, start, values) {
    const { tx, buf } = buildWriteMultiHolding(unitId, start, values);
    await this.queue.enqueue(tx, buf, 'high');
    return true;
  }

  // [15]
  async writeMultiCoil(unitId, start, values) {
    const { tx, buf } = buildWriteMutilCoil(unitId, start, values);
    await this.queue.enqueue(tx, buf, 'high');
    return true;
  }
}



