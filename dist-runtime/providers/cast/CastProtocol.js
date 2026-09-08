export const CAST_PROTOCOL_VERSION = 0;
export const CAST_PAYLOAD_TYPE_STRING = 0;
export function encodeCastMessage(message) {
    const fields = [];
    fields.push(encodeVarintField(1, message.protocolVersion));
    fields.push(encodeStringField(2, message.sourceId));
    fields.push(encodeStringField(3, message.destinationId));
    fields.push(encodeStringField(4, message.namespace));
    fields.push(encodeVarintField(5, message.payloadType));
    if (message.payloadUtf8 !==
        undefined) {
        fields.push(encodeStringField(6, message.payloadUtf8));
    }
    if (message.payloadBinary !==
        undefined) {
        fields.push(encodeBytesField(7, message.payloadBinary));
    }
    return Buffer.concat(fields);
}
export function decodeCastMessage(buffer) {
    let offset = 0;
    const message = {};
    while (offset < buffer.length) {
        const tag = decodeVarint(buffer, offset);
        offset =
            tag.nextOffset;
        const fieldNumber = tag.value >>> 3;
        const wireType = tag.value & 0x07;
        if (wireType === 0) {
            const value = decodeVarint(buffer, offset);
            offset =
                value.nextOffset;
            if (fieldNumber === 1) {
                message.protocolVersion =
                    value.value;
            }
            else if (fieldNumber === 5) {
                message.payloadType =
                    value.value;
            }
            continue;
        }
        if (wireType === 2) {
            const length = decodeVarint(buffer, offset);
            offset =
                length.nextOffset;
            const end = offset +
                length.value;
            if (end >
                buffer.length) {
                throw new Error('Invalid Cast protobuf length.');
            }
            const value = buffer.subarray(offset, end);
            offset = end;
            switch (fieldNumber) {
                case 2:
                    message.sourceId =
                        value.toString('utf8');
                    break;
                case 3:
                    message.destinationId =
                        value.toString('utf8');
                    break;
                case 4:
                    message.namespace =
                        value.toString('utf8');
                    break;
                case 6:
                    message.payloadUtf8 =
                        value.toString('utf8');
                    break;
                case 7:
                    message.payloadBinary =
                        Buffer.from(value);
                    break;
            }
            continue;
        }
        throw new Error(`Unsupported Cast protobuf wire type: ${wireType}.`);
    }
    if (message.protocolVersion ===
        undefined ||
        message.sourceId ===
            undefined ||
        message.destinationId ===
            undefined ||
        message.namespace ===
            undefined ||
        message.payloadType ===
            undefined) {
        throw new Error('Cast protobuf message is incomplete.');
    }
    return message;
}
export function frameCastMessage(message) {
    const payload = encodeCastMessage(message);
    const header = Buffer.allocUnsafe(4);
    header.writeUInt32BE(payload.length, 0);
    return Buffer.concat([
        header,
        payload,
    ]);
}
function encodeVarintField(fieldNumber, value) {
    return Buffer.concat([
        encodeVarint(fieldNumber << 3),
        encodeVarint(value),
    ]);
}
function encodeStringField(fieldNumber, value) {
    return encodeBytesField(fieldNumber, Buffer.from(value, 'utf8'));
}
function encodeBytesField(fieldNumber, value) {
    return Buffer.concat([
        encodeVarint((fieldNumber << 3) | 2),
        encodeVarint(value.length),
        value,
    ]);
}
function encodeVarint(value) {
    if (!Number.isSafeInteger(value) ||
        value < 0) {
        throw new Error('Invalid protobuf varint value.');
    }
    const bytes = [];
    let remaining = value;
    while (remaining >= 0x80) {
        bytes.push((remaining & 0x7f) |
            0x80);
        remaining =
            Math.floor(remaining / 128);
    }
    bytes.push(remaining);
    return Buffer.from(bytes);
}
function decodeVarint(buffer, startOffset) {
    let result = 0;
    let multiplier = 1;
    let offset = startOffset;
    while (offset < buffer.length) {
        const byte = buffer[offset];
        result +=
            (byte & 0x7f) *
                multiplier;
        offset += 1;
        if ((byte & 0x80) === 0) {
            if (!Number.isSafeInteger(result)) {
                throw new Error('Protobuf varint exceeds the safe integer range.');
            }
            return {
                value: result,
                nextOffset: offset,
            };
        }
        multiplier *= 128;
        if (multiplier >
            Number.MAX_SAFE_INTEGER) {
            throw new Error('Invalid protobuf varint.');
        }
    }
    throw new Error('Unexpected end of protobuf varint.');
}
