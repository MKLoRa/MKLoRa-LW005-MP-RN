import {PositioningStrategy} from '../sdk/MPSDKDefines';

export const SAVE_VALIDATION_MSG_AUXILIARY =
  'Opps！Save failed. Please check the input characters and try again.';

export const ALARM_TYPE_OPTIONS = ['NO', 'Alert', 'SOS'] as const;

export const ALERT_TRIGGER_MODE_OPTIONS = [
  'Single Click',
  'Double Click',
  'Long Press 1s',
  'Long Press 2s',
  'Long Press 3s',
] as const;

export const SOS_TRIGGER_MODE_OPTIONS = [
  'Double Click',
  'Triple Click',
  'Long Press 1s',
  'Long Press 2s',
  'Long Press 3s',
] as const;

export type DownlinkState = {strategy: number};

export type VibrationState = {
  isOn: boolean;
  thresholds: string;
  reportInterval: string;
  shockTimeout: string;
};

export type ManDownState = {
  isOn: boolean;
  timeout: string;
};

export type AlarmFunctionState = {
  alarmType: number;
  exitTime: string;
};

export type AlertAlarmState = {
  mode: number;
  strategy: number;
  notifyStart: boolean;
  notifyEnd: boolean;
};

export type SosAlarmState = {
  mode: number;
  strategy: number;
  reportInterval: string;
  notifyStart: boolean;
  notifyEnd: boolean;
};

export type TempMonitorState = {
  isOn: boolean;
  sampleRate: string;
  temperature: string;
  alarmSwitch: boolean;
  maxThreshold: string;
  minThreshold: string;
};

export type LightMonitorState = {
  isOn: boolean;
  sampleRate: string;
  intensity: string;
  alarmSwitch: boolean;
  lightThreshold: string;
};

export function filterSignedInt(raw: string, maxLength = 4): string {
  let s = raw.replace(/[^0-9-]/g, '');
  if (s.includes('-')) {
    s = (s.startsWith('-') ? '-' : '') + s.replace(/-/g, '');
  }
  return s.slice(0, maxLength);
}

export function validateVibration(state: VibrationState): boolean {
  const t = parseInt(state.thresholds, 10);
  const r = parseInt(state.reportInterval, 10);
  const to = parseInt(state.shockTimeout, 10);
  if (
    !state.thresholds ||
    Number.isNaN(t) ||
    t < 10 ||
    t > 255 ||
    !state.reportInterval ||
    Number.isNaN(r) ||
    r < 3 ||
    r > 255 ||
    !state.shockTimeout ||
    Number.isNaN(to) ||
    to < 1 ||
    to > 20
  ) {
    return false;
  }
  return true;
}

export function validateManDown(state: ManDownState): boolean {
  const timeout = parseInt(state.timeout, 10);
  if (!state.timeout || Number.isNaN(timeout) || timeout < 1 || timeout > 8760) {
    return false;
  }
  return true;
}

export function validateAlarmFunction(state: AlarmFunctionState): boolean {
  const t = parseInt(state.exitTime, 10);
  return (
    !!state.exitTime && !Number.isNaN(t) && t >= 5 && t <= 15
  );
}

export function validateSosAlarm(state: SosAlarmState): boolean {
  const interval = parseInt(state.reportInterval, 10);
  return (
    !!state.reportInterval &&
    !Number.isNaN(interval) &&
    interval >= 10 &&
    interval <= 600
  );
}

export function validateTempMonitor(state: TempMonitorState): boolean {
  const rate = parseInt(state.sampleRate, 10);
  const max = parseInt(state.maxThreshold, 10);
  const min = parseInt(state.minThreshold, 10);
  if (
    !state.sampleRate ||
    Number.isNaN(rate) ||
    rate < 1 ||
    rate > 3600 ||
    !state.maxThreshold ||
    Number.isNaN(max) ||
    max < -20 ||
    max > 60 ||
    !state.minThreshold ||
    Number.isNaN(min) ||
    min < -20 ||
    min > 60
  ) {
    return false;
  }
  return true;
}

export function validateLightMonitor(state: LightMonitorState): boolean {
  const rate = parseInt(state.sampleRate, 10);
  const th = parseInt(state.lightThreshold, 10);
  if (
    !state.sampleRate ||
    Number.isNaN(rate) ||
    rate < 1 ||
    rate > 3600 ||
    !state.lightThreshold ||
    Number.isNaN(th) ||
    th < 10 ||
    th > 300
  ) {
    return false;
  }
  return true;
}

export function clampStrategy(index: number): PositioningStrategy {
  if (index < 0 || index > PositioningStrategy.BLE_MUL_GPS) {
    return PositioningStrategy.BLE;
  }
  return index as PositioningStrategy;
}
