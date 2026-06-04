import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {configTempMonitor, readTempMonitor} from '../utils/auxiliaryApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  type TempMonitorState,
  SAVE_VALIDATION_MSG_AUXILIARY,
  filterSignedInt,
} from '../utils/auxiliaryModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: TempMonitorState = {
  isOn: false,
  sampleRate: '1',
  temperature: '',
  alarmSwitch: false,
  maxThreshold: '60',
  minThreshold: '-20',
};

const TempMonitorSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<TempMonitorState>(DEFAULT_STATE);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readTempMonitor();
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
      await configTempMonitor(state);
      await readData(() => false);
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

  const tempDisplay =
    state.isOn && state.temperature
      ? `${state.temperature}℃`
      : '';

  return (
    <StackScreenLayout
      title="Temperature Monitor Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Function Switch"
            value={state.isOn}
            onValueChange={v => setState(s => ({...s, isOn: v}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Sample Rate"
            value={state.sampleRate}
            placeholder="1~3600"
            unit="S"
            maxLength={4}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, sampleRate: t}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell label="Temperature" value={tempDisplay} />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Temp Threshold Alarm Swicth"
            value={state.alarmSwitch}
            onValueChange={v => setState(s => ({...s, alarmSwitch: v}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Max."
            value={state.maxThreshold}
            placeholder="-20~60"
            unit="℃"
            maxLength={4}
            keyboardType="default"
            onChangeText={t =>
              setState(s => ({...s, maxThreshold: filterSignedInt(t, 4)}))
            }
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Min."
            value={state.minThreshold}
            placeholder="-20~60"
            unit="℃"
            maxLength={4}
            keyboardType="default"
            onChangeText={t =>
              setState(s => ({...s, minThreshold: filterSignedInt(t, 4)}))
            }
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

export default TempMonitorSettingsScreen;
