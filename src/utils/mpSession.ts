/** 当前 BLE 会话 MAC，供 CentralManager / ConnectModel 共用，避免循环依赖 */

let connectedMacAddress = '';

export function setConnectedMacAddress(mac: string): void {
  connectedMacAddress = mac.trim() ? mac : '';
}

export function getConnectedMacAddress(): string {
  return connectedMacAddress;
}

export function clearConnectedMacAddress(): void {
  connectedMacAddress = '';
}
