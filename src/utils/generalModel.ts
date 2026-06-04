import {
  LedColorType,
  OverProtectionType,
  ProductModel,
  RepoweredDefaultMode,
} from '../sdk/MPSDKDefines';

export const SAVE_VALIDATION_MSG_GENERAL =
  'Opps！Save failed. Please check the input characters and try again.';

export const REPOWERED_MODE_OPTIONS = [
  'Off',
  'On',
  'Restore Last Mode',
] as const;

export const LED_COLOR_TYPE_OPTIONS = [
  'Active power indicator with color direct transition',
  'Active power indicator with color smooth transition',
  'White',
  'Red',
  'Green',
  'Blue',
  'Orange',
  'Cyan',
  'Purple',
] as const;

export type SwitchSettingsState = {
  isOn: boolean;
  interval: string;
  repoweredMode: RepoweredDefaultMode;
};

export type ElectricitySettingsState = {
  interval: string;
};

export type EnergySettingsState = {
  reportInterval: string;
  saveInterval: string;
  powerChangeValue: string;
  totalEnergy: string;
};

export type ProtectionSettingsState = {
  isOn: boolean;
  overThreshold: string;
  timeThreshold: string;
  productModel: ProductModel;
};

export type LoadStatusState = {
  loadStatus: boolean;
  loadStart: boolean;
  loadStop: boolean;
  threshold: string;
};

export type CountdownSettingsState = {
  interval: string;
};

export type LedSettingsState = {
  networkStatus: boolean;
  powerStatus: boolean;
};

export type PowerIndicatorColorState = {
  colorType: LedColorType;
  productModel: ProductModel;
  blue: string;
  green: string;
  yellow: string;
  orange: string;
  red: string;
  purple: string;
};

export function filterDigits(text: string, maxLength: number): string {
  return text.replace(/\D/g, '').slice(0, maxLength);
}

export function validateSwitchSettings(s: SwitchSettingsState): boolean {
  const n = parseInt(s.interval, 10);
  return !Number.isNaN(n) && n >= 10 && n <= 600;
}

export function validateElectricitySettings(s: ElectricitySettingsState): boolean {
  const n = parseInt(s.interval, 10);
  return !Number.isNaN(n) && n >= 5 && n <= 600;
}

export function validateEnergySettings(s: EnergySettingsState): boolean {
  const report = parseInt(s.reportInterval, 10);
  const save = parseInt(s.saveInterval, 10);
  const power = parseInt(s.powerChangeValue, 10);
  return (
    !Number.isNaN(report) &&
    report >= 1 &&
    report <= 60 &&
    !Number.isNaN(save) &&
    save >= 1 &&
    save <= 60 &&
    !Number.isNaN(power) &&
    power >= 1 &&
    power <= 100
  );
}

export function validateCountdownSettings(s: CountdownSettingsState): boolean {
  const n = parseInt(s.interval, 10);
  return !Number.isNaN(n) && n >= 10 && n <= 60;
}

export function validateLoadStatusSettings(s: LoadStatusState): boolean {
  const n = parseInt(s.threshold, 10);
  return !Number.isNaN(n) && n >= 1 && n <= 10;
}

export function normalizeLedColorType(value: unknown): LedColorType {
  const n = Number(value);
  if (n >= LedColorType.TransitionDirectly && n <= LedColorType.Purple) {
    return n as LedColorType;
  }
  return LedColorType.TransitionDirectly;
}

export function isLedColorTransitionType(colorType: LedColorType): boolean {
  return (
    colorType === LedColorType.TransitionDirectly ||
    colorType === LedColorType.TransitionSmoothly
  );
}

export function parseLedColorPower(value: string): number {
  const n = parseInt(String(value).trim(), 10);
  return Number.isNaN(n) ? 0 : n;
}

export function maxPowerForProduct(productModel: ProductModel): number {
  if (productModel === ProductModel.America) {
    return 2160;
  }
  if (productModel === ProductModel.UK) {
    return 3588;
  }
  return 4416;
}

