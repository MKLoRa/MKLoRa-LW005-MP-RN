import {FilterByOther} from '../sdk/MPSDKDefines';
import type {BLEFilterRawData} from '../sdk/MPConfigSupport';
import {isConfirmRawFilterProtocol} from '../sdk/MPConfigSupport';
import {checkHexCharacter} from './BleHexUtils';
import {validateMajorMinorPair} from './filterRangeModel';
import {formatHexForDisplay} from './filterByListModel';

export type FilterTypeStatus = {
  other: boolean;
  iBeacon: boolean;
  uid: boolean;
  url: boolean;
  tlm: boolean;
  bxp_acc: boolean;
  bxp_th: boolean;
  bxp_ts: boolean;
  bxp_deviceInfo: boolean;
  bxp_button: boolean;
  bxp_pir: boolean;
  bxp_tof: boolean;
  bxp_beacon: boolean;
};

export type BeaconFilterState = {
  isOn: boolean;
  minMajor: string;
  maxMajor: string;
  minMinor: string;
  maxMinor: string;
  uuid: string;
};

export type UidFilterState = {
  isOn: boolean;
  namespaceID: string;
  instanceID: string;
};

export type UrlFilterState = {
  isOn: boolean;
  content: string;
};

export type TlmFilterState = {
  isOn: boolean;
  version: number;
};

export type BxpButtonFilterState = {
  isOn: boolean;
  singlePress: boolean;
  doublePress: boolean;
  longPress: boolean;
  abnormal: boolean;
};

export type BxpTagFilterState = {
  isOn: boolean;
  match: boolean;
  filter: boolean;
  items: string[];
};

export type PirFilterState = {
  isOn: boolean;
  delayStatus: number;
  doorStatus: number;
  sensitivity: number;
  detection: number;
  minMajor: string;
  maxMajor: string;
  minMinor: string;
  maxMinor: string;
};

export type TofFilterState = {
  isOn: boolean;
  items: string[];
};

export type OtherFilterCondition = {
  dataType: string;
  minIndex: string;
  maxIndex: string;
  rawData: string;
};

export type OtherFilterState = {
  isOn: boolean;
  relationship: number;
  conditions: OtherFilterCondition[];
};

export const SAVE_VALIDATION_MSG =
  'Opps！Save failed. Please check the input characters and try again.';

export const PIR_DELAY_OPTIONS = [
  'Low delay',
  'Medium delay',
  'High delay',
  'All',
] as const;
export const PIR_DOOR_OPTIONS = ['Close', 'Open', 'All'] as const;
export const PIR_SENSITIVITY_OPTIONS = ['Low', 'Medium', 'High', 'All'] as const;
export const PIR_DETECTION_OPTIONS = [
  'No motion detected',
  'Motion detected',
  'All',
] as const;

export const OTHER_RELATIONSHIP_OPTIONS_BY_COUNT: Record<
  number,
  readonly string[]
> = {
  1: ['A'],
  2: ['A&B', 'A|B'],
  3: ['A&B&C', '(A&B)|C', 'A|B|C'],
};

export function otherRelationshipOptions(count: number): readonly string[] {
  return OTHER_RELATIONSHIP_OPTIONS_BY_COUNT[count] ?? ['A'];
}

export function validateBeaconFilter(s: BeaconFilterState): boolean {
  const uuid = s.uuid ?? '';
  if (uuid.length > 32 || (uuid.length > 0 && uuid.length % 2 !== 0)) {
    return false;
  }
  if (uuid.length > 0 && !/^[0-9a-fA-F]+$/.test(uuid)) {
    return false;
  }
  return (
    validateMajorMinorPair(s.minMinor, s.maxMinor) &&
    validateMajorMinorPair(s.minMajor, s.maxMajor)
  );
}

export function validatePirFilter(s: PirFilterState): boolean {
  return (
    validateMajorMinorPair(s.minMinor, s.maxMinor) &&
    validateMajorMinorPair(s.minMajor, s.maxMajor)
  );
}

