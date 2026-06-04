/**
 * LW005-MP BLE command builder
 * Frame: HEAD(ED) + FLAG(1) + CMD(1 byte) + LEN(1) + DATA
 * LW005-MP 使用 1 字节 CMD（如 01）；部分其它型号为 2 字节 CMD（如 0025）
 */

import {fetchHexValue} from '../../utils/BleHexUtils';

export const PROTOCOL = {
  HEAD: 'ed',
  FLAG_READ: '00',
  FLAG_WRITE: '01',
  FLAG_NOTIFY: '02',
} as const;

/** 将 CMD 规范为 2 位 hex（1 字节） */
export function normalizeCmd(cmd: number | string): string {
  if (typeof cmd === 'number') {
    return fetchHexValue(cmd, 1);
  }
  const s = cmd.toLowerCase().replace(/^0x/, '');
  return s.length <= 2 ? s.padStart(2, '0') : s.slice(-2);
}

/** 读命令：ED 00 CMD 00（固定 4 字节） */
export function buildReadCommand(cmd: number | string): string {
  return `${PROTOCOL.HEAD}${PROTOCOL.FLAG_READ}${normalizeCmd(cmd)}00`;
}

/** 写命令：ED 01 CMD LEN DATA */
export function buildWriteCommand(cmd: number | string, dataHex: string): string {
  const data = dataHex.toLowerCase();
  const lenHex = fetchHexValue(data.length / 2, 1);
  return `${PROTOCOL.HEAD}${PROTOCOL.FLAG_WRITE}${normalizeCmd(cmd)}${lenHex}${data}`;
}

/** AA00 密码验证：CMD=0x01，8 字节 ASCII 密码 */
export function buildPasswordCommand(password: string): string {
  let data = '';
  for (let i = 0; i < password.length; i++) {
    data += fetchHexValue(password.charCodeAt(i), 1);
  }
  return buildWriteCommand(0x01, data);
}
