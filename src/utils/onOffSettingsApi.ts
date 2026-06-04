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

export type OnOffSettingsState = {
  shutDownPayload: boolean;
  offByMagnetic: boolean;
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

function boolField(res: Record<string, unknown>, key = 'isOn'): boolean {
  const v = res[key];
  if (typeof v === 'boolean') {
    return v;
  }
  return v === true || v === 'true' || v === '01' || v === 1;
}

async function ensureBle(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
}

/** 对齐 MKMPOnOffSettingsModel readDataWithSucBlock */
export async function readOnOffSettings(): Promise<OnOffSettingsState> {
  await ensureBle();
  const shutRes = await readStep('Read Shut-Down Payload Error', () =>
    readPromise(MPInterface.read_shutdown_payload_status as ReadFn),
  );
  const hallRes = await readStep('Read Off By Button Error', () =>
    readPromise(MPInterface.read_hall_power_off_status as ReadFn),
  );
  return {
    shutDownPayload: boolField(shutRes),
    offByMagnetic: boolField(hallRes),
  };
}

export async function configShutDownPayload(isOn: boolean): Promise<void> {
  await ensureBle();
  await readStep('Config Shut-Down Payload Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configShutdownPayloadStatus(isOn, s, f),
    ).then(() => ({})),
  );
}

export async function configOffByMagnetic(isOn: boolean): Promise<void> {
  await ensureBle();
  await readStep('Config Off By Button Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configHallPowerOffStatus(isOn, s, f),
    ).then(() => ({})),
  );
}

export async function powerOffDevice(): Promise<void> {
  await ensureBle();
  await readStep('Power Off Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.powerOffWithSucBlock(s, f),
    ).then(() => ({})),
  );
}
