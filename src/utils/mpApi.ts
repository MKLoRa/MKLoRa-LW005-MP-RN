/**
 * LW005-MP 读/写辅助（对齐 MKMPInterface / MKMPInterfaceConfig）
 */
import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import MPCentralManager from '../sdk/MPCentralManager';
import {parseFilterAdvNameList} from '../sdk/MPSDKDataAdopter';
import {
  BluetoothFixMechanism,
  LoRaWanClassType,
  LoRaWanMessageType,
  LoRaWanModem,
} from '../sdk/MPSDKDefines';
import {
  type BleFixState,
  SAVE_VALIDATION_MSG_BLE,
  validateBleFix,
} from './bleFixModel';
import {
  type GpsFixState,
  type OutdoorFixState,
  SAVE_VALIDATION_MSG_GPS,
  SAVE_VALIDATION_MSG_OUTDOOR,
  validateGpsFix,
  validateOutdoorFix,
} from './gpsFixModel';
import {
  type FilterByListState,
  SAVE_VALIDATION_MSG_FILTER,
  formatHexList,
  validateAdvNameList,
  validateMacList,
} from './filterByListModel';
import {
  type ConnectionSettingsState,
  DEFAULT_CONNECTION_SETTINGS,
  SAVE_VALIDATION_MSG,
  clampDeviceRegion,
  deviceModemToUiModel,
  showCHSection,
  showDutySection,
  showJoinSection,
  uiModemToDeviceModem,
  validateConnectionSettings,
} from './connectionSettingsModel';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

type ConfigFn = (suc?: () => void, failed?: (e: Error) => void) => void;

/** 全局串行 BLE 队列，避免多 Tab / 并发导致应答错位、超时 */
let bleReadChain: Promise<unknown> = Promise.resolve();

function enqueueBleRead<T>(fn: () => Promise<T>): Promise<T> {
  const run = () => bleReadChain.then(fn, fn);
  const result = run();
  bleReadChain = result.catch(() => undefined);
  return result;
}

export function readPromise(fn: ReadFn): Promise<Record<string, unknown>> {
  return enqueueBleRead(
    () =>
      new Promise((resolve, reject) => {
        fn(
          data => {
            const payload = data as {result?: Record<string, unknown>} | undefined;
            if (payload?.result != null) {
              resolve(payload.result);
              return;
            }
            reject(new Error('Request data error'));
          },
          err => reject(err),
        );
      }),
  );
}

export function configPromise(fn: ConfigFn): Promise<void> {
  return enqueueBleRead(
    () =>
      new Promise((resolve, reject) => {
        fn(
          () => resolve(),
          err => reject(err),
        );
      }),
  );
}

/** 等待全局 BLE Promise 队列空闲（例如 LoRa App 页 0540 读完后，再进 Message Type） */
export async function waitForBleIdle(): Promise<void> {
  await bleReadChain;
}

export async function waitForBleReady(timeoutMs = 5000): Promise<boolean> {
  const central = MPCentralManager.shared();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (central.isReadyToCommunicate()) {
      return true;
    }
    await new Promise<void>(r => setTimeout(r, 80));
  }
  return central.isReadyToCommunicate();
}

