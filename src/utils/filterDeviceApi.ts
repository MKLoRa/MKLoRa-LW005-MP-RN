import MPInterface from '../sdk/MPInterface';
import MPInterfaceConfig from '../sdk/MPInterfaceConfig';
import {
  DeviceMode,
  FilterByOther,
  PositioningStrategy,
} from '../sdk/MPSDKDefines';
import type {BLEFilterRawData} from '../sdk/MPConfigSupport';
import type {TimingModeTimePoint, TimeSegmentedModePeriod} from '../sdk/MPSDKDataAdopter';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './mpApi';
import type {
  BeaconFilterState,
  BxpButtonFilterState,
  BxpTagFilterState,
  FilterTypeStatus,
  OtherFilterState,
  PirFilterState,
  TlmFilterState,
  TofFilterState,
  UidFilterState,
  UrlFilterState,
} from './filterRawDataModel';
import {
  otherConditionsToBle,
  relationshipFromPicker,
  SAVE_VALIDATION_MSG,
  validateBeaconFilter,
  validatePirFilter,
  validateOtherFilter,
  otherConditionFromDevice,
  validateTagIdList,
  validateTofCodeList,
  validateUidFilter,
  validateUrlFilter,
} from './filterRawDataModel';
import type {MotionModeState, TimingTimePoint, TimeSegmentedPeriod} from './deviceModeModel';
import {timeSegmentedPeriodToProtocol} from './deviceModeModel';
import {
  DEFAULT_MOTION_MODE,
  SAVE_VALIDATION_MSG as DEVICE_SAVE_MSG,
  validateMotionMode,
  validatePeriodicInterval,
} from './deviceModeModel';

import {
  beaconRangeFromDevice,
  beaconRangeToConfig,
  pirRangeFromDevice,
  pirRangeToConfig,
} from './filterRangeModel';
import {formatHexForDisplay, formatHexList} from './filterByListModel';

export {apiErrorMessage, waitForBleReady, waitForBleIdle};

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

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

function boolField(res: Record<string, unknown>, key: string): boolean {
  const v = res[key];
  if (typeof v === 'boolean') {
    return v;
  }
  return Number(v) === 1;
}

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

function numField(res: Record<string, unknown>, key: string): number {
  return Number(res[key] ?? 0);
}

async function configRun(msg: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    await new Promise<void>(r => setTimeout(r, 120));
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(
      detail === 'Operation failed' || detail === msg ? msg : `${msg}: ${detail}`,
    );
  }
}

// —— Filter type status hub ——

export async function readFilterTypeStatus(): Promise<FilterTypeStatus> {
  await waitForBleIdle();
  const res = await readStep('Read Filter Type Status Error', () =>
    readPromise(MPInterface.read_filter_type_status as ReadFn),
  );
  return {
    other: boolField(res, 'other'),
    iBeacon: boolField(res, 'iBeacon'),
    uid: boolField(res, 'uid'),
    url: boolField(res, 'url'),
    tlm: boolField(res, 'tlm'),
    bxp_acc: boolField(res, 'bxp_acc'),
    bxp_th: boolField(res, 'bxp_th'),
    bxp_ts: boolField(res, 'bxp_ts'),
    bxp_deviceInfo: boolField(res, 'bxp_deviceInfo'),
    bxp_button: boolField(res, 'bxp_button'),
    bxp_pir: boolField(res, 'bxp_pir'),
    bxp_tof: boolField(res, 'bxp_tof'),
    bxp_beacon: boolField(res, 'bxp_beacon'),
  };
}

export async function configBxpDeviceInfoFilter(isOn: boolean): Promise<void> {
  await configRun('Config BXP Device Info Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByBXPDeviceInfoStatus(isOn, s, f),
    ),
  );
}

export async function configBxpAccFilter(isOn: boolean): Promise<void> {
  await configRun('Config BXP ACC Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configBXPAccFilterStatus(isOn, s, f),
    ),
  );
}

export async function configBxpThFilter(isOn: boolean): Promise<void> {
  await configRun('Config BXP T&H Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configBXPTHFilterStatus(isOn, s, f),
    ),
  );
}

// —— Beacon (iBeacon / BXP-iBeacon) ——

