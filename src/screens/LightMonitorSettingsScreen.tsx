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
import {configLightMonitor, readLightMonitor} from '../utils/auxiliaryApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  type LightMonitorState,
  SAVE_VALIDATION_MSG_AUXILIARY,
} from '../utils/auxiliaryModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: LightMonitorState = {
  isOn: false,
  sampleRate: '1',
  intensity: '',
  alarmSwitch: false,
  lightThreshold: '10',
};

const LightMonitorSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<LightMonitorState>(DEFAULT_STATE);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readLightMonitor();
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
      await configLightMonitor(state);
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

  const intensityDisplay =
    state.isOn && state.intensity ? `${state.intensity} lux` : '';

  return (
    <StackScreenLayout
      title="Lighting Monitor Settings"
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
          <NormalTextCell
            label="illumination intensity:"
            value={intensityDisplay}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Light Threshold Alarm Swicth"
            value={state.alarmSwitch}
            onValueChange={v => setState(s => ({...s, alarmSwitch: v}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Light Threshold"
            value={state.lightThreshold}
            placeholder="10~200"
            unit="lux"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, lightThreshold: t}))}
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
  bottom: {height: 24},
});

export default LightMonitorSettingsScreen;
