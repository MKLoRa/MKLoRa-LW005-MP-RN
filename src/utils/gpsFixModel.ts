export type GpsFixState = {
  timeout: string;
  pdop: string;
};

export const DEFAULT_GPS_FIX: GpsFixState = {
  timeout: '30',
  pdop: '25',
};

export const SAVE_VALIDATION_MSG_GPS =
  'Opps！Save failed. Please check the input characters and try again.';

export function validateGpsFix(s: GpsFixState): boolean {
  const t = parseInt(s.timeout, 10);
  const p = parseInt(s.pdop, 10);
  if (!s.timeout || t < 30 || t > 600) {
    return false;
  }
  if (!s.pdop || p < 25 || p > 100) {
    return false;
  }
  return true;
}

export type OutdoorFixState = {
  bleInterval: string;
  gpsInterval: string;
};

export const DEFAULT_OUTDOOR_FIX: OutdoorFixState = {
  bleInterval: '1',
  gpsInterval: '1',
};

export const SAVE_VALIDATION_MSG_OUTDOOR =
  'Opps！Save failed. Please check the input characters and try again.';

export function validateOutdoorFix(s: OutdoorFixState): boolean {
  const b = parseInt(s.bleInterval, 10);
  const g = parseInt(s.gpsInterval, 10);
  if (!s.bleInterval || b < 1 || b > 100) {
    return false;
  }
  if (!s.gpsInterval || g < 1 || g > 14400) {
    return false;
  }
  return true;
}