export const mpRead = {
  lorawanModem: () => readPromise(MPInterface.read_lorawan_modem as ReadFn),
  lorawanRegion: () => readPromise(MPInterface.read_lorawan_region as ReadFn),
  lorawanNetworkStatus: () =>
    readPromise(MPInterface.read_lorawan_network_status as ReadFn),
  offlineFixStatus: () =>
    readPromise(MPInterface.read_offline_fix_status as ReadFn),
  gpsLimitUploadStatus: () =>
    readPromise(MPInterface.read_gps_limit_upload_status as ReadFn),
  beaconVoltageReportInBleFix: () =>
    readPromise(MPInterface.read_beacon_voltage_report_in_ble_fix as ReadFn),
  heartbeatInterval: () =>
    readPromise(MPInterface.read_heartbeat_interval as ReadFn),
  hallPowerOffStatus: () =>
    readPromise(MPInterface.read_hall_power_off_status as ReadFn),
  shutdownPayloadStatus: () =>
    readPromise(MPInterface.read_shutdown_payload_status as ReadFn),
  timeZone: () => readPromise(MPInterface.read_time_zone as ReadFn),
  lowPowerPayloadStatus: () =>
    readPromise(MPInterface.read_low_power_payload_status as ReadFn),
  lowPowerPrompt: () =>
    readPromise(MPInterface.read_low_power_condition1_voltage_threshold as ReadFn),
  lowPowerPayloadInterval: () =>
    readPromise(MPInterface.read_low_power_payload_interval as ReadFn),
  lorawanDevTimeSyncInterval: () =>
    readPromise(MPInterface.read_lorawan_time_sync_interval as ReadFn),
  lorawanNetworkCheckInterval: () =>
    readPromise(MPInterface.read_lorawan_network_check_interval as ReadFn),
  manDownPayloadData: () =>
    readPromise(MPInterface.read_man_down_detection_payload_data as ReadFn),
  tamperAlarmPayloadData: () =>
    readPromise(MPInterface.read_tamper_alarm_payload_data as ReadFn),
  heartbeatPayloadData: () =>
    readPromise(MPInterface.read_heartbeat_payload_data as ReadFn),
  positioningPayloadData: () =>
    readPromise(MPInterface.read_positioning_payload_data as ReadFn),
  lowPowerPayloadData: () =>
    readPromise(MPInterface.read_low_power_payload_data as ReadFn),
  shockPayloadData: () =>
    readPromise(MPInterface.read_shock_payload_data as ReadFn),
  eventPayloadData: () =>
    readPromise(MPInterface.read_event_payload_data as ReadFn),
  gpsLimitPayloadData: () =>
    readPromise(MPInterface.read_gps_limit_payload_data as ReadFn),
  lorawanDEVEUI: () => readPromise(MPInterface.read_lorawan_deveui as ReadFn),
  lorawanAPPEUI: () => readPromise(MPInterface.read_lorawan_appeui as ReadFn),
  lorawanAPPKEY: () => readPromise(MPInterface.read_lorawan_appkey as ReadFn),
  lorawanDEVADDR: () =>
    readPromise(MPInterface.read_lorawan_devaddr as ReadFn),
  lorawanAPPSKEY: () =>
    readPromise(MPInterface.read_lorawan_appskey as ReadFn),
  lorawanNWKSKEY: () =>
    readPromise(MPInterface.read_lorawan_nwkskey as ReadFn),
  lorawanCH: () => readPromise(MPInterface.read_lorawan_ch as ReadFn),
  lorawanDR: () => readPromise(MPInterface.read_lorawan_dr as ReadFn),
  lorawanUplinkStrategy: () =>
    readPromise(MPInterface.read_lorawan_uplink_strategy as ReadFn),
  lorawanDutyCycleStatus: () =>
    readPromise(MPInterface.read_lorawan_duty_cycle_status as ReadFn),
  lorawanADRACKLimit: () =>
    readPromise(MPInterface.read_lorawan_adrack_limit as ReadFn),
  lorawanADRACKDelay: () =>
    readPromise(MPInterface.read_lorawan_adrack_delay as ReadFn),
  blePositioningTimeout: () =>
    readPromise(MPInterface.read_ble_positioning_timeout as ReadFn),
  blePositioningNumberOfMac: () =>
    readPromise(MPInterface.read_ble_positioning_number_of_mac as ReadFn),
  bluetoothFixMechanism: () =>
    readPromise(MPInterface.read_bluetooth_fix_mechanism as ReadFn),
  rssiFilterValue: () =>
    readPromise(MPInterface.read_rssi_filter_value as ReadFn),
  filterRelationship: () =>
    readPromise(MPInterface.read_filter_relationship as ReadFn),
  gpsFixPositioningTimeout: () =>
    readPromise(MPInterface.read_gps_fix_positioning_timeout as ReadFn),
  gpsFixPDOP: () => readPromise(MPInterface.read_gps_fix_pdop as ReadFn),
  outdoorBLEReportInterval: () =>
    readPromise(MPInterface.read_outdoor_ble_report_interval as ReadFn),
  outdoorGPSReportInterval: () =>
    readPromise(MPInterface.read_outdoor_gps_report_interval as ReadFn),
  filterByMacPreciseMatch: () =>
    readPromise(MPInterface.read_filter_by_mac_precise_match as ReadFn),
  filterByMacReverseFilter: () =>
    readPromise(MPInterface.read_filter_by_mac_reverse_filter as ReadFn),
  filterMACAddressList: () =>
    readPromise(MPInterface.read_filter_mac_address_list as ReadFn),
  filterByAdvNamePreciseMatch: () =>
    readPromise(MPInterface.read_filter_by_adv_name_precise_match as ReadFn),
  filterByAdvNameReverseFilter: () =>
    readPromise(MPInterface.read_filter_by_adv_name_reverse_filter as ReadFn),

  lorawanClassType: () =>
    readPromise(MPInterface.read_lorawan_class_type as ReadFn),
  lorawanMessageType: () =>
    readPromise(MPInterface.read_lorawan_message_type as ReadFn),
  lorawanMaxRetransmissionTimes: () =>
    readPromise(MPInterface.read_lorawan_max_retransmission_times as ReadFn),
  deviceName: () => readPromise(MPInterface.read_device_name as ReadFn),
  advInterval: () => readPromise(MPInterface.read_adv_interval as ReadFn),
  deviceConnectable: () =>
    readPromise(MPInterface.read_device_connectable as ReadFn),
  connectationNeedPassword: () =>
    readPromise(MPInterface.read_connectation_need_password as ReadFn),
  txPower: () => readPromise(MPInterface.read_tx_power as ReadFn),
};

