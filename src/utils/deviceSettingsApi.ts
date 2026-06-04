import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';

export type DeviceSettingsState = {
  /** 对齐 MKMPDeviceSettingModel.timeZone，TIME_ZONE_LIST 下标 */
  timeZoneIndex: number;
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

/** 对齐 MKMPDeviceSettingModel readDataWithSucBlock */
export async function readDeviceSettings(): Promise<DeviceSettingsState> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  const res = await readStep('Read Time Zone Error', () =>
    readPromise(MPInterface.read_time_zone),
  );
  const tz = Number(res.timeZone ?? 0);
  return {timeZoneIndex: tz + 24};
}

/** 对齐 MKMPDeviceSettingModel configDataWithSucBlock */
export async function configDeviceTimeZone(timeZoneIndex: number): Promise<void> {
  const timeZone = timeZoneIndex - 24;
  if (timeZone < -24 || timeZone > 28) {
    throw new Error('Config Time Zone Error');
  }
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  await readStep('Config Time Zone Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_time_zone(timeZone, s, f),
    ).then(() => ({})),
  );
}

export async function factoryResetDevice(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  await readStep('Factory Reset Error', () =>
    configPromise((s, f) => MPInterfaceConfig.factory_reset(s, f)).then(() => ({})),
  );
}