async function readBeaconVariant(
  variant: 'beacon' | 'bxp',
): Promise<BeaconFilterState> {
  await waitForBleIdle();
  const statusFn =
    variant === 'beacon'
      ? MPInterface.read_filter_by_beacon_status
      : MPInterface.read_filter_by_bxp_beacon_status;
  const majorFn =
    variant === 'beacon'
      ? MPInterface.read_filter_by_beacon_major_range
      : MPInterface.read_filter_by_bxp_beacon_major_range;
  const minorFn =
    variant === 'beacon'
      ? MPInterface.read_filter_by_beacon_minor_range
      : MPInterface.read_filter_by_bxp_beacon_minor_range;
  const uuidFn =
    variant === 'beacon'
      ? MPInterface.read_filter_by_beacon_uuid
      : MPInterface.read_filter_by_bxp_beacon_uuid;

  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(statusFn as ReadFn),
  );
  const majorRes = await readStep('Read Beacon Major Error', () =>
    readPromise(majorFn as ReadFn),
  );
  const minorRes = await readStep('Read Beacon Minor Error', () =>
    readPromise(minorFn as ReadFn),
  );
  const uuidRes = await readStep('Read Beacon UUID Error', () =>
    readPromise(uuidFn as ReadFn),
  );
  const range = beaconRangeFromDevice(majorRes, minorRes);
  return {
    isOn: boolField(statusRes, 'isOn'),
    ...range,
    uuid: formatHexForDisplay(strField(uuidRes, 'uuid')),
  };
}

export function readIBeaconFilter(): Promise<BeaconFilterState> {
  return readBeaconVariant('beacon');
}

export function readBxpIBeaconFilter(): Promise<BeaconFilterState> {
  return readBeaconVariant('bxp');
}

async function configBeaconVariant(
  variant: 'beacon' | 'bxp',
  state: BeaconFilterState,
): Promise<void> {
  if (!validateBeaconFilter(state)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }
  const maj = beaconRangeToConfig(state.minMajor, state.maxMajor);
  const min = beaconRangeToConfig(state.minMinor, state.maxMinor);
  const minMaj = maj.min;
  const maxMaj = maj.max;
  const minMin = min.min;
  const maxMin = min.max;

  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) => {
      if (variant === 'beacon') {
        MPInterfaceConfig.configFilterByBeaconStatus(state.isOn, s, f);
      } else {
        MPInterfaceConfig.configFilterByBXPBeaconStatus(state.isOn, s, f);
      }
    }),
  );
  await configRun('Config Beacon Major Error', () =>
    configPromise((s, f) => {
      if (variant === 'beacon') {
        MPInterfaceConfig.configFilterByBeaconMajorWithMinValue(
          minMaj,
          maxMaj,
          s,
          f,
        );
      } else {
        MPInterfaceConfig.configFilterByBXPBeaconMajorWithMinValue(
          minMaj,
          maxMaj,
          s,
          f,
        );
      }
    }),
  );
  await configRun('Config Beacon Minor Error', () =>
    configPromise((s, f) => {
      if (variant === 'beacon') {
        MPInterfaceConfig.configFilterByBeaconMinorWithMinValue(
          minMin,
          maxMin,
          s,
          f,
        );
      } else {
        MPInterfaceConfig.configFilterByBXPBeaconMinorWithMinValue(
          minMin,
          maxMin,
          s,
          f,
        );
      }
    }),
  );
  await configRun('Config Beacon UUID Error', () =>
    configPromise((s, f) => {
      if (variant === 'beacon') {
        MPInterfaceConfig.configFilterByBeaconUUID(state.uuid, s, f);
      } else {
        MPInterfaceConfig.configFilterByBXPBeaconUUID(state.uuid, s, f);
      }
    }),
  );
}

export function configIBeaconFilter(state: BeaconFilterState): Promise<void> {
  return configBeaconVariant('beacon', state);
}

export function configBxpIBeaconFilter(state: BeaconFilterState): Promise<void> {
  return configBeaconVariant('bxp', state);
}

// —— UID / URL / TLM ——

export async function readUidFilter(): Promise<UidFilterState> {
  await waitForBleIdle();
  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(MPInterface.read_filter_by_uid_status as ReadFn),
  );
  const nsRes = await readStep('Read Namespace ID Error', () =>
    readPromise(MPInterface.read_filter_by_uid_namespace_id as ReadFn),
  );
  const instRes = await readStep('Read Instance ID Error', () =>
    readPromise(MPInterface.read_filter_by_uid_instance_id as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    namespaceID: formatHexForDisplay(strField(nsRes, 'namespaceID')),
    instanceID: formatHexForDisplay(strField(instRes, 'instanceID')),
  };
}

