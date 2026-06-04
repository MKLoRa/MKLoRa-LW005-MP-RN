import React, {useCallback, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {configAlertAlarm, readAlertAlarm} from '../utils/auxiliaryApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  ALERT_TRIGGER_MODE_OPTIONS,
  type AlertAlarmState,
} from '../utils/auxiliaryModel';
import {
  POSITIONING_STRATEGY_OPTIONS,
  positioningStrategyLabel,
} from '../utils/deviceModeModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: AlertAlarmState = {
  mode: 0,
  strategy: 0,
  notifyStart: false,
  notifyEnd: false,
};

const AlertAlarmSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<AlertAlarmState>(DEFAULT_STATE);
  const [modePicker, setModePicker] = useState(false);
  const [strategyPicker, setStrategyPicker] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readAlertAlarm();
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
      await configAlertAlarm(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title="Alert Alarm Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Trigger Mode"
            value={
              ALERT_TRIGGER_MODE_OPTIONS[state.mode] ??
              ALERT_TRIGGER_MODE_OPTIONS[0]
            }
            onPress={() => setModePicker(true)}
          />
          <View style={styles.line} />
          <PickerButtonCell
            label="Positioning Strategy"
            value={positioningStrategyLabel(state.strategy)}
            onPress={() => setStrategyPicker(true)}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Notify Event On Alert Start"
            value={state.notifyStart}
            onValueChange={v => setState(s => ({...s, notifyStart: v}))}
          />
          <View style={styles.line} />
          <TextSwitchCell
            label="Notify Event On Alert End"
            value={state.notifyEnd}
            onValueChange={v => setState(s => ({...s, notifyEnd: v}))}
          />
        </View>
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {modePicker ? (
        <OptionPickerModal
          visible
          title="Trigger Mode"
          options={[...ALERT_TRIGGER_MODE_OPTIONS]}
          selectedIndex={state.mode}
          onSelect={index => {
            setModePicker(false);
            setState(s => ({...s, mode: index}));
          }}
          onDismiss={() => setModePicker(false)}
        />
      ) : null}
      {strategyPicker ? (
        <OptionPickerModal
          visible
          title="Positioning Strategy"
          options={[...POSITIONING_STRATEGY_OPTIONS]}
          selectedIndex={state.strategy}
          onSelect={index => {
            setStrategyPicker(false);
            setState(s => ({...s, strategy: index}));
          }}
          onDismiss={() => setStrategyPicker(false)}
        />
      ) : null}
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

export default AlertAlarmSettingsScreen;
