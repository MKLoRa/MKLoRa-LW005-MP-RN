import AsyncStorage from '@react-native-async-storage/async-storage';

export type DebuggerLogEntry = {
  date: string;
  logDetails: string;
  selected?: boolean;
};

const STORAGE_PREFIX = '@mp_debugger_logs:';

function storageKey(macAddress: string): string {
  return `${STORAGE_PREFIX}${macAddress.toUpperCase()}`;
}

export async function readDebuggerLogs(
  macAddress: string,
): Promise<DebuggerLogEntry[]> {
  const raw = await AsyncStorage.getItem(storageKey(macAddress));
  if (!raw) {
    return [];
  }
  try {
    const list = JSON.parse(raw) as DebuggerLogEntry[];
    return list
      .map((item, index) => ({
        date: item.date ?? '',
        logDetails: item.logDetails ?? '',
        selected: false,
        index,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export async function saveDebuggerLogs(
  macAddress: string,
  logs: DebuggerLogEntry[],
): Promise<void> {
  const payload = logs.map(({date, logDetails}) => ({date, logDetails}));
  await AsyncStorage.setItem(storageKey(macAddress), JSON.stringify(payload));
}

/** 删除选中项后写回；若 deleteAll 为 true 则清空该 MAC 全部日志 */
export async function deleteDebuggerLogs(
  macAddress: string,
  logs: DebuggerLogEntry[],
  selectedOnly: boolean,
): Promise<DebuggerLogEntry[]> {
  const next = selectedOnly ? logs.filter(l => !l.selected) : [];
  await saveDebuggerLogs(macAddress, next);
  return next.map((item, index) => ({...item, selected: false, index}));
}

/** 设备断开时清空该 MAC 的全部本地 Debugger 日志 */
export async function clearDebuggerLogs(macAddress: string): Promise<void> {
  if (!macAddress.trim()) {
    return;
  }
  await AsyncStorage.removeItem(storageKey(macAddress));
}
