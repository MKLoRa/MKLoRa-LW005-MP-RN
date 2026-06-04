/**
 * MPTaskAdopter — TypeScript port of MKMPTaskAdopter.m (LW005-MP, 1-byte CMD)
 */

import {
  hexStringFromData,
  getDecimalWithHex,
  getDecimalStringWithHex,
  signedHexTurnString,
} from '../utils/BleHexUtils';
import {TaskOperationID} from './TaskOperationID';
import {fetchTxPowerValueString} from './MPSDKDataAdopter';
import {utf8Decode} from '../utils/base64';

export type TaskParseResult =
  | {operationID: TaskOperationID; result: Record<string, unknown>}
  | {};

function normalizeUuid(uuid: string): string {
  return uuid.replace(/-/g, '').toUpperCase();
}

function hexSubstring(hex: string, start: number, length: number): string {
  return hex.substring(start, start + length);
}

function utf8StringFromData(data: Uint8Array, start: number): string {
  try {
    return utf8Decode(data, start);
  } catch {
    return '';
  }
}

function isValidStr(value: string | null | undefined): boolean {
  return typeof value === 'string' && value !== '';
}

function dataParserGetDataSuccess(
  returnData: Record<string, unknown> | null | undefined,
  operationID: TaskOperationID,
): TaskParseResult {
  if (!returnData) {
    return {};
  }
  return {operationID, result: returnData};
}

/** MP 帧：ED + FLAG(1) + CMD(1) + LEN(1) + DATA */
function parseCustomData(readData: Uint8Array): TaskParseResult {
  const readString = hexStringFromData(readData);
  if (!readString.startsWith('ed')) {
    return {};
  }
  const dataLen = getDecimalWithHex(readString, 6, 2);
  if (readData.length !== dataLen + 4) {
    return {};
  }
  const flag = readString.substring(2, 4);
  const cmd = readString.substring(4, 6);
  const content = readString.substring(8, 8 + dataLen * 2);
  if (flag === '00') {
    return parseCustomReadData(content, cmd, readData);
  }
  if (flag === '01') {
    return parseCustomConfigData(content, cmd);
  }
  return {};
}