export function overThresholdRange(
  type: OverProtectionType,
  productModel: ProductModel,
): {min: number; max: number} {
  switch (type) {
    case OverProtectionType.Load: {
      let max = 4416;
      if (productModel === ProductModel.America) {
        max = 2160;
      } else if (productModel === ProductModel.UK) {
        max = 3588;
      }
      return {min: 10, max};
    }
    case OverProtectionType.Voltage: {
      if (productModel === ProductModel.America) {
        return {min: 121, max: 138};
      }
      return {min: 231, max: 264};
    }
    case OverProtectionType.SagVoltage: {
      if (productModel === ProductModel.America) {
        return {min: 102, max: 119};
      }
      return {min: 196, max: 229};
    }
    case OverProtectionType.Current: {
      if (productModel === ProductModel.America) {
        return {min: 1, max: 180};
      }
      if (productModel === ProductModel.UK) {
        return {min: 1, max: 156};
      }
      return {min: 1, max: 192};
    }
    default:
      return {min: 0, max: 0};
  }
}

export function validateProtectionSettings(
  type: OverProtectionType,
  s: ProtectionSettingsState,
): boolean {
  const time = parseInt(s.timeThreshold, 10);
  if (Number.isNaN(time) || time < 1 || time > 30) {
    return false;
  }
  const over = parseInt(s.overThreshold, 10);
  const {min, max} = overThresholdRange(type, s.productModel);
  return !Number.isNaN(over) && over >= min && over <= max;
}

export function validatePowerIndicatorColor(
  s: PowerIndicatorColorState,
): boolean {
  const colorType = normalizeLedColorType(s.colorType);
  if (!isLedColorTransitionType(colorType)) {
    return true;
  }
  const fields = [s.blue, s.green, s.yellow, s.orange, s.red, s.purple];
  if (fields.some(f => String(f).trim() === '')) {
    return false;
  }
  const max = maxPowerForProduct(s.productModel);
  const b = parseLedColorPower(s.blue);
  const g = parseLedColorPower(s.green);
  const y = parseLedColorPower(s.yellow);
  const o = parseLedColorPower(s.orange);
  const r = parseLedColorPower(s.red);
  const p = parseLedColorPower(s.purple);
  if (
    b < 1 ||
    b > max - 5 ||
    g <= b ||
    g > max - 4 ||
    y <= g ||
    y > max - 3 ||
    o <= y ||
    o > max - 2 ||
    r <= o ||
    r > max - 1 ||
    p <= r ||
    p > max
  ) {
    return false;
  }
  return true;
}

export function protectionTitle(type: OverProtectionType): string {
  switch (type) {
    case OverProtectionType.Load:
      return 'Over-Load Protection';
    case OverProtectionType.Voltage:
      return 'Over-Voltage Protection';
    case OverProtectionType.SagVoltage:
      return 'Sag-Voltage Protection';
    case OverProtectionType.Current:
      return 'Over-Current Protection';
    default:
      return 'Protection';
  }
}

export function protectionThresholdLabel(type: OverProtectionType): string {
  switch (type) {
    case OverProtectionType.Load:
      return 'Over-Load Threshold';
    case OverProtectionType.Voltage:
      return 'Over-Voltage Threshold';
    case OverProtectionType.SagVoltage:
      return 'Sag-Voltage Threshold';
    case OverProtectionType.Current:
      return 'Over-Current Threshold';
    default:
      return 'Threshold';
  }
}

export function protectionThresholdUnit(type: OverProtectionType): string {
  switch (type) {
    case OverProtectionType.Load:
      return 'W';
    case OverProtectionType.Voltage:
    case OverProtectionType.SagVoltage:
      return 'V';
    case OverProtectionType.Current:
      return '×0.1 A';
    default:
      return '';
  }
}

export function protectionThresholdMaxLength(type: OverProtectionType): number {
  return type === OverProtectionType.Load ? 4 : 3;
}

function toEnergyInt(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Math.trunc(value);
  }
  const n = parseInt(String(value ?? '').trim(), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** 对齐 MKMPEnergySettingsModel readEnergyDatas */
export function formatTotalEnergy(
  totalRounds: number | string,
  ec: number | string,
): string {
  const ecN = toEnergyInt(ec);
  if (ecN === 0) {
    return '0.0';
  }
  const roundsN = toEnergyInt(totalRounds);
  return ((roundsN * 1.0) / ecN).toFixed(1);
}

export function ledColorShowsThresholdFields(colorType: LedColorType): boolean {
  return isLedColorTransitionType(normalizeLedColorType(colorType));
}
