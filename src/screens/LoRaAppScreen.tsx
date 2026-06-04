import React, {useCallback, useRef, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import TextFieldCell from '../components/cells/TextFieldCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  mpRead,
  mpConfig,
  apiErrorMessage,
  waitForBleReady,
  waitForBleIdle,
} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LoRaAppScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [timeSyncInterval, setTimeSyncInterval] = useState('');
  const [networkInterval, setNetworkInterval] = useState('');
  const timeRef = useRef('');
  const networkRef = useRef('');
  timeRef.current = timeSyncInterval;
  networkRef.current = networkInterval;

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setDataReady(false);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      await waitForBleIdle();
      const timeRes = await mpRead.lorawanDevTimeSyncInterval();
      const netRes = await mpRead.lorawanNetworkCheckInterval();
      if (!cancelled()) {
        const time =
          timeRes.interval != null ? String(timeRes.interval) : '';
        const net = netRes.interval != null ? String(netRes.interval) : '';
        setTimeSyncInterval(time);
        setNetworkInterval(net);
        timeRef.current = time;
        networkRef.current = net;
        setDataReady(true);
      }
    } catch (e) {
      if (!cancelled()) {
        showToast(apiErrorMessage(e));
      }
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      readData(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [readData]),
  );

  const saveData = async () => {
    if (loading || !dataReady) {
      showToast('Reading device settings, please wait...');
      return;
    }
    const t = parseInt(timeRef.current, 10);
    const n = parseInt(networkRef.current, 10);
    if (
      !timeRef.current ||
      Number.isNaN(t) ||
      t < 0 ||
      t > 255 ||
      !networkRef.current ||
      Number.isNaN(n) ||
      n < 0 ||
      n > 255
    ) {
      Alert.alert(
        'Error',
        'Opps！Save failed. Please check the input characters and try again.',
      );
      return;
    }
    setSaving(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await waitForBleIdle();
      await mpConfig.lorawanDevTimeSyncInterval(t);
      await mpConfig.lorawanNetworkCheckInterval(n);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const busy = loading || saving;

  return (
    <StackScreenLayout
      title="Application Settings"
      onBack={() => navigation.goBack()}
      onSave={saveData}
      saveDisabled={!dataReady || busy}
      loading={busy}
      loadingText={saving ? 'Config...' : 'Reading...'}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Time Sync Interval"
            value={timeSyncInterval}
            placeholder="0~255"
            unit="H"
            maxLength={3}
            keyboardType="number-pad"
            onChangeText={setTimeSyncInterval}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Network Check Interval"
            value={networkInterval}
            placeholder="0~255"
            unit="H"
            maxLength={3}
            keyboardType="number-pad"
            onChangeText={setNetworkInterval}
          />
        </View>
      </KeyboardFormScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default LoRaAppScreen;