function parseCustomReadData(
  content: string,
  cmd: string,
  data: Uint8Array,
): TaskParseResult {
  let operationID = TaskOperationID.mk_mp_defaultTaskOperationID;
  let result: Record<string, unknown> = {};


      if (cmd === '01') {
          //读取LoRaWAN入网类型
          result = {
              modem:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanModemOperation;
      }else if (cmd === '02') {
          //读取LoRaWAN DEVEUI
          result = {
              devEUI:content,
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanDEVEUIOperation;
      }else if (cmd === '03') {
          //读取LoRaWAN APPEUI
          result = {
              appEUI:content
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanAPPEUIOperation;
      }else if (cmd === '04') {
          //读取LoRaWAN APPKEY
          result = {
              appKey:content
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanAPPKEYOperation;
      }else if (cmd === '05') {
          //读取LoRaWAN DEVADDR
          result = {
              devAddr:content
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanDEVADDROperation;
      }else if (cmd === '06') {
          //读取LoRaWAN APPSKEY
          result = {
              appSkey:content
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanAPPSKEYOperation;
      }else if (cmd === '07') {
          //读取LoRaWAN nwkSkey
          result = {
              nwkSkey:content
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanNWKSKEYOperation;
      }else if (cmd === '08') {
          //读取LoRaWAN频段
          result = {
              region:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanRegionOperation;
      }else if (cmd === '09') {
          //读取LoRaWAN工作模式
          result = {
              classType:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanClassTypeOperation;
      }else if (cmd === '0a') {
          //读取LoRaWAN 上行数据类型
          result = {
              messageType:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanMessageTypeOperation;
      }else if (cmd === '0b') {
          //读取LoRaWAN CH
          result = {
              CHL:getDecimalStringWithHex(content, 0, 2),
              CHH:getDecimalStringWithHex(content, 2, 2)
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanCHOperation;
      }else if (cmd === '0c') {
          //读取LoRaWAN duty cycle
          const isOn = content === '01';
          result = {
              isOn:isOn
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanDutyCycleStatusOperation;
      }else if (cmd === '0d') {
          //读取LoRaWAN DR
          result = {
              DR:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanDROperation;
      }else if (cmd === '0e') {
          //读取LoRaWAN 数据发送策略
          const isOn = hexSubstring(content, 0, 2) === '01';
          const transmissions = getDecimalStringWithHex(content, 2, 2);
          const DRL = getDecimalStringWithHex(content, 4, 2);
          const DRH = getDecimalStringWithHex(content, 6, 2);
          result = {
              isOn:isOn,
              transmissions:transmissions,
              DRL:DRL,
              DRH:DRH,
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanUplinkStrategyOperation;
      }else if (cmd === '0f') {
          //读取LoRaWAN 重传次数
          result = {
              number:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanMaxRetransmissionTimesOperation;
      }else if (cmd === '10') {
          //读取LoRaWAN devtime指令同步间隔
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanDevTimeSyncIntervalOperation;
      }else if (cmd === '11') {
          //读取LoRaWAN LinkCheckReq指令间隔
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanNetworkCheckIntervalOperation;
      }else if (cmd === '21') {
          //读取设备广播名称
          const deviceName = utf8StringFromData(data, 4);
          result = {
              deviceName:(isValidStr(deviceName) ? deviceName : ''),
          };
          operationID = TaskOperationID.mk_mp_taskReadDeviceNameOperation;
      }else if (cmd === '22') {
          //读取广播间隔
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadAdvIntervalOperation;
      }else if (cmd === '23') {
          //读取设备Tx Power
          const txPower = fetchTxPowerValueString(content);
          result = {txPower:txPower};
          operationID = TaskOperationID.mk_mp_taskReadTxPowerOperation;
      }else if (cmd === '24') {
          //读取可连接状态
          const connectable = content === '01';
          result = {
              connectable:connectable
          };
          operationID = TaskOperationID.mk_mp_taskReadDeviceConnectableOperation;
      }else if (cmd === '25') {
          //读取密码开关
          const need = content === '01';
          result = {
              need:need
          };
          operationID = TaskOperationID.mk_mp_taskReadConnectationNeedPasswordOperation;
      }else if (cmd === '26') {
          //读取密码
          const password = utf8StringFromData(data, 4);
          result = {
              password:(isValidStr(password) ? password : ''),
          };
          operationID = TaskOperationID.mk_mp_taskReadPasswordOperation;
      }else if (cmd === '41') {
          //读取设备上电后模式选择
          const mode = getDecimalStringWithHex(content, 0, content.length);
          result = {
              mode:mode,
          };
          operationID = TaskOperationID.mk_mp_taskReadRepoweredDefaultModeOperation;
      }else if (cmd === '42') {
          //读取开关状态上报间隔
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadReportIntervalOfSwitchPayloadsOperation;
      }else if (cmd === '43') {
          //读取电量上报间隔
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadReportIntervalOfElectricityOperation;
      }else if (cmd === '44') {
          //读取电能存储与上报间隔
          result = {
              saveInterval:getDecimalStringWithHex(content, 0, 2),
              repoertInterval:getDecimalStringWithHex(content, 2, 2),
          };
          operationID = TaskOperationID.mk_mp_taskReadEnergyIntervalParamsOperation;
      }else if (cmd === '45') {
          //读取功率变化存储阈值
          result = {
              value:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadPowerChangeValueOperation;
      }else if (cmd === '46') {
          //读取设备规格
          result = {
              specification:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadSpecificationsOfDeviceOperation;
      }else if (cmd === '47') {
          //读取过压保护信息
          const isOn = hexSubstring(content, 0, 2) === '01';
          const overThreshold = getDecimalStringWithHex(content, 2, 4);
          const timeThreshold = getDecimalStringWithHex(content, 6, 2);
          result = {
              isOn:isOn,
              overThreshold:overThreshold,
              timeThreshold:timeThreshold,
          };
          operationID = TaskOperationID.mk_mp_taskReadOverVoltageProtectionOperation;
      }else if (cmd === '48') {
          //读取欠压保护信息
          const isOn = hexSubstring(content, 0, 2) === '01';
          const overThreshold = getDecimalStringWithHex(content, 2, 2);
          const timeThreshold = getDecimalStringWithHex(content, 4, 2);
          result = {
              isOn:isOn,
              overThreshold:overThreshold,
              timeThreshold:timeThreshold,
          };
          operationID = TaskOperationID.mk_mp_taskReadSagVoltageProtectionOperation;
      }else if (cmd === '49') {
          //读取过流保护信息
          const isOn = hexSubstring(content, 0, 2) === '01';
          const overThreshold = getDecimalStringWithHex(content, 2, 2);
          const timeThreshold = getDecimalStringWithHex(content, 4, 2);
          result = {
              isOn:isOn,
              overThreshold:overThreshold,
              timeThreshold:timeThreshold,
          };
          operationID = TaskOperationID.mk_mp_taskReadOverCurrentProtectionOperation;
      }else if (cmd === '4a') {
          //读取过载保护信息
          const isOn = hexSubstring(content, 0, 2) === '01';
          const overThreshold = getDecimalStringWithHex(content, 2, 4);
          const timeThreshold = getDecimalStringWithHex(content, 6, 2);
          result = {
              isOn:isOn,
              overThreshold:overThreshold,
              timeThreshold:timeThreshold,
          };
          operationID = TaskOperationID.mk_mp_taskReadOverLoadProtectionOperation;
      }else if (cmd === '4b') {
          //读取负载通知开关
          const loadStart = hexSubstring(content, 0, 2) === '01';
          const loadStop = hexSubstring(content, 2, 2) === '01';
          result = {
              loadStart:loadStart,
              loadStop:loadStop,
          };
          operationID = TaskOperationID.mk_mp_taskReadLoadStatusNotificationsOperation;
      }else if (cmd === '4c') {
          //读取P0
          result = {
              value:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLoadStatusThresholdOperation;
      }else if (cmd === '4d') {
          //读取功率指示灯
          const colorType = getDecimalStringWithHex(content, 0, 2);
          const blue = getDecimalStringWithHex(content, 2, 4);
          const green = getDecimalStringWithHex(content, 6, 4);
          const yellow = getDecimalStringWithHex(content, 10, 4);
          const orange = getDecimalStringWithHex(content, 14, 4);
          const red = getDecimalStringWithHex(content, 18, 4);
          const purple = getDecimalStringWithHex(content, 22, 4);
          result = {
              colorType:colorType,
              blue:blue,
              green:green,
              yellow:yellow,
              orange:orange,
              red:red,
              purple:purple,
          };
          operationID = TaskOperationID.mk_mp_taskReadPowerIndicatorColorOperation;
      }else if (cmd === '4e') {
          //读取时区
          result = {
              timeZone:signedHexTurnString(content),
          };
          operationID = TaskOperationID.mk_mp_taskReadTimeZoneOperation;
      }else if (cmd === '4f') {
          //读取倒计时通知间隔
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadCountDownReportIntervalOperation;
      }else if (cmd === '50') {
          //读取指示灯开关
          const powerStatus = hexSubstring(content, 0, 2) === '01';
          const networkStatus = hexSubstring(content, 2, 2) === '01';
          result = {
              powerStatus:powerStatus,
              networkStatus:networkStatus,
          };
          operationID = TaskOperationID.mk_mp_taskReadLEDIndicatorStatusOperation;
      }else if (cmd === '61') {
          //读取开关状态
          const isOn = content === '01';
          result = {
              isOn:isOn
          };
          operationID = TaskOperationID.mk_mp_taskReadSwitchStatusOperation;
      }else if (cmd === '62') {
          //读取LoRaWAN网络状态
          result = {
              status:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_mp_taskReadLorawanNetworkStatusOperation;
      }else if (cmd === '63') {
          //读取负载状态
          const load = content === '01';
          result = {
              load:load
          };
          operationID = TaskOperationID.mk_mp_taskReadLoadStatusOperation;
      }else if (cmd === '64') {
          //读取电量信息
          const voltage = `${(getDecimalWithHex(content, 0, 4) * 0.1).toFixed(1)}`;
          const current = `${(getDecimalWithHex(content, 4, 4) * 0.001).toFixed(3)}`;
          const power = `${(getDecimalWithHex(content, 8, 8) * 0.1).toFixed(1)}`;
          const frequencyOfCurrent = `${(getDecimalWithHex(content, 16, 4) * 0.001).toFixed(3)}`;
          const powerFactor = getDecimalStringWithHex(content, 20, 2);

          result = {
              voltage:voltage,
              current:current,
              power:power,
              frequencyOfCurrent:frequencyOfCurrent,
              powerFactor:powerFactor,
          };
          operationID = TaskOperationID.mk_mp_taskReadElectricityDataOperation;
      }else if (cmd === '65') {
          //读取电能信息
          const totalRounds = getDecimalStringWithHex(content, 0, 8);
          const lastHourRounds = getDecimalStringWithHex(content, 8, 4);
          const EC = getDecimalStringWithHex(content, 12, 4);
          result = {
              totalRounds:totalRounds,
              lastHourRounds:lastHourRounds,
              EC:EC,
          };
          operationID = TaskOperationID.mk_mp_taskReadEnergyDataOperation;
      }else if (cmd === '68') {
          //读取MAC地址
          const macAddress = `${hexSubstring(content, 0, 2)}:${hexSubstring(content, 2, 2)}:${hexSubstring(content, 4, 2)}:${hexSubstring(content, 6, 2)}:${hexSubstring(content, 8, 2)}:${hexSubstring(content, 10, 2)}`;
          result = {macAddress: macAddress.toUpperCase()};
          operationID = TaskOperationID.mk_mp_taskReadMacAddressOperation;
      }

  return dataParserGetDataSuccess(result, operationID);
}

function parseCustomConfigData(content: string, cmd: string): TaskParseResult {
  let operationID = TaskOperationID.mk_mp_defaultTaskOperationID;
  const success = content === '01';


      if (cmd === '01') {
          //配置LoRaWAN入网类型
          operationID = TaskOperationID.mk_mp_taskConfigModemOperation;
      }else if (cmd === '02') {
          //配置LoRaWAN DEVEUI
          operationID = TaskOperationID.mk_mp_taskConfigDEVEUIOperation;
      }else if (cmd === '03') {
          //配置LoRaWAN APPEUI
          operationID = TaskOperationID.mk_mp_taskConfigAPPEUIOperation;
      }else if (cmd === '04') {
          //配置LoRaWAN APPKEY
          operationID = TaskOperationID.mk_mp_taskConfigAPPKEYOperation;
      }else if (cmd === '05') {
          //配置LoRaWAN DEVADDR
          operationID = TaskOperationID.mk_mp_taskConfigDEVADDROperation;
      }else if (cmd === '06') {
          //配置LoRaWAN APPSKEY
          operationID = TaskOperationID.mk_mp_taskConfigAPPSKEYOperation;
      }else if (cmd === '07') {
          //配置LoRaWAN nwkSkey
          operationID = TaskOperationID.mk_mp_taskConfigNWKSKEYOperation;
      }else if (cmd === '08') {
          //配置LoRaWAN频段
          operationID = TaskOperationID.mk_mp_taskConfigRegionOperation;
      }else if (cmd === '09') {
          //配置LoRaWAN工作模式
          operationID = TaskOperationID.mk_mp_taskConfigClassTypeOperation;
      }else if (cmd === '0a') {
          //配置LoRaWAN 上行数据类型
          operationID = TaskOperationID.mk_mp_taskConfigMessageTypeOperation;
      }else if (cmd === '0b') {
          //配置LoRaWAN CH
          operationID = TaskOperationID.mk_mp_taskConfigCHValueOperation;
      }else if (cmd === '0c') {
          //配置LoRaWAN duty cycle
          operationID = TaskOperationID.mk_mp_taskConfigDutyCycleStatusOperation;
      }else if (cmd === '0d') {
          //配置LoRaWAN DR
          operationID = TaskOperationID.mk_mp_taskConfigDRValueOperation;
      }else if (cmd === '0e') {
          //配置LoRaWAN 数据发送策略
          operationID = TaskOperationID.mk_mp_taskConfigUplinkStrategyOperation;
      }else if (cmd === '0f') {
          //配置LoRaWAN 重传次数
          operationID = TaskOperationID.mk_mp_taskConfigMaxRetransmissionTimesOperation;
      }else if (cmd === '10') {
          //配置LoRaWAN devtime指令同步间隔
          operationID = TaskOperationID.mk_mp_taskConfigTimeSyncIntervalOperation;
      }else if (cmd === '11') {
          //配置LoRaWAN LinkCheckReq指令间隔
          operationID = TaskOperationID.mk_mp_taskConfigNetworkCheckIntervalOperation;
      }else if (cmd === '21') {
          //配置广播名称
          operationID = TaskOperationID.mk_mp_taskConfigDeviceNameOperation;
      }else if (cmd === '22') {
          //配置广播间隔
          operationID = TaskOperationID.mk_mp_taskConfigAdvIntervalOperation;
      }else if (cmd === '23') {
          //配置发射功率
          operationID = TaskOperationID.mk_mp_taskConfigTxPowerOperation;
      }else if (cmd === '24') {
          //配置可连接状态
          operationID = TaskOperationID.mk_mp_taskConfigConnectableStatusOperation;
      }else if (cmd === '25') {
          //配置密码开关
          operationID = TaskOperationID.mk_mp_taskConfigNeedPasswordOperation;
      }else if (cmd === '26') {
          //配置密码
          operationID = TaskOperationID.mk_mp_taskConfigPasswordOperation;
      }else if (cmd === '41') {
          //配置默认开关上电状态
          operationID = TaskOperationID.mk_mp_taskConfigRepoweredDefaultModeOperation;
      }else if (cmd === '42') {
          //配置开关状态上报间隔
          operationID = TaskOperationID.mk_mp_taskConfigReportIntervalOfSwitchPayloadsOperation;
      }else if (cmd === '43') {
          //配置电量上报间隔
          operationID = TaskOperationID.mk_mp_taskConfigReportIntervalOfElectricityOperation;
      }else if (cmd === '44') {
          //配置电能存储与上报间隔
          operationID = TaskOperationID.mk_mp_taskConfigEnergyIntervalParamsOperation;
      }else if (cmd === '45') {
          //配置功率变化存储阈值
          operationID = TaskOperationID.mk_mp_taskConfigPowerChangeValueOperation;
      }else if (cmd === '47') {
          //配置过压保护信息
          operationID = TaskOperationID.mk_mp_taskConfigOverVoltageOperation;
      }else if (cmd === '48') {
          //配置欠压保护信息
          operationID = TaskOperationID.mk_mp_taskConfigSagVoltageOperation;
      }else if (cmd === '49') {
          //配置过流保护信息
          operationID = TaskOperationID.mk_mp_taskConfigOverCurrentOperation;
      }else if (cmd === '4a') {
          //配置过载保护信息
          operationID = TaskOperationID.mk_mp_taskConfigOverLoadOperation;
      }else if (cmd === '4b') {
          //配置负载通知开关
          operationID = TaskOperationID.mk_mp_taskConfigLoadStatusNotificationsOperation;
      }else if (cmd === '4c') {
          //配置P0
          operationID = TaskOperationID.mk_mp_taskConfigLoadStatusThresholdOperation;
      }else if (cmd === '4d') {
          //配置功率指示灯
          operationID = TaskOperationID.mk_mp_taskConfigPowerIndicatorColorOperation;
      }else if (cmd === '4e') {
          //配置时区
          operationID = TaskOperationID.mk_mp_taskConfigTimeZoneOperation;
      }else if (cmd === '4f') {
          //配置倒计时通知间隔
          operationID = TaskOperationID.mk_mp_taskConfigCountDownReportIntervalOperation;
      }else if (cmd === '50') {
          //配置网络和电源指示灯状态
          operationID = TaskOperationID.mk_mp_taskConfigLEDIndicatorOperation;
      }else if (cmd === '61') {
          //配置开关状态
          operationID = TaskOperationID.mk_mp_taskConfigSwitchStatusOperation;
      }else if (cmd === '66') {
          //配置LoRaWAN 入网
          operationID = TaskOperationID.mk_mp_taskRestartDeviceOperation;
      }else if (cmd === '69') {
          //同步时间
          operationID = TaskOperationID.mk_mp_taskConfigDeviceTimeOperation;
      }else if (cmd === '6a') {
          //恢复出厂设置
          operationID = TaskOperationID.mk_mp_taskFactoryResetOperation;
      }

  return dataParserGetDataSuccess({success}, operationID);
}

export function parseReadDataWithCharacteristic(
  uuid: string,
  data: Uint8Array,
): TaskParseResult {
  const normalized = normalizeUuid(uuid);
  if (normalized === '2A24') {
    const modeID = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {modeID},
      TaskOperationID.mk_mp_taskReadDeviceModelOperation,
    );
  }
  if (normalized === '2A26') {
    const firmware = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {firmware},
      TaskOperationID.mk_mp_taskReadFirmwareOperation,
    );
  }
  if (normalized === '2A27') {
    const hardware = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {hardware},
      TaskOperationID.mk_mp_taskReadHardwareOperation,
    );
  }
  if (normalized === '2A28') {
    const software = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {software},
      TaskOperationID.mk_mp_taskReadSoftwareOperation,
    );
  }
  if (normalized === '2A29') {
    const manufacturer = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {manufacturer},
      TaskOperationID.mk_mp_taskReadManufacturerOperation,
    );
  }
  if (normalized === 'AA00') {
    const hexContent = hexStringFromData(data);
    let state = '';
    if (hexContent.length === 10) {
      state = hexContent.substring(8, 10);
    }
    return dataParserGetDataSuccess(
      {state},
      TaskOperationID.mk_mp_connectPasswordOperation,
    );
  }
  if (normalized === 'AA02' || normalized === 'AA03') {
    return parseCustomData(data);
  }
  return {};
}

export function parseWriteDataWithCharacteristic(
  _uuid: string,
  _data: Uint8Array,
): TaskParseResult {
  return {};
}
