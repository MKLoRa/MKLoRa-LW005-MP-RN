/**
 * LW005-MP 扫描广播解析（对齐 MKMPCentralManager.m parseModelWithRssi）
 *
 * 原生仅认 CBAdvertisementDataManufacturerData：25 字节，头 04AA。
 * iOS ble-plx 常把 device.manufacturerData 置空，载荷在 rawScanRecord(JSON) 内。
 */
import {Platform} from 'react-native';
import {Device} from 'react-native-ble-plx';
import {PROTOCOL} from '../sdk/MPSDKDefines';
import {hexStringFromData} from './BleHexUtils';
import {base64ToBytes, utf8Decode} from './base64';

export const MP_CONTENT_HEX_LEN = (PROTOCOL.MANUFACTURER_DATA_LEN - 2) * 2;

/** 原生 scanForPeripheralsWithServices:AA04 */
export function getMpScanServiceUuids(): string[] {
  return [...PROTOCOL.SCAN_SERVICE_UUIDS];
}

/** iOS 按 AA04 过滤（与原生 CBUUID AA04 一致）；Android 全扫 */
export function getMpScanServiceFilter(): string[] | null {
  return Platform.OS === 'ios' ? getMpScanServiceUuids() : null;
}

export function bytesFromManufacturerField(raw: unknown): Uint8Array | null {
  if (typeof raw === 'string') {
    const bytes = base64ToBytes(raw);
    return bytes.length > 0 ? bytes : null;
  }
  if (raw instanceof Uint8Array) {
    return raw.length > 0 ? raw : null;
  }
  if (Array.isArray(raw)) {
    const bytes = Uint8Array.from(raw);
    return bytes.length > 0 ? bytes : null;
  }
  return null;
}

/** 规范为 25 字节：2B 厂商 ID 04AA + 23B 载荷 */
export function normalizeMpManufacturerBytes(bytes: Uint8Array): Uint8Array | null {
  let slice = bytes;
  if (bytes.length > PROTOCOL.MANUFACTURER_DATA_LEN) {
    slice = bytes.subarray(0, PROTOCOL.MANUFACTURER_DATA_LEN);
  }
  if (slice.length === PROTOCOL.MANUFACTURER_DATA_LEN) {
    const hex = hexStringFromData(slice);
    return hex.startsWith(PROTOCOL.MANUFACTURER_HEADER) ? slice : null;
  }
  if (bytes.length === PROTOCOL.MANUFACTURER_DATA_LEN - 2) {
    const out = new Uint8Array(PROTOCOL.MANUFACTURER_DATA_LEN);
    out[0] = 0x04;
    out[1] = 0xaa;
    out.set(bytes, 2);
    const hex = hexStringFromData(out);
    return hex.startsWith(PROTOCOL.MANUFACTURER_HEADER) ? out : null;
  }
  return null;
}

/** 对齐原生：仅 25 字节且头 04AA */
function contentHexFromNativeManufacturer(bytes: Uint8Array): string | null {
  if (bytes.length !== PROTOCOL.MANUFACTURER_DATA_LEN) {
    return null;
  }
  const hex = hexStringFromData(bytes);
  if (hex.substring(0, 4).toUpperCase() !== '04AA') {
    return null;
  }
  const content = hex.substring(4);
  return content.length >= MP_CONTENT_HEX_LEN ? content : null;
}

function contentHexFromNormalizedBytes(normalized: Uint8Array): string | null {
  const strict = contentHexFromNativeManufacturer(normalized);
  if (strict) {
    return strict;
  }
  const hex = hexStringFromData(normalized);
  if (!hex.startsWith(PROTOCOL.MANUFACTURER_HEADER)) {
    return null;
  }
  const content = hex.substring(4);
  return content.length >= MP_CONTENT_HEX_LEN ? content : null;
}

/** iOS ble-plx：rawScanRecord = base64(JSON)，manufacturerData 在 JSON 内 */
function extractManufacturerFromIosBlePlxJson(
  rawScanRecord: string,
): Uint8Array | null {
  if (Platform.OS !== 'ios') {
    return null;
  }
  try {
    const jsonText = utf8Decode(base64ToBytes(rawScanRecord));
    const payload = JSON.parse(jsonText) as {manufacturerData?: unknown};
    const nested = bytesFromManufacturerField(payload.manufacturerData);
    if (!nested) {
      return null;
    }
    return (
      normalizeMpManufacturerBytes(nested) ??
      (nested.length === PROTOCOL.MANUFACTURER_DATA_LEN ? nested : null)
    );
  } catch {
    return null;
  }
}

/** Android：rawScanRecord 为二进制 AD，解析 0xFF Manufacturer */
export function extractManufacturerFromRawScanRecord(
  rawScanRecord: string,
): Uint8Array | null {
  const raw = base64ToBytes(rawScanRecord);
  let offset = 0;
  while (offset < raw.length) {
    const len = raw[offset];
    if (len === 0) {
      break;
    }
    if (offset + 1 + len > raw.length) {
      break;
    }
    const type = raw[offset + 1];
    if (type === 0xff) {
      const mfg = raw.subarray(offset + 2, offset + 1 + len);
      const normalized = normalizeMpManufacturerBytes(mfg);
      if (normalized) {
        return normalized;
      }
    }
    offset += len + 1;
  }
  return null;
}

function getMpManufacturerBytes(device: Device): Uint8Array | null {
  // iOS：优先 rawScanRecord JSON（ble-plx 顶层 manufacturerData 常为 null）
  if (Platform.OS === 'ios' && device.rawScanRecord) {
    const fromJson = extractManufacturerFromIosBlePlxJson(device.rawScanRecord);
    if (fromJson) {
      return fromJson;
    }
  }

  const fromField = bytesFromManufacturerField(device.manufacturerData);
  if (fromField) {
    const normalized =
      normalizeMpManufacturerBytes(fromField) ??
      (fromField.length === PROTOCOL.MANUFACTURER_DATA_LEN ? fromField : null);
    if (normalized) {
      return normalized;
    }
  }

  if (device.rawScanRecord && Platform.OS === 'android') {
    return extractManufacturerFromRawScanRecord(device.rawScanRecord);
  }

  return null;
}

/**
 * 解析 MP 广播 content（46 hex = 23B），对齐 MKMPCentralManager.m。
 */
export function extractMpManufacturerContentHex(device: Device): string | null {
  const bytes = getMpManufacturerBytes(device);
  if (!bytes) {
    return null;
  }

  const strict = contentHexFromNativeManufacturer(bytes);
  if (strict) {
    return strict;
  }

  const normalized = normalizeMpManufacturerBytes(bytes);
  if (normalized) {
    return contentHexFromNormalizedBytes(normalized);
  }

  return null;
}
