import {DeviceMode, PositioningStrategy} from '../sdk/MPSDKDefines';

/** iOS Device Mode 选择器顺序：Standby, Periodic, Timing, Motion, Time-Segmented */
export const DEVICE_MODE_OPTIONS = [
  'Standby Mode',
  'Periodic Mode',
  'Timing Mode',
  'Motion Mode',
  'Time-Segmented Mode',
] as const;

export const POSITIONING_STRATEGY_OPTIONS = [
  'BLE',
  'GPS',
  'BLE+GPS',
  'BLE*GPS',
] as const;

export const POSITIONING_STRATEGY_IN_TRIP_OPTIONS = [
  'BLE',
  'GPS',
  'BLE+GPS',
  'BLE*GPS',
  'BLE&GPS',
] as const;

export function positioningStrategyLabel(index: number): string {
  return POSITIONING_STRATEGY_OPTIONS[index] ?? POSITIONING_STRATEGY_OPTIONS[0];
}

export function positioningStrategyInTripLabel(index: number): string {
  return (
    POSITIONING_STRATEGY_IN_TRIP_OPTIONS[index] ??
    POSITIONING_STRATEGY_IN_TRIP_OPTIONS[0]
  );
}

export function deviceModeFromPickerIndex(index: number): DeviceMode {
  return index as DeviceMode;
}

export function pickerIndexFromDeviceMode(mode: number): number {
  if (mode < 0 || mode > DeviceMode.TimeSegmented) {
    return 0;
  }
  return mode;
}

export type TimingTimePoint = {hour: number; minuteGear: number};

export type TimeSegmentedPeriod = {
  startHour: number;
  startMinuteGear: number;
  endHour: number;
  endMinuteGear: number;
  interval: string;
};

export type MotionModeState = {
  fixOnStart: boolean;
  numberOfFixOnStart: string;
  posStrategyOnStart: number;
  fixInTrip: boolean;
  reportIntervalInTrip: string;
  posStrategyInTrip: number;
  fixOnEnd: boolean;
  tripEndTimeout: string;
  numberOfFixOnEnd: string;
  reportIntervalOnEnd: string;
  posStrategyOnEnd: number;
  fixOnStationary: boolean;
  reportIntervalOnStationary: string;
  posStrategyOnStationary: number;
  notifyEventOnStart: boolean;
  notifyEventInTrip: boolean;
  notifyEventOnEnd: boolean;
};

export const DEFAULT_MOTION_MODE: MotionModeState = {
  fixOnStart: false,
  numberOfFixOnStart: '1',
  posStrategyOnStart: PositioningStrategy.BLE,
  fixInTrip: false,
  reportIntervalInTrip: '60',
  posStrategyInTrip: PositioningStrategy.BLE,
  fixOnEnd: false,
  tripEndTimeout: '30',
  numberOfFixOnEnd: '1',
  reportIntervalOnEnd: '60',
  posStrategyOnEnd: PositioningStrategy.BLE,
  fixOnStationary: false,
  reportIntervalOnStationary: '60',
  posStrategyOnStationary: PositioningStrategy.BLE,
  notifyEventOnStart: false,
  notifyEventInTrip: false,
  notifyEventOnEnd: false,
};

export const SAVE_VALIDATION_MSG =
  'Opps！Save failed. Please check the input characters and try again.';

export function validatePeriodicInterval(interval: string): boolean {
  const n = parseInt(interval, 10);
  return !!interval && !Number.isNaN(n) && n >= 1 && n <= 14400;
}

export function validateMotionMode(s: MotionModeState): boolean {
  const nStart = parseInt(s.numberOfFixOnStart, 10);
  const nTrip = parseInt(s.reportIntervalInTrip, 10);
  const nTimeout = parseInt(s.tripEndTimeout, 10);
  const nEndNum = parseInt(s.numberOfFixOnEnd, 10);
  const nEnd = parseInt(s.reportIntervalOnEnd, 10);
  const nStat = parseInt(s.reportIntervalOnStationary, 10);
  if (!s.numberOfFixOnStart || nStart < 1 || nStart > 10) {
    return false;
  }
  if (!s.reportIntervalInTrip || nTrip < 10 || nTrip > 86400) {
    return false;
  }
  if (!s.tripEndTimeout || nTimeout < 1 || nTimeout > 180) {
    return false;
  }
  if (!s.numberOfFixOnEnd || nEndNum < 1 || nEndNum > 10) {
    return false;
  }
  if (!s.reportIntervalOnEnd || nEnd < 10 || nEnd > 300) {
    return false;
  }
  if (!s.reportIntervalOnStationary || nStat < 1 || nStat > 14400) {
    return false;
  }
  return true;
}

/** Timing Mode：0–23 时 */
export const HOUR_OPTIONS = Array.from({length: 24}, (_, i) =>
  i < 10 ? `0${i}` : String(i),
);

/** Time-Segmented Mode：0–24 时（24 表示当日结束，分钟档位为 0） */
export const HOUR_OPTIONS_SEGMENTED = Array.from({length: 25}, (_, i) =>
  i < 10 ? `0${i}` : String(i),
);

export const MINUTE_OPTIONS = Array.from({length: 60}, (_, i) =>
  i < 10 ? `0${i}` : String(i),
);

export function timeSegmentedPeriodToProtocol(p: TimeSegmentedPeriod): {
  startHour: number;
  startMinuteGear: number;
  endHour: number;
  endMinuteGear: number;
  interval: number;
} {
  return {
    startHour: p.startHour,
    startMinuteGear: p.startHour === 24 ? 0 : p.startMinuteGear,
    endHour: p.endHour,
    endMinuteGear: p.endHour === 24 ? 0 : p.endMinuteGear,
    interval: parseInt(p.interval, 10),
  };
}

export function validateTimeSegmentedSave(periods: TimeSegmentedPeriod[]): string | null {
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    if (!p.interval.trim()) {
      return 'Report Interval cannot be empty!';
    }
    const interval = parseInt(p.interval, 10);
    if (Number.isNaN(interval) || interval < 30 || interval > 86400) {
      return SAVE_VALIDATION_MSG;
    }
    const proto = timeSegmentedPeriodToProtocol(p);
    if (proto.startHour < 0 || proto.startHour > 24 || proto.endHour < 0 || proto.endHour > 24) {
      return SAVE_VALIDATION_MSG;
    }
  }
  return null;
}
