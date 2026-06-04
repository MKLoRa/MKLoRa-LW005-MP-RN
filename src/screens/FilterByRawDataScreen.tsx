import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import NormalTextCell from '../components/cells/NormalTextCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  apiErrorMessage,
  configBxpAccFilter,
  configBxpDeviceInfoFilter,
  configBxpThFilter,
  readFilterTypeStatus,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import type {FilterTypeStatus} from '../utils/filterRawDataModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATUS: FilterTypeStatus = {
  other: false,
  iBeacon: false,
  uid: false,
  url: false,
  tlm: false,
  bxp_acc: false,
  bxp_th: false,
  bxp_ts: false,
  bxp_deviceInfo: false,
  bxp_button: false,
  bxp_pir: false,
  bxp_tof: false,
  bxp_beacon: false,
};

const FilterByRawDataScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [status, setStatus] = useState<FilterTypeStatus>(DEFAULT_STATUS);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readFilterTypeStatus();
      if (!cancelled()) {
        setStatus(data);
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

  const busy = loading || configuring;
  const onOff = (v: boolean) => (v ? 'ON' : 'OFF');

  const configSwitch = async (
    fn: (on: boolean) => Promise<void>,
    key: keyof FilterTypeStatus,
    on: boolean,
    errMsg: string,
  ) => {
    setConfiguring(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await fn(on);
      setStatus(s => ({...s, [key]: on}));
    } catch (e) {
      showToast(apiErrorMessage(e) || errMsg);
      readData(() => false);
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <StackScreenLayout title="Filter by Raw Data" onBack={() => navigation.goBack()} loading={busy}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <NormalTextCell
          label="iBeacon"
          value={onOff(status.iBeacon)}
          showArrow
          onPress={() => navigation.navigate('FilterByBeacon', {variant: 'beacon'})}
        />
        <NormalTextCell
          label="Eddystone-UID"
          value={onOff(status.uid)}
          showArrow
          onPress={() => navigation.navigate('FilterByUID')}
        />
        <NormalTextCell
          label="Eddystone-URL"
          value={onOff(status.url)}
          showArrow
          onPress={() => navigation.navigate('FilterByURL')}
        />
        <NormalTextCell
          label="Eddystone-TLM"
          value={onOff(status.tlm)}
          showArrow
          onPress={() => navigation.navigate('FilterByTLM')}
        />
        <NormalTextCell
          label="BXP-iBeacon"
          value={onOff(status.bxp_beacon)}
          showArrow
          onPress={() => navigation.navigate('FilterByBeacon', {variant: 'bxp'})}
        />
        <SectionSpacer />
        <TextSwitchCell
          label="BXP - Device Info"
          value={status.bxp_deviceInfo}
          onValueChange={v =>
            configSwitch(configBxpDeviceInfoFilter, 'bxp_deviceInfo', v, 'Config BXP Device Info Error')
          }
        />
        <TextSwitchCell
          label="BXP - ACC"
          value={status.bxp_acc}
          onValueChange={v =>
            configSwitch(configBxpAccFilter, 'bxp_acc', v, 'Config BXP ACC Error')
          }
        />
        <TextSwitchCell
          label="BXP - T&H"
          value={status.bxp_th}
          onValueChange={v =>
            configSwitch(configBxpThFilter, 'bxp_th', v, 'Config BXP T&H Error')
          }
        />
        <SectionSpacer />
        <NormalTextCell
          label="BXP - Button"
          value={onOff(status.bxp_button)}
          showArrow
          onPress={() => navigation.navigate('FilterByBXPButton')}
        />
        <NormalTextCell
          label="BXP - T&S"
          value={onOff(status.bxp_ts)}
          showArrow
          onPress={() => navigation.navigate('FilterByBXPTag')}
        />
        <NormalTextCell
          label="MK - PIR"
          value={onOff(status.bxp_pir)}
          showArrow
          onPress={() => navigation.navigate('FilterByPir')}
        />
        <NormalTextCell
          label="BXP-TOF"
          value={onOff(status.bxp_tof)}
          showArrow
          onPress={() => navigation.navigate('FilterByTof')}
        />
        <NormalTextCell
          label="Other"
          value={onOff(status.other)}
          showArrow
          onPress={() => navigation.navigate('FilterByOther')}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  bottom: {height: 24},
});

export default FilterByRawDataScreen;
