import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import MPCentralManager from '../sdk/MPCentralManager';
import {getDecimalStringWithHex, getDecimalWithHex} from '../utils/BleHexUtils';
import {
  clearAllStoredData,
  keepAliveBleCommunication,
  pauseSendLocalData,
  readNumberOfDaysStoredData,
} from '../utils/localDataSyncApi';
import {parseSynDataPacket} from '../utils/syncDataParser';
import {
  clearSyncDataList,
  getReadDayNum,
  getTotalSum,
  readSyncDataList,
  saveSyncDataList,
  setReadDayNum,
  setTotalSum,
  type SyncDataRow,
} from '../utils/syncDataStorage';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';
import {NAVBAR_COLOR} from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PARSE_INTERVAL_MS = 100;
const KEEP_ALIVE_INTERVAL_MS = 30000;
const BACK_WAIT_TICKS = 4;
const BACK_TICK_MS = 500;

const LocalDataSyncScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dayInput, setDayInput] = useState('');
  const [dataList, setDataList] = useState<SyncDataRow[]>([]);
  const [sumLabel, setSumLabel] = useState('Sum:N/A');
  const [countLabel, setCountLabel] = useState('Count:N/A');
  const [syncSelected, setSyncSelected] = useState(false);
  const [startEnabled, setStartEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [actionEnabled, setActionEnabled] = useState(false);

  const contentQueueRef = useRef<string[]>([]);
  const totalSumRef = useRef('');
  const isMaxCountRef = useRef(false);
  const parseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keepAliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backCountRef = useRef(0);
  const dataListRef = useRef<SyncDataRow[]>([]);

  useEffect(() => {
    dataListRef.current = dataList;
  }, [dataList]);

  const stopParseTimer = useCallback(() => {
    if (parseTimerRef.current) {
      clearInterval(parseTimerRef.current);
      parseTimerRef.current = null;
    }
  }, []);

  const stopKeepAliveTimer = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  }, []);

  const stopBackTimer = useCallback(() => {
    if (backTimerRef.current) {
      clearInterval(backTimerRef.current);
      backTimerRef.current = null;
    }
    backCountRef.current = 0;
  }, []);

  const updateCountLabel = useCallback((count: number, totalSum: string) => {
    let n = count;
    if (totalSum && parseInt(totalSum, 10) < n) {
      n = parseInt(totalSum, 10);
    }
    setCountLabel(`Count: ${n}`);
  }, []);

  const parseQueuedContent = useCallback(() => {
    const queue = contentQueueRef.current;
    if (queue.length === 0) {
      const tempNumber = dataListRef.current.length;
      if (totalSumRef.current && parseInt(totalSumRef.current, 10) === tempNumber) {
        stopParseTimer();
      }
      updateCountLabel(tempNumber, totalSumRef.current);
      return;
    }

    const first = queue.shift()!;
    const parsed = parseSynDataPacket(first);
    setDataList(prev => {
      let next: SyncDataRow[];
      if (isMaxCountRef.current && prev.length > 0) {
        next = [...parsed, ...prev];
      } else {
        next = [...prev, ...parsed];
      }
      dataListRef.current = next;
      updateCountLabel(next.length, totalSumRef.current);
      return next;
    });
  }, [stopParseTimer, updateCountLabel]);

  const startParseTimer = useCallback(() => {
    stopParseTimer();
    parseTimerRef.current = setInterval(parseQueuedContent, PARSE_INTERVAL_MS);
  }, [parseQueuedContent, stopParseTimer]);

  const startKeepAliveTimer = useCallback(() => {
    stopKeepAliveTimer();
    keepAliveTimerRef.current = setInterval(() => {
      void keepAliveBleCommunication();
    }, KEEP_ALIVE_INTERVAL_MS);
  }, [stopKeepAliveTimer]);

  const applyIdleState = useCallback((rows: SyncDataRow[], savedSum: string, savedDays: string) => {
    setDayInput(savedDays);
    if (savedSum) {
      setSumLabel(`Sum:${savedSum}`);
      totalSumRef.current = savedSum;
    } else {
      setSumLabel('Sum:N/A');
    }
    if (rows.length > 0) {
      setCountLabel(`Count:${rows.length}`);
      setSyncEnabled(true);
      setActionEnabled(true);
    } else {
      setCountLabel('Count:N/A');
      setSyncEnabled(false);
      setActionEnabled(false);
    }
  }, []);

  const applyStartSyncUi = useCallback(() => {
    setStartEnabled(false);
    setActionEnabled(false);
    setSyncEnabled(true);
    setSyncSelected(true);
    setSumLabel('Sum:N/A');
    totalSumRef.current = '';
    contentQueueRef.current = [];
    setDataList([]);
    dataListRef.current = [];
    startParseTimer();
  }, [startParseTimer]);

  const applyStopSyncUi = useCallback(
    (rows: SyncDataRow[]) => {
      setStartEnabled(true);
      const enable = rows.length > 0;
      setActionEnabled(enable);
      setSyncSelected(false);
      stopParseTimer();
    },
    [stopParseTimer],
  );

  const applyEmptyUi = useCallback(() => {
    setStartEnabled(true);
    setSyncEnabled(false);
    setActionEnabled(true);
    setSyncSelected(false);
    setSumLabel('Sum:0');
    setCountLabel('Count:0');
    totalSumRef.current = '0';
  }, []);

  useEffect(() => {
    const central = MPCentralManager.shared();
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [rows, savedSum, savedDays] = await Promise.all([
          readSyncDataList(),
          getTotalSum(),
          getReadDayNum(),
        ]);
        if (!cancelled) {
          setDataList(rows);
          dataListRef.current = rows;
          applyIdleState(rows, savedSum, savedDays);
        }
      } catch (e) {
        if (!cancelled) {
          showToast(apiErrorMessage(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    central.storageDataDelegate = {
      mk_mp_receiveStorageData: content => {
        const number = getDecimalWithHex(content, 10, 2);
        if (number === 0) {
          const total = getDecimalStringWithHex(content, 12, 4);
          totalSumRef.current = total;
          setSumLabel(`Sum:${total}`);
          if (parseInt(total, 10) === 0) {
            setCountLabel('Count:0');
          }
          startKeepAliveTimer();
          return;
        }
        contentQueueRef.current.push(content);
      },
    };
    central.notifyStorageData(true);
    void load();

    return () => {
      cancelled = true;
      central.notifyStorageData(false);
      central.storageDataDelegate = undefined;
      stopParseTimer();
      stopKeepAliveTimer();
      stopBackTimer();
    };
  }, [
    applyIdleState,
    startKeepAliveTimer,
    stopBackTimer,
    stopKeepAliveTimer,
    stopParseTimer,
  ]);

  const onStart = async () => {
    const days = parseInt(dayInput, 10);
    if (!dayInput || Number.isNaN(days) || days < 1 || days > 65535) {
      showToast('Time must be 1 ~ 65535');
      return;
    }
    setBusy(true);
    try {
      await readNumberOfDaysStoredData(days);
      isMaxCountRef.current = days === 65535;
      await setReadDayNum(dayInput);
      applyStartSyncUi();
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSyncToggle = async () => {
    const nextSelected = !syncSelected;
    setBusy(true);
    try {
      await pauseSendLocalData(!nextSelected);
      if (nextSelected) {
        setSyncSelected(true);
        setStartEnabled(false);
        setActionEnabled(false);
        totalSumRef.current = '';
        setSumLabel('Sum:N/A');
        startParseTimer();
      } else {
        applyStopSyncUi(dataListRef.current);
      }
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onEmpty = async () => {
    setBusy(true);
    try {
      await clearAllStoredData();
      stopParseTimer();
      contentQueueRef.current = [];
      totalSumRef.current = '0';
      setDataList([]);
      dataListRef.current = [];
      await clearSyncDataList();
      await setTotalSum('0');
      applyEmptyUi();
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onExport = async () => {
    if (dataListRef.current.length === 0) {
      showToast('No data to send');
      return;
    }
    const lines = dataListRef.current.map(row => {
      const time = row.date ? `Time: ${row.date}` : 'Time: N/A';
      const raw = row.rawData ? `Raw Data: ${row.rawData}` : 'Raw Data: N/A';
      return `${time}\n${raw}`;
    });
    try {
      await Share.share({
        message: lines.join('\n\n'),
        title: 'LoRaWAN-MT Data.txt',
      });
    } catch {
      showToast('Export failed');
    }
  };

  const saveAndGoBack = useCallback(async () => {
    try {
      await clearSyncDataList();
      await setTotalSum(totalSumRef.current);
      const rows = dataListRef.current;
      if (rows.length > 0) {
        await saveSyncDataList(rows);
      }
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setBusy(false);
      navigation.goBack();
    }
  }, [navigation]);

  const onBack = useCallback(() => {
    if (busy) {
      return;
    }
    setBusy(true);
    stopBackTimer();
    void pauseSendLocalData(true)
      .catch(() => undefined)
      .finally(() => {
        backTimerRef.current = setInterval(() => {
          backCountRef.current += 1;
          if (backCountRef.current >= BACK_WAIT_TICKS) {
            stopBackTimer();
            void saveAndGoBack();
          }
        }, BACK_TICK_MS);
      });
  }, [busy, saveAndGoBack, stopBackTimer]);

  const renderRow = ({item}: {item: SyncDataRow}) => (
    <View style={styles.row}>
      <Text style={styles.rowTime}>
        Time: {item.date || 'N/A'}
      </Text>
      <Text style={styles.rowRaw}>
        Raw Data: {item.rawData || 'N/A'}
      </Text>
      <View style={styles.rowLine} />
    </View>
  );

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.timeLabel}>Time</Text>
        <TextInput
          style={styles.dayInput}
          value={dayInput}
          onChangeText={setDayInput}
          placeholder="1~65535"
          placeholderTextColor="#ccc"
          keyboardType="number-pad"
          maxLength={5}
        />
        <Text style={styles.daysLabel}>Days</Text>
        <TouchableOpacity
          style={[styles.startBtn, !startEnabled && styles.startBtnDisabled]}
          disabled={!startEnabled || busy}
          onPress={onStart}>
          <Text style={styles.startBtnText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          disabled={!syncEnabled || busy}
          onPress={onSyncToggle}>
          {syncSelected ? (
            <ActivityIndicator size="small" color={NAVBAR_COLOR} />
          ) : null}
          <Text style={styles.iconBtnText}>{syncSelected ? 'STOP' : 'SYNC'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          disabled={!actionEnabled || busy}
          onPress={onEmpty}>
          <Text style={styles.iconBtnText}>Empty</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          disabled={!actionEnabled || busy}
          onPress={onExport}>
          <Text style={styles.iconBtnText}>Export</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.statText}>{sumLabel}</Text>
        <Text style={styles.statText}>{countLabel}</Text>
      </View>
      <View style={styles.headerLine} />
    </View>
  );

  return (
    <StackScreenLayout
      title="Local Data Sync"
      onBack={onBack}
      loading={loading || busy}
      loadingText={busy ? 'Waiting...' : 'Reading...'}>
      <FlatList
        style={styles.list}
        data={dataList}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderRow}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
      />
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  list: {flex: 1, backgroundColor: '#fff'},
  listContent: {paddingBottom: 24},
  header: {backgroundColor: '#fff'},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    flexWrap: 'wrap',
    gap: 6,
  },
  timeLabel: {fontSize: 15, color: '#333'},
  dayInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 4,
    minWidth: 72,
    height: 28,
    paddingHorizontal: 6,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  daysLabel: {fontSize: 12, color: '#333'},
  startBtn: {
    backgroundColor: NAVBAR_COLOR,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  startBtnDisabled: {backgroundColor: '#999'},
  startBtnText: {color: '#fff', fontSize: 13},
  iconBtn: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  iconBtnText: {fontSize: 12, color: '#333', marginTop: 4},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  statText: {fontSize: 13, color: '#333'},
  headerLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginHorizontal: 15,
  },
  row: {paddingHorizontal: 15, paddingTop: 15},
  rowTime: {fontSize: 14, color: '#333'},
  rowRaw: {fontSize: 14, color: '#333', marginTop: 5},
  rowLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginTop: 15,
  },
});

export default LocalDataSyncScreen;