export async function configUidFilter(state: UidFilterState): Promise<void> {
  if (!validateUidFilter(state)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }
  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByUIDStatus(state.isOn, s, f),
    ),
  );
  await configRun('Config Namespace ID Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByUIDNamespaceID(state.namespaceID, s, f),
    ),
  );
  await configRun('Config Instance ID Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByUIDInstanceID(state.instanceID, s, f),
    ),
  );
}

export async function readUrlFilter(): Promise<UrlFilterState> {
  await waitForBleIdle();
  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(MPInterface.read_filter_by_url_status as ReadFn),
  );
  const contentRes = await readStep('Read URL Content Error', () =>
    readPromise(MPInterface.read_filter_by_url_content as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    content: strField(contentRes, 'url') || strField(contentRes, 'content'),
  };
}

export async function configUrlFilter(state: UrlFilterState): Promise<void> {
  if (!validateUrlFilter(state)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }
  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByURLStatus(state.isOn, s, f),
    ),
  );
  await configRun('Config URL Content Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByURLContent(state.content, s, f),
    ),
  );
}

export async function readTlmFilter(): Promise<TlmFilterState> {
  await waitForBleIdle();
  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(MPInterface.read_filter_by_tlm_status as ReadFn),
  );
  const verRes = await readStep('Read TLM Version Error', () =>
    readPromise(MPInterface.read_filter_by_tlm_version as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    version: numField(verRes, 'version'),
  };
}

export async function configTlmFilter(state: TlmFilterState): Promise<void> {
  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByTLMStatus(state.isOn, s, f),
    ),
  );
  await configRun('Config TLM Version Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByTLMVersion(state.version, s, f),
    ),
  );
}

// —— BXP Button ——

export async function readBxpButtonFilter(): Promise<BxpButtonFilterState> {
  await waitForBleIdle();
  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(MPInterface.read_bxp_button_filter_status as ReadFn),
  );
  const alarmRes = await readStep('Read BXP-Button Content Error', () =>
    readPromise(MPInterface.read_bxp_button_alarm_filter_status as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    singlePress: boolField(alarmRes, 'singlePresse'),
    doublePress: boolField(alarmRes, 'doublePresse'),
    longPress: boolField(alarmRes, 'longPresse'),
    abnormal: boolField(alarmRes, 'abnormal'),
  };
}

export async function configBxpButtonFilter(
  state: BxpButtonFilterState,
): Promise<void> {
  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByBXPButtonStatus(state.isOn, s, f),
    ),
  );
  await configRun('Config BXP-Button Content Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByBXPButtonAlarmStatus(
        state.singlePress,
        state.doublePress,
        state.longPress,
        state.abnormal,
        s,
        f,
      ),
    ),
  );
}

// —— BXP Tag / TOF list ——

export async function readBxpTagFilter(): Promise<BxpTagFilterState> {
  await waitForBleIdle();
  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(MPInterface.read_filter_by_bxp_tag_id_status as ReadFn),
  );
  const matchRes = await readStep('Read Filter Precise Match Error', () =>
    readPromise(MPInterface.read_precise_match_tag_id_status as ReadFn),
  );
  const revRes = await readStep('Read Reverse Filter Error', () =>
    readPromise(MPInterface.read_reverse_filter_tag_id_status as ReadFn),
  );
  const listRes = await readStep('Read TagID List Error', () =>
    readPromise(MPInterface.read_filter_bxp_tag_id_list as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    match: boolField(matchRes, 'isOn'),
    filter: boolField(revRes, 'isOn'),
    items: formatHexList(listRes.tagIDList),
  };
}

export async function configBxpTagFilter(state: BxpTagFilterState): Promise<void> {
  if (!validateTagIdList(state.items)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }
  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByBXPTagIDStatus(state.isOn, s, f),
    ),
  );
  await configRun('Config Filter Precise Match Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configPreciseMatchTagIDStatus(state.match, s, f),
    ),
  );
  await configRun('Config Reverse Filter Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configReverseFilterTagIDStatus(state.filter, s, f),
    ),
  );
  await configRun('Config TagID List Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterBXPTagIDList(state.items, s, f),
    ),
  );
}

