/** LW005-MP SDK 常量（对齐 MKMPSDKDefines / LW005-MP协议） */

export enum CentralManagerStatus {
  Unknown = 0,
  Enable = 1,
  Disable = 2,
}

export enum CentralConnectStatus {
  Unknown = 0,
  Connecting = 1,
  Connected = 2,
  ConnectedFailed = 3,
  Disconnect = 4,
}

export const PROTOCOL = {
  /** 扫描过滤 Service UUID（对齐原生 scanForPeripheralsWithServices:AA04） */
  SCAN_SERVICE: 'AA04',
  SCAN_SERVICE_UUIDS: ['AA04'] as const,
  /** 广播 manufacturer 回应包头（小端 AA04） */
  MANUFACTURER_HEADER: '04aa',
  MANUFACTURER_DATA_LEN: 25,
  /** 设备控制服务 */
  SERVICE_CONTROL: 'AA00',
  CHAR_PASSWORD: 'AA00',
  CHAR_DISCONNECT: 'AA01',
  /** 参数配置 AA02，读写控制 AA03 */
  CHAR_PARAMS: 'AA02',
  CHAR_CONTROL: 'AA03',
  DIS_SERVICE: '180A',
} as const;

export type ScannedDeviceModel = {
  id: string;
  deviceName: string;
  macAddress: string;
  rssi: number;
  voltage: string;
  current: string;
  power: string;
  powerFactor: string;
  frequencyOfCurrent: string;
  energy: string;
  switchStatus: boolean;
  load: boolean;
  overPressure: boolean;
  underVoltage: boolean;
  overCurrent: boolean;
  overLoad: boolean;
  needPassword: boolean;
  connectable: boolean;
  txPower: number;
};

export enum LoRaWanRegion {
  AS923 = 0,
  AU915 = 1,
  CN470 = 2,
  CN779 = 3,
  EU433 = 4,
  EU868 = 5,
  KR920 = 6,
  IN865 = 7,
  US915 = 8,
  RU864 = 9,
}

export enum LoRaWanModem {
  ABP = 0,
  OTAA = 1,
}

export enum LoRaWanMessageType {
  Unconfirm = 0,
  Confirm = 1,
}

export enum LoRaWanClassType {
  A = 0,
  C = 2,
}

export enum RepoweredDefaultMode {
  Off = 0,
  On = 1,
  RevertToLast = 2,
}

/** 对齐 mk_mp_productModel */
export enum ProductModel {
  EuropeFrance = 0,
  America = 1,
  UK = 2,
}

/** 对齐 mk_mp_ledColorType */
export enum LedColorType {
  TransitionDirectly = 0,
  TransitionSmoothly = 1,
  White = 2,
  Red = 3,
  Green = 4,
  Blue = 5,
  Orange = 6,
  Cyan = 7,
  Purple = 8,
}

export type LedColorProtocol = {
  b_color: number;
  g_color: number;
  y_color: number;
  o_color: number;
  r_color: number;
  p_color: number;
};

export enum OverProtectionType {
  Load = 0,
  Voltage = 1,
  SagVoltage = 2,
  Current = 3,
}

export enum TxPower {
  Neg40dBm = 0,
  Neg20dBm = 1,
  Neg16dBm = 2,
  Neg12dBm = 3,
  Neg8dBm = 4,
  Neg4dBm = 5,
  d0 = 6,
  d3 = 7,
  d4 = 8,
}

