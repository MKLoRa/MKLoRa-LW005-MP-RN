import {BluetoothFixMechanism} from '../sdk/MPSDKDefines';

export const BLE_FIX_MECHANISM_OPTIONS = [
  'Time Priority',
  'RSSI Priority',
] as const;

export const FILTER_RELATIONSHIP_OPTIONS = [
  'Null',
  'Only MAC',
  'Only ADV Name',
  'Only Raw Data',
  'ADV Name & Raw Data',
  'MAC & ADV Name & Raw Data',
  'ADV Name | Raw Data',
] as const;

export type BleFixState = {
  timeout: string;
  number: string;
  priority: number;
  rssi: number;
  relationship: number;
};

export const DEFAULT_BLE_FIX: BleFixState = {
  timeout: '1',
  number: '1',
  priority: BluetoothFixMechanism.TimePriority,
  rssi: -127,
  relationship: 0,
};

export const SAVE_VALIDATION_MSG_BLE =
  'Opps！Save failed. Please check the input characters and try again.';

export function validateBleFix(s: BleFixState): boolean {
  const t = parseInt(s.timeout, 10);
  const n = parseInt(s.number, 10);
  if (!s.timeout || t < 1 || t > 10) {
    return false;
  }
  if (!s.number || n < 1 || n > 15) {
    return false;
  }
  if (s.rssi < -127 || s.rssi > 0) {
    return false;
  }
  if (s.priority < 0 || s.priority > 1) {
    return false;
  }
  if (s.relationship < 0 || s.relationship > 6) {
    return false;
  }
  return true;
}

export function mechanismLabel(index: number): string {
  return BLE_FIX_MECHANISM_OPTIONS[index] ?? BLE_FIX_MECHANISM_OPTIONS[0];
}

export function filterRelationshipLabel(index: number): string {
  return (
    FILTER_RELATIONSHIP_OPTIONS[index] ?? FILTER_RELATIONSHIP_OPTIONS[0]
  );
}
