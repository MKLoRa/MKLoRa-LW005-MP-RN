import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import ExitAlarmTypeCell from '../components/cells/ExitAlarmTypeCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {configAlarmFunction, readAlarmFunction} from '../utils/auxiliaryApi';
import {apiErrorMessage} from '../utils/mpApi';
import {
  ALARM_TYPE_OPTIONS,
  type AlarmFunctionState,
  SAVE_VALIDATION_MSG_AUXILIARY,
} from '../utils/auxiliaryModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_STATE: AlarmFunctionState = {
  alarmType: 0,
  exitTime: '5',
};

const AlarmFunctionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<AlarmFunctionState>(DEFAULT_STATE);
  const [typePicker, setTypePicker] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readAlarmFunction();
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
      await configAlarmFunction(state);
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
      title="Alarm Function"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Alarm Type"
            value={ALARM_TYPE_OPTIONS[state.alarmType] ?? ALARM_TYPE_OPTIONS[0]}
            onPress={() => setTypePicker(true)}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <ExitAlarmTypeCell
            value={state.exitTime}
            onChangeText={t => setState(s => ({...s, exitTime: t}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Alert Alarm Settings"
            showArrow
            onPress={() => navigation.navigate('AlertAlarmSettings')}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="SOS Alarm Settings"
            showArrow
            onPress={() => navigation.navigate('SosAlarmSettings')}
          />
        </View>
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {typePicker ? (
        <OptionPickerModal
          visible
          title="Alarm Type"
          options={[...ALARM_TYPE_OPTIONS]}
          selectedIndex={state.alarmType}
          onSelect={index => {
            setTypePicker(false);
            setState(s => ({...s, alarmType: index}));
          }}
          onDismiss={() => setTypePicker(false)}
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

export default AlarmFunctionScreen;
