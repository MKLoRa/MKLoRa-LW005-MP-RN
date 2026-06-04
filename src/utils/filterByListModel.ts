import {checkHexCharacter} from '../utils/BleHexUtils';

export type FilterByListState = {
  match: boolean;
  filter: boolean;
  items: string[];
};

export const SAVE_VALIDATION_MSG_FILTER =
  'Opps！Save failed. Please check the input characters and try again.';

export function filterHexMacInput(text: string): string {
  return text.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
}

/** 仅保留十六进制字符（对齐 iOS mk_hexCharOnly） */
export function filterHexInput(text: string): string {
  return filterHexMacInput(text);
}

/** 设备读回的 hex 字段展示为小写（与输入框 filterHexInput 一致） */
export function formatHexForDisplay(hex: string): string {
  return filterHexMacInput(hex);
}

export function formatHexList(list: unknown): string[] {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.map(item => formatHexForDisplay(String(item ?? '')));
}

/** 仅保留数字（Major/Minor、Raw Data 索引等） */
export function filterDecimalInput(text: string, maxLength?: number): string {
  let v = text.replace(/\D/g, '');
  if (maxLength !== undefined) {
    v = v.slice(0, maxLength);
  }
  return v;
}

export function validateMacList(macList: string[]): boolean {
  if (macList.length > 10) {
    return false;
  }
  for (const mac of macList) {
    if (
      mac.length % 2 !== 0 ||
      !mac ||
      mac.length > 12 ||
      !checkHexCharacter(mac)
    ) {
      return false;
    }
  }
  return true;
}

export function validateAdvNameList(nameList: string[]): boolean {
  if (nameList.length > 10) {
    return false;
  }
  for (const name of nameList) {
    if (!name || name.length > 20) {
      return false;
    }
  }
  return true;
}
