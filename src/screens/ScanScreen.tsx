import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch} from 'react-redux';
import ScreenLoadingOverlay from '../components/ScreenLoadingOverlay';
import {RootStackParamList} from '../types/navigation';
import {ScanListItem} from '../types/scan';
import ScanDeviceCell, {SCAN_CELL_HEIGHT} from '../components/ScanDeviceCell';
import PasswordModal from '../components/PasswordModal';
import SearchButton from '../components/SearchButton';
import SearchConditionsModal from '../components/SearchConditionsModal';
import MPCentralManager from '../sdk/MPCentralManager';
import MPConnectModel from '../sdk/MPConnectModel';
import {ScannedDeviceModel} from '../sdk/MPSDKDefines';
import {setConnectedDevice, setScanning} from '../store/deviceSlice';
import {NAVBAR_COLOR, NAVBAR_TINT} from '../theme/colors';

const SCAN_ROW_HEIGHT = SCAN_CELL_HEIGHT + StyleSheet.hairlineWidth;
import {showToast} from '../utils/toast';
import {
  loadSavedPassword,
  savePassword,
} from '../utils/scanPasswordStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

const MIN_RSSI = -127;
const SCAN_DURATION_MS = 60_000;
const REFRESH_THROTTLE_MS = 500;

function toListItem(
  device: ScannedDeviceModel,
  prev?: ScanListItem,
): ScanListItem {
  const now = Date.now();
  if (!prev) {
    return {...device, scanTime: 'N/A', lastScanDate: now};
  }
  const delta = now - prev.lastScanDate;
  return {
    ...device,
    scanTime: `<->${delta}ms`,
    lastScanDate: now,
  };
}

const ScanScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const [devices, setDevices] = useState<ScanListItem[]>([]);
  const [scanning, setScanningLocal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [searchRssi, setSearchRssi] = useState(MIN_RSSI);
  const [filterModal, setFilterModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [pendingDevice, setPendingDevice] = useState<ScanListItem | null>(null);
  const [savedPassword, setSavedPassword] = useState('');
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPending = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectingRef = useRef(false);
  const searchKeyRef = useRef(searchKey);
  const searchRssiRef = useRef(searchRssi);

  searchKeyRef.current = searchKey;
  searchRssiRef.current = searchRssi;

  const deviceCount = devices.length;

  const scheduleListRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      return;
    }
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      if (refreshPending.current) {
        refreshPending.current = false;
        setDevices(d => [...d]);
      }
    }, REFRESH_THROTTLE_MS);
  }, []);

  const upsertDevice = useCallback(
    (model: ScannedDeviceModel) => {
      const key = searchKeyRef.current;
      const rssiMin = searchRssiRef.current;
      const rssiOk = model.rssi >= rssiMin;
      const nameOk =
        !key ||
        model.deviceName.toUpperCase().includes(key.toUpperCase()) ||
        model.macAddress
          .replace(/:/g, '')
          .toUpperCase()
          .includes(key.toUpperCase());
      if (!rssiOk || !nameOk) {
        return;
      }

      setDevices(prev => {
        const idx = prev.findIndex(
          d => d.macAddress === model.macAddress || d.id === model.id,
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = toListItem(model, prev[idx]);
          return next;
        }
        return [...prev, toListItem(model)];
      });
      refreshPending.current = true;
      scheduleListRefresh();
    },
    [scheduleListRefresh],
  );

  const startSpin = useCallback(() => {
    spinAnim.setValue(0);
    spinLoop.current = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.current.start();
  }, [spinAnim]);

  const stopSpin = useCallback(() => {
    spinLoop.current?.stop();
    spinAnim.setValue(0);
  }, [spinAnim]);

  const stopScanInternal = useCallback(() => {
    MPCentralManager.shared().stopScan();
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    setScanningLocal(false);
    dispatch(setScanning(false));
    stopSpin();
  }, [dispatch, stopSpin]);

  const startScanInternal = useCallback(async (keepDevices = false) => {
    if (!keepDevices) {
      setDevices([]);
    }
    setScanningLocal(true);
    dispatch(setScanning(true));
    startSpin();
    const central = MPCentralManager.shared();
    const ready = await central.ensureBluetoothReady();
    if (!ready) {
      setScanningLocal(false);
      dispatch(setScanning(false));
      stopSpin();
      Alert.alert('Dismiss', 'The current system of bluetooth is not available!');
      return;
    }
    await central.startScan();
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
    }
    scanTimerRef.current = setTimeout(() => {
      stopScanInternal();
    }, SCAN_DURATION_MS);
  }, [dispatch, startSpin, stopScanInternal]);

  const toggleScan = useCallback(() => {
    if (scanning) {
      stopScanInternal();
    } else {
      startScanInternal();
    }
  }, [scanning, startScanInternal, stopScanInternal]);

  const applyFilterAndRefresh = useCallback(
    (key: string, rssi: number) => {
      setSearchKey(key);
      setSearchRssi(rssi);
      searchKeyRef.current = key;
      searchRssiRef.current = rssi;
      if (!scanning) {
        startScanInternal();
      } else {
        setDevices([]);
        stopScanInternal();
        setTimeout(() => startScanInternal(), 100);
      }
    },
    [scanning, startScanInternal, stopScanInternal],
  );

  const clearFilter = useCallback(() => {
    applyFilterAndRefresh('', MIN_RSSI);
  }, [applyFilterAndRefresh]);

  useEffect(() => {
    loadSavedPassword().then(setSavedPassword);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setConnecting(false);
      connectingRef.current = false;
      const central = MPCentralManager.shared();
      central.delegate = {
        mk_mp_receiveDevice: upsertDevice,
        mk_mp_stopScan: () => {
          setScanningLocal(false);
          stopSpin();
        },
      };
      // 对齐 iOS mk_mp_needResetScanDelegate → startScanDevice（0.1s）
      const t = setTimeout(() => {
        if (!connectingRef.current) {
          startScanInternal();
        }
      }, 100);
      return () => {
        clearTimeout(t);
      };
    }, [startScanInternal, stopSpin, upsertDevice]),
  );

  useEffect(() => {
    return () => {
      stopScanInternal();
      MPCentralManager.shared().delegate = undefined;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [stopScanInternal]);

  const finishConnect = useCallback(
    async (device: ScanListItem, password: string) => {
      stopScanInternal();
      setConnecting(true);
      connectingRef.current = true;
      MPCentralManager.shared().suppressNextConnectStateAlert();
      try {
        await MPConnectModel.shared().connectDevice(device, password);
        if (device.needPassword && password.length === 8) {
          await savePassword(password);
          setSavedPassword(password);
        }
        dispatch(setConnectedDevice(device));
        showToast('Time sync completed!');
        setTimeout(() => {
          navigation.replace('MainTabs');
        }, 600);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Connection failed';
        Alert.alert('Error', msg);
        startScanInternal(true);
      } finally {
        connectingRef.current = false;
        setConnecting(false);
      }
    },
    [dispatch, navigation, startScanInternal, stopScanInternal],
  );

  const onConnectPress = useCallback(
    (device: ScanListItem) => {
      if (connecting) {
        return;
      }
      // 对齐 iOS connectDeviceWithModel：先停扫再弹密码框/连接
      stopScanInternal();
      if (device.needPassword) {
        loadSavedPassword().then(pwd => {
          setSavedPassword(pwd);
          setPendingDevice(device);
          setPasswordModal(true);
        });
        return;
      }
      finishConnect(device, '');
    },
    [connecting, finishConnect, stopScanInternal],
  );

  const onPasswordCancel = useCallback(() => {
    setPasswordModal(false);
    setPendingDevice(null);
    startScanInternal();
  }, [startScanInternal]);

  const onPasswordConfirm = useCallback(
    (pwd: string) => {
      if (!pendingDevice) {
        return;
      }
      if (pwd.length !== 8) {
        showToast('The password should be 8 characters.');
        return;
      }
      setPasswordModal(false);
      finishConnect(pendingDevice, pwd);
      setPendingDevice(null);
    },
    [finishConnect, pendingDevice],
  );

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <ScreenLoadingOverlay visible={connecting} text="Connecting..." />
      <StatusBar
        barStyle="light-content"
        backgroundColor={NAVBAR_COLOR}
        translucent={false}
      />
      <View style={[styles.headerWrap, {paddingTop: insets.top}]}>
        <View style={styles.navBar}>
          <Text style={styles.navTitle}>DEVICE({deviceCount})</Text>
          <Pressable
            style={styles.aboutBtn}
            onPress={() => navigation.navigate('About')}
            hitSlop={12}>
            <Image
              source={require('../../assets/images/mp_scanRightAboutIcon.png')}
              style={styles.aboutIcon}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.toolbar}>
        <SearchButton
          searchKey={searchKey}
          searchRssi={searchRssi}
          minRssi={MIN_RSSI}
          onPress={() => setFilterModal(true)}
          onClear={clearFilter}
        />
        <Pressable style={styles.refreshBtn} onPress={toggleScan}>
          <Animated.Image
            source={require('../../assets/images/mp_scan_refreshIcon.png')}
            style={[styles.refreshIcon, {transform: [{rotate: spin}]}]}
          />
        </Pressable>
      </View>

      <FlatList
        style={styles.list}
        data={devices}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ScanDeviceCell item={item} onConnect={() => onConnectPress(item)} />
        )}
        getItemLayout={(_, index) => ({
          length: SCAN_ROW_HEIGHT,
          offset: SCAN_ROW_HEIGHT * index,
          index,
        })}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {scanning ? 'Scanning for LW005-MP devices…' : 'No devices found'}
          </Text>
        }
      />

      <SearchConditionsModal
        visible={filterModal}
        searchKey={searchKey}
        searchRssi={searchRssi}
        minRssi={MIN_RSSI}
        onDismiss={() => setFilterModal(false)}
        onDone={(key, rssi) => {
          setFilterModal(false);
          applyFilterAndRefresh(key, rssi);
        }}
      />

      <PasswordModal
        visible={passwordModal}
        initialPassword={savedPassword}
        onCancel={onPasswordCancel}
        onConfirm={onPasswordConfirm}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EDF3FA'},
  headerWrap: {backgroundColor: NAVBAR_COLOR},
  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVBAR_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {elevation: 2},
    }),
  },
  navTitle: {fontSize: 17, fontWeight: '600', color: NAVBAR_TINT},
  aboutBtn: {position: 'absolute', right: 12},
  aboutIcon: {width: 24, height: 24},
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {width: 22, height: 22},
  list: {
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
  },
  empty: {textAlign: 'center', color: '#999', marginTop: 48, fontSize: 14},
});

export default ScanScreen;
