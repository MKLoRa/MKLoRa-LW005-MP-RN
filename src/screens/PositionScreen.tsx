import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TabScreenLayout from '../components/TabScreenLayout';
import NormalTextCell from '../components/cells/NormalTextCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {useTabBackToScan} from '../hooks/useTabBackToScan';
import {mpRead, mpConfig, apiErrorMessage, waitForBleReady} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OFFLINE_FIX_NOTE =
  '* Whether to enable positioning when the device fails to connect to the Lorawan network';

const PositionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const onBack = useTabBackToScan();
  const [loading, setLoading] = useState(true);
  const [offlineFix, setOfflineFix] = useState(false);
  const [gpsExtremeMode, setGpsExtremeMode] = useState(false);
  const [bleFix, setBleFix] = useState(false);
  const [saving, setSaving] = useState(false);

  const readData = useCallback(async () => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      const offlineRes = await mpRead.offlineFixStatus();
      const gpsRes = await mpRead.gpsLimitUploadStatus();
      const bleRes = await mpRead.beaconVoltageReportInBleFix();
      setOfflineFix(Boolean(offlineRes.isOn));
      setGpsExtremeMode(Boolean(gpsRes.isOn));
      setBleFix(Boolean(bleRes.isOn));
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      readData();
    }, [readData]),
  );

  const saveOfflineFix = async (isOn: boolean) => {
    setSaving(true);
    try {
      await mpConfig.offlineFix(isOn);
      setOfflineFix(isOn);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
      readData();
    } finally {
      setSaving(false);
    }
  };

  const saveGpsExtreme = async (isOn: boolean) => {
    setSaving(true);
    try {
      await mpConfig.gpsLimitUploadStatus(isOn);
      setGpsExtremeMode(isOn);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
      readData();
    } finally {
      setSaving(false);
    }
  };

  const saveBleFix = async (isOn: boolean) => {
    setSaving(true);
    try {
      await mpConfig.beaconVoltageReportInBleFixStatus(isOn);
      setBleFix(isOn);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
      readData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <TabScreenLayout title="Positioning Strategy" onBack={onBack} loading={loading}>
      <ScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Bluetooth Fix"
            showArrow
            onPress={() => navigation.navigate('BleFix')}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="GPS Fix"
            showArrow
            onPress={() => navigation.navigate('LCGpsFix')}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Offline Fix"
            note={OFFLINE_FIX_NOTE}
            value={offlineFix}
            disabled={saving}
            onValueChange={saveOfflineFix}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="BLE&GPS"
            showArrow
            onPress={() => navigation.navigate('OutdoorFix')}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="GPS Extreme Mode"
            value={gpsExtremeMode}
            disabled={saving}
            onValueChange={saveGpsExtreme}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Beacon Voltage Report in Bluetooth Fix"
            value={bleFix}
            disabled={saving}
            onValueChange={saveBleFix}
          />
        </View>
      </ScrollView>
    </TabScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
    marginLeft: 15,
  },
});

export default PositionScreen;