export const mpConfig = {
  offlineFix: (isOn: boolean) =>
    configPromise((s, f) => MPInterfaceConfig.configOfflineFix(isOn, s, f)),
  gpsLimitUploadStatus: (isOn: boolean) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configGpsLimitUploadStatus(isOn, s, f),
    ),
  beaconVoltageReportInBleFixStatus: (isOn: boolean) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configBeaconVoltageReportInBleFixStatus(isOn, s, f),
    ),
  heartbeatInterval: (interval: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configHeartbeatInterval(interval, s, f),
    ),
  timeZone: (timeZone: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_time_zone(timeZone, s, f),
    ),
  lowPowerPayloadStatus: (isOn: boolean) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerPayloadStatus(isOn, s, f),
    ),
  lowPowerPayloadInterval: (interval: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerPayloadInterval(interval, s, f),
    ),
  factoryReset: () =>
    configPromise((s, f) => MPInterfaceConfig.factory_reset(s, f)),
  lorawanDevTimeSyncInterval: (interval: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_time_sync_interval(interval, s, f),
    ),
  lorawanNetworkCheckInterval: (interval: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_lorawan_network_check_interval(interval, s, f),
    ),
  shockPayload: (type: number, times: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configShockPayloadWithMessageType(type, times, s, f),
    ),
  manDownPayload: (type: number, times: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configManDownDetectionPayloadWithMessageType(
        type,
        times,
        s,
        f,
      ),
    ),
  eventPayload: (type: number, times: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configEventPayloadWithMessageType(type, times, s, f),
    ),
  tamperAlarmPayload: (type: number, times: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTamperAlarmPayloadWithMessageType(
        type,
        times,
        s,
        f,
      ),
    ),
  heartbeatPayload: (type: number, times: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configHeartbeatPayloadWithMessageType(
        type,
        times,
        s,
        f,
      ),
    ),
  lowPowerPayload: (type: number, times: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configLowPowerPayloadWithMessageType(
        type,
        times,
        s,
        f,
      ),
    ),
  positioningPayload: (type: number, times: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configPositioningPayloadWithMessageType(
        type,
        times,
        s,
        f,
      ),
    ),
  gpsLimitPayload: (type: number, times: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configGPSLimitPayloadWithMessageType(
        type,
        times,
        s,
        f,
      ),
    ),
  modem: (modem: LoRaWanModem) =>
    configPromise((s, f) => MPInterfaceConfig.config_modem(modem, s, f)),
  region: (region: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_region(clampDeviceRegion(region), s, f),
    ),
  blePositioningTimeout: (timeout: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configBlePositioningTimeout(timeout, s, f),
    ),
  blePositioningNumberOfMac: (number: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configBlePositioningNumberOfMac(number, s, f),
    ),
  bluetoothFixMechanism: (priority: BluetoothFixMechanism) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configBluetoothFixMechanism(priority, s, f),
    ),
  rssiFilterValue: (rssi: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configRssiFilterValue(rssi, s, f),
    ),
  filterRelationship: (relationship: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterRelationship(relationship, s, f),
    ),
  gpsFixPositioningTimeout: (timeout: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configGPSFixPositioningTimeout(timeout, s, f),
    ),
  gpsFixPDOP: (pdop: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configGPSFixPDOP(pdop, s, f),
    ),
  outdoorBLEReportInterval: (interval: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configOutdoorBLEReportInterval(interval, s, f),
    ),
  outdoorGPSReportInterval: (interval: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configOutdoorGPSReportInterval(interval, s, f),
    ),
  filterByMacPreciseMatch: (isOn: boolean) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByMacPreciseMatch(isOn, s, f),
    ),
  filterByMacReverseFilter: (isOn: boolean) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByMacReverseFilter(isOn, s, f),
    ),
  filterMACAddressList: (macList: string[]) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterMACAddressList(macList, s, f),
    ),
  filterByAdvNamePreciseMatch: (isOn: boolean) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByAdvNamePreciseMatch(isOn, s, f),
    ),
  filterByAdvNameReverseFilter: (isOn: boolean) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByAdvNameReverseFilter(isOn, s, f),
    ),
  filterAdvNameList: (nameList: string[]) =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterAdvNameList(nameList, s, f),
    ),
  devEUI: (v: string) =>
    configPromise((s, f) => MPInterfaceConfig.config_deveui(v, s, f)),
  appEUI: (v: string) =>
    configPromise((s, f) => MPInterfaceConfig.config_appeui(v, s, f)),
  appKey: (v: string) =>
    configPromise((s, f) => MPInterfaceConfig.config_appkey(v, s, f)),
  devAddr: (v: string) =>
    configPromise((s, f) => MPInterfaceConfig.config_devaddr(v, s, f)),
  appSkey: (v: string) =>
    configPromise((s, f) => MPInterfaceConfig.config_appskey(v, s, f)),
  nwkSkey: (v: string) =>
    configPromise((s, f) => MPInterfaceConfig.config_nwkskey(v, s, f)),
  ch: (chl: number, chh: number) =>
    configPromise((s, f) => MPInterfaceConfig.config_chl(chl, chh, s, f)),
  dr: (dr: number) =>
    configPromise((s, f) => MPInterfaceConfig.config_dr(dr, s, f)),
  uplinkStrategy: (
    isOn: boolean,
    _transmissions: number,
    drl: number,
    drh: number,
  ) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_uplink_strategy(isOn, drl, drh, s, f),
    ),
  dutyCycle: (isOn: boolean) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_duty_cycle_status(isOn, s, f),
    ),
  restartDevice: () =>
    configPromise((s, f) => MPInterfaceConfig.restart_device(s, f)),
  messageType: (type: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_message_type(
        type === 1 ? LoRaWanMessageType.Confirm : LoRaWanMessageType.Unconfirm,
        s,
        f,
      ),
    ),
  classType: (uiClassType: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_class_type(
        uiClassType === 1 ? LoRaWanClassType.C : LoRaWanClassType.A,
        s,
        f,
      ),
    ),
  maxRetransmission: (deviceTimes: number) =>
    configPromise((s, f) =>
      MPInterfaceConfig.config_lorawan_max_retransmission_times(
        deviceTimes,
        s,
        f,
      ),
    ),
};

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

