import {NativeModules} from 'react-native';
import type {DebuggerLogEntry} from './debuggerLogStorage';

type ExportNativeModule = {
  writeDebuggerLogFile?: (fileName: string, content: string) => Promise<string>;
  shareFiles?: (paths: string[]) => Promise<boolean>;
};

const Native: ExportNativeModule | undefined = NativeModules.MPNative;

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[/\\?%*:|"<> ]/g, '-').replace(/-+/g, '-');
}

/** 对齐原生 MKBLEBaseLogManager：每条本地记录对应一个 .txt 文件 */
export function debuggerLogFileName(
  macAddress: string,
  date: string,
): string {
  const mac = sanitizeFileNamePart(macAddress.replace(/:/g, ''));
  const ts = sanitizeFileNamePart(date);
  return `${mac}_${ts}.txt`;
}

export function debuggerLogFileContent(
  macAddress: string,
  entry: DebuggerLogEntry,
): string {
  return `--- ${macAddress} ${entry.date} ---${entry.logDetails}\n`;
}

export function isDebuggerLogExportAvailable(): boolean {
  return (
    Native?.writeDebuggerLogFile != null && Native?.shareFiles != null
  );
}

/** 写入 .txt 并调起系统分享（可选 Mail，以附件形式发送） */
export async function exportSelectedDebuggerLogs(
  macAddress: string,
  entries: DebuggerLogEntry[],
): Promise<void> {
  if (!Native?.writeDebuggerLogFile || !Native?.shareFiles) {
    throw new Error('Export is not available on this platform.');
  }
  if (entries.length === 0) {
    throw new Error('No logs selected.');
  }

  const paths: string[] = [];
  for (const entry of entries) {
    const path = await Native.writeDebuggerLogFile(
      debuggerLogFileName(macAddress, entry.date),
      debuggerLogFileContent(macAddress, entry),
    );
    paths.push(path);
  }
  await Native.shareFiles(paths);
}
