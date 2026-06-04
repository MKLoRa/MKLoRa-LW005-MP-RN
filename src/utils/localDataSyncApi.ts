import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

async function configStep(
  msg: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
  }
}

export async function readNumberOfDaysStoredData(days: number): Promise<void> {
  if (days < 1 || days > 65535) {
    throw new Error('Time must be 1 ~ 65535');
  }
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  await configStep('Read Stored Data Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.readNumberOfDaysStoredData(days, s, f),
    ).then(() => undefined),
  );
}

export async function pauseSendLocalData(pause: boolean): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  await configStep('Pause Local Data Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.pauseSendLocalData(pause, s, f),
    ).then(() => undefined),
  );
}

export async function clearAllStoredData(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  await configStep('Clear Stored Data Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.clearAllDatasWithSucBlock(s, f),
    ).then(() => undefined),
  );
}

/** 对齐 addDataTimer：每 30s 读三轴唤醒条件维持通信 */
export async function keepAliveBleCommunication(): Promise<void> {
  if (!(await waitForBleReady())) {
    return;
  }
  try {
    await readPromise(MPInterface.read_three_axis_wakeup_conditions as ReadFn);
  } catch {
    /* ignore keep-alive failures */
  }
}
