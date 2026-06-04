/**
 * Beacon / PIR Major·Minor 读写显示规则（对齐 MKMPFilterByBeaconModel / MKMPFilterByPirModel）
 */

export type MajorMinorStrings = {
  minMajor: string;
  maxMajor: string;
  minMinor: string;
  maxMinor: string;
};

function strFromField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null && v !== '' ? String(v) : '';
}

/** iBeacon / BXP-iBeacon：设备返回值原样展示，不做 0~65535 转空 */
export function beaconRangeFromDevice(
  majorRes: Record<string, unknown>,
  minorRes: Record<string, unknown>,
): Pick<MajorMinorStrings, 'minMajor' | 'maxMajor' | 'minMinor' | 'maxMinor'> {
  return {
    minMajor: strFromField(majorRes, 'minValue'),
    maxMajor: strFromField(majorRes, 'maxValue'),
    minMinor: strFromField(minorRes, 'minValue'),
    maxMinor: strFromField(minorRes, 'maxValue'),
  };
}

/** PIR：0~65535 表示未限定范围，界面显示为空 */
export function pirRangeFromDevice(res: Record<string, unknown>): {
  min: string;
  max: string;
} {
  const minV = Number(res.minValue ?? 0);
  const maxV = Number(res.maxValue ?? 0);
  if (minV === 0 && maxV === 65535) {
    return {min: '', max: ''};
  }
  return {min: String(minV), max: String(maxV)};
}

/** iBeacon / BXP：空字段按 0 下发（对齐 iOS configBeaconFilterMajor/Minor） */
export function beaconRangeToConfig(minStr: string, maxStr: string): {
  min: number;
  max: number;
} {
  return {
    min: minStr ? parseInt(minStr, 10) : 0,
    max: maxStr ? parseInt(maxStr, 10) : 0,
  };
}

/** PIR：仅当 Min、Max 都填写时才用用户范围，否则 0~65535（对齐 iOS configFilterMajor/Minor） */
export function pirRangeToConfig(minStr: string, maxStr: string): {
  min: number;
  max: number;
} {
  if (minStr && maxStr) {
    return {
      min: parseInt(minStr, 10),
      max: parseInt(maxStr, 10),
    };
  }
  return {min: 0, max: 65535};
}

export function validateMajorMinorPair(
  minStr: string,
  maxStr: string,
): boolean {
  if (minStr && !maxStr) {
    return false;
  }
  if (!minStr && maxStr) {
    return false;
  }
  if (!minStr && !maxStr) {
    return true;
  }
  const min = parseInt(minStr, 10);
  const max = parseInt(maxStr, 10);
  if (min < 0 || min > 65535 || max < min || max > 65535) {
    return false;
  }
  return true;
}