export async function readTofFilter(): Promise<TofFilterState> {
  await waitForBleIdle();
  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(MPInterface.read_filter_bxp_tof_status as ReadFn),
  );
  const listRes = await readStep('Read Code List Error', () =>
    readPromise(MPInterface.read_filter_bxp_tof_mfg_code_list as ReadFn),
  );
  return {
    isOn: boolField(statusRes, 'isOn'),
    items: formatHexList(listRes.codeList ?? listRes.mfgCodeList),
  };
}

export async function configTofFilter(state: TofFilterState): Promise<void> {
  if (!validateTofCodeList(state.items)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }
  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByTofStatus(state.isOn, s, f),
    ),
  );
  await configRun('Config TOF List Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterBXPTofList(state.items, s, f),
    ),
  );
}

// —— PIR ——

export async function readPirFilter(): Promise<PirFilterState> {
  await waitForBleIdle();
  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(MPInterface.read_filter_by_pir_status as ReadFn),
  );
  const delayRes = await readStep('Read Delay Status Error', () =>
    readPromise(MPInterface.read_filter_by_pir_delay_response_status as ReadFn),
  );
  const sensRes = await readStep('Read Sensor Sensitivity Error', () =>
    readPromise(MPInterface.read_filter_by_pir_sensor_sensitivity as ReadFn),
  );
  const detRes = await readStep('Read Detection Status Error', () =>
    readPromise(MPInterface.read_filter_by_pir_detection_status as ReadFn),
  );
  const doorRes = await readStep('Read Pir Door Status Error', () =>
    readPromise(MPInterface.read_filter_by_pir_door_status as ReadFn),
  );
  const majorRes = await readStep('Read Filter By Major Error', () =>
    readPromise(MPInterface.read_filter_by_pir_major_range as ReadFn),
  );
  const minorRes = await readStep('Read Filter By Minor Error', () =>
    readPromise(MPInterface.read_filter_by_pir_minor_range as ReadFn),
  );
  const major = pirRangeFromDevice(majorRes);
  const minor = pirRangeFromDevice(minorRes);
  return {
    isOn: boolField(statusRes, 'isOn'),
    delayStatus: numField(delayRes, 'status'),
    sensitivity: numField(sensRes, 'sensitivity'),
    detection: numField(detRes, 'status'),
    doorStatus: numField(doorRes, 'status'),
    minMajor: major.min,
    maxMajor: major.max,
    minMinor: minor.min,
    maxMinor: minor.max,
  };
}

export async function configPirFilter(state: PirFilterState): Promise<void> {
  if (!validatePirFilter(state)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }
  const maj = pirRangeToConfig(state.minMajor, state.maxMajor);
  const min = pirRangeToConfig(state.minMinor, state.maxMinor);
  const minMaj = maj.min;
  const maxMaj = maj.max;
  const minMin = min.min;
  const maxMin = min.max;
  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByPirStatus(state.isOn, s, f),
    ),
  );
  await configRun('Config Delay Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByPirDelayResponseStatus(
        state.delayStatus,
        s,
        f,
      ),
    ),
  );
  await configRun('Config Sensor Sensitivity Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByPirSensorSensitivity(
        state.sensitivity,
        s,
        f,
      ),
    ),
  );
  await configRun('Config Detection Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByPirDetectionStatus(
        state.detection,
        s,
        f,
      ),
    ),
  );
  await configRun('Config Pir Door Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByPirDoorStatus(state.doorStatus, s, f),
    ),
  );
  await configRun('Config Filter By Major Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByPirMajorMinValue(minMaj, maxMaj, s, f),
    ),
  );
  await configRun('Config Filter By Minor Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByPirMinorMinValue(minMin, maxMin, s, f),
    ),
  );
}

// —— Other ——

