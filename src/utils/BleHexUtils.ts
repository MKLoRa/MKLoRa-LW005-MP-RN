/**
 * BLE hex utilities — port of MKBLEBaseSDKAdopter helpers used by MKMP SDK.
 */

export function hexStringFromData(data: Uint8Array): string {
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toLowerCase();
}

export function stringToData(hex: string): Uint8Array {
  const normalized = hex.replace(/\s/g, '').toLowerCase();
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.substring(i, i + 2), 16);
  }
  return bytes;
}

export function getDecimalWithHex(hex: string, start: number, length: number): number {
  const sub = hex.substring(start, start + length);
  return parseInt(sub, 16);
}

export function getDecimalStringWithHex(hex: string, start: number, length: number): string {
  return String(getDecimalWithHex(hex, start, length));
}

/** 有符号数转 1 字节 hex（时区等） */
export function hexStringFromSignedNumber(value: number): string {
  if (value >= 0) {
    return fetchHexValue(value, 1);
  }
  const byte = value < 0 ? (256 + value) & 0xff : value;
  return fetchHexValue(byte, 1);
}

export function signedHexTurnString(hex: string): string {
  const value = parseInt(hex, 16);
  if (hex.length <= 2) {
    return value > 127 ? String(value - 256) : String(value);
  }
  if (hex.length <= 4) {
    return value > 32767 ? String(value - 65536) : String(value);
  }
  return String(value);
}

export function fetchHexValue(value: number, byteLen: number): string {
  let hex = value.toString(16);
  const targetLen = byteLen * 2;
  while (hex.length < targetLen) {
    hex = '0' + hex;
  }
  return hex.slice(-targetLen);
}

export function checkHexCharacter(hex: string): boolean {
  return /^[0-9A-Fa-f]+$/.test(hex);
}

const HEX_BINARY_MAP: Record<string, string> = {
  '0': '0000', '1': '0001', '2': '0010', '3': '0011', '4': '0100', '5': '0101',
  '6': '0110', '7': '0111', '8': '1000', '9': '1001', A: '1010', a: '1010',
  B: '1011', b: '1011', C: '1100', c: '1100', D: '1101', d: '1101',
  E: '1110', e: '1110', F: '1111', f: '1111',
};

export function binaryByHex(hex: string): string {
  if (!hex || !/^[0-9A-Fa-f]+$/.test(hex)) {
    return '';
  }
  let normalized = hex;
  if (normalized.length % 2 !== 0) {
    normalized = '0'.repeat(2 - (normalized.length % 2)) + normalized;
  }
  return normalized
    .split('')
    .map(c => HEX_BINARY_MAP[c] ?? '')
    .join('');
}

export function getHexByBinary(binary: string): string {
  const padded = binary.padStart(Math.ceil(binary.length / 4) * 4, '0');
  let hex = '';
  for (let i = 0; i < padded.length; i += 4) {
    hex += parseInt(padded.substring(i, i + 4), 2).toString(16);
  }
  return hex;
}

export {base64ToBytes as base64ToUint8Array, bytesToBase64} from './base64';
