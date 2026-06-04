import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {configVibration, readVibration} from '../utils/auxiliaryApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  type VibrationState,
  SAVE_VALIDATION_MSG_AUXILIARY,
} from '../utils/auxiliaryModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: VibrationState = {
  isOn: false,
  thresholds: '10',
  reportInterval: '3',
  shockTimeout: '1',
};

const VibrationScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<VibrationState>(DEFAULT_STATE);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readVibration();
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
      await configVibration(state);
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
      title="Shock Detection"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Shock Detection"
            value={state.isOn}
            onValueChange={v => setState(s => ({...s, isOn: v}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Report Interval"
            value={state.reportInterval}
            placeholder="3~255"
            unit="s"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, reportInterval: t}))}
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Shock Timeout"
            value={state.shockTimeout}
            placeholder="1~20"
            unit="s"
            maxLength={2}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, shockTimeout: t}))}
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Shock Thresholds"
            value={state.thresholds}
            placeholder="10~255"
            unit="x10mg"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, thresholds: t}))}
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

export default VibrationScreen;
