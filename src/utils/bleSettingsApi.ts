import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import {
  apiErrorMessage,
  configPromise,
  mpRead,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';
import {
  type BleSettingsState,
  SAVE_VALIDATION_MSG_BLE_SETTINGS,
  txPowerFromLabel,
  validateBleSettings,
} from './bleSettingsModel';

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

function boolField(res: Record<string, unknown>, key: string): boolean {
  const v = res[key];
  if (typeof v === 'boolean') {
    return v;
  }
  return v === true || v === 'true' || v === '01' || v === 1;
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

/** 对齐 MKMPBleSettingsDataModel readDataWithSucBlock */
export async function readBleSettings(): Promise<BleSettingsState> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }

  const nameRes = await readStep('Read Device Name Error', mpRead.deviceName);
  const intervalRes = await readStep('Read Adv Interval Error', mpRead.advInterval);
  const connectRes = await readStep('Read Connectable Error', mpRead.deviceConnectable);
  const needRes = await readStep('Read Need Password Error', mpRead.connectationNeedPassword);
  const txRes = await readStep('Read Tx Power Error', mpRead.txPower);

  return {
    advName: strField(nameRes, 'deviceName'),
    interval: strField(intervalRes, 'interval'),
    connectable: boolField(connectRes, 'connectable'),
    needPassword: boolField(needRes, 'need'),
    txPower: txPowerFromLabel(strField(txRes, 'txPower')),
  };
}

/** 对齐 MKMPBleSettingsDataModel configDataWithSucBlock */
export async function configBleSettings(state: BleSettingsState): Promise<void> {
  if (!validateBleSettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG_BLE_SETTINGS);
  }
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }

  const interval = parseInt(state.interval, 10);

  await readStep('Config Device Name Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_device_name(state.advName, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Adv Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_adv_interval(interval, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Connectable Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_connectable_status(state.connectable, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Need Password Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_need_password(state.needPassword, s, f),
    ).then(() => ({})),
  );
  await readStep('Config Tx Power Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_tx_power(state.txPower, s, f),
    ).then(() => ({})),
  );
}

export async function configBlePassword(password: string): Promise<void> {
  if (password.length !== 8) {
    throw new Error('The password should be 8 characters.Please try again.');
  }
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
  await readStep('Config Password Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_password(password, s, f),
    ).then(() => ({})),
  );
}
