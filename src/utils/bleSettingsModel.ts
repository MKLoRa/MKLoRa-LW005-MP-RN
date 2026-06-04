import {TxPower} from '../sdk/MPSDKDefines';

/** 对齐 MKMPBleSettingsDataModel */
export type BleSettingsState = {
  advName: string;
  interval: string;
  connectable: boolean;
  needPassword: boolean;
  txPower: TxPower;
};

export const SAVE_VALIDATION_MSG_BLE_SETTINGS =
  'Opps！Save failed. Please check the input characters and try again.';

const TX_POWER_LABELS: Record<TxPower, string> = {
  [TxPower.Neg40dBm]: '-40dBm',
  [TxPower.Neg20dBm]: '-20dBm',
  [TxPower.Neg16dBm]: '-16dBm',
  [TxPower.Neg12dBm]: '-12dBm',
  [TxPower.Neg8dBm]: '-8dBm',
  [TxPower.Neg4dBm]: '-4dBm',
  [TxPower.d0]: '0dBm',
  [TxPower.d3]: '3dBm',
  [TxPower.d4]: '4dBm',
};

export function txPowerLabel(power: TxPower): string {
  return TX_POWER_LABELS[power] ?? '0dBm';
}

/** 设备读回 dBm 文案 → TxPower 枚举（对齐 fetchTxPowerValueString） */
export function txPowerFromLabel(label: string): TxPower {
  const entry = Object.entries(TX_POWER_LABELS).find(([, v]) => v === label);
  if (entry) {
    return Number(entry[0]) as TxPower;
  }
  return TxPower.Neg4dBm;
}

export function validateBleSettings(state: BleSettingsState): boolean {
  if (state.advName.length > 16) {
    return false;
  }
  const interval = parseInt(state.interval, 10);
  return (
    !!state.interval &&
    !Number.isNaN(interval) &&
    interval >= 1 &&
    interval <= 100
  );
}