function numField(res: Record<string, unknown>, key: string): number {
  return Number(res[key] ?? 0);
}

function boolField(res: Record<string, unknown>, key: string): boolean {
  const v = res[key];
  if (typeof v === 'boolean') {
    return v;
  }
  return Number(v) === 1;
}

async function readStep(
  msg: string,
  read: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  try {
    return await read();
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
  }
}

/** 对齐 MKMPLoRaSettingModel readDataWithSucBlock */
export async function readConnectionSettings(): Promise<ConnectionSettingsState> {
  await waitForBleIdle();
  const base: ConnectionSettingsState = {...DEFAULT_CONNECTION_SETTINGS};

  const modemRes = await readStep('Read Modem Error', mpRead.lorawanModem);
  base.modem = deviceModemToUiModel(numField(modemRes, 'modem') || 1);

  const regionRes = await readStep('Read Region Error', mpRead.lorawanRegion);
  base.region = clampDeviceRegion(numField(regionRes, 'region'));

  base.devEUI = strField(
    await readStep('Read DevEUI Error', mpRead.lorawanDEVEUI),
    'devEUI',
  );
  base.appEUI = strField(
    await readStep('Read AppEUI Error', mpRead.lorawanAPPEUI),
    'appEUI',
  );
  base.appKey = strField(
    await readStep('Read AppKey Error', mpRead.lorawanAPPKEY),
    'appKey',
  );
  base.devAddr = strField(
    await readStep('Read DevAddr Error', mpRead.lorawanDEVADDR),
    'devAddr',
  );
  base.appSKey = strField(
    await readStep('Read AppSKEY Error', mpRead.lorawanAPPSKEY),
    'appSkey',
  );
  base.nwkSKey = strField(
    await readStep('Read NWKSKEY Error', mpRead.lorawanNWKSKEY),
    'nwkSkey',
  );

  const msgRes = await readStep(
    'Read Message Type Error',
    mpRead.lorawanMessageType,
  );
  base.messageType = numField(msgRes, 'messageType');

  const classRes = await readStep(
    'Read Class Type Error',
    mpRead.lorawanClassType,
  );
  const deviceClass = numField(classRes, 'classType');
  base.classType = deviceClass === 0 ? 0 : 1;

  const retransRes = await readStep(
    'Read Max retransmission times Error',
    mpRead.lorawanMaxRetransmissionTimes,
  );
  const deviceRetrans = numField(retransRes, 'number');
  base.maxRetransmission = Math.max(
    0,
    Math.min(7, deviceRetrans > 0 ? deviceRetrans - 1 : 0),
  );

  if (!base.needAdvanceSetting) {
    return base;
  }

  if (showCHSection(base.region)) {
    const ch = await readStep('Read CH Error', mpRead.lorawanCH);
    base.CHL = numField(ch, 'CHL');
    base.CHH = numField(ch, 'CHH');
  }
  if (showDutySection(base.region)) {
    const duty = await readStep(
      'Read Duty Cycle Error',
      mpRead.lorawanDutyCycleStatus,
    );
    base.dutyIsOn = boolField(duty, 'isOn');
  }
  if (showJoinSection(base.region)) {
    const dr = await readStep('Read Dr For Join Error', mpRead.lorawanDR);
    base.join = numField(dr, 'DR');
  }
  const uplink = await readStep(
    'Read Uplink  Strategy Error',
    mpRead.lorawanUplinkStrategy,
  );
  base.adrIsOn = boolField(uplink, 'isOn');
  const transmissions = numField(uplink, 'transmissions');
  base.transmissions =
    transmissions === 1 || transmissions === 2 ? transmissions : 1;
  base.DRL = numField(uplink, 'DRL');
  base.DRH = numField(uplink, 'DRH');

  return base;
}

