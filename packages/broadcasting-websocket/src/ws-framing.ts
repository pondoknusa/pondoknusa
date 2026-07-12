import { createHash, randomBytes } from 'node:crypto';
import type { Socket } from 'node:net';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function computeAcceptKey(secWebSocketKey: string): string {
  return createHash('sha1').update(secWebSocketKey + WS_GUID).digest('base64');
}

export function writeUpgradeResponse(socket: Socket, acceptKey: string): void {
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n'
    + 'Upgrade: websocket\r\n'
    + 'Connection: Upgrade\r\n'
    + `Sec-WebSocket-Accept: ${acceptKey}\r\n\r\n`,
  );
}

export type WebSocketConnection = {
  socketId: string;
  send: (message: string) => void;
  close: () => void;
  onMessage: (handler: (message: string) => void) => void;
  onClose: (handler: () => void) => void;
};

export function acceptWebSocket(socket: Socket): WebSocketConnection {
  const socketId = randomBytes(16).toString('hex');
  let messageHandler: ((message: string) => void) | undefined;
  let closeHandler: (() => void) | undefined;
  let buffer = Buffer.alloc(0);
  let closed = false;

  const connection: WebSocketConnection = {
    socketId,
    send(message: string) {
      if (closed) {
        return;
      }
      socket.write(encodeTextFrame(message));
    },
    close() {
      if (closed) {
        return;
      }
      closed = true;
      socket.end();
    },
    onMessage(handler) {
      messageHandler = handler;
    },
    onClose(handler) {
      closeHandler = handler;
    },
  };

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
    while (buffer.length > 0) {
      const frame = decodeClientTextFrame(buffer);
      if (!frame) {
        break;
      }
      buffer = Buffer.from(frame.remaining);
      if (frame.payload !== undefined) {
        if (frame.close) {
          connection.close();
          return;
        }
        if (frame.payload.length > 0) {
          messageHandler?.(frame.payload);
        }
      }
    }
  });

  socket.on('close', () => {
    if (!closed) {
      closed = true;
      closeHandler?.();
    }
  });

  socket.on('error', () => {
    connection.close();
  });

  return connection;
}

function encodeTextFrame(message: string): Buffer {
  const payload = Buffer.from(message, 'utf8');
  const length = payload.length;
  if (length < 126) {
    const header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = length;
    return Buffer.concat([header, payload]);
  }

  if (length < 65_536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, payload]);
}

type DecodedFrame = {
  payload?: string;
  close?: boolean;
  remaining: Buffer;
};

const MAX_WS_PAYLOAD_BYTES = 1024 * 1024;

function decodeClientTextFrame(buffer: Buffer): DecodedFrame | null {
  if (buffer.length < 2) {
    return null;
  }

  const firstByte = buffer.readUInt8(0);
  const secondByte = buffer.readUInt8(1);
  const opcode = firstByte & 0x0f;
  const masked = (secondByte & 0x80) !== 0;
  let payloadLength = secondByte & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) {
      return null;
    }
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) {
      return null;
    }
    const lengthBig = buffer.readBigUInt64BE(2);
    if (lengthBig > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('WebSocket frame too large.');
    }
    payloadLength = Number(lengthBig);
    offset = 10;
  }

  if (payloadLength > MAX_WS_PAYLOAD_BYTES) {
    throw new Error('WebSocket frame too large.');
  }

  const maskLength = masked ? 4 : 0;
  const totalLength = offset + maskLength + payloadLength;
  if (buffer.length < totalLength) {
    return null;
  }

  if (opcode === 0x8) {
    return { close: true, remaining: buffer.subarray(totalLength) };
  }

  if (opcode !== 0x1 && opcode !== 0x0) {
    return { remaining: buffer.subarray(totalLength) };
  }

  let payload = buffer.subarray(offset + maskLength, totalLength);
  if (masked) {
    const mask = buffer.subarray(offset, offset + 4);
    payload = Buffer.from(payload);
    for (let i = 0; i < payload.length; i++) {
      payload[i] = payload[i]! ^ mask.readUInt8(i % 4);
    }
  }

  return {
    payload: payload.toString('utf8'),
    remaining: buffer.subarray(totalLength),
  };
}