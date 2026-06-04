import {useCallback, useEffect, useRef} from 'react';
import {Alert} from 'react-native';
import MPCentralManager, {
  type TabBarDisconnectListener,
} from '../sdk/MPCentralManager';
import MPConnectModel from '../sdk/MPConnectModel';
import {resetToScan} from '../navigation/navigationRef';
import {
  disconnectAlertForType,
  DISCONNECT_ALERT_BT_UNAVAILABLE,
  DISCONNECT_ALERT_DEVICE_OFF,
} from '../utils/disconnectMessages';

/**
 * 对齐 iOS MKMPTabBarController：全局监听断开，点确定后一律回扫描页。
 */
export function useTabBarDisconnectAlerts() {
  const disconnectTypeHandled = useRef(false);

  const showAlert = useCallback((title: string, message: string) => {
    Alert.alert(title || ' ', message, [
      {
        text: 'OK',
        onPress: () => {
          disconnectTypeHandled.current = false;
          void resetToScan();
        },
      },
    ]);
  }, []);

  useEffect(() => {
    const central = MPCentralManager.shared();
    const listener: TabBarDisconnectListener = {
      onDisconnectType: type => {
        if (MPConnectModel.shared().isDfuInProgress()) {
          return;
        }
        disconnectTypeHandled.current = true;
        const {title, message} = disconnectAlertForType(type);
        showAlert(title, message);
      },
      onConnectStateChanged: () => {
        if (MPConnectModel.shared().isDfuInProgress()) {
          return;
        }
        if (disconnectTypeHandled.current) {
          return;
        }
        const {title, message} = DISCONNECT_ALERT_DEVICE_OFF;
        showAlert(title, message);
      },
      onCentralStateChanged: () => {
        if (MPConnectModel.shared().isDfuInProgress()) {
          return;
        }
        if (disconnectTypeHandled.current) {
          return;
        }
        const {title, message} = DISCONNECT_ALERT_BT_UNAVAILABLE;
        showAlert(title, message);
      },
    };
    central.setTabBarDisconnectListener(listener);
    return () => central.setTabBarDisconnectListener(null);
  }, [showAlert]);
}