export async function readOtherFilter(): Promise<OtherFilterState> {
  await waitForBleIdle();
  const statusRes = await readStep('Read Filter Status Error', () =>
    readPromise(MPInterface.read_filter_by_other_status as ReadFn),
  );
  const relRes = await readStep('Read Relationship Error', () =>
    readPromise(MPInterface.read_filter_by_other_relationship as ReadFn),
  );
  const condRes = await readStep('Read Conditions Error', () =>
    readPromise(MPInterface.read_filter_by_other_conditions as ReadFn),
  );
  const rawList = condRes.conditionList;
  const conditions = Array.isArray(rawList)
    ? (rawList as Array<Record<string, unknown>>).map(otherConditionFromDevice)
    : [];
  return {
    isOn: boolField(statusRes, 'isOn'),
    relationship: numField(relRes, 'relationship'),
    conditions,
  };
}

export async function configOtherFilter(
  state: OtherFilterState,
  relationshipIndex: number,
): Promise<void> {
  if (!validateOtherFilter(state)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }
  const count = state.conditions.length;
  const rel = relationshipFromPicker(count, relationshipIndex);
  const list: BLEFilterRawData[] = otherConditionsToBle(state.conditions);
  await configRun('Config Conditions Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByOtherConditions(list, s, f),
    ),
  );
  await configRun('Config Filter Status Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByOtherStatus(state.isOn, s, f),
    ),
  );
  await configRun('Config Relationship Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configFilterByOtherRelationship(rel, s, f),
    ),
  );
}

// —— Device mode ——

export async function readWorkMode(): Promise<number> {
  await waitForBleIdle();
  const res = await readStep('Read Work Mode Error', () =>
    readPromise(MPInterface.read_work_mode as ReadFn),
  );
  return numField(res, 'mode');
}

export async function configWorkMode(mode: DeviceMode): Promise<void> {
  await configRun('Config Work Mode Error', () =>
    configPromise((s, f) => MPInterfaceConfig.configWorkMode(mode, s, f)),
  );
}

export async function readStandbyStrategy(): Promise<number> {
  await waitForBleIdle();
  const res = await readStep('Read Positioning Strategy Error', () =>
    readPromise(MPInterface.read_standby_mode_positioning_strategy as ReadFn),
  );
  return numField(res, 'strategy');
}

export async function configStandbyStrategy(
  strategy: PositioningStrategy,
): Promise<void> {
  await configRun('Config Positioning Strategy Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configStandbyModePositioningStrategy(strategy, s, f),
    ),
  );
}

export async function readPeriodicMode(): Promise<{
  strategy: number;
  interval: string;
}> {
  await waitForBleIdle();
  const stratRes = await readStep('Read Positioning Strategy Error', () =>
    readPromise(MPInterface.read_periodic_mode_positioning_strategy as ReadFn),
  );
  const intRes = await readStep('Read Report Interval Error', () =>
    readPromise(MPInterface.read_periodic_mode_report_interval as ReadFn),
  );
  return {
    strategy: numField(stratRes, 'strategy'),
    interval: strField(intRes, 'interval') || '60',
  };
}

export async function configPeriodicMode(
  strategy: PositioningStrategy,
  interval: string,
): Promise<void> {
  if (!validatePeriodicInterval(interval)) {
    throw new Error(DEVICE_SAVE_MSG);
  }
  await configRun('Config Positioning Strategy Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configPeriodicModePositioningStrategy(strategy, s, f),
    ),
  );
  await configRun('Config Report Interval Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configPeriodicModeReportInterval(
        parseInt(interval, 10),
        s,
        f,
      ),
    ),
  );
}

export async function readTimingMode(): Promise<{
  strategy: number;
  points: TimingTimePoint[];
}> {
  await waitForBleIdle();
  const stratRes = await readStep('Read Positioning Strategy Error', () =>
    readPromise(MPInterface.read_timing_mode_positioning_strategy as ReadFn),
  );
  const ptRes = await readStep('Read Reporting Time Point Error', () =>
    readPromise(MPInterface.read_timing_mode_reporting_time_point as ReadFn),
  );
  const pointList = ptRes.pointList;
  const points = Array.isArray(pointList)
    ? (pointList as Array<{hour: number; minuteGear: number}>).map(p => ({
        hour: numField(p as Record<string, unknown>, 'hour'),
        minuteGear: numField(p as Record<string, unknown>, 'minuteGear'),
      }))
    : [];
  return {strategy: numField(stratRes, 'strategy'), points};
}

export async function configTimingMode(
  strategy: PositioningStrategy,
  points: TimingTimePoint[],
): Promise<void> {
  const list: TimingModeTimePoint[] = points.map(p => ({
    hour: p.hour,
    minuteGear: p.minuteGear,
  }));
  await configRun('Config Positioning Strategy Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTimingModePositioningStrategy(strategy, s, f),
    ),
  );
  await configRun('Config Reporting Time Point Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTimingModeReportingTimePoint(list, s, f),
    ),
  );
}

