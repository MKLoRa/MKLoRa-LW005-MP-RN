import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

type PickedFirmwareFile = {
  fileName: string;
  filePath?: string;
};

type MPNativeModule = {
  listDocumentFiles: () => Promise<string[]>;
  getDocumentsDirectory: () => Promise<string>;
  pickFirmwareFile?: () => Promise<PickedFirmwareFile>;
  startDFU: (deviceId: string, fileName: string) => void;
  cancelDFU?: () => void;
};

const Native: MPNativeModule | undefined = NativeModules.MPNative;

const emitter =
  Native != null ? new NativeEventEmitter(NativeModules.MPNative) : null;

/** 原生 progress 统一为 0–1（iOS 曾误传 0–100） */
export function normalizeDfuProgress(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }
  const p = raw > 1 ? raw / 100 : raw;
  return Math.min(1, Math.max(0, p));
}

export function isNativeDfuAvailable(): boolean {
  return (
    (Platform.OS === 'ios' || Platform.OS === 'android') &&
    Native?.startDFU != null
  );
}

export async function listDocumentFirmwareFiles(): Promise<string[]> {
  if (!Native?.listDocumentFiles) {
    return [];
  }
  return Native.listDocumentFiles();
}

/** Android：打开系统文件管理器选择 .zip */
export async function pickFirmwareFileFromSystem(): Promise<PickedFirmwareFile | null> {
  if (Platform.OS !== 'android' || !Native?.pickFirmwareFile) {
    return null;
  }
  try {
    const result = await Native.pickFirmwareFile();
    const fileName = String(result?.fileName ?? '').trim();
    if (!fileName) {
      return null;
    }
    return {
      fileName,
      filePath: result.filePath ? String(result.filePath) : undefined,
    };
  } catch (e: unknown) {
    const code =
      e && typeof e === 'object' && 'code' in e
        ? String((e as {code?: string}).code)
        : '';
    if (code === 'cancelled') {
      return null;
    }
    throw e;
  }
}

export function isAndroidFirmwarePickerAvailable(): boolean {
  return Platform.OS === 'android' && Native?.pickFirmwareFile != null;
}

export async function getDocumentsDirectory(): Promise<string> {
  if (!Native?.getDocumentsDirectory) {
    return '';
  }
  return Native.getDocumentsDirectory();
}

export function startNativeDFU(
  deviceId: string,
  fileName: string,
  handlers: {
    onUploading?: () => void;
    onProgress?: (progress: number) => void;
    onSuccess?: () => void;
    onError?: (message: string) => void;
  },
): () => void {
  if (!Native?.startDFU) {
    handlers.onError?.('DFU is not available on this platform.');
    return () => undefined;
  }

  const subs = [
    emitter?.addListener('MPDfuUploading', () => {
      handlers.onUploading?.();
    }),
    emitter?.addListener('MPDfuProgress', e => {
      const p =
        typeof e?.progress === 'number' ? normalizeDfuProgress(e.progress) : 0;
      handlers.onProgress?.(p);
    }),
    emitter?.addListener('MPDfuSuccess', () => {
      handlers.onSuccess?.();
    }),
    emitter?.addListener('MPDfuError', e => {
      handlers.onError?.(String(e?.message ?? 'DFU failed'));
    }),
  ];

  Native.startDFU(deviceId, fileName);

  return () => {
    subs.forEach(s => s?.remove());
    Native.cancelDFU?.();
  };
}
