import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {configSosAlarm, readSosAlarm} from '../utils/auxiliaryApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  SOS_TRIGGER_MODE_OPTIONS,
  type SosAlarmState,
  SAVE_VALIDATION_MSG_AUXILIARY,
} from '../utils/auxiliaryModel';
import {
  POSITIONING_STRATEGY_OPTIONS,
  positioningStrategyLabel,
} from '../utils/deviceModeModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: SosAlarmState = {
  mode: 0,
  strategy: 0,
  reportInterval: '10',
  notifyStart: false,
  notifyEnd: false,
};

const SosAlarmSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<SosAlarmState>(DEFAULT_STATE);
  const [modePicker, setModePicker] = useState(false);
  const [strategyPicker, setStrategyPicker] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readSosAlarm();
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
      await configSosAlarm(state);
      showToast('Success');
    } catch (e) {
      const msg = apiErrorMessage(e);
      if (msg === SAVE_VALIDATION_MSG_AUXILIARY) {
        Alert.alert('Error', msg);
      } else {
        showToast(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title="SOS Alarm Settings"
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
              SOS_TRIGGER_MODE_OPTIONS[state.mode] ??
              SOS_TRIGGER_MODE_OPTIONS[0]
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
          <TextFieldCell
            label="Report Interval"
            value={state.reportInterval}
            placeholder="10~600"
            unit="s"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, reportInterval: t}))}
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
          options={[...SOS_TRIGGER_MODE_OPTIONS]}
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

export default SosAlarmSettingsScreen;