export async function readMotionMode(): Promise<MotionModeState> {
  await waitForBleIdle();
  const s = {...DEFAULT_MOTION_MODE};
  const r = async (
    msg: string,
    fn: unknown,
    apply: (res: Record<string, unknown>) => void,
  ) => {
    const res = await readStep(msg, () => readPromise(fn as ReadFn));
    apply(res);
  };
  await r('Read Notify Event On Start Error', MPInterface.read_motion_mode_events_notify_event_on_start, res => {
    s.notifyEventOnStart = boolField(res, 'isOn');
  });
  await r('Read Fix On Start Error', MPInterface.read_motion_mode_events_fix_on_start, res => {
    s.fixOnStart = boolField(res, 'isOn');
  });
  await r('Read Notify Event In Trip Error', MPInterface.read_motion_mode_events_notify_event_in_trip, res => {
    s.notifyEventInTrip = boolField(res, 'isOn');
  });
  await r('Read Fix In Trip Error', MPInterface.read_motion_mode_events_fix_in_trip, res => {
    s.fixInTrip = boolField(res, 'isOn');
  });
  await r('Read Notify Event On End Error', MPInterface.read_motion_mode_events_notify_event_on_end, res => {
    s.notifyEventOnEnd = boolField(res, 'isOn');
  });
  await r('Read Fix On End Error', MPInterface.read_motion_mode_events_fix_on_end, res => {
    s.fixOnEnd = boolField(res, 'isOn');
  });
  await r('Read Fix On Stationary Error', MPInterface.read_motion_mode_events_fix_on_stationary_state, res => {
    s.fixOnStationary = boolField(res, 'isOn');
  });
  await r('Read Number Of Fix On Start Error', MPInterface.read_motion_mode_number_of_fix_on_start, res => {
    s.numberOfFixOnStart = strField(res, 'number') || '1';
  });
  await r('Read Pos-Strategy On Start Error', MPInterface.read_motion_mode_pos_strategy_on_start, res => {
    s.posStrategyOnStart = numField(res, 'strategy');
  });
  await r('Read Report Interval In Trip Error', MPInterface.read_motion_mode_report_interval_in_trip, res => {
    s.reportIntervalInTrip = strField(res, 'interval') || '60';
  });
  await r('Read Pos-Strategy In Trip Error', MPInterface.read_motion_mode_pos_strategy_in_trip, res => {
    s.posStrategyInTrip = numField(res, 'strategy');
  });
  await r('Read Trip End Timeout Error', MPInterface.read_motion_mode_trip_end_timeout, res => {
    s.tripEndTimeout = strField(res, 'time') || strField(res, 'timeout') || '30';
  });
  await r('Read Report Interval On Stationary Error', MPInterface.read_report_interval_on_stationary, res => {
    s.reportIntervalOnStationary = strField(res, 'interval') || '60';
  });
  await r('Read Pos-Strategy On Stationary Error', MPInterface.read_pos_strategy_on_stationary, res => {
    s.posStrategyOnStationary = numField(res, 'strategy');
  });
  await r('Read Number Of Fix On End Error', MPInterface.read_motion_mode_number_of_fix_on_end, res => {
    s.numberOfFixOnEnd = strField(res, 'number') || '1';
  });
  await r('Read Report Interval On End Error', MPInterface.read_motion_mode_report_interval_on_end, res => {
    s.reportIntervalOnEnd = strField(res, 'interval') || '60';
  });
  await r('Read Pos-Strategy On End Error', MPInterface.read_motion_mode_pos_strategy_on_end, res => {
    s.posStrategyOnEnd = numField(res, 'strategy');
  });
  return s;
}