/** 对齐 MKMPLoRaSettingModel configDataWithSucBlock */
export async function configConnectionSettings(
  state: ConnectionSettingsState,
): Promise<void> {
  if (!validateConnectionSettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }

  const bleStepDelay = () =>
    new Promise<void>(r => setTimeout(r, 120));

  const run = async (msg: string, fn: () => Promise<void>) => {
    try {
      await fn();
      await bleStepDelay();
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(
        detail === 'Operation failed' || detail === msg
          ? msg
          : `${msg}: ${detail}`,
      );
    }
  };

  await run('Config Modem Error', () =>
    mpConfig.modem(uiModemToDeviceModem(state.modem)),
  );
  await run('Config Region Error', () => mpConfig.region(state.region));
  await run('Config DevEUI Error', () => mpConfig.devEUI(state.devEUI));
  await run('Config AppEUI Error', () => mpConfig.appEUI(state.appEUI));

  if (state.modem === 1) {
    await run('Config DevAddr Error', () => mpConfig.devAddr(state.devAddr));
    await run('Config AppSKEY Error', () => mpConfig.appSkey(state.appSKey));
    await run('Config NWKSKEY Error', () => mpConfig.nwkSkey(state.nwkSKey));
  } else {
    await run('Config AppKey Error', () => mpConfig.appKey(state.appKey));
  }

  await run('Config Message Type Error', () =>
    mpConfig.messageType(state.messageType),
  );
  await run('Config Class Type Error', () =>
    mpConfig.classType(state.classType),
  );

  if (!state.needAdvanceSetting) {
    await run('Connect network error', () => mpConfig.restartDevice());
    return;
  }

  if (showCHSection(state.region)) {
    await run('Config CH Error', () =>
      mpConfig.ch(state.CHL, state.CHH),
    );
  }
  if (showDutySection(state.region)) {
    await run('Config Duty Cycle Error', () =>
      mpConfig.dutyCycle(state.dutyIsOn),
    );
  }
  if (showJoinSection(state.region)) {
    await run('Config DR For Join Error', () => mpConfig.dr(state.join));
  }
  await run('Config Uplink  Strategy Error', () =>
    mpConfig.uplinkStrategy(
      state.adrIsOn,
      state.transmissions,
      state.DRL,
      state.DRH,
    ),
  );
  await run('Config Max retransmission times Error', () =>
    mpConfig.maxRetransmission(state.maxRetransmission + 1),
  );
  await run('Connect network error', () => mpConfig.restartDevice());
}

