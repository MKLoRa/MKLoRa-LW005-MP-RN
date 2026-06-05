import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  RouteProp,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import DebuggerLogRow from '../components/DebuggerLogRow';
import DebuggerActionButton from '../components/DebuggerActionButton';
import MPCentralManager from '../sdk/MPCentralManager';
import {CentralConnectStatus} from '../sdk/MPSDKDefines';
import MPConnectModel from '../sdk/MPConnectModel';
import {
  deleteDebuggerLogs,
  readDebuggerLogs,
  saveDebuggerLogs,
  type DebuggerLogEntry,
} from '../utils/debuggerLogStorage';
import {showToast} from '../utils/toast';
import {useTabBackToScan} from '../hooks/useTabBackToScan';
import {RootStackParamList} from '../types/navigation';
import {
  exportSelectedDebuggerLogs,
  isDebuggerLogExportAvailable,
} from '../utils/debuggerLogExport';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Debugger'>;
type Route = RouteProp<RootStackParamList, 'Debugger'>;

/** 与全项目一致：require 不带 @2x，由 Metro 自动匹配 @2x/@3x */
const ICONS = {
  /** iOS 录制时仍用 disable 图 + 旋转动画，不切换 enable 图 */
  sync: require('../../assets/images/mp_sync_disableIcon.png'),
  deleteOff: require('../../assets/images/mp_delete_disableIcon.png'),
  deleteOn: require('../../assets/images/mp_delete_enableIcon.png'),
  exportOff: require('../../assets/images/mp_export_disableIcon.png'),
  exportOn: require('../../assets/images/mp_export_enableIcon.png'),
};

function formatLogTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const DebuggerScreen: React.FC<{route: Route}> = ({route}) => {
  const navigation = useNavigation<Nav>();
  const backToScan = useTabBackToScan();
  const macAddress = route.params?.macAddress ?? '';

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<DebuggerLogEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const contentBuffer = useRef<string[]>([]);
  const logStartTime = useRef('');
  const pendingBack = useRef(false);
  const isRecordingRef = useRef(false);
  const spin = useRef(new Animated.Value(0)).current;
  const stopRecordingRef = useRef<(fromDisconnect?: boolean) => Promise<void>>(
    async () => {},
  );

  const hasSelection = logs.some(l => l.selected);
  const toolsEnabled = hasSelection && !isRecording && !busy;

  const deleteIcon = useMemo(
    () => (toolsEnabled ? ICONS.deleteOn : ICONS.deleteOff),
    [toolsEnabled],
  );
  const exportIcon = useMemo(
    () => (toolsEnabled ? ICONS.exportOn : ICONS.exportOff),
    [toolsEnabled],
  );

  const loadLogs = useCallback(async () => {
    if (!macAddress) {
      setLogs([]);
      return;
    }
    const list = await readDebuggerLogs(macAddress);
    setLogs(list.map((item, index) => ({...item, selected: false, index})));
  }, [macAddress]);

  useEffect(() => {
    MPConnectModel.shared().setDebuggerMode(true);
    const central = MPCentralManager.shared();
    central.logDelegate = {
      mk_mp_receiveLog: (text: string) => {
        if (text) {
          contentBuffer.current.push(text);
        }
      },
    };
    return () => {
      central.logDelegate = undefined;
      central.notifyLogData(false);
      MPConnectModel.shared().setDebuggerMode(false);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          await loadLogs();
        } catch {
          if (!cancelled) {
            showToast('Read local logs error');
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [loadLogs]),
  );

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) {
      spin.stopAnimation();
      spin.setValue(0);
      return undefined;
    }
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [isRecording, spin]);

  useEffect(() => {
    const central = MPCentralManager.shared();
    const prev = central.disconnectTypeCallback;
    central.disconnectTypeCallback = type => {
      prev?.(type);
      isRecordingRef.current = false;
      setIsRecording(false);
      central.notifyLogData(false);
      contentBuffer.current = [];
      setLogs([]);
    };
    return () => {
      central.disconnectTypeCallback = prev;
    };
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const persistLogs = async (list: DebuggerLogEntry[]) => {
    await saveDebuggerLogs(macAddress, list);
    setLogs(list.map((item, index) => ({...item, selected: false, index})));
  };

  const saveBuffer = async () => {
    if (contentBuffer.current.length === 0) {
      Alert.alert('Tips!', 'No debug logs are sent during this process!');
      return false;
    }
    if (logs.length >= 10) {
      Alert.alert(
        'Tips!',
        'Up to 10 log files can be stored, please delete the useless logs first!',
      );
      return false;
    }
    const text = contentBuffer.current.map(l => `\n${l}`).join('');
    const entry: DebuggerLogEntry = {
      date: logStartTime.current,
      logDetails: text,
      selected: false,
    };
    const next = [...logs, entry];
    await persistLogs(next);
    contentBuffer.current = [];
    return true;
  };

  const stopRecording = async (fromDisconnect = false) => {
    isRecordingRef.current = false;
    setIsRecording(false);
    MPCentralManager.shared().notifyLogData(false);
    if (!fromDisconnect) {
      setBusy(true);
      try {
        await saveBuffer();
      } finally {
        setBusy(false);
      }
    } else if (contentBuffer.current.length > 0) {
      setBusy(true);
      try {
        await saveBuffer();
      } finally {
        setBusy(false);
      }
    }
  };
  stopRecordingRef.current = stopRecording;

  const onStartStop = async () => {
    if (isRecording) {
      await stopRecording();
      return;
    }
    if (logs.length >= 10) {
      Alert.alert(
        'Tips!',
        'Up to 10 log files can be stored, please delete the useless logs first!',
      );
      return;
    }
    if (
      MPCentralManager.shared().connectStatus !==
      CentralConnectStatus.Connected
    ) {
      Alert.alert('Tips!', 'The device is disconnected.');
      return;
    }
    if (!MPCentralManager.shared().notifyLogData(true)) {
      showToast('Log characteristic unavailable');
      return;
    }
    logStartTime.current = formatLogTime(new Date());
    contentBuffer.current = [];
    isRecordingRef.current = true;
    setIsRecording(true);
  };

  const onDelete = async () => {
    if (!toolsEnabled) {
      return;
    }
    setBusy(true);
    try {
      const next = await deleteDebuggerLogs(macAddress, logs, true);
      setLogs(next);
    } catch {
      showToast('fail to delete');
    } finally {
      setBusy(false);
    }
  };

  const onExport = async () => {
    if (!toolsEnabled) {
      return;
    }
    const selected = logs.filter(l => l.selected);
    if (!isDebuggerLogExportAvailable()) {
      showToast('Export is not available');
      return;
    }
    setBusy(true);
    try {
      await exportSelectedDebuggerLogs(macAddress, selected);
      showToast('Export ready');
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e
          ? String((e as {code?: string}).code)
          : '';
      if (code === 'cancelled') {
        showToast('Export cancelled');
      } else {
        showToast('Export failed');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleBack = async () => {
    if (
      MPCentralManager.shared().connectStatus !==
      CentralConnectStatus.Connected
    ) {
      await backToScan();
      return;
    }
    MPCentralManager.shared().notifyLogData(false);
    if (isRecording) {
      await stopRecording();
    }
    if (contentBuffer.current.length > 0) {
      pendingBack.current = true;
      setBusy(true);
      const ok = await saveBuffer();
      setBusy(false);
      if (ok || pendingBack.current) {
        navigation.goBack();
      }
      pendingBack.current = false;
      return;
    }
    navigation.goBack();
  };

  return (
    <StackScreenLayout
      title="Debugger Mode"
      onBack={handleBack}
      loading={loading || busy}
      saving={busy}
      loadingText={busy ? 'Waiting...' : 'Reading...'}>
      <View style={styles.body}>
        <View style={styles.toolbar}>
          <Pressable
            style={[styles.startBtn, isRecording && styles.stopBtn]}
            onPress={onStartStop}
            disabled={busy}>
            <Text style={styles.startBtnText}>
              {isRecording ? 'Stop' : 'Start'}
            </Text>
          </Pressable>
          <Animated.Image
            source={ICONS.sync}
            style={[
              styles.syncIcon,
              isRecording && {transform: [{rotate}]},
            ]}
            resizeMode="contain"
          />
          <DebuggerActionButton
            label="Delete"
            icon={deleteIcon}
            onPress={onDelete}
            disabled={!toolsEnabled}
          />
          <DebuggerActionButton
            label="Export"
            icon={exportIcon}
            onPress={onExport}
            disabled={!toolsEnabled}
          />
        </View>
        <View style={styles.listWrap}>
          <FlatList
            data={logs}
            keyExtractor={item => item.date}
            renderItem={({item, index}) => (
              <DebuggerLogRow
                timeMsg={item.date}
                selected={!!item.selected}
                disabled={isRecording}
                onToggle={() => {
                  if (isRecording) {
                    return;
                  }
                  setLogs(prev =>
                    prev.map((row, i) =>
                      i === index ? {...row, selected: !row.selected} : row,
                    ),
                  );
                }}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No local log files</Text>
            }
          />
        </View>
        <Pressable
          onPress={() =>
            Linking.openURL('mailto:Development@mokotechnology.com')
          }>
          <Text style={styles.mailHint}>
            Tap Export to share .txt log files; choose Mail to send as attachments.
            You can also email Development@mokotechnology.com for feedback.
          </Text>
        </Pressable>
      </View>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  body: {flex: 1, paddingHorizontal: 15},
  toolbar: {
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 12,
    marginTop: 10,
  },
  startBtn: {
    width: 80,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {backgroundColor: '#e74c3c'},
  startBtnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  syncIcon: {width: 25, height: 25, marginHorizontal: 20},
  listWrap: {
    flex: 1,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  empty: {textAlign: 'center', color: '#999', marginTop: 24, fontSize: 14},
  mailHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
  },
});

export default DebuggerScreen;
