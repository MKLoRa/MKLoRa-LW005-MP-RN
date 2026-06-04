import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncDataRow = {
  date: string;
  rawData: string;
};

const DATA_LIST_KEY = 'mp_sync_data_list';
export const READ_DAY_NUM_KEY = 'mp_readRecordDataDayNumKey';
export const TOTAL_SUM_KEY = 'mp_recordDataTotalSumKey';

export async function readSyncDataList(): Promise<SyncDataRow[]> {
  const raw = await AsyncStorage.getItem(DATA_LIST_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as SyncDataRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSyncDataList(rows: SyncDataRow[]): Promise<void> {
  await AsyncStorage.setItem(DATA_LIST_KEY, JSON.stringify(rows));
}

export async function clearSyncDataList(): Promise<void> {
  await AsyncStorage.removeItem(DATA_LIST_KEY);
}

export async function getReadDayNum(): Promise<string> {
  return (await AsyncStorage.getItem(READ_DAY_NUM_KEY)) ?? '';
}

export async function setReadDayNum(value: string): Promise<void> {
  await AsyncStorage.setItem(READ_DAY_NUM_KEY, value);
}

export async function getTotalSum(): Promise<string> {
  return (await AsyncStorage.getItem(TOTAL_SUM_KEY)) ?? '';
}

export async function setTotalSum(value: string): Promise<void> {
  await AsyncStorage.setItem(TOTAL_SUM_KEY, value);
}

/** 对齐 MKMPScanController configParams：新连接时清空天数/总数缓存 */
export async function clearSyncSessionPrefs(): Promise<void> {
  await AsyncStorage.removeMany([READ_DAY_NUM_KEY, TOTAL_SUM_KEY]);
}
