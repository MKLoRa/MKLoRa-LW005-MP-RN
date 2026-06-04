import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';
import {
  mapBatteryInfo,
  type BatteryCycleInfo,
} from './selftestApi';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export type BatteryConsumptionState = {
  currentInfo: BatteryCycleInfo;
  lastInfo: BatteryCycleInfo;
  allInfo: BatteryCycleInfo;
};

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

async function ensureBle(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
}

/** 对齐 MKMPBatteryConsumptionModel readDataWithSucBlock */
export async function readBatteryConsumption(): Promise<BatteryConsumptionState> {
  await ensureBle();

  const currentRes = await readStep(
    'Read Current Cycle Battery Information Error',
    () => readPromise(MPInterface.read_battery_information as ReadFn),
  );
  const lastRes = await readStep(
    'Read Last Cycle Battery Information Error',
    () =>
      readPromise(MPInterface.read_last_cycle_battery_information as ReadFn),
  );
  const allRes = await readStep('Read All Cycle Battery Information Error', () =>
    readPromise(MPInterface.read_all_cycle_battery_information as ReadFn),
  );

  return {
    currentInfo: mapBatteryInfo(currentRes),
    lastInfo: mapBatteryInfo(lastRes),
    allInfo: mapBatteryInfo(allRes),
  };
}

export async function resetBatteryConsumption(): Promise<void> {
  await ensureBle();
  await readStep('Battery Reset Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.batteryResetWithSucBlock(s, f),
    ).then(() => ({})),
  );
}
