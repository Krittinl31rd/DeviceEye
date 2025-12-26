import { ModbusSocket } from "./socket.js";
import { ModbusQueue } from "./queue.js";
import { buildReadPacket, buildWriteSingle, buildWriteMulti } from "./packet.js";
import { parseResponse } from "./parser.js";
import { buildChunks } from "./chunk.js";
import { diffRegisters } from "./cache.js";

export class ModbusClient {
  constructor(ip, port) {
    this.socket = new ModbusSocket(ip, port);
    this.queue = new ModbusQueue(this.socket);
    this.socket.connect();
  }

  // async readHoldingChunk(unitId, start, length, chunkSize = 50) {
  //   const chunks = buildChunks(start, length, chunkSize);
  //   const result = Buffer.alloc(length * 2);

  //   for (const c of chunks) {
  //     const { tx, buf } = buildReadPacket(unitId, 3, c.start, c.length);
  //     const res = await this.queue.enqueue(tx, buf);
  //     const parsed = parseResponse(res);
  //     parsed.data.copy(result, c.offset * 2);
  //   }

  //   return result;
  // }

  // async readHoldingDelta(ip, unitId, start, length, chunkSize = 50) {
  //   const buffer = await this.readHoldingChunk(
  //     unitId,
  //     start,
  //     length,
  //     chunkSize
  //   );

  //   const key = `${ip}:${unitId}:3:${start}`;
  //   return diffRegisters(key, buffer);
  // }

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
    const { tx, buf } = buildWriteSingle(unitId, fc, addr, value);
    await this.queue.enqueue(tx, buf, 'high');
    return true;
  }

  //[16] multiple holding register
  async writeMulti(unitId, start, values) {
    const { tx, buf } = buildWriteMulti(unitId, start, values);
    await this.queue.enqueue(tx, buf, 'high');
    return true;
  }
}


