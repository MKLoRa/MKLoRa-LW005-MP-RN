/**
 * MPConnectModel — 连接 + 时间同步（对齐 iOS ConnectModule）
 */

import {Platform} from 'react-native';
import MPCentralManager from './MPCentralManager';
import MPInterfaceConfig from './MPInterfaceConfig';
import {ScannedDeviceModel} from './MPSDKDefines';
import {waitForBleReady} from '../utils/mpApi';
import {clearDebuggerLogs} from '../utils/debuggerLogStorage';
import {
  clearConnectedMacAddress,
  getConnectedMacAddress,
  setConnectedMacAddress,
} from '../utils/mpSession';
import {
  clearSyncDataList,
  clearSyncSessionPrefs,
} from '../utils/syncDataStorage';

export interface ConnectOptions {
  deviceId: string;
  password?: string;
  deviceType?: string;
}

class MPConnectModel {
  private static instance: MPConnectModel | null = null;
  hasPassword = false;
  deviceType = '00';
  /** 对齐 iOS TabBar isDebugger：调试模式下断开不自动回扫描页 */
  private debuggerMode = false;
  /** 对齐 mk_mp_startDfuProcessNotification：从 DFU 返回设备信息页不重复读取 */
  private dfuInProgress = false;
  static shared(): MPConnectModel {
    if (!MPConnectModel.instance) {
      MPConnectModel.instance = new MPConnectModel();
    }
    return MPConnectModel.instance;
  }

  async connectDevice(
    device: ScannedDeviceModel,
    password: string,
  ): Promise<void> {
    const needPwd = device.needPassword;
    const pwd = needPwd ? password : undefined;
    if (needPwd && (!pwd || pwd.length !== 8)) {
      throw new Error('The password should be 8 characters.');
    }

    const central = MPCentralManager.shared();
    await central.connectPeripheral(device.id, pwd);
    this.hasPassword = !!needPwd && !!pwd;

    setConnectedMacAddress(device.macAddress ?? '');

    const synced = await this.configDate();
    if (!synced) {
      clearConnectedMacAddress();
      await central.disconnect();
      throw new Error('Config Date Error');
    }

    // 对齐 MKMPScanController configParams：新连接成功后清空 sync 缓存
    await clearSyncSessionPrefs();
    await clearSyncDataList();
  }

  /** 断开连接时清除该设备本地 Debugger 日志（含意外断开） */
  async clearLocalDebuggerLogs(): Promise<void> {
    const mac = getConnectedMacAddress();
    if (!mac) {
      return;
    }
    await clearDebuggerLogs(mac);
  }

  setDebuggerMode(enabled: boolean): void {
    this.debuggerMode = enabled;
  }

  isDebuggerMode(): boolean {
    return this.debuggerMode;
  }

  setDfuInProgress(inProgress: boolean): void {
    this.dfuInProgress = inProgress;
  }

  isDfuInProgress(): boolean {
    return this.dfuInProgress;
  }

  /** 对齐 iOS TabBar viewDidDisappear / 返回扫描前断开连接 */
  async disconnectFromDevice(): Promise<void> {
    await this.clearLocalDebuggerLogs();
    MPCentralManager.shared().suppressNextConnectStateAlert();
    await MPCentralManager.shared().disconnect();
    this.hasPassword = false;
    this.deviceType = '00';
    clearConnectedMacAddress();
  }

  private async configDate(): Promise<boolean> {
    if (!(await waitForBleReady())) {
      return false;
    }
    const timestamp = Math.floor(Date.now() / 1000);
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise<void>(r =>
          setTimeout(r, Platform.OS === 'android' ? 400 : 200),
        );
      }
      const ok = await new Promise<boolean>(resolve => {
        MPInterfaceConfig.config_device_time(
          timestamp,
          () => resolve(true),
          () => resolve(false),
        );
      });
      if (ok) {
        return true;
      }
    }
    return false;
  }
}

export default MPConnectModel;
