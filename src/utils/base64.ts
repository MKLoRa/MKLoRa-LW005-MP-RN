/** Base64 helpers for React Native (no DOM lib required). */

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    result += BASE64_CHARS[(triple >> 18) & 63];
    result += BASE64_CHARS[(triple >> 12) & 63];
    result += i + 1 < bytes.length ? BASE64_CHARS[(triple >> 6) & 63] : '=';
    result += i + 2 < bytes.length ? BASE64_CHARS[triple & 63] : '=';
  }
  return result;
}

export function base64ToBytes(base64: string): Uint8Array {
  const normalized = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  if (!normalized) {
    return new Uint8Array(0);
  }
  let padding = 0;
  if (normalized.endsWith('==')) {
    padding = 2;
  } else if (normalized.endsWith('=')) {
    padding = 1;
  }
  const len = normalized.length;
  const outLen = Math.floor((len * 3) / 4) - padding;
  const bytes = new Uint8Array(outLen);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const enc1 = BASE64_CHARS.indexOf(normalized[i]);
    const enc2 = BASE64_CHARS.indexOf(normalized[i + 1]);
    const enc3 = normalized[i + 2] === '=' ? 0 : BASE64_CHARS.indexOf(normalized[i + 2]);
    const enc4 = normalized[i + 3] === '=' ? 0 : BASE64_CHARS.indexOf(normalized[i + 3]);
    const triple = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4;
    if (p < outLen) {
      bytes[p++] = (triple >> 16) & 255;
    }
    if (p < outLen) {
      bytes[p++] = (triple >> 8) & 255;
    }
    if (p < outLen) {
      bytes[p++] = triple & 255;
    }
  }
  return bytes;
}

/** Decode UTF-8 bytes to string (RN-safe, no DOM). */
export function utf8Decode(bytes: Uint8Array, start = 0): string {
  let out = '';
  let i = start;
  while (i < bytes.length) {
    const c = bytes[i++];
    if (c < 128) {
      out += String.fromCharCode(c);
    } else if (c > 191 && c < 224) {
      out += String.fromCharCode(((c & 31) << 6) | (bytes[i++] & 63));
    } else {
      out += String.fromCharCode(
        ((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63),
      );
    }
  }
  return out;
}
