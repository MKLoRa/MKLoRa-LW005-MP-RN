import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {configAxisSettings, readAxisSettings} from '../utils/axisSettingApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  type AxisSettingState,
  SAVE_VALIDATION_MSG_AXIS,
} from '../utils/axisSettingModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: AxisSettingState = {
  wakeupThreshold: '1',
  wakeupDuration: '1',
  motionThreshold: '10',
  motionDuration: '1',
};

const AxisSettingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<AxisSettingState>(DEFAULT_STATE);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readAxisSettings();
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
      await configAxisSettings(state);
      showToast('Success');
    } catch (e) {
      const msg = apiErrorMessage(e);
      if (msg === SAVE_VALIDATION_MSG_AXIS) {
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
      title="3-Axis Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Wakeup Threshold"
            value={state.wakeupThreshold}
            placeholder="1~20"
            unit="x16mg"
            maxLength={2}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, wakeupThreshold: t}))}
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Wakeup Duration"
            value={state.wakeupDuration}
            placeholder="1~10"
            unit="x10ms"
            maxLength={2}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, wakeupDuration: t}))}
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Motion Threshold"
            value={state.motionThreshold}
            placeholder="10~250"
            unit="x2mg"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, motionThreshold: t}))}
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Motion  Duration"
            value={state.motionDuration}
            placeholder="1~50"
            unit="x5ms"
            maxLength={2}
            inputFilter="decimal"
            onChangeText={t => setState(s => ({...s, motionDuration: t}))}
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

export default AxisSettingScreen;
