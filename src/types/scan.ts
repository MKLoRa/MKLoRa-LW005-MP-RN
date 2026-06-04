import {ScannedDeviceModel} from '../sdk/MPSDKDefines';

export interface ScanListItem extends ScannedDeviceModel {
  scanTime: string;
  lastScanDate: number;
}
