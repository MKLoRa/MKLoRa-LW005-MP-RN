import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TabScreenLayout from '../components/TabScreenLayout';
import NormalTextCell from '../components/cells/NormalTextCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {useTabBackToScan} from '../hooks/useTabBackToScan';
import {TIME_ZONE_LIST} from '../constants/timeZones';
import {
  configDeviceTimeZone,
  factoryResetDevice,
  readDeviceSettings,
} from '../utils/deviceSettingsApi';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** 对齐 MKMPDeviceSettingController：时区、设备信息、恢复出厂 */
const DeviceSettingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const onBack = useTabBackToScan();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyText, setBusyText] = useState('Reading...');
  const [timeZone, setTimeZone] = useState(24);
  const [timezonePicker, setTimezonePicker] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readDeviceSettings();
      if (!cancelled()) {
        setTimeZone(data.timeZoneIndex);
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

  const onTimeZoneSelect = async (index: number) => {
    setTimeZone(index);
    setTimezonePicker(false);
    setBusyText('Config...');
    setSaving(true);
    try {
      await configDeviceTimeZone(index);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
      readData(() => false);
    } finally {
      setSaving(false);
      setBusyText('Reading...');
    }
  };

  const factoryReset = () => {
    Alert.alert(
      'Factory Reset',
      'After factory reset,all the data will be reseted to the factory values.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'OK',
          onPress: async () => {
            setBusyText('Setting...');
            setSaving(true);
            try {
              await factoryResetDevice();
              showToast(
                'Factory reset successfully!Please reconnect the device.',
              );
            } catch (e) {
              showToast(apiErrorMessage(e));
            } finally {
              setSaving(false);
              setBusyText('Reading...');
            }
          },
        },
      ],
    );
  };

  return (
    <TabScreenLayout
      title="Device Settings"
      onBack={onBack}
      loading={loading}
      saving={saving}
      loadingText={busyText}
      backgroundColor="#F2F2F2">
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Current Time Zone"
            value={TIME_ZONE_LIST[timeZone] ?? TIME_ZONE_LIST[24]}
            onPress={() => setTimezonePicker(true)}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Device Information"
            showArrow
            onPress={() => navigation.navigate('DeviceInfo')}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Factory Reset"
            showArrow
            onPress={factoryReset}
          />
        </View>
      </KeyboardFormScrollView>

      <OptionPickerModal
        visible={timezonePicker}
        title="Current Time Zone"
        options={TIME_ZONE_LIST}
        selectedIndex={timeZone}
        onSelect={onTimeZoneSelect}
        onDismiss={() => setTimezonePicker(false)}
      />
    </TabScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default DeviceSettingScreen;
