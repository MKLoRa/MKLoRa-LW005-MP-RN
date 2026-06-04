#!/usr/bin/env python3
"""Generate MPInterfaceConfig.ts from MKMPInterface+MKMPConfig.m"""
import re
from pathlib import Path

M_PATH = Path(
    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-MP/MKLoRaWAN-MP/Classes/SDK/MKMPInterface+MKMPConfig.m'
)
OUT = Path(__file__).resolve().parent.parent / 'src/sdk/MPInterfaceConfig.ts'

src = M_PATH.read_text()


def snake(name: str) -> str:
    s = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', name)
    return s.lower()


header = '''/**
 * Auto-generated from MKMPInterface+MKMPConfig.m (LW005-MP, 1-byte CMD)
 */
import {TaskOperationID} from './TaskOperationID';
import {fetchHexValue, hexStringFromSignedNumber} from '../utils/BleHexUtils';
import {
  LedColorType,
  LoRaWanClassType,
  LoRaWanMessageType,
  LoRaWanModem,
  LoRaWanRegion,
  RepoweredDefaultMode,
  TxPower,
} from './MPSDKDefines';
import {fetchTxPower, lorawanRegionString, passwordToHex} from './MPSDKDataAdopter';
import {configControl, configData, paramsError, type FailedBlock, type SucBlock} from './MPConfigSupport';

export const MPInterfaceConfig = {
'''

footer = '''
};
export default MPInterfaceConfig;
'''

methods: list[str] = []

# Simple literal command methods: NSString *commandString = @"ed01...";
for m in re.finditer(
    r'\+ \(void\)mp_(\w+)[^{]+\{([\s\S]*?)\n\}',
    src,
):
    name, body = m.group(1), m.group(2)
    if name.endswith('WithSucBlock'):
        continue
    literal = re.search(r'NSString \*commandString = @"([^"]+)";', body)
    task = re.search(r'config(?:DeviceControl)?DataWithTaskID:(\w+)', body)
    if not literal or not task:
        continue
    fn = snake(name)
    channel = 'configControl' if 'configDeviceControlDataWithTaskID' in body else 'configData'
    methods.append(
        f'  {fn}(suc?: SucBlock, failed?: FailedBlock) {{\n'
        f'    {channel}(TaskOperationID.{task.group(1)}, "{literal.group(1)}", suc, failed);\n'
        f'  }},'
    )

# Hand-maintained complex configs appended manually in template
complex_methods = '''
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
    if (!deviceName || deviceName.length > 16) return paramsError(failed);
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
'''

OUT.write_text(header + complex_methods + '\n'.join(methods) + footer)
print(f'Wrote {OUT}')