export function validateUidFilter(s: UidFilterState): boolean {
  if (
    s.namespaceID.length > 20 ||
    s.instanceID.length > 12 ||
    s.namespaceID.length % 2 !== 0 ||
    s.instanceID.length % 2 !== 0
  ) {
    return false;
  }
  if (s.namespaceID.length > 0 && !checkHexCharacter(s.namespaceID)) {
    return false;
  }
  if (s.instanceID.length > 0 && !checkHexCharacter(s.instanceID)) {
    return false;
  }
  return true;
}

export function validateUrlFilter(s: UrlFilterState): boolean {
  if (s.content.length > 100) {
    return false;
  }
  for (let i = 0; i < s.content.length; i++) {
    const c = s.content.charCodeAt(i);
    if (c < 0x20 || c > 0x7e) {
      return false;
    }
  }
  return true;
}

export function validateTagIdList(items: string[]): boolean {
  if (items.length > 10) {
    return false;
  }
  for (const id of items) {
    if (!id || id.length % 2 !== 0 || id.length > 12 || !/^[0-9a-fA-F]+$/.test(id)) {
      return false;
    }
  }
  return true;
}

export function validateTofCodeList(items: string[]): boolean {
  if (items.length > 10) {
    return false;
  }
  for (const id of items) {
    if (!id || id.length % 2 !== 0 || id.length > 4 || !/^[0-9a-fA-F]+$/.test(id)) {
      return false;
    }
  }
  return true;
}

/** Data Type 展示：00 或空 → 界面留空（对齐 MKFilterByOtherController） */
export function displayOtherDataType(dataType: string): string {
  const t = (dataType ?? '').trim().toLowerCase();
  return t === '' || t === '00' ? '' : t;
}

/** Data Type 保存：空等同于 00（对齐 MKFilterRawAdvDataModel validParams） */
export function otherDataTypeForSave(dataType: string): string {
  const t = (dataType ?? '').trim().toLowerCase();
  return t === '' ? '00' : t;
}

/** 从设备读回的一条 Other 条件 → UI 状态 */
export function otherConditionFromDevice(c: Record<string, unknown>): OtherFilterCondition {
  const type = String(c.type ?? c.dataType ?? '').toLowerCase();
  const dataType = displayOtherDataType(type);
  const minIndex = String(c.start ?? c.minIndex ?? '0');
  const maxIndex = String(c.end ?? c.maxIndex ?? '0');
  const rawData = formatHexForDisplay(String(c.data ?? c.rawData ?? ''));
  if (dataType === '') {
    return {dataType: '', minIndex: '0', maxIndex: '0', rawData};
  }
  return {dataType, minIndex, maxIndex, rawData};
}

export function otherConditionsToBle(
  conditions: OtherFilterCondition[],
): BLEFilterRawData[] {
  return conditions.map(c => {
    const dataType = otherDataTypeForSave(c.dataType);
    let minIndex = parseInt(c.minIndex || '0', 10) || 0;
    let maxIndex = parseInt(c.maxIndex || '0', 10) || 0;
    if (dataType === '00') {
      minIndex = 0;
      maxIndex = 0;
    }
    return {
      dataType,
      minIndex,
      maxIndex,
      rawData: c.rawData,
    };
  });
}

export function validateOtherFilter(state: OtherFilterState): boolean {
  const list = otherConditionsToBle(state.conditions);
  for (const item of list) {
    if (!isConfirmRawFilterProtocol(item)) {
      return false;
    }
  }
  return true;
}

export function relationshipFromPicker(
  count: number,
  index: number,
): FilterByOther {
  if (count === 1) {
    return FilterByOther.A;
  }
  if (count === 2) {
    return index === 0 ? FilterByOther.AB : FilterByOther.AOrB;
  }
  const map = [FilterByOther.ABC, FilterByOther.ABOrC, FilterByOther.AOrBOrC];
  return map[index] ?? FilterByOther.ABC;
}

export function pickerIndexFromRelationship(
  count: number,
  relationship: number,
): number {
  if (count === 1) {
    return 0;
  }
  if (count === 2) {
    return relationship === FilterByOther.AOrB ? 1 : 0;
  }
  if (relationship === FilterByOther.ABOrC) {
    return 1;
  }
  if (relationship === FilterByOther.AOrBOrC) {
    return 2;
  }
  return 0;
}
