import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import {
  LedColorType,
  OverProtectionType,
  ProductModel,
  RepoweredDefaultMode,
} from '../sdk/MPSDKDefines';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';
import {
  type CountdownSettingsState,
  type ElectricitySettingsState,
  type EnergySettingsState,
  type LedSettingsState,
  type LoadStatusState,
  type PowerIndicatorColorState,
  type ProtectionSettingsState,
  type SwitchSettingsState,
  SAVE_VALIDATION_MSG_GENERAL,
  formatTotalEnergy,
  validateCountdownSettings,
  validateElectricitySettings,
  validateEnergySettings,
  validateLoadStatusSettings,
  normalizeLedColorType,
  parseLedColorPower,
  validatePowerIndicatorColor,
  validateProtectionSettings,
  validateSwitchSettings,
} from './generalModel';

function boolField(res: Record<string, unknown>, key: string): boolean {
  const v = res[key];
  if (typeof v === 'boolean') {
    return v;
  }
  return v === true || v === 'true' || v === '01' || v === 1;
}

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

function numField(res: Record<string, unknown>, key: string): number {
  return Number(res[key] ?? 0);
}

async function ensureBleReady(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
}

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

async function runConfig(msg: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    await new Promise<void>(r => setTimeout(r, 120));
  } catch (e) {
    if (e instanceof Error && e.message) {
      throw e;
    }
    throw new Error(msg);
  }
}

export async function readProductModel(): Promise<ProductModel> {
  await ensureBleReady();
  const res = await readStep('Read Product Model Error', () =>
    readPromise(MPInterface.read_specifications_of_device),
  );
  const spec = numField(res, 'specification');
  if (spec >= 0 && spec <= 2) {
    return spec as ProductModel;
  }
  return ProductModel.EuropeFrance;
}

export async function readSwitchSettings(): Promise<SwitchSettingsState> {
  await ensureBleReady();
  const status = await readStep('Read Switch Status Error', () =>
    readPromise(MPInterface.read_switch_status),
  );
  const interval = await readStep('Read Report Interval Error', () =>
    readPromise(MPInterface.read_report_interval_of_switch_payloads),
  );
  const mode = await readStep('Read Repowered Default Mode Error', () =>
    readPromise(MPInterface.read_repowered_default_mode),
  );
  return {
    isOn: boolField(status, 'isOn'),
    interval: strField(interval, 'interval'),
    repoweredMode: numField(mode, 'mode') as RepoweredDefaultMode,
  };
}

export async function configSwitchSettings(
  state: SwitchSettingsState,
): Promise<void> {
  if (!validateSwitchSettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG_GENERAL);
  }
  await ensureBleReady();
  const interval = parseInt(state.interval, 10);
  await runConfig('Config Switch Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_switch_status(state.isOn, s, f),
    ),
  );
  await runConfig('Config Report Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_report_interval_of_switch_payloads(
        interval,
        s,
        f,
      ),
    ),
  );
  await runConfig('Config Repowered Default Mode Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_repowered_default_mode(state.repoweredMode, s, f),
    ),
  );
}

export async function readElectricitySettings(): Promise<ElectricitySettingsState> {
  await ensureBleReady();
  const res = await readStep('Read Report Interval Error', () =>
    readPromise(MPInterface.read_report_interval_of_electricity),
  );
  return {interval: strField(res, 'interval')};
}

export async function configElectricitySettings(
  state: ElectricitySettingsState,
): Promise<void> {
  if (!validateElectricitySettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG_GENERAL);
  }
  await ensureBleReady();
  await runConfig('Config Report Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_report_interval_of_electricity(
        parseInt(state.interval, 10),
        s,
        f,
      ),
    ),
  );
}

export async function readEnergySettings(): Promise<EnergySettingsState> {
  await ensureBleReady();
  const params = await readStep('Read Interval Error', () =>
    readPromise(MPInterface.read_energy_interval_params),
  );
  const power = await readStep('Read Power Change Value Error', () =>
    readPromise(MPInterface.read_power_change_value),
  );
  const energy = await readStep('Read Energy Datas Error', () =>
    readPromise(MPInterface.read_energy_data),
  );
  return {
    reportInterval:
      strField(params, 'repoertInterval') || strField(params, 'reportInterval'),
    saveInterval: strField(params, 'saveInterval'),
    powerChangeValue: strField(power, 'value'),
    totalEnergy: formatTotalEnergy(
      strField(energy, 'totalRounds'),
      strField(energy, 'EC'),
    ),
  };
}

export async function configEnergySettings(
  state: EnergySettingsState,
): Promise<void> {
  if (!validateEnergySettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG_GENERAL);
  }
  await ensureBleReady();
  await runConfig('Config Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_energy_report_interval(
        parseInt(state.reportInterval, 10),
        parseInt(state.saveInterval, 10),
        s,
        f,
      ),
    ),
  );
  await runConfig('Config Power Change Value Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_power_change_value(
        parseInt(state.powerChangeValue, 10),
        s,
        f,
      ),
    ),
  );
}

async function readProtectionRaw(
  type: OverProtectionType,
): Promise<Record<string, unknown>> {
  switch (type) {
    case OverProtectionType.Load:
      return readPromise(MPInterface.read_over_load_protection);
    case OverProtectionType.Voltage:
      return readPromise(MPInterface.read_over_voltage_protection);
    case OverProtectionType.SagVoltage:
      return readPromise(MPInterface.read_sag_voltage_protection);
    case OverProtectionType.Current:
      return readPromise(MPInterface.read_over_current_protection);
    default:
      return {};
  }
}

