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
  type AxisSettingState,
  SAVE_VALIDATION_MSG_AXIS,
  validateAxisSetting,
} from './axisSettingModel';

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

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

export async function readAxisSettings(): Promise<AxisSettingState> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }

  const wakeupRes = await readStep('Read Wakeup Conditions Error', () =>
    readPromise(MPInterface.read_three_axis_wakeup_conditions as ReadFn),
  );
  const motionRes = await readStep('Read Motion Conditions Error', () =>
    readPromise(MPInterface.read_three_axis_motion_parameters as ReadFn),
  );

  return {
    wakeupThreshold: strField(wakeupRes, 'threshold'),
    wakeupDuration: strField(wakeupRes, 'duration'),
    motionThreshold: strField(motionRes, 'threshold'),
    motionDuration: strField(motionRes, 'duration'),
  };
}

export async function configAxisSettings(state: AxisSettingState): Promise<void> {
  if (!validateAxisSetting(state)) {
    throw new Error(SAVE_VALIDATION_MSG_AXIS);
  }
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }

  const wt = parseInt(state.wakeupThreshold, 10);
  const wd = parseInt(state.wakeupDuration, 10);
  const mt = parseInt(state.motionThreshold, 10);
  const md = parseInt(state.motionDuration, 10);

  await readStep('Config Wakeup Conditions Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configThreeAxisWakeupConditions(wt, wd, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Motion Conditions Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configThreeAxisMotionParameters(mt, md, s, f),
    ).then(() => ({})),
  );
}
