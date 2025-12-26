
// MBAP Header
// 0-1   Transaction ID
// 2-3   Protocol ID
// 4-5   Length
// 6     Unit ID

// PDU
// 7     Function Code
// 8     Byte Count
// 9..   Data (N bytes)


export function parseResponse(buffer) {
    return {
        txId: buffer.readUInt16BE(0),
        unitId: buffer.readUInt8(6),
        fc: buffer.readUInt8(7),
        byteCount: buffer.readUInt8(8),
        data: buffer.slice(9, 9 + buffer.readUInt8(8))
    };
}