/** 对齐 MKMPBleFixDataModel readDataWithSucBlock */
export async function readBleFixSettings(): Promise<BleFixState> {
  await waitForBleIdle();
  const timeoutRes = await readStep('Read Timeout Error', mpRead.blePositioningTimeout);
  const numberRes = await readStep(
    'Read Number Error',
    mpRead.blePositioningNumberOfMac,
  );
  const priorityRes = await readStep(
    'Read Ble Priority Error',
    mpRead.bluetoothFixMechanism,
  );
  const rssiRes = await readStep('Read Filter Rssi Error', mpRead.rssiFilterValue);
  const relRes = await readStep(
    'Read Filter Relationship Error',
    mpRead.filterRelationship,
  );
  return {
    timeout: strField(timeoutRes, 'timeout') || '1',
    number: strField(numberRes, 'number') || '1',
    priority: numField(priorityRes, 'priority'),
    rssi: numField(rssiRes, 'rssi'),
    relationship: numField(relRes, 'relationship'),
  };
}

/** 对齐 MKMPBleFixDataModel configDataWithSucBlock */
export async function configBleFixSettings(state: BleFixState): Promise<void> {
  if (!validateBleFix(state)) {
    throw new Error(SAVE_VALIDATION_MSG_BLE);
  }
  const bleStepDelay = () => new Promise<void>(r => setTimeout(r, 120));
  const run = async (msg: string, fn: () => Promise<void>) => {
    try {
      await fn();
      await bleStepDelay();
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(
        detail === 'Operation failed' || detail === msg ? msg : `${msg}: ${detail}`,
      );
    }
  };
  await run('Config Timeout Error', () =>
    mpConfig.blePositioningTimeout(parseInt(state.timeout, 10)),
  );
  await run('Config Number Error', () =>
    mpConfig.blePositioningNumberOfMac(parseInt(state.number, 10)),
  );
  await run('Config Ble Priority Error', () =>
    mpConfig.bluetoothFixMechanism(state.priority as BluetoothFixMechanism),
  );
  await run('Config Filter Rssi Error', () =>
    mpConfig.rssiFilterValue(state.rssi),
  );
  await run('Config Filter Relationship Error', () =>
    mpConfig.filterRelationship(state.relationship),
  );
}

/** 对齐 MKMPLCGpsFixModel */
export async function readGpsFixSettings(): Promise<GpsFixState> {
  await waitForBleIdle();
  const timeoutRes = await readStep(
    'Read Positioning Timeout Error',
    mpRead.gpsFixPositioningTimeout,
  );
  const pdopRes = await readStep('Read PDOP Error', mpRead.gpsFixPDOP);
  return {
    timeout: strField(timeoutRes, 'timeout') || '30',
    pdop: strField(pdopRes, 'pdop') || '25',
  };
}

export async function configGpsFixSettings(state: GpsFixState): Promise<void> {
  if (!validateGpsFix(state)) {
    throw new Error(SAVE_VALIDATION_MSG_GPS);
  }
  const delay = () => new Promise<void>(r => setTimeout(r, 120));
  const run = async (msg: string, fn: () => Promise<void>) => {
    try {
      await fn();
      await delay();
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(
        detail === 'Operation failed' || detail === msg ? msg : `${msg}: ${detail}`,
      );
    }
  };
  await run('Config Positioning Timeout Error', () =>
    mpConfig.gpsFixPositioningTimeout(parseInt(state.timeout, 10)),
  );
  await run('Config PDOP Error', () =>
    mpConfig.gpsFixPDOP(parseInt(state.pdop, 10)),
  );
}

/** 对齐 MKMPOutdoorFixModel */
export async function readOutdoorFixSettings(): Promise<OutdoorFixState> {
  await waitForBleIdle();
  const bleRes = await readStep(
    'Read Outdoor BLE Report Interval Error',
    mpRead.outdoorBLEReportInterval,
  );
  const gpsRes = await readStep(
    'Read Outdoor GPS Report Interval Error',
    mpRead.outdoorGPSReportInterval,
  );
  return {
    bleInterval: strField(bleRes, 'interval') || '1',
    gpsInterval: strField(gpsRes, 'interval') || '1',
  };
}

