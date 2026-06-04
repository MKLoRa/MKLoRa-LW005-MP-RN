import {LoRaWanModem, LoRaWanRegion} from '../sdk/MPSDKDefines';

/** 对齐 MKMPLoRaSettingModel RegionList（Third Party NS, platform=0） */
export const REGION_OPTIONS = [
  'AS923',
  'AU915',
  'CN470',
  'CN779',
  'EU433',
  'EU868',
  'KR920',
  'IN865',
  'US915',
  'RU864',
] as const;

export const MODEM_OPTIONS = ['ABP', 'OTAA'] as const;
export const CLASS_TYPE_OPTIONS = ['Class A', 'Class C'] as const;
export const MESSAGE_TYPE_OPTIONS = ['Unconfirmed', 'Confirmed'] as const;
export const MAX_RETRANSMISSION_OPTIONS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
] as const;

/** 1=ABP, 2=OTAA (iOS MKMPLoRaSettingModel) */
export type ConnectionSettingsState = {
  modem: number;
  devEUI: string;
  appEUI: string;
  appKey: string;
  devAddr: string;
  appSKey: string;
  nwkSKey: string;
  /** 设备频段键 0–9，与 LoRaWanRegion 枚举一致 */
  region: number;
  needAdvanceSetting: boolean;
  advancedStatus: boolean;
  CHL: number;
  CHH: number;
  dutyIsOn: boolean;
  join: number;
  adrIsOn: boolean;
  DRL: number;
  DRH: number;
  /** 0=Class A UI，1=Class C UI */
  classType: number;
  /** 0=Unconfirmed，1=Confirmed */
  messageType: number;
  /** UI 下标 0–7，写入设备为 maxRetransmission + 1 */
  maxRetransmission: number;
  /** 上行 Transmissions：设备值 1 或 2 */
  transmissions: number;
};

export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettingsState = {
  modem: 1,
  devEUI: '',
  appEUI: '',
  appKey: '',
  devAddr: '',
  appSKey: '',
  nwkSKey: '',
  region: LoRaWanRegion.AS923,
  needAdvanceSetting: true,
  advancedStatus: false,
  CHL: 0,
  CHH: 15,
  dutyIsOn: false,
  join: 0,
  adrIsOn: true,
  DRL: 0,
  DRH: 0,
  classType: 0,
  messageType: 0,
  maxRetransmission: 0,
  transmissions: 1,
};

/** platform=0 时 currentRegion 即 region（Third Party NS） */
export function currentRegion(region: number): number {
  return region;
}

export function deviceModemToUiModel(deviceModem: number): number {
  if (deviceModem === 1 || deviceModem === 2) {
    return deviceModem;
  }
  return deviceModem === 0 ? 2 : 1;
}

export function uiModemToDeviceModem(uiModem: number): LoRaWanModem {
  return (uiModem - 1) as LoRaWanModem;
}

export function clampDeviceRegion(region: number): number {
  if (region >= 0 && region <= 9) {
    return region;
  }
  return LoRaWanRegion.AS923;
}

function loadStringWithMaxValue(max: number): string[] {
  return Array.from({length: max + 1}, (_, i) => String(i));
}

/** 对齐 MKMPLoRaSettingModel CHLValueList */
export function chlValueList(region: number): string[] {
  const r = currentRegion(region);
  if (r === 1 || r === 8) {
    return loadStringWithMaxValue(63);
  }
  if (r === 2) {
    return loadStringWithMaxValue(95);
  }
  if (r === 3 || r === 4 || r === 5 || r === 6 || r === 7) {
    return loadStringWithMaxValue(2);
  }
  return loadStringWithMaxValue(1);
}

export function chhValueList(region: number, chl: number): string[] {
  const list = chlValueList(region);
  return list.slice(chl);
}

/** 对齐 MKMPLoRaSettingModel DRValueList */
export function drValueList(region: number): string[] {
  const r = currentRegion(region);
  if (r === 0) {
    return ['2', '3', '4', '5'];
  }
  if (r === 1) {
    return ['2', '3', '4', '5', '6'];
  }
  if (r === 8) {
    return loadStringWithMaxValue(4);
  }
  return loadStringWithMaxValue(5);
}

