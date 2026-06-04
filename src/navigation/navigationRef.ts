import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import MPCentralManager from '../sdk/MPCentralManager';
import MPConnectModel from '../sdk/MPConnectModel';
import {store} from '../store';
import {setConnectedDevice} from '../store/deviceSlice';
import type {RootStackParamList} from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** 断开 BLE、清理会话并 reset 到扫描页（任意栈深度均可） */
export async function resetToScan(): Promise<void> {
  const central = MPCentralManager.shared();
  central.stopScan();
  central.suppressNextConnectStateAlert();
  MPConnectModel.shared().setDebuggerMode(false);
  await MPConnectModel.shared().disconnectFromDevice();
  store.dispatch(setConnectedDevice(null));
  central.clearDisconnectTypeNotified();
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Scan'}],
      }),
    );
  }
}