export async function configOutdoorFixSettings(
  state: OutdoorFixState,
): Promise<void> {
  if (!validateOutdoorFix(state)) {
    throw new Error(SAVE_VALIDATION_MSG_OUTDOOR);
  }
  const delay = () => new Promise<void>(r => setTimeout(r, 120));
  const run = async (msg: string, fn: () => Promise<void>) => {
    try {
      await fn();
      await delay();
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(
        detail === 'Operation failed' || detail === msg ? msg : `${msg}: ${detail}`,
      );
    }
  };
  await run('Config Outdoor BLE Report Interval Error', () =>
    mpConfig.outdoorBLEReportInterval(parseInt(state.bleInterval, 10)),
  );
  await run('Config Outdoor GPS Report Interval Error', () =>
    mpConfig.outdoorGPSReportInterval(parseInt(state.gpsInterval, 10)),
  );
}

function readAdvNameListPromise(): Promise<string[]> {
  return enqueueBleRead(
    () =>
      new Promise((resolve, reject) => {
        MPInterface.read_filter_adv_name_list(
          data => {
            const payload = data as {result?: unknown};
            const r = payload?.result;
            if (Array.isArray(r)) {
              resolve(parseFilterAdvNameList(r as Uint8Array[]));
              return;
            }
            if (
              r &&
              typeof r === 'object' &&
              Array.isArray((r as {nameList?: string[]}).nameList)
            ) {
              resolve((r as {nameList: string[]}).nameList);
              return;
            }
            reject(new Error('Request data error'));
          },
          err => reject(err),
        );
      }),
  );
}

/** 对齐 MKMPFilterByMacModel */
export async function readFilterByMacSettings(): Promise<FilterByListState> {
  await waitForBleIdle();
  const matchRes = await readStep(
    'Read Filter Precise Match Error',
    mpRead.filterByMacPreciseMatch,
  );
  const filterRes = await readStep(
    'Read Reverse Filter Error',
    mpRead.filterByMacReverseFilter,
  );
  const listRes = await readStep('Read Mac List Error', mpRead.filterMACAddressList);
  return {
    match: boolField(matchRes, 'isOn'),
    filter: boolField(filterRes, 'isOn'),
    items: formatHexList(listRes.macList),
  };
}

export async function configFilterByMacSettings(
  state: FilterByListState,
): Promise<void> {
  const macList = state.items.map(s => s.trim()).filter(Boolean);
  if (!validateMacList(macList)) {
    throw new Error(SAVE_VALIDATION_MSG_FILTER);
  }
  const delay = () => new Promise<void>(r => setTimeout(r, 120));
  const run = async (msg: string, fn: () => Promise<void>) => {
    try {
      await fn();
      await delay();
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(
        detail === 'Operation failed' || detail === msg ? msg : `${msg}: ${detail}`,
      );
    }
  };
  await run('Config Filter Precise Match Error', () =>
    mpConfig.filterByMacPreciseMatch(state.match),
  );
  await run('Config Reverse Filter Error', () =>
    mpConfig.filterByMacReverseFilter(state.filter),
  );
  await run('Config Mac List Error', () =>
    mpConfig.filterMACAddressList(macList),
  );
}

/** 对齐 MKMPFilterByAdvNameModel */
export async function readFilterByAdvNameSettings(): Promise<FilterByListState> {
  await waitForBleIdle();
  const matchRes = await readStep(
    'Read Filter Precise Match Error',
    mpRead.filterByAdvNamePreciseMatch,
  );
  const filterRes = await readStep(
    'Read Reverse Filter Error',
    mpRead.filterByAdvNameReverseFilter,
  );
  let nameList: string[] = [];
  try {
    nameList = await readAdvNameListPromise();
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(
      detail === 'Operation failed'
        ? 'Read Adv Name List Error'
        : `Read Adv Name List Error: ${detail}`,
    );
  }
  return {
    match: boolField(matchRes, 'isOn'),
    filter: boolField(filterRes, 'isOn'),
    items: nameList,
  };
}

export async function configFilterByAdvNameSettings(
  state: FilterByListState,
): Promise<void> {
  const nameList = state.items.map(s => s.trim()).filter(Boolean);
  if (!validateAdvNameList(nameList)) {
    throw new Error(SAVE_VALIDATION_MSG_FILTER);
  }
  const delay = () => new Promise<void>(r => setTimeout(r, 120));
  const run = async (msg: string, fn: () => Promise<void>) => {
    try {
      await fn();
      await delay();
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(
        detail === 'Operation failed' || detail === msg ? msg : `${msg}: ${detail}`,
      );
    }
  };
  await run('Config Filter Precise Match Error', () =>
    mpConfig.filterByAdvNamePreciseMatch(state.match),
  );
  await run('Config Reverse Filter Error', () =>
    mpConfig.filterByAdvNameReverseFilter(state.filter),
  );
  await run('Config Adv Name List Error', () =>
    mpConfig.filterAdvNameList(nameList),
  );
}

