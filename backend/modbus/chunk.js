
export function buildChunks(start, length, chunkSize) {
    const chunks = [];
    let offset = 0;

    while (offset < length) {
        const size = Math.min(chunkSize, length - offset);
        chunks.push({
            start: start + offset,
            length: size,
            offset
        });
        offset += size;
    }

    return chunks;
}