/**
 * 设备 AA01 断开类型文案 — 与 MKMPTabBarController disconnectTypeNotification: 一致。
 * 注：README 与 .m 内编号不一致，以 TabBar .m 内 if 分支为准。
 */
export type DisconnectAlert = {
  title: string;
  message: string;
};

/** iOS disconnectTypeNotification: 命中类型后不再弹「The device is disconnected.」 */
export function disconnectAlertForType(type: string): DisconnectAlert {
  switch (type) {
    case '02':
      return {
        title: 'Change Password',
        message:
          'Password changed successfully! Please reconnect the device.',
      };
    case '03':
      return {
        title: '',
        message:
          'No data communication for 3 minutes, the device is disconnected.',
      };
    case '04':
      return {
        title: 'Dismiss',
        message: 'Reboot successfully!Please reconnect the device.',
      };
    case '05':
      return {
        title: 'Factory Reset',
        message:
          'Factory reset successfully!Please reconnect the device.',
      };
    default:
      return {
        title: 'Dismiss',
        message: `Device disconnected for unknown reason.(${type})`,
      };
  }
}

export const DISCONNECT_ALERT_DEVICE_OFF: DisconnectAlert = {
  title: 'Dismiss',
  message: 'The device is disconnected.',
};

export const DISCONNECT_ALERT_BT_UNAVAILABLE: DisconnectAlert = {
  title: 'Dismiss',
  message: 'The current system of bluetooth is not available!',
};