export type {ConnectionSettingsState};
export type {BleFixState} from './bleFixModel';
export type {GpsFixState, OutdoorFixState} from './gpsFixModel';
export type {FilterByListState} from './filterByListModel';

export type MessageTypePayloadState = {
  heartbeat: {type: number; maxTimes: number};
  lowPower: {type: number; maxTimes: number};
  position: {type: number; maxTimes: number};
  shock: {type: number; maxTimes: number};
  manDown: {type: number; maxTimes: number};
  event: {type: number; maxTimes: number};
  tamperAlarm: {type: number; maxTimes: number};
  gpsLimit: {type: number; maxTimes: number};
};

/** 对齐 MKMPMessageTypeModel readDataWithSucBlock */
export async function readMessageTypeSettings(): Promise<MessageTypePayloadState> {
  await waitForBleIdle();
  const steps: Array<[string, () => Promise<Record<string, unknown>>]> = [
    ['Read Heartbeat Payload Error', mpRead.heartbeatPayloadData],
    ['Read Low-Power Payload Error', mpRead.lowPowerPayloadData],
    ['Read Positioning Payload Error', mpRead.positioningPayloadData],
    ['Read Shock Payload Error', mpRead.shockPayloadData],
    ['Read Man Down Payload Error', mpRead.manDownPayloadData],
    ['Read Event Payload Error', mpRead.eventPayloadData],
    ['Read Tampe Alarm Payload Error', mpRead.tamperAlarmPayloadData],
    ['Read GPS Payload Error', mpRead.gpsLimitPayloadData],
  ];
  const results: Array<{type: number; maxTimes: number}> = [];
  for (const [msg, read] of steps) {
    try {
      results.push(parsePayloadReadResult(await read()));
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
    }
  }
  const [
    heartbeat,
    lowPower,
    position,
    shock,
    manDown,
    event,
    tamperAlarm,
    gpsLimit,
  ] = results;
  return {heartbeat, lowPower, position, shock, manDown, event, tamperAlarm, gpsLimit};
}

/** 对齐 MKMPMessageTypeModel configDataWithSucBlock */
export async function configMessageTypeSettings(
  state: MessageTypePayloadState,
): Promise<void> {
  await waitForBleIdle();
  const bleStepDelay = () => new Promise<void>(r => setTimeout(r, 120));
  const steps: Array<
    [string, (type: number, times: number) => Promise<void>, {type: number; maxTimes: number}]
  > = [
    ['Config Heartbeat Payload Error', mpConfig.heartbeatPayload, state.heartbeat],
    ['Config Low-Power Payload Error', mpConfig.lowPowerPayload, state.lowPower],
    ['Config Positioning Payload Error', mpConfig.positioningPayload, state.position],
    ['Config Shock Payload Error', mpConfig.shockPayload, state.shock],
    ['Config Man Down Payload Error', mpConfig.manDownPayload, state.manDown],
    ['Config Event Payload Error', mpConfig.eventPayload, state.event],
    ['Config Tampe Alarm Payload Error', mpConfig.tamperAlarmPayload, state.tamperAlarm],
    ['Config GPS Payload Error', mpConfig.gpsLimitPayload, state.gpsLimit],
  ];
  for (const [msg, config, payload] of steps) {
    try {
      await config(payload.type, payload.maxTimes + 1);
      await bleStepDelay();
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(
        detail === 'Operation failed' || detail === msg ? msg : `${msg}: ${detail}`,
      );
    }
  }
}

/** 解析 payload 读结果：retransmissionTimes 为 1~4，UI 下标为 times-1 */
export function parsePayloadReadResult(
  res: Record<string, unknown>,
): {type: number; maxTimes: number} {
  const type = Number(res.type ?? 0);
  const retrans = Number(res.retransmissionTimes ?? 1);
  return {type, maxTimes: Math.max(0, Math.min(3, retrans - 1))};
}

export function apiErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message || 'Operation failed';
  }
  return 'Operation failed';
}

export function classTypeLabel(classType: unknown): string {
  const n = Number(classType);
  return n === 0 ? 'ClassA' : 'ClassC';
}

export function modemLabel(modem: unknown): string {
  return Number(modem) === 1 ? 'ABP' : 'OTAA';
}

export function networkStatusLabel(status: unknown): string {
  return Number(status) === 0 ? 'Connecting' : 'Connected';
}

