import React, {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import type {IndicatorSettings} from '../sdk/MPSDKDataAdopter';
import {
  configIndicatorSettings,
  readIndicatorSettings,
} from '../utils/indicatorSettingsApi';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT: IndicatorSettings = {
  DeviceState: false,
  LowPower: false,
  Broadcast: false,
  NetworkCheck: false,
  InFix: false,
  FixSuccessful: false,
  FailToFix: false,
};

const IndicatorSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<IndicatorSettings>(DEFAULT);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readIndicatorSettings();
      if (!cancelled()) {
        setState(data);
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

  const onSave = async () => {
    setSaving(true);
    try {
      await configIndicatorSettings(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const patch = (patchState: Partial<IndicatorSettings>) =>
    setState(s => ({...s, ...patchState}));

  return (
    <StackScreenLayout
      title="Indicator Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Device State"
            value={state.DeviceState}
            onValueChange={v => patch({DeviceState: v})}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Low-power"
            value={state.LowPower}
            onValueChange={v => patch({LowPower: v})}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Bluetooth Broadcast"
            value={state.Broadcast}
            onValueChange={v => patch({Broadcast: v})}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Network Check"
            value={state.NetworkCheck}
            onValueChange={v => patch({NetworkCheck: v})}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="In Fix"
            value={state.InFix}
            onValueChange={v => patch({InFix: v})}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Fix Successful"
            value={state.FixSuccessful}
            onValueChange={v => patch({FixSuccessful: v})}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Fail To Fix"
            value={state.FailToFix}
            onValueChange={v => patch({FailToFix: v})}
          />
        </View>
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginLeft: 15,
  },
  bottom: {height: 24},
});

export default IndicatorSettingsScreen;
