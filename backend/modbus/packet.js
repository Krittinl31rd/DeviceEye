let txId = 0;

export function nextTxId() {
    txId = (txId + 1) & 0xffff;
    return txId;
}

export function buildReadPacket(unitId, fc, start, qty) {
    const tx = nextTxId();
    const buf = Buffer.alloc(12);

    buf.writeUInt16BE(tx, 0);     // Transaction ID
    buf.writeUInt16BE(0, 2);      // Protocol ID
    buf.writeUInt16BE(6, 4);      // Length
    buf.writeUInt8(unitId, 6);    // Unit ID
    buf.writeUInt8(fc, 7);        // Function Code
    buf.writeUInt16BE(start, 8);
    buf.writeUInt16BE(qty, 10);

    return { tx, buf };
}

export function buildWriteSingle(unitId, fc, addr, value) {
    const tx = nextTxId();
    const buf = Buffer.alloc(12);

    buf.writeUInt16BE(tx, 0);
    buf.writeUInt16BE(0, 2);
    buf.writeUInt16BE(6, 4);
    buf.writeUInt8(unitId, 6);
    buf.writeUInt8(fc, 7);           //FC
    buf.writeUInt16BE(addr, 8);
    buf.writeUInt16BE(value, 10);

    return { tx, buf };
}

export function buildWriteMultiHolding(unitId, start, values) {
    const tx = nextTxId();
    const qty = values.length;
    const byteCount = qty * 2;

    const buf = Buffer.alloc(13 + byteCount);

    buf.writeUInt16BE(tx, 0);
    buf.writeUInt16BE(0, 2);
    buf.writeUInt16BE(7 + byteCount, 4);
    buf.writeUInt8(unitId, 6);
    buf.writeUInt8(16, 7);
    buf.writeUInt16BE(start, 8);
    buf.writeUInt16BE(qty, 10);
    buf.writeUInt8(byteCount, 12);

    values.forEach((v, i) => {
        buf.writeUInt16BE(v, 13 + i * 2);
    });

    return { tx, buf };
}

export function buildWriteMutilCoil(unitId, start, values) {
    const tx = nextTxId();
    const qty = values.length;

    const byteCount = Math.ceil(qty / 8);

    const buf = Buffer.alloc(13 + byteCount);

    buf.writeUInt16BE(tx, 0);      // Transaction ID
    buf.writeUInt16BE(0, 2);       // Protocol ID
    buf.writeUInt16BE(7 + byteCount, 4); // Length
    buf.writeUInt8(unitId, 6);    // Unit ID
    buf.writeUInt8(15, 7);        // FC15
    buf.writeUInt16BE(start, 8);  // Start address
    buf.writeUInt16BE(qty, 10);   // Quantity
    buf.writeUInt8(byteCount, 12);

    for (let i = 0; i < qty; i++) {
        if (values[i]) {
            const byteIndex = Math.floor(i / 8);
            const bitIndex = i % 8;
            buf[13 + byteIndex] |= 1 << bitIndex;
        }
    }

    return { tx, buf };
}



// ตัวอย่าง Modbus TCP message

// เราลองมาดูตัวอย่างโปรโตคอล Modbus RTU สำหรับอ่านค่าอนาลอกเอาท์พุตของ Holding register แอดเดรส 40108 ถึง 40110 จาก Slave หมายเลข 17

// 11 03 006B 0003 7687
// 11: SlaveID Address (17 = 11 hex)
// 03: Function Code (read Analog Output Holding Registers)
// 006B: Data Address ของ register ตัวแรก (40108-40001 = 107 =6B hex)
// 0003: จำนวน registers ที่ต้องการอ่าน (อ่าน 3 ตัว 40108 ถึง 40110)
// 7687: เป็น CRC (cyclic redundancy check) สำหรับเช็คความผิดพลาด

// เมื่อนำไปรวมกับ MBAP จะได้รายละเอียดโปรโตคอล Modbus TCP ดังนี้ ซึ่ง Frame checksum (CRC) จะถูกตัดออกไป

// 0001 0000 0006 11 03 006B 0003

// 0001: Transaction Identifier
// 0000: Protocol Identifier
// 0006: Message Length (6 bytes ที่อยู่ตำแหน่งถัดไปจาก Byte นี้)
// 11:     Unit Identifier  (17 = 11 hex)
// 03:     Function Code (อ่านค่า Analog Output Holding Registers)
// 006B: Data Address ของ register ตัวแรก (40108-40001 = 107 =6B hex)
// 0003: จำนวน registers ที่ต้องการอ่าน (อ่าน 3 ตัว 40108 ถึง 40110)