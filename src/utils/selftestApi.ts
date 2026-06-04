import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import {binaryByHex} from './BleHexUtils';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';
import {
  type SelftestFormState,
  validateSelftestParams,
} from './selftestModel';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export type BatteryCycleInfo = {
  workTimes: string;
  advCount: string;
  axisWakeupTimes: string;
  blePostionTimes: string;
  gpsPostionTimes: string;
  loraSendCount: string;
  loraPowerConsumption: string;
  batteryPower: string;
  staticPositionCount: string;
  movePositionCount: string;
};

export type SelftestState = SelftestFormState;

async function readStep(
  msg: string,
  fn: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  try {
    return await fn();
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
  }
}

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

function thresholdIndex(res: Record<string, unknown>): number {
  const raw = parseInt(strField(res, 'threshold'), 10);
  if (Number.isNaN(raw)) {
    return 0;
  }
  const index = raw - 44;
  return index < 0 ? 0 : index > 20 ? 20 : index;
}

export function mapBatteryInfo(res: Record<string, unknown>): BatteryCycleInfo {
  const staticCount =
    strField(res, 'motionStaticUploadReportTime') ||
    strField(res, 'staticPositionCount');
  const moveCount =
    strField(res, 'motionMoveUploadReportTime') ||
    strField(res, 'movePositionCount');
  return {
    workTimes: strField(res, 'workTimes'),
    advCount: strField(res, 'advCount'),
    axisWakeupTimes: strField(res, 'axisWakeupTimes'),
    blePostionTimes: strField(res, 'blePostionTimes'),
    gpsPostionTimes: strField(res, 'gpsPostionTimes'),
    loraSendCount: strField(res, 'loraSendCount'),
    loraPowerConsumption: strField(res, 'loraPowerConsumption'),
    batteryPower: strField(res, 'batteryPower'),
    staticPositionCount: staticCount,
    movePositionCount: moveCount,
  };
}

async function ensureBle(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
}

/** 对齐 MKMPSelftestModel readDataWithSucBlock */
export async function readSelftest(): Promise<SelftestState> {
  await ensureBle();

  const pcbaRes = await readStep('Read PCBA Status Error', () =>
    readPromise(MPInterface.read_pcba_status as ReadFn),
  );
  const selfRes = await readStep('Read Self Test Status Error', () =>
    readPromise(MPInterface.read_selftest_status as ReadFn),
  );
  const th1Res = await readStep('Read Condition1 Voltage Threshold Error', () =>
    readPromise(
      MPInterface.read_low_power_condition1_voltage_threshold as ReadFn,
    ),
  );
  const int1Res = await readStep('Read Condition1 Sample Interval Error', () =>
    readPromise(
      MPInterface.read_low_power_condition1_min_sample_interval as ReadFn,
    ),
  );
  const times1Res = await readStep('Read Condition1 Sample Times Error', () =>
    readPromise(
      MPInterface.read_low_power_condition1_sample_times as ReadFn,
    ),
  );
  const th2Res = await readStep('Read Condition2 Voltage Threshold Error', () =>
    readPromise(
      MPInterface.read_low_power_condition2_voltage_threshold as ReadFn,
    ),
  );
  const int2Res = await readStep('Read Condition2 Sample Interval Error', () =>
    readPromise(
      MPInterface.read_low_power_condition2_min_sample_interval as ReadFn,
    ),
  );
  const times2Res = await readStep('Read Condition2 Sample Times Error', () =>
    readPromise(
      MPInterface.read_low_power_condition2_sample_times as ReadFn,
    ),
  );

  const statusHex = strField(selfRes, 'status');
  const binary = binaryByHex(statusHex);
  const gps = binary.length > 7 ? binary.charAt(7) : '0';
  const acceData = binary.length > 6 ? binary.charAt(6) : '0';
  const flash = binary.length > 5 ? binary.charAt(5) : '0';

  return {
    pcbaStatus: strField(pcbaRes, 'status'),
    gps,
    acceData,
    flash,
    voltageThreshold1: thresholdIndex(th1Res),
    sampleInterval1: strField(int1Res, 'interval'),
    sampleTimes1: strField(times1Res, 'times'),
    voltageThreshold2: thresholdIndex(th2Res),
    sampleInterval2: strField(int2Res, 'interval'),
    sampleTimes2: strField(times2Res, 'times'),
  };
}

/** 对齐 MKMPSelftestModel configDataWithSucBlock */
export async function configSelftest(state: SelftestState): Promise<void> {
  if (!validateSelftestParams(state)) {
    throw new Error(
      'Opps！Save failed. Please check the input characters and try again.',
    );
  }
  await ensureBle();

  await readStep('Config Condition1 Voltage Threshold Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerCondition1VoltageThreshold(
        state.voltageThreshold1 + 44,
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Condition1 Sample Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerCondition1MinSampleInterval(
        parseInt(state.sampleInterval1, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Condition1 Sample Times Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerCondition1SampleTimes(
        parseInt(state.sampleTimes1, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Condition2 Voltage Threshold Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerCondition2VoltageThreshold(
        state.voltageThreshold2 + 44,
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Condition2 Sample Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerCondition2MinSampleInterval(
        parseInt(state.sampleInterval2, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Condition2 Sample Times Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerCondition2SampleTimes(
        parseInt(state.sampleTimes2, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export function selftestStatusDisplay(
  gps: string,
  acceData: string,
  flash: string,
): Record<number, string> {
  const gpsN = parseInt(gps, 10);
  const acceN = parseInt(acceData, 10);
  const flashN = parseInt(flash, 10);
  const out: Record<number, string> = {};
  if (gpsN === 0 && acceN === 0 && flashN === 0) {
    out[0] = '0';
  }
  if (gpsN === 1) {
    out[1] = '1';
  }
  if (acceN === 1) {
    out[2] = '2';
  }
  if (flashN === 1) {
    out[3] = '3';
  }
  return out;
}

export function pcbaStatusDisplay(status: string): Record<number, string> {
  const n = parseInt(status, 10);
  const out: Record<number, string> = {};
  if (n === 0) {
    out[0] = '0';
  } else if (n === 1) {
    out[1] = '1';
  } else if (n === 2) {
    out[2] = '2';
  }
  return out;
}

export function formatBatteryPowerMah(batteryPower: string): string {
  const n = parseInt(batteryPower, 10);
  if (Number.isNaN(n)) {
    return '0.000 mAH';
  }
  return `${(n * 0.001).toFixed(3)} mAH`;
}
