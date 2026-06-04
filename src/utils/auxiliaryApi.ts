import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import {PositioningStrategy} from '../sdk/MPSDKDefines';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';
import {
  type AlertAlarmState,
  type AlarmFunctionState,
  type DownlinkState,
  type LightMonitorState,
  type ManDownState,
  type SosAlarmState,
  type TempMonitorState,
  type VibrationState,
  clampStrategy,
  validateAlarmFunction,
  validateLightMonitor,
  validateManDown,
  validateSosAlarm,
  validateTempMonitor,
  validateVibration,
  SAVE_VALIDATION_MSG_AUXILIARY,
} from './auxiliaryModel';

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

function intField(res: Record<string, unknown>, key: string): number {
  const v = res[key];
  if (typeof v === 'number') {
    return v;
  }
  const n = parseInt(String(v ?? '0'), 10);
  return Number.isNaN(n) ? 0 : n;
}

function boolField(res: Record<string, unknown>, key: string): boolean {
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

export async function readDownlink(): Promise<DownlinkState> {
  await ensureBle();
  const res = await readStep('Read Positioning Strategy Error', () =>
    readPromise(MPInterface.read_downlink_positioning_strategy as ReadFn),
  );
  return {strategy: intField(res, 'strategy')};
}

export async function configDownlink(strategy: number): Promise<void> {
  await ensureBle();
  await readStep('Config Positioning Strategy Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configDownlinkPositioningStrategy(
        clampStrategy(strategy),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export async function readVibration(): Promise<VibrationState> {
  await ensureBle();
  const statusRes = await readStep('Read Vibration Detection Error', () =>
    readPromise(MPInterface.read_shock_detection_status as ReadFn),
  );
  const thRes = await readStep('Read Shock Thresholds Error', () =>
    readPromise(MPInterface.read_shock_thresholds as ReadFn),
  );
  const intervalRes = await readStep('Read Report Interval Error', () =>
    readPromise(MPInterface.read_shock_detection_report_interval as ReadFn),
  );
  const timeoutRes = await readStep('Read Vibration Timeout Error', () =>
    readPromise(MPInterface.read_shock_timeout as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    thresholds: strField(thRes, 'threshold'),
    reportInterval: strField(intervalRes, 'interval'),
    shockTimeout: strField(timeoutRes, 'interval'),
  };
}

export async function configVibration(state: VibrationState): Promise<void> {
  if (!validateVibration(state)) {
    throw new Error(SAVE_VALIDATION_MSG_AUXILIARY);
  }
  await ensureBle();
  await readStep('Config Vibration Detection Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configShockDetectionStatus(state.isOn, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Shock Thresholds Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configShockThresholds(
        parseInt(state.thresholds, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Report Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configShockDetectionReportInterval(
        parseInt(state.reportInterval, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Vibration Timeout Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configShockTimeout(
        parseInt(state.shockTimeout, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export async function readManDown(): Promise<ManDownState> {
  await ensureBle();
  const detRes = await readStep('Read Man Down Detection Error', () =>
    readPromise(MPInterface.read_man_down_detection as ReadFn),
  );
  const timeoutRes = await readStep('Read Idle Detection Timeout Error', () =>
    readPromise(MPInterface.read_idle_detection_timeout as ReadFn),
  );
  return {
    isOn: boolField(detRes, 'isOn'),
    timeout: strField(timeoutRes, 'interval'),
  };
}

export async function resetManDownIdleStatus(): Promise<void> {
  await ensureBle();
  await readStep('Reset Idle Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configIdleStutasResetWithSucBlock(s, f),
    ).then(() => ({})),
  );
}

export async function configManDown(state: ManDownState): Promise<void> {
  if (!validateManDown(state)) {
    throw new Error(SAVE_VALIDATION_MSG_AUXILIARY);
  }
  await ensureBle();
  await readStep('Config Man Down Detection Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configManDownDetectionStatus(state.isOn, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Idle Detection Timeout Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configIdleDetectionTimeout(
        parseInt(state.timeout, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export type TamperAlarmState = {
  isOn: boolean;
  threshold: string;
  reportInterval: string;
};

export function validateTamperAlarm(state: TamperAlarmState): boolean {
  const threshold = parseInt(state.threshold, 10);
  const interval = parseInt(state.reportInterval, 10);
  return (
    threshold >= 10 &&
    threshold <= 200 &&
    interval >= 1 &&
    interval <= 14400
  );
}

export async function readTamperAlarm(): Promise<TamperAlarmState> {
  await ensureBle();
  const statusRes = await readStep('Read Function Switch Error', () =>
    readPromise(MPInterface.read_tamper_alarm_status as ReadFn),
  );
  const thRes = await readStep('Read Light Threshold Error', () =>
    readPromise(MPInterface.read_tamper_alarm_thresholds as ReadFn),
  );
  const intervalRes = await readStep('Read Report Interval Error', () =>
    readPromise(MPInterface.read_tamper_alarm_report_interval as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    threshold: strField(thRes, 'threshold'),
    reportInterval: strField(intervalRes, 'interval'),
  };
}

export async function configTamperAlarm(state: TamperAlarmState): Promise<void> {
  if (!validateTamperAlarm(state)) {
    throw new Error(SAVE_VALIDATION_MSG_AUXILIARY);
  }
  await ensureBle();
  await readStep('Config Function Switch Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTamperAlarmStatus(state.isOn, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Light Threshold Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTamperAlarmThresholds(
        parseInt(state.threshold, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Report Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTamperAlarmReportInterval(
        parseInt(state.reportInterval, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export async function readAlarmFunction(): Promise<AlarmFunctionState> {
  await ensureBle();
  const typeRes = await readStep('Read Alarm Type Error', () =>
    readPromise(MPInterface.read_alarmType as ReadFn),
  );
  const exitRes = await readStep('Read Exit Alarm Type Error', () =>
    readPromise(MPInterface.read_exitAlarmTypeTime as ReadFn),
  );
  return {
    alarmType: intField(typeRes, 'type'),
    exitTime: strField(exitRes, 'time'),
  };
}

export async function configAlarmFunction(
  state: AlarmFunctionState,
): Promise<void> {
  if (!validateAlarmFunction(state)) {
    throw new Error(SAVE_VALIDATION_MSG_AUXILIARY);
  }
  await ensureBle();
  await readStep('Config Alarm Type Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configAlarmType(state.alarmType, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Exit Alarm Type Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configExitAlarmTypeTime(
        parseInt(state.exitTime, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export async function readAlertAlarm(): Promise<AlertAlarmState> {
  await ensureBle();
  const modeRes = await readStep('Read Trigger Mode Error', () =>
    readPromise(MPInterface.read_alertAlarmTriggerMode as ReadFn),
  );
  const strategyRes = await readStep('Read Positioning Strategy Error', () =>
    readPromise(MPInterface.read_alertAlarmPositioningStrategy as ReadFn),
  );
  const notifyRes = await readStep('Read Notify Event Error', () =>
    readPromise(MPInterface.read_alertAlarmNotifyStatus as ReadFn),
  );
  return {
    mode: intField(modeRes, 'mode'),
    strategy: intField(strategyRes, 'strategy'),
    notifyStart: boolField(notifyRes, 'start'),
    notifyEnd: boolField(notifyRes, 'end'),
  };
}

export async function configAlertAlarm(state: AlertAlarmState): Promise<void> {
  await ensureBle();
  await readStep('Config Trigger Mode Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configAlertAlarmTriggerMode(state.mode, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Positioning Strategy Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configAlertAlarmPositioningStrategy(
        clampStrategy(state.strategy),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Notify Event Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configAlertAlarmNotifyEventWithStart(
        state.notifyStart,
        state.notifyEnd,
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export async function readSosAlarm(): Promise<SosAlarmState> {
  await ensureBle();
  const modeRes = await readStep('Read Trigger Mode Error', () =>
    readPromise(MPInterface.read_sosAlarmTriggerMode as ReadFn),
  );
  const strategyRes = await readStep('Read Positioning Strategy Error', () =>
    readPromise(MPInterface.read_sosAlarmPositioningStrategy as ReadFn),
  );
  const intervalRes = await readStep('Read Report Interval Error', () =>
    readPromise(MPInterface.read_sosAlarmReportInterval as ReadFn),
  );
  const notifyRes = await readStep('Read Notify Event Error', () =>
    readPromise(MPInterface.read_sosAlarmNotifyStatus as ReadFn),
  );
  return {
    mode: intField(modeRes, 'mode'),
    strategy: intField(strategyRes, 'strategy'),
    reportInterval: strField(intervalRes, 'interval'),
    notifyStart: boolField(notifyRes, 'start'),
    notifyEnd: boolField(notifyRes, 'end'),
  };
}

export async function configSosAlarm(state: SosAlarmState): Promise<void> {
  if (!validateSosAlarm(state)) {
    throw new Error(SAVE_VALIDATION_MSG_AUXILIARY);
  }
  await ensureBle();
  await readStep('Config Trigger Mode Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configSosAlarmTriggerMode(state.mode, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Positioning Strategy Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configSosAlarmPositioningStrategy(
        clampStrategy(state.strategy),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Report Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configSosAlarmReportInterval(
        parseInt(state.reportInterval, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Notify Event Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configSosAlarmNotifyEventWithStart(
        state.notifyStart,
        state.notifyEnd,
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export async function readTempMonitor(): Promise<TempMonitorState> {
  await ensureBle();
  const statusRes = await readStep(
    'Read Temperatureing Monitor Status Error',
    () =>
      readPromise(MPInterface.read_temperatureMonitorNotifyStatus as ReadFn),
  );
  const rateRes = await readStep('Read Sample Rate Error', () =>
    readPromise(
      MPInterface.read_temperatureDataSampleRateInterval as ReadFn,
    ),
  );
  const thRes = await readStep('Read Temperature Threshold Error', () =>
    readPromise(MPInterface.read_temperatureThreshold as ReadFn),
  );
  const tempRes = await readStep('Read Temperature Error', () =>
    readPromise(MPInterface.read_temperature as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    alarmSwitch: boolField(statusRes, 'alarmSwicth'),
    sampleRate: strField(rateRes, 'interval'),
    maxThreshold: strField(thRes, 'max'),
    minThreshold: strField(thRes, 'min'),
    temperature: strField(tempRes, 'temperature'),
  };
}

export async function configTempMonitor(state: TempMonitorState): Promise<void> {
  if (!validateTempMonitor(state)) {
    throw new Error(SAVE_VALIDATION_MSG_AUXILIARY);
  }
  await ensureBle();
  await readStep('Config Temperatureing Monitor Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTemperatureMonitorNotifyStatus(
        state.isOn,
        state.alarmSwitch,
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Sample Rate Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTemperatureDataSampleRateInterval(
        parseInt(state.sampleRate, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Temperature Threshold Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTemperatureThreshold(
        parseInt(state.maxThreshold, 10),
        parseInt(state.minThreshold, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export async function readLightMonitor(): Promise<LightMonitorState> {
  await ensureBle();
  const statusRes = await readStep('Read Lighting Monitor Status Error', () =>
    readPromise(MPInterface.read_lightMonitorNotifyStatus as ReadFn),
  );
  const rateRes = await readStep('Read Sample Rate Error', () =>
    readPromise(MPInterface.read_lightDataSampleRateInterval as ReadFn),
  );
  const thRes = await readStep('Read Light Threshold Error', () =>
    readPromise(MPInterface.read_lightThreshold as ReadFn),
  );
  const intensityRes = await readStep('Read illumination intensity Error', () =>
    readPromise(MPInterface.read_lightIlluminationIntensity as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    alarmSwitch: boolField(statusRes, 'alarmSwicth'),
    sampleRate: strField(rateRes, 'interval'),
    lightThreshold: strField(thRes, 'threshold'),
    intensity: strField(intensityRes, 'intensity'),
  };
}

export async function configLightMonitor(
  state: LightMonitorState,
): Promise<void> {
  if (!validateLightMonitor(state)) {
    throw new Error(SAVE_VALIDATION_MSG_AUXILIARY);
  }
  await ensureBle();
  await readStep('Config Lighting Monitor Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLightMonitorNotifyStatus(
        state.isOn,
        state.alarmSwitch,
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Sample Rate Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLightDataSampleRateInterval(
        parseInt(state.sampleRate, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Light Threshold Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLightThreshold(
        parseInt(state.lightThreshold, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}
