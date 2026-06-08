import {OverProtectionType} from '../sdk/MPSDKDefines';

export type RootStackParamList = {
  Scan: undefined;
  MainTabs: undefined;
  SwitchSettings: undefined;
  ElectricitySettings: undefined;
  EnergySettings: undefined;
  ProtectionSettings: undefined;
  OverProtection: {type: OverProtectionType};
  LoadStatusNotification: undefined;
  CountdownSettings: undefined;
  LEDSettings: undefined;
  PowerIndicatorColor: undefined;
  LoRaSettings: undefined;
  LoRaApp: undefined;
  BleSettings: undefined;
  DeviceInfo: undefined;
  Update: undefined;
  About: undefined;
};

export type MainTabParamList = {
  LORA: undefined;
  GENERAL: undefined;
  BLUETOOTH: undefined;
  DEVICE: undefined;
};