export function drlValueList(region: number): string[] {
  return drValueList(region);
}

export function drhValueList(region: number, drl: number): string[] {
  const list = drlValueList(region);
  const lowIndex = Math.max(
    0,
    list.findIndex(v => Number(v) === drl),
  );
  return list.slice(lowIndex);
}

export function indexInList(list: string[], value: number): number {
  const idx = list.findIndex(v => Number(v) === value);
  return idx >= 0 ? idx : 0;
}

export function showCHSection(region: number): boolean {
  const r = currentRegion(region);
  return r === 1 || r === 2 || r === 8;
}

export function showDutySection(region: number): boolean {
  const r = currentRegion(region);
  return r === 3 || r === 4 || r === 5 || r === 9;
}

export function showJoinSection(region: number): boolean {
  const r = currentRegion(region);
  return r === 2 || r === 3 || r === 4 || r === 5 || r === 6 || r === 7 || r === 9;
}

/** 对齐 MKMPLoRaSettingModel configAdvanceSettingDefaultParams (platform=0) */
export function advanceDefaultsForRegion(
  region: number,
  _base: ConnectionSettingsState,
): Partial<ConnectionSettingsState> {
  const r = currentRegion(region);
  const next: Partial<ConnectionSettingsState> = {
    CHL: 0,
    dutyIsOn: false,
    adrIsOn: true,
  };
  if (r === 1 || r === 8) {
    next.CHL = 8;
    next.CHH = 15;
  } else if (r === 2) {
    next.CHH = 7;
  } else if (r === 3 || r === 4 || r === 5 || r === 6 || r === 7) {
    next.CHH = 2;
  } else if (r === 0 || r === 9) {
    next.CHH = 1;
  }
  if (r === 0 || r === 1) {
    next.join = 2;
    next.DRL = 2;
    next.DRH = 2;
  } else {
    next.join = 0;
    next.DRL = 0;
    next.DRH = 0;
  }
  return next;
}

const HEX_RE = /^[0-9a-fA-F]*$/;

export function isValidHex(s: string, len?: number): boolean {
  if (!s || !HEX_RE.test(s)) {
    return false;
  }
  if (len != null && s.length !== len) {
    return false;
  }
  return true;
}

export function filterHexInput(text: string, maxLength: number): string {
  return text.replace(/[^0-9a-fA-F]/gi, '').slice(0, maxLength).toLowerCase();
}

export function filterDigits(text: string, maxLength: number): string {
  return text.replace(/\D/g, '').slice(0, maxLength);
}

/** 对齐 MKMPLoRaSettingModel checkParams */
export function validateConnectionSettings(
  s: ConnectionSettingsState,
): boolean {
  if (s.modem !== 1 && s.modem !== 2) {
    return false;
  }
  if (!isValidHex(s.devEUI, 16) || !isValidHex(s.appEUI, 16)) {
    return false;
  }
  if (s.modem === 1) {
    if (
      !isValidHex(s.devAddr, 8) ||
      !isValidHex(s.nwkSKey, 32) ||
      !isValidHex(s.appSKey, 32)
    ) {
      return false;
    }
  } else if (!isValidHex(s.appKey, 32)) {
    return false;
  }
  const r = currentRegion(s.region);
  if (r < 0 || r > 9) {
    return false;
  }
  if (s.messageType !== 0 && s.messageType !== 1) {
    return false;
  }
  if (!s.needAdvanceSetting || !s.advancedStatus) {
    return true;
  }
  if (showCHSection(s.region)) {
    if (s.CHL < 0 || s.CHL > 95 || s.CHH < s.CHL || s.CHH > 95) {
      return false;
    }
  }
  if (
    r === 0 ||
    r === 2 ||
    r === 3 ||
    r === 4 ||
    r === 5 ||
    r === 6 ||
    r === 7
  ) {
    if (s.join < 0 || s.join > 5) {
      return false;
    }
  }
  if (s.maxRetransmission < 0 || s.maxRetransmission > 7) {
    return false;
  }
  if (s.DRL < 0 || s.DRL > 6 || s.DRH < s.DRL || s.DRH > 6) {
    return false;
  }
  return true;
}

export const SAVE_VALIDATION_MSG =
  'Opps！Save failed. Please check the input characters and try again.';
