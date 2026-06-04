/**
 * Auto-generated from MKMPInterface+MKMPConfig.m (LW005-MP, 1-byte CMD)
 */
import {TaskOperationID} from './TaskOperationID';
import {fetchHexValue, hexStringFromSignedNumber} from '../utils/BleHexUtils';
import {
  LedColorProtocol,
  LedColorType,
  LoRaWanClassType,
  LoRaWanMessageType,
  LoRaWanModem,
  LoRaWanRegion,
  ProductModel,
  RepoweredDefaultMode,
  TxPower,
} from './MPSDKDefines';
import {fetchTxPower, lorawanRegionString, passwordToHex} from './MPSDKDataAdopter';
import {configControl, configData, paramsError, type FailedBlock, type SucBlock} from './MPConfigSupport';

export const MPInterfaceConfig = {

  config_modem(modem: LoRaWanModem, suc?: SucBlock, failed?: FailedBlock) {
    const cmd = modem === LoRaWanModem.ABP ? 'ed01010101' : 'ed01010102';
    configData(TaskOperationID.mk_mp_taskConfigModemOperation, cmd, suc, failed);
  },
  config_deveui(devEUI: string, suc?: SucBlock, failed?: FailedBlock) {
    if (devEUI.length !== 16) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigDEVEUIOperation, `ed010208${devEUI.toLowerCase()}`, suc, failed);
  },
  config_appeui(appEUI: string, suc?: SucBlock, failed?: FailedBlock) {
    if (appEUI.length !== 16) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigAPPEUIOperation, `ed010308${appEUI.toLowerCase()}`, suc, failed);
  },
  config_appkey(appKey: string, suc?: SucBlock, failed?: FailedBlock) {
    if (appKey.length !== 32) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigAPPKEYOperation, `ed010410${appKey.toLowerCase()}`, suc, failed);
  },
  config_devaddr(devAddr: string, suc?: SucBlock, failed?: FailedBlock) {
    if (devAddr.length !== 8) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigDEVADDROperation, `ed010504${devAddr.toLowerCase()}`, suc, failed);
  },
  config_appskey(appSkey: string, suc?: SucBlock, failed?: FailedBlock) {
    if (appSkey.length !== 32) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigAPPSKEYOperation, `ed010610${appSkey.toLowerCase()}`, suc, failed);
  },
  config_nwkskey(nwkSkey: string, suc?: SucBlock, failed?: FailedBlock) {
    if (nwkSkey.length !== 32) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigNWKSKEYOperation, `ed010710${nwkSkey.toLowerCase()}`, suc, failed);
  },
  config_region(region: LoRaWanRegion, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_mp_taskConfigRegionOperation, `ed010801${lorawanRegionString(region)}`, suc, failed);
  },
  config_class_type(classType: LoRaWanClassType, suc?: SucBlock, failed?: FailedBlock) {
    const cmd = classType === LoRaWanClassType.C ? 'ed01090102' : 'ed01090100';
    configData(TaskOperationID.mk_mp_taskConfigClassTypeOperation, cmd, suc, failed);
  },
  config_message_type(messageType: LoRaWanMessageType, suc?: SucBlock, failed?: FailedBlock) {
    const cmd = messageType === LoRaWanMessageType.Unconfirm ? 'ed010a0100' : 'ed010a0101';
    configData(TaskOperationID.mk_mp_taskConfigMessageTypeOperation, cmd, suc, failed);
  },
  config_chl(chl: number, chh: number, suc?: SucBlock, failed?: FailedBlock) {
    if (chl < 0 || chl > 95 || chh < chl || chh > 95) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigCHValueOperation,
      `ed010b02${fetchHexValue(chl, 1)}${fetchHexValue(chh, 1)}`,
      suc,
      failed,
    );
  },
  config_duty_cycle_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_mp_taskConfigDutyCycleStatusOperation, isOn ? 'ed010c0101' : 'ed010c0100', suc, failed);
  },
  config_dr(dr: number, suc?: SucBlock, failed?: FailedBlock) {
    if (dr < 0 || dr > 5) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigDRValueOperation, `ed010d01${fetchHexValue(dr, 1)}`, suc, failed);
  },
  config_uplink_strategy(isOn: boolean, drl: number, drh: number, suc?: SucBlock, failed?: FailedBlock) {
    if (!isOn && (drl < 0 || drl > 6 || drh < drl || drh > 6)) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigUplinkStrategyOperation,
      `ed010e04${isOn ? '01' : '00'}01${fetchHexValue(drl, 1)}${fetchHexValue(drh, 1)}`,
      suc,
      failed,
    );
  },
  config_lorawan_max_retransmission_times(times: number, suc?: SucBlock, failed?: FailedBlock) {
    if (times < 1 || times > 8) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigMaxRetransmissionTimesOperation, `ed010f01${fetchHexValue(times, 1)}`, suc, failed);
  },
  config_time_sync_interval(interval: number, suc?: SucBlock, failed?: FailedBlock) {
    if (interval < 0 || interval > 255) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigTimeSyncIntervalOperation, `ed011001${fetchHexValue(interval, 1)}`, suc, failed);
  },
  config_lorawan_network_check_interval(interval: number, suc?: SucBlock, failed?: FailedBlock) {
    if (interval < 0 || interval > 255) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigNetworkCheckIntervalOperation, `ed011101${fetchHexValue(interval, 1)}`, suc, failed);
  },
  config_device_name(deviceName: string, suc?: SucBlock, failed?: FailedBlock) {
    if (deviceName == null || deviceName.length > 16) return paramsError(failed);
    let data = '';
    for (let i = 0; i < deviceName.length; i++) {
      data += fetchHexValue(deviceName.charCodeAt(i), 1);
    }
    configData(
      TaskOperationID.mk_mp_taskConfigDeviceNameOperation,
      `ed0121${fetchHexValue(deviceName.length, 1)}${data}`,
      suc,
      failed,
    );
  },
  config_adv_interval(interval: number, suc?: SucBlock, failed?: FailedBlock) {
    if (interval < 1 || interval > 100) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigAdvIntervalOperation,
      `ed012201${fetchHexValue(interval, 1)}`,
      suc,
      failed,
    );
  },
  config_tx_power(txPower: TxPower, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_mp_taskConfigTxPowerOperation, `ed012301${fetchTxPower(txPower)}`, suc, failed);
  },
  config_connectable_status(connectable: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_mp_taskConfigConnectableStatusOperation, connectable ? 'ed01240101' : 'ed01240100', suc, failed);
  },
  config_need_password(need: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_mp_taskConfigNeedPasswordOperation, need ? 'ed01250101' : 'ed01250100', suc, failed);
  },
  config_password(password: string, suc?: SucBlock, failed?: FailedBlock) {
    if (password.length !== 8) return paramsError(failed);
    configData(TaskOperationID.mk_mp_taskConfigPasswordOperation, `ed012608${passwordToHex(password)}`, suc, failed);
  },
  config_repowered_default_mode(mode: RepoweredDefaultMode, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_mp_taskConfigRepoweredDefaultModeOperation, `ed014101${fetchHexValue(mode, 1)}`, suc, failed);
  },
  config_switch_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configControl(TaskOperationID.mk_mp_taskConfigSwitchStatusOperation, isOn ? 'ed01610101' : 'ed01610100', suc, failed);
  },
  config_device_time(timestamp: number, suc?: SucBlock, failed?: FailedBlock) {
    configControl(TaskOperationID.mk_mp_taskConfigDeviceTimeOperation, `ed016904${timestamp.toString(16)}`, suc, failed);
  },
  restart_device(suc?: SucBlock, failed?: FailedBlock) {
    configControl(TaskOperationID.mk_mp_taskRestartDeviceOperation, 'ed016600', suc, failed);
  },
  config_time_zone(timeZone: number, suc?: SucBlock, failed?: FailedBlock) {
    if (timeZone < -24 || timeZone > 28) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigTimeZoneOperation,
      `ed014e01${hexStringFromSignedNumber(timeZone)}`,
      suc,
      failed,
    );
  },
  factory_reset(suc?: SucBlock, failed?: FailedBlock) {
    configControl(TaskOperationID.mk_mp_taskFactoryResetOperation, 'ed016a00', suc, failed);
  },

  config_report_interval_of_switch_payloads(
    interval: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (interval < 10 || interval > 600) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigReportIntervalOfSwitchPayloadsOperation,
      `ed014202${fetchHexValue(interval, 2)}`,
      suc,
      failed,
    );
  },
  config_report_interval_of_electricity(
    interval: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (interval < 5 || interval > 600) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigReportIntervalOfElectricityOperation,
      `ed014302${fetchHexValue(interval, 2)}`,
      suc,
      failed,
    );
  },
  config_energy_report_interval(
    reportInterval: number,
    saveInterval: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (
      reportInterval < 1 ||
      reportInterval > 60 ||
      saveInterval < 1 ||
      saveInterval > 60
    ) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_mp_taskConfigEnergyIntervalParamsOperation,
      `ed014402${fetchHexValue(saveInterval, 1)}${fetchHexValue(reportInterval, 1)}`,
      suc,
      failed,
    );
  },
  config_power_change_value(value: number, suc?: SucBlock, failed?: FailedBlock) {
    if (value < 1 || value > 100) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigPowerChangeValueOperation,
      `ed014501${fetchHexValue(value, 1)}`,
      suc,
      failed,
    );
  },
  config_over_voltage(
    isOn: boolean,
    productModel: ProductModel,
    overThreshold: number,
    timeThreshold: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    let min = 231;
    let max = 264;
    if (productModel === ProductModel.America) {
      min = 121;
      max = 138;
    }
    if (
      overThreshold < min ||
      overThreshold > max ||
      timeThreshold < 1 ||
      timeThreshold > 30
    ) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_mp_taskConfigOverVoltageOperation,
      `ed014704${isOn ? '01' : '00'}${fetchHexValue(overThreshold, 2)}${fetchHexValue(timeThreshold, 1)}`,
      suc,
      failed,
    );
  },
  config_sag_voltage(
    isOn: boolean,
    productModel: ProductModel,
    overThreshold: number,
    timeThreshold: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    let min = 196;
    let max = 229;
    if (productModel === ProductModel.America) {
      min = 102;
      max = 119;
    }
    if (
      overThreshold < min ||
      overThreshold > max ||
      timeThreshold < 1 ||
      timeThreshold > 30
    ) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_mp_taskConfigSagVoltageOperation,
      `ed014803${isOn ? '01' : '00'}${fetchHexValue(overThreshold, 1)}${fetchHexValue(timeThreshold, 1)}`,
      suc,
      failed,
    );
  },
  config_over_current(
    isOn: boolean,
    productModel: ProductModel,
    overThreshold: number,
    timeThreshold: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    let max = 192;
    if (productModel === ProductModel.America) {
      max = 180;
    } else if (productModel === ProductModel.UK) {
      max = 156;
    }
    if (
      overThreshold < 1 ||
      overThreshold > max ||
      timeThreshold < 1 ||
      timeThreshold > 30
    ) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_mp_taskConfigOverCurrentOperation,
      `ed014903${isOn ? '01' : '00'}${fetchHexValue(overThreshold, 1)}${fetchHexValue(timeThreshold, 1)}`,
      suc,
      failed,
    );
  },
  config_over_load(
    isOn: boolean,
    productModel: ProductModel,
    overThreshold: number,
    timeThreshold: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    let max = 4416;
    if (productModel === ProductModel.America) {
      max = 2160;
    } else if (productModel === ProductModel.UK) {
      max = 3588;
    }
    if (
      overThreshold < 10 ||
      overThreshold > max ||
      timeThreshold < 1 ||
      timeThreshold > 30
    ) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_mp_taskConfigOverLoadOperation,
      `ed014a04${isOn ? '01' : '00'}${fetchHexValue(overThreshold, 2)}${fetchHexValue(timeThreshold, 1)}`,
      suc,
      failed,
    );
  },
  config_load_status_notifications(
    startIsOn: boolean,
    stopIsOn: boolean,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    configData(
      TaskOperationID.mk_mp_taskConfigLoadStatusNotificationsOperation,
      `ed014b02${startIsOn ? '01' : '00'}${stopIsOn ? '01' : '00'}`,
      suc,
      failed,
    );
  },
  config_load_status_threshold(
    threshold: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (threshold < 1 || threshold > 10) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigLoadStatusThresholdOperation,
      `ed014c01${fetchHexValue(threshold, 1)}`,
      suc,
      failed,
    );
  },
  config_power_indicator_color(
    colorType: LedColorType,
    protocol: LedColorProtocol,
    productModel: ProductModel,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    const ct = Number(colorType);
    if (
      ct === LedColorType.TransitionDirectly ||
      ct === LedColorType.TransitionSmoothly
    ) {
      let max = 4416;
      if (productModel === ProductModel.America) {
        max = 2160;
      } else if (productModel === ProductModel.UK) {
        max = 3588;
      }
      const p = protocol;
      if (
        p.b_color < 1 ||
        p.b_color > max - 5 ||
        p.g_color <= p.b_color ||
        p.g_color > max - 4 ||
        p.y_color <= p.g_color ||
        p.y_color > max - 3 ||
        p.o_color <= p.y_color ||
        p.o_color > max - 2 ||
        p.r_color <= p.o_color ||
        p.r_color > max - 1 ||
        p.p_color <= p.r_color ||
        p.p_color > max
      ) {
        return paramsError(failed);
      }
    }
    configData(
      TaskOperationID.mk_mp_taskConfigPowerIndicatorColorOperation,
      `ed014d0d${fetchHexValue(ct, 1)}${fetchHexValue(protocol.b_color, 2)}${fetchHexValue(protocol.g_color, 2)}${fetchHexValue(protocol.y_color, 2)}${fetchHexValue(protocol.o_color, 2)}${fetchHexValue(protocol.r_color, 2)}${fetchHexValue(protocol.p_color, 2)}`,
      suc,
      failed,
    );
  },
  config_count_down_report_interval(
    interval: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (interval < 10 || interval > 60) return paramsError(failed);
    configData(
      TaskOperationID.mk_mp_taskConfigCountDownReportIntervalOperation,
      `ed014f01${fetchHexValue(interval, 1)}`,
      suc,
      failed,
    );
  },
  config_led_indicator_status(
    network: boolean,
    power: boolean,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    configData(
      TaskOperationID.mk_mp_taskConfigLEDIndicatorOperation,
      `ed015002${power ? '01' : '00'}${network ? '01' : '00'}`,
      suc,
      failed,
    );
  },
  config_switch_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configControl(
      TaskOperationID.mk_mp_taskConfigSwitchStatusOperation,
      isOn ? 'ed01610101' : 'ed01610100',
      suc,
      failed,
    );
  },

};
export default MPInterfaceConfig;
