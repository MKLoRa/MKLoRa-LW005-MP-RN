import {getDecimalWithHex} from './BleHexUtils';
import type {SyncDataRow} from './syncDataStorage';

function formatSyncDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** 对齐 MKMPSynDataController parseSynData: */
export function parseSynDataPacket(content: string): SyncDataRow[] {
  const payload = content.substring(12);
  const date = formatSyncDate(new Date());
  const rows: SyncDataRow[] = [];
  let index = 0;

  for (let i = 0; i < payload.length; i++) {
    if (index >= payload.length) {
      break;
    }
    const subLen = getDecimalWithHex(payload, index, 2);
    index += 2;
    if (payload.length < index + subLen * 2) {
      break;
    }
    const rawData = payload.substring(index, index + subLen * 2);
    index += subLen * 2;
    rows.push({date, rawData});
  }
  return rows;
}