export async function configMotionMode(state: MotionModeState): Promise<void> {
  if (!validateMotionMode(state)) {
    throw new Error(DEVICE_SAVE_MSG);
  }
  const steps: Array<[string, () => Promise<void>]> = [
    ['Config Notify Event On Start Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeEventsNotifyEventOnStart(
          state.notifyEventOnStart,
          s,
          f,
        ),
      )],
    ['Config Fix On Start Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeEventsFixOnStart(state.fixOnStart, s, f),
      )],
    ['Config Notify Event In Trip Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeEventsNotifyEventInTrip(
          state.notifyEventInTrip,
          s,
          f,
        ),
      )],
    ['Config Fix In Trip Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeEventsFixInTrip(state.fixInTrip, s, f),
      )],
    ['Config Notify Event On End Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeEventsNotifyEventOnEnd(
          state.notifyEventOnEnd,
          s,
          f,
        ),
      )],
    ['Config Fix On End Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeEventsFixOnEnd(state.fixOnEnd, s, f),
      )],
    ['Config Fix On Stationary Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeEventsFixOnStationaryState(
          state.fixOnStationary,
          s,
          f,
        ),
      )],
    ['Config Number Of Fix On Start Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeNumberOfFixOnStart(
          parseInt(state.numberOfFixOnStart, 10),
          s,
          f,
        ),
      )],
    ['Config Pos-Strategy On Start Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModePosStrategyOnStart(
          state.posStrategyOnStart as PositioningStrategy,
          s,
          f,
        ),
      )],
    ['Config Report Interval In Trip Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeReportIntervalInTrip(
          parseInt(state.reportIntervalInTrip, 10),
          s,
          f,
        ),
      )],
    ['Config Pos-Strategy In Trip Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModePosStrategyInTrip(
          state.posStrategyInTrip as PositioningStrategy,
          s,
          f,
        ),
      )],
    ['Config Trip End Timeout Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeTripEndTimeout(
          parseInt(state.tripEndTimeout, 10),
          s,
          f,
        ),
      )],
    ['Config Report Interval On Stationary Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configReportIntervalOnStationary(
          parseInt(state.reportIntervalOnStationary, 10),
          s,
          f,
        ),
      )],
    ['Config Pos-Strategy On Stationary Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configPosStrategyOnStationary(
          state.posStrategyOnStationary as PositioningStrategy,
          s,
          f,
        ),
      )],
    ['Config Number Of Fix On End Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeNumberOfFixOnEnd(
          parseInt(state.numberOfFixOnEnd, 10),
          s,
          f,
        ),
      )],
    ['Config Report Interval On End Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModeReportIntervalOnEnd(
          parseInt(state.reportIntervalOnEnd, 10),
          s,
          f,
        ),
      )],
    ['Config Pos-Strategy On End Error', () =>
      configPromise((s, f) =>
        MPInterfaceConfig.configMotionModePosStrategyOnEnd(
          state.posStrategyOnEnd as PositioningStrategy,
          s,
          f,
        ),
      )],
  ];
  for (const [msg, fn] of steps) {
    await configRun(msg, fn);
  }
}

export async function readTimeSegmentedMode(): Promise<{
  strategy: number;
  periods: TimeSegmentedPeriod[];
}> {
  await waitForBleIdle();
  const stratRes = await readStep('Read Positioning Strategy Error', () =>
    readPromise(MPInterface.read_time_segmented_mode_strategy as ReadFn),
  );
  const ptRes = await readStep('Read Reporting Time Point Error', () =>
    readPromise(MPInterface.read_time_segmented_mode_time_period_setting as ReadFn),
  );
  const timeList = ptRes.timeList;
  const periods = Array.isArray(timeList)
    ? (timeList as Array<Record<string, unknown>>).map(p => ({
        startHour: numField(p, 'startHour'),
        startMinuteGear: numField(p, 'startMinuteGear'),
        endHour: numField(p, 'endHour'),
        endMinuteGear: numField(p, 'endMinuteGear'),
        interval: String(p.reportInterval ?? p.interval ?? '60'),
      }))
    : [];
  return {strategy: numField(stratRes, 'strategy'), periods};
}

export async function configTimeSegmentedMode(
  strategy: PositioningStrategy,
  periods: TimeSegmentedPeriod[],
): Promise<void> {
  const list: TimeSegmentedModePeriod[] = periods.map(p =>
    timeSegmentedPeriodToProtocol(p),
  );
  await configRun('Config Positioning Strategy Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTimeSegmentedModeStrategy(strategy, s, f),
    ),
  );
  await configRun('Config Reporting Time Point Error', () =>
    configPromise((s, f) =>
      MPInterfaceConfig.configTimeSegmentedModeTimePeriodSetting(list, s, f),
    ),
  );
}
