const store = new Map();

export function diffRegisters(ip, unitId, fc, start, data) {
  
  const isBit = fc == 1 || fc == 2;
  const changes = [];

  if (!store.has(ip)) store.set(ip, new Map());
  const unitMap = store.get(ip);

  if (!unitMap.has(unitId)) unitMap.set(unitId, new Map());
  const fcMap = unitMap.get(unitId);

  if (!fcMap.has(fc)) fcMap.set(fc, new Map());
  const addrMap = fcMap.get(fc);

  if (isBit) {
    // data = Uint8Array
    for (let i = 0; i < data.length; i++) {
      const addr = start + i;
      const val = data[i] ? 1 : 0;
      const prev = addrMap.get(addr);

      if (prev !== val) {
        addrMap.set(addr, val);
        changes.push({ ip, unitId, fc, address: addr, value: val });
      }
    }
  } else {
    // data = Buffer (word)
    for (let i = 0; i < data.length; i += 2) {
      const addr = start + i / 2;
      const val = data.readUInt16BE(i);
      const prev = addrMap.get(addr);

      if (prev !== val) {
        addrMap.set(addr, val);
        changes.push({ ip, unitId, fc, address: addr, value: val });
      }
    }
  }

  return changes;
}
