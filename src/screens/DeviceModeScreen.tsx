import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  apiErrorMessage,
  configWorkMode,
  readWorkMode,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import {
  DEVICE_MODE_OPTIONS,
  deviceModeFromPickerIndex,
  pickerIndexFromDeviceMode,
} from '../utils/deviceModeModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DeviceModeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [modeIndex, setModeIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const mode = await readWorkMode();
      if (!cancelled()) {
        setModeIndex(pickerIndexFromDeviceMode(mode));
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

  const saveMode = async (index: number) => {
    setConfiguring(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        readData(() => false);
        return;
      }
      await configWorkMode(deviceModeFromPickerIndex(index));
      setModeIndex(index);
    } catch (e) {
      showToast(apiErrorMessage(e));
      readData(() => false);
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <StackScreenLayout
      title="Device Mode"
      onBack={() => navigation.goBack()}
      loading={loading || configuring}
      saving={configuring}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <PickerButtonCell
          label="Device Mode"
          value={DEVICE_MODE_OPTIONS[modeIndex]}
          onPress={() => setPickerOpen(true)}
        />
        <SectionSpacer />
        <NormalTextCell
          label="Standby Mode"
          showArrow
          onPress={() => navigation.navigate('StandbyMode')}
        />
        <NormalTextCell
          label="Timing Mode"
          showArrow
          onPress={() => navigation.navigate('TimingMode')}
        />
        <NormalTextCell
          label="Periodic Mode"
          showArrow
          onPress={() => navigation.navigate('PeriodicMode')}
        />
        <NormalTextCell
          label="Motion Mode"
          showArrow
          onPress={() => navigation.navigate('MotionMode')}
        />
        <NormalTextCell
          label="Time-Segmented Mode"
          showArrow
          onPress={() => navigation.navigate('TimeSegmentedMode')}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {pickerOpen ? (
        <OptionPickerModal
          visible
          title="Device Mode"
          options={[...DEVICE_MODE_OPTIONS]}
          selectedIndex={modeIndex}
          onSelect={index => {
            setPickerOpen(false);
            saveMode(index);
          }}
          onDismiss={() => setPickerOpen(false)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({scroll: {flex: 1}, bottom: {height: 24}});

export default DeviceModeScreen;
