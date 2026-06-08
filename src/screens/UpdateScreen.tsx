import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import MPCentralManager from '../sdk/MPCentralManager';
import MPConnectModel from '../sdk/MPConnectModel';
import {
  isAndroidFirmwarePickerAvailable,
  isNativeDfuAvailable,
  listDocumentFirmwareFiles,
  pickFirmwareFileFromSystem,
  startNativeDFU,
} from '../native/MPNative';
import {showToast} from '../utils/toast';
import {resolveDfuBluetoothAddress} from '../utils/mpSession';
import {useTabBackToScan} from '../hooks/useTabBackToScan';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Update'>;

/** 仅在 DFU 尚未开始（无 Uploading/Progress）时生效 */
const DFU_START_TIMEOUT_MS = 60_000;
/** Android：destroy ble-plx 后等待控制器释放连接句柄 */
const ANDROID_DFU_DISCONNECT_DELAY_MS = 2000;

const UpdateScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const backToScan = useTabBackToScan();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);
  const dfuStartedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDfuTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      const list = await listDocumentFirmwareFiles();
      setFiles(list);
    } catch {
      setFiles([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({gestureEnabled: !busy});
      let cancelled = false;
      (async () => {
        setLoading(true);
        await loadFiles();
        if (!cancelled) {
          setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
        if (!busy) {
          navigation.setOptions({gestureEnabled: true});
        }
      };
    }, [busy, loadFiles, navigation]),
  );

  useEffect(() => {
    if (!busy) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [busy]);

  useEffect(
    () => () => {
      clearDfuTimeout();
      cleanupRef.current?.();
      cleanupRef.current = null;
    },
    [clearDfuTimeout],
  );

  const cleanupAfterDfu = useCallback(async () => {
    clearDfuTimeout();
    cleanupRef.current?.();
    cleanupRef.current = null;
    dfuStartedRef.current = false;
    MPCentralManager.sharedDealloc();
    MPConnectModel.shared().setDfuInProgress(false);
    setBusy(false);
    setStatusText('');
    await backToScan();
  }, [backToScan, clearDfuTimeout]);

  const showDfuResult = useCallback(
    (title: string, message: string) => {
      Alert.alert(title, message, [
        {
          text: 'OK',
          onPress: () => {
            void cleanupAfterDfu();
          },
        },
      ]);
    },
    [cleanupAfterDfu],
  );

  const failDfu = useCallback(
    (message: string) => {
      if (!dfuStartedRef.current) {
        return;
      }
      dfuStartedRef.current = false;
      clearDfuTimeout();
      setStatusText('Opps!DFU Failed. Please try again!');
      showToast(message);
      showDfuResult('DFU Failed', message);
    },
    [clearDfuTimeout, showDfuResult],
  );

  const startDfuWithFile = async (fileName: string, filePath?: string) => {
    if (!fileName.trim()) {
      showToast('Firmware cannot be empty!');
      return;
    }
    if (!isNativeDfuAvailable()) {
      Alert.alert(
        'DFU unavailable',
        'Firmware update requires the native DFU module (iOSDFULibrary / Nordic Android DFU). Rebuild the app on a device.',
      );
      return;
    }
    const device = MPCentralManager.shared().getPeripheral();
    if (!device?.id) {
      showToast('The device is disconnected.');
      return;
    }
    const deviceId =
      Platform.OS === 'android'
        ? resolveDfuBluetoothAddress(device.id)
        : device.id;

    MPConnectModel.shared().setDfuInProgress(true);
    dfuStartedRef.current = true;
    setBusy(true);
    setStatusText('Waiting...');

    clearDfuTimeout();
    timeoutRef.current = setTimeout(() => {
      failDfu(
        'DFU did not start or timed out. Check the firmware file and device connection.',
      );
    }, DFU_START_TIMEOUT_MS);

    if (Platform.OS === 'android') {
      setStatusText('Disconnecting...');
      try {
        await MPCentralManager.shared().disconnectForDfu();
        await new Promise<void>(resolve =>
          setTimeout(resolve, ANDROID_DFU_DISCONNECT_DELAY_MS),
        );
      } catch {
        failDfu(
          'Failed to release BLE connection before DFU. Try disconnecting and reconnecting.',
        );
        return;
      }
    }

    cleanupRef.current?.();
    const dfuTarget = filePath?.startsWith('/') ? filePath : fileName;
    cleanupRef.current = startNativeDFU(deviceId, dfuTarget, {
      onUploading: () => {
        clearDfuTimeout();
        if (Platform.OS === 'ios') {
          MPCentralManager.sharedDealloc();
        } else {
          MPCentralManager.shared().prepareForDfuTeardown();
        }
        setStatusText('Uploading...');
      },
      onProgress: progress => {
        clearDfuTimeout();
        const pct = Math.min(100, Math.round(progress * 100));
        setStatusText(`Uploading... ${pct}%`);
      },
      onSuccess: () => {
        if (!dfuStartedRef.current) {
          return;
        }
        dfuStartedRef.current = false;
        clearDfuTimeout();
        setStatusText('Update firmware successfully!');
        showDfuResult('Success', 'Update firmware successfully!');
      },
      onError: msg => {
        failDfu(msg || 'DFU failed');
      },
    });
  };

  const onSelectFile = (fileName: string) => {
    void startDfuWithFile(fileName);
  };

  const onPickFromSystem = async () => {
    if (busy) {
      return;
    }
    try {
      const picked = await pickFirmwareFileFromSystem();
      if (!picked?.fileName) {
        return;
      }
      void startDfuWithFile(picked.fileName, picked.filePath);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to open file picker');
    }
  };

  const handleBack = () => {
    if (busy) {
      showToast('Firmware update in progress. Please wait.');
      return;
    }
    navigation.goBack();
  };

  return (
    <StackScreenLayout
      title="OTA"
      onBack={handleBack}
      loading={loading || busy}
      saving={busy}
      loadingText={statusText || (busy ? 'Waiting...' : 'Reading...')}
>
      <View style={styles.body}>
        {isAndroidFirmwarePickerAvailable() ? (
          <>
            <Pressable
              style={[styles.pickRow, busy && styles.rowDisabled]}
              onPress={() => void onPickFromSystem()}
              disabled={busy}>
              <Text style={styles.pickTitle}>Select firmware file</Text>
              <Text style={styles.pickHint}>Open system file manager (.zip)</Text>
            </Pressable>
            {files.length > 0 ? (
              <Text style={styles.sectionLabel}>Recent in app folder</Text>
            ) : null}
            <FlatList
              data={files}
              keyExtractor={item => item}
              renderItem={({item}) => (
                <Pressable
                  style={[styles.row, busy && styles.rowDisabled]}
                  onPress={() => onSelectFile(item)}
                  disabled={busy}>
                  <Text style={styles.fileName}>{item}</Text>
                </Pressable>
              )}
            />
          </>
        ) : (
          <FlatList
            data={files}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <Pressable
                style={[styles.row, busy && styles.rowDisabled]}
                onPress={() => onSelectFile(item)}
                disabled={busy}>
                <Text style={styles.fileName}>{item}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                Place firmware .zip files in the app Documents folder (e.g. via
                Files app).
              </Text>
            }
          />
        )}
      </View>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  body: {flex: 1, backgroundColor: '#fff'},
  pickRow: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    backgroundColor: '#f8fbff',
  },
  pickTitle: {fontSize: 16, color: '#2F84D0', fontWeight: '600'},
  pickHint: {fontSize: 13, color: '#666', marginTop: 4},
  sectionLabel: {
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    height: 44,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowDisabled: {opacity: 0.5},
  fileName: {fontSize: 15, color: '#333'},
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    paddingHorizontal: 24,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default UpdateScreen;
