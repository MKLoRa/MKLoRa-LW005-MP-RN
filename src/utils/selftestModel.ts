export const VOLTAGE_THRESHOLD_OPTIONS = [
  '2.2',
  '2.25',
  '2.3',
  '2.35',
  '2.4',
  '2.45',
  '2.5',
  '2.55',
  '2.6',
  '2.65',
  '2.7',
  '2.75',
  '2.8',
  '2.85',
  '2.9',
  '2.95',
  '3.0',
  '3.05',
  '3.1',
  '3.15',
  '3.2',
] as const;

export type SelftestFormState = {
  gps: string;
  acceData: string;
  flash: string;
  pcbaStatus: string;
  voltageThreshold1: number;
  sampleInterval1: string;
  sampleTimes1: string;
  voltageThreshold2: number;
  sampleInterval2: string;
  sampleTimes2: string;
};

export const SAVE_VALIDATION_MSG_SELFTEST =
  'Opps！Save failed. Please check the input characters and try again.';

export function voltageThresholdLabel(index: number): string {
  if (index < 0 || index >= VOLTAGE_THRESHOLD_OPTIONS.length) {
    return VOLTAGE_THRESHOLD_OPTIONS[0];
  }
  return VOLTAGE_THRESHOLD_OPTIONS[index];
}

export function validateSelftestParams(state: SelftestFormState): boolean {
  if (
    state.voltageThreshold1 < 0 ||
    state.voltageThreshold1 > 20 ||
    state.voltageThreshold2 < 0 ||
    state.voltageThreshold2 > 20
  ) {
    return false;
  }
  const i1 = parseInt(state.sampleInterval1, 10);
  const i2 = parseInt(state.sampleInterval2, 10);
  const t1 = parseInt(state.sampleTimes1, 10);
  const t2 = parseInt(state.sampleTimes2, 10);
  if (
    !state.sampleInterval1 ||
    Number.isNaN(i1) ||
    i1 < 1 ||
    i1 > 1440 ||
    !state.sampleInterval2 ||
    Number.isNaN(i2) ||
    i2 < 1 ||
    i2 > 1440
  ) {
    return false;
  }
  if (
    !state.sampleTimes1 ||
    Number.isNaN(t1) ||
    t1 < 1 ||
    t1 > 100 ||
    !state.sampleTimes2 ||
    Number.isNaN(t2) ||
    t2 < 1 ||
    t2 > 100
  ) {
    return false;
  }
  return true;
}
