import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import type {IndicatorSettings} from '../sdk/MPSDKDataAdopter';
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

function boolField(v: unknown): boolean {
  if (typeof v === 'boolean') {
    return v;
  }
  return v === true || v === 'true' || v === '01' || v === 1;
}

function mapIndicatorSettings(
  raw: Record<string, unknown>,
): IndicatorSettings {
  const s =
    raw.indicatorSettings && typeof raw.indicatorSettings === 'object'
      ? (raw.indicatorSettings as Record<string, unknown>)
      : raw;
  return {
    DeviceState: boolField(s.deviceState),
    LowPower: boolField(s.lowPower),
    Broadcast: boolField(s.broadcast),
    NetworkCheck: boolField(s.networkCheck),
    InFix: boolField(s.inFix),
    FixSuccessful: boolField(s.fixSuccessful),
    FailToFix: boolField(s.failToFix),
  };
}

export async function readIndicatorSettings(): Promise<IndicatorSettings> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  const res = await readStep('Read Indicator Settings Error', () =>
    readPromise(MPInterface.read_indicator_settings as ReadFn),
  );
  return mapIndicatorSettings(res);
}

export async function configIndicatorSettings(
  settings: IndicatorSettings,
): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  await readStep('Config Indicator Settings Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configIndicatorSettings(settings, s, f),
    ).then(() => ({})),
  );
}
