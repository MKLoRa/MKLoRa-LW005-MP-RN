import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextFieldCell from '../components/cells/TextFieldCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  configTamperAlarm,
  readTamperAlarm,
  type TamperAlarmState,
  validateTamperAlarm,
} from '../utils/auxiliaryApi';
import {SAVE_VALIDATION_MSG_AUXILIARY} from '../utils/auxiliaryModel';
import {apiErrorMessage} from '../utils/mpApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: TamperAlarmState = {
  isOn: false,
  threshold: '10',
  reportInterval: '1',
};

const TamperAlarmScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<TamperAlarmState>(DEFAULT_STATE);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readTamperAlarm();
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
      await configTamperAlarm(state);
      showToast('Success');
    } catch (e) {
      const msg = apiErrorMessage(e);
      if (msg === SAVE_VALIDATION_MSG_AUXILIARY || !validateTamperAlarm(state)) {
        Alert.alert('Error', SAVE_VALIDATION_MSG_AUXILIARY);
      } else {
        showToast(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenLayout
      title="Tamper Alarm Function"
      loading={loading || saving}
      showSave
      onSave={onSave}
      onBack={() => navigation.goBack()}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Function Switch"
            value={state.isOn}
            onValueChange={isOn => setState(prev => ({...prev, isOn}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Light Threshold"
            value={state.threshold}
            placeholder="10~200"
            unit="lux"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={threshold => setState(prev => ({...prev, threshold}))}
          />
          <View style={styles.line} />
          <TextFieldCell
            label="Tamper Alarm Report Interval"
            value={state.reportInterval}
            placeholder="1~14400"
            unit="Mins"
            maxLength={5}
            inputFilter="decimal"
            onChangeText={reportInterval =>
              setState(prev => ({...prev, reportInterval}))
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

export default TamperAlarmScreen;
