/** Auto-generated from MKMPInterface.m */
import MPCentralManager from "./MPCentralManager";
import {TaskOperationID} from "./TaskOperationID";
import {buildReadCommand} from "./protocol/CommandBuilder";

type SucBlock = (data: {msg: string; code: string; result: unknown}) => void;
type FailedBlock = (error: Error) => void;

const central = () => MPCentralManager.shared();

function readParams(
  taskID: TaskOperationID,
  cmdFlag: string,
  suc?: SucBlock,
  failed?: FailedBlock,
) {
  central().addTaskWithTaskID(
    taskID,
    buildReadCommand(cmdFlag),
    suc,
    failed,
    "params",
  );
}

function readControl(
  taskID: TaskOperationID,
  cmdFlag: string,
  suc?: SucBlock,
  failed?: FailedBlock,
) {
  central().addTaskWithTaskID(
    taskID,
    buildReadCommand(cmdFlag),
    suc,
    failed,
    "control",
  );
}

function readGatt(
  taskID: TaskOperationID,
  uuid: string,
  suc?: SucBlock,
  failed?: FailedBlock,
) {
  central().addReadTaskWithTaskID(taskID, uuid, suc, failed);
}

export const MPInterface = {
  read_adv_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadAdvIntervalOperation, "22", suc, failed);
  },
  read_connectation_need_password(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadConnectationNeedPasswordOperation, "25", suc, failed);
  },
  read_count_down_report_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadCountDownReportIntervalOperation, "4f", suc, failed);
  },
  read_device_connectable(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadDeviceConnectableOperation, "24", suc, failed);
  },
  read_device_model(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_mp_taskReadDeviceModelOperation, "2A24", suc, failed);
  },
  read_device_name(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadDeviceNameOperation, "21", suc, failed);
  },
  read_electricity_data(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_mp_taskReadElectricityDataOperation, "64", suc, failed);
  },
  read_energy_data(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_mp_taskReadEnergyDataOperation, "65", suc, failed);
  },
  read_energy_interval_params(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadEnergyIntervalParamsOperation, "44", suc, failed);
  },
  read_firmware(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_mp_taskReadFirmwareOperation, "2A26", suc, failed);
  },
  read_hardware(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_mp_taskReadHardwareOperation, "2A27", suc, failed);
  },
  read_led_indicator_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLEDIndicatorStatusOperation, "50", suc, failed);
  },
  read_load_status(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_mp_taskReadLoadStatusOperation, "63", suc, failed);
  },
  read_load_status_notifications(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLoadStatusNotificationsOperation, "4b", suc, failed);
  },
  read_load_status_threshold(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLoadStatusThresholdOperation, "4c", suc, failed);
  },
  read_lorawan_appeui(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanAPPEUIOperation, "03", suc, failed);
  },
  read_lorawan_appkey(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanAPPKEYOperation, "04", suc, failed);
  },
  read_lorawan_appskey(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanAPPSKEYOperation, "06", suc, failed);
  },
  read_lorawan_ch(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanCHOperation, "0b", suc, failed);
  },
  read_lorawan_class_type(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanClassTypeOperation, "09", suc, failed);
  },
  read_lorawan_devaddr(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanDEVADDROperation, "05", suc, failed);
  },
  read_lorawan_deveui(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanDEVEUIOperation, "02", suc, failed);
  },
  read_lorawan_dr(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanDROperation, "0d", suc, failed);
  },
  read_lorawan_duty_cycle_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanDutyCycleStatusOperation, "0c", suc, failed);
  },
  read_lorawan_max_retransmission_times(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanMaxRetransmissionTimesOperation, "0f", suc, failed);
  },
  read_lorawan_message_type(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanMessageTypeOperation, "0a", suc, failed);
  },
  read_lorawan_modem(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanModemOperation, "01", suc, failed);
  },
  read_lorawan_network_check_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanNetworkCheckIntervalOperation, "11", suc, failed);
  },
  read_lorawan_network_status(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_mp_taskReadLorawanNetworkStatusOperation, "62", suc, failed);
  },
  read_lorawan_nwkskey(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanNWKSKEYOperation, "07", suc, failed);
  },
  read_lorawan_region(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanRegionOperation, "08", suc, failed);
  },
  read_lorawan_time_sync_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanDevTimeSyncIntervalOperation, "10", suc, failed);
  },
  read_lorawan_uplink_strategy(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadLorawanUplinkStrategyOperation, "0e", suc, failed);
  },
  read_mac_address(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_mp_taskReadMacAddressOperation, "68", suc, failed);
  },
  read_manufacturer(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_mp_taskReadManufacturerOperation, "2A29", suc, failed);
  },
  read_over_current_protection(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadOverCurrentProtectionOperation, "49", suc, failed);
  },
  read_over_load_protection(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadOverLoadProtectionOperation, "4a", suc, failed);
  },
  read_over_voltage_protection(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadOverVoltageProtectionOperation, "47", suc, failed);
  },
  read_password(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadPasswordOperation, "25", suc, failed);
  },
  read_power_change_value(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadPowerChangeValueOperation, "45", suc, failed);
  },
  read_power_indicator_color(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadPowerIndicatorColorOperation, "4d", suc, failed);
  },
  read_report_interval_of_electricity(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadReportIntervalOfElectricityOperation, "43", suc, failed);
  },
  read_report_interval_of_switch_payloads(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadReportIntervalOfSwitchPayloadsOperation, "42", suc, failed);
  },
  read_repowered_default_mode(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadRepoweredDefaultModeOperation, "41", suc, failed);
  },
  read_sag_voltage_protection(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadSagVoltageProtectionOperation, "48", suc, failed);
  },
  read_software(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_mp_taskReadSoftwareOperation, "2A28", suc, failed);
  },
  read_specifications_of_device(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadSpecificationsOfDeviceOperation, "46", suc, failed);
  },
  read_switch_status(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_mp_taskReadSwitchStatusOperation, "61", suc, failed);
  },
  read_time_zone(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadTimeZoneOperation, "4e", suc, failed);
  },
  read_tx_power(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_mp_taskReadTxPowerOperation, "23", suc, failed);
  },
};

export default MPInterface;