export async function readProtectionSettings(
  type: OverProtectionType,
): Promise<ProtectionSettingsState> {
  await ensureBleReady();
  const productModel = await readProductModel();
  const res = await readStep('Read Protection Error', () =>
    readProtectionRaw(type),
  );
  return {
    isOn: boolField(res, 'isOn'),
    overThreshold: strField(res, 'overThreshold'),
    timeThreshold: strField(res, 'timeThreshold'),
    productModel,
  };
}

export async function configProtectionSettings(
  type: OverProtectionType,
  state: ProtectionSettingsState,
): Promise<void> {
  if (!validateProtectionSettings(type, state)) {
    throw new Error(SAVE_VALIDATION_MSG_GENERAL);
  }
  await ensureBleReady();
  const isOn = state.isOn;
  const over = parseInt(state.overThreshold, 10);
  const time = parseInt(state.timeThreshold, 10);
  const pm = state.productModel;

  const run = (msg: string, fn: (s?: () => void, f?: (e: Error) => void) => void) =>
    runConfig(msg, () => configPromise((s, f) => fn(s, f)));

  switch (type) {
    case OverProtectionType.Load:
      await run('Config Over-Load Error', (s, f) =>
        MPInterfaceConfig.config_over_load(isOn, pm, over, time, s, f),
      );
      break;
    case OverProtectionType.Voltage:
      await run('Config Over-Voltage Error', (s, f) =>
        MPInterfaceConfig.config_over_voltage(isOn, pm, over, time, s, f),
      );
      break;
    case OverProtectionType.SagVoltage:
      await run('Config Sag-Voltage Error', (s, f) =>
        MPInterfaceConfig.config_sag_voltage(isOn, pm, over, time, s, f),
      );
      break;
    case OverProtectionType.Current:
      await run('Config Over-Current Error', (s, f) =>
        MPInterfaceConfig.config_over_current(isOn, pm, over, time, s, f),
      );
      break;
    default:
      break;
  }
}

export async function readLoadStatusSettings(): Promise<LoadStatusState> {
  await ensureBleReady();
  const load = await readStep('Read Load Status Error', () =>
    readPromise(MPInterface.read_load_status),
  );
  const notify = await readStep('Read Load Notifications Error', () =>
    readPromise(MPInterface.read_load_status_notifications),
  );
  const threshold = await readStep('Read Load Threshold Error', () =>
    readPromise(MPInterface.read_load_status_threshold),
  );
  return {
    loadStatus: boolField(load, 'load'),
    loadStart: boolField(notify, 'loadStart'),
    loadStop: boolField(notify, 'loadStop'),
    threshold: strField(threshold, 'value'),
  };
}

export async function configLoadStatusSettings(
  state: LoadStatusState,
): Promise<void> {
  if (!validateLoadStatusSettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG_GENERAL);
  }
  await ensureBleReady();
  await runConfig('Config Load Notifications Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_load_status_notifications(
        state.loadStart,
        state.loadStop,
        s,
        f,
      ),
    ),
  );
  await runConfig('Config Load Threshold Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_load_status_threshold(
        parseInt(state.threshold, 10),
        s,
        f,
      ),
    ),
  );
}

export async function readCountdownSettings(): Promise<CountdownSettingsState> {
  await ensureBleReady();
  const res = await readStep('Read Countdown Interval Error', () =>
    readPromise(MPInterface.read_count_down_report_interval),
  );
  return {interval: strField(res, 'interval')};
}

export async function configCountdownSettings(
  state: CountdownSettingsState,
): Promise<void> {
  if (!validateCountdownSettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG_GENERAL);
  }
  await ensureBleReady();
  await runConfig('Config Countdown Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_count_down_report_interval(
        parseInt(state.interval, 10),
        s,
        f,
      ),
    ),
  );
}

export async function readLedSettings(): Promise<LedSettingsState> {
  await ensureBleReady();
  const res = await readStep('Read LED Indicator Error', () =>
    readPromise(MPInterface.read_led_indicator_status),
  );
  return {
    networkStatus: boolField(res, 'networkStatus'),
    powerStatus: boolField(res, 'powerStatus'),
  };
}

export async function configLedSettings(state: LedSettingsState): Promise<void> {
  await ensureBleReady();
  await runConfig('Config LED Indicator Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_led_indicator_status(
        state.networkStatus,
        state.powerStatus,
        s,
        f,
      ),
    ),
  );
}

export async function readPowerIndicatorColor(): Promise<PowerIndicatorColorState> {
  await ensureBleReady();
  const productModel = await readProductModel();
  const res = await readStep('Read Power Indicator Color Error', () =>
    readPromise(MPInterface.read_power_indicator_color),
  );
  return {
    colorType: normalizeLedColorType(numField(res, 'colorType')),
    productModel,
    blue: strField(res, 'blue'),
    green: strField(res, 'green'),
    yellow: strField(res, 'yellow'),
    orange: strField(res, 'orange'),
    red: strField(res, 'red'),
    purple: strField(res, 'purple'),
  };
}

export async function configPowerIndicatorColor(
  state: PowerIndicatorColorState,
): Promise<void> {
  if (!validatePowerIndicatorColor(state)) {
    throw new Error(SAVE_VALIDATION_MSG_GENERAL);
  }
  await ensureBleReady();
  const colorType = normalizeLedColorType(state.colorType);
  await runConfig('Config Power Indicator Color Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_power_indicator_color(
        colorType,
        {
          b_color: parseLedColorPower(state.blue),
          g_color: parseLedColorPower(state.green),
          y_color: parseLedColorPower(state.yellow),
          o_color: parseLedColorPower(state.orange),
          r_color: parseLedColorPower(state.red),
          p_color: parseLedColorPower(state.purple),
        },
        state.productModel,
        s,
        f,
      ),
    ),
  );
}
