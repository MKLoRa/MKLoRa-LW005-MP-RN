import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, Text, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  apiErrorMessage,
  configMotionMode,
  readMotionMode,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import {
  DEFAULT_MOTION_MODE,
  POSITIONING_STRATEGY_IN_TRIP_OPTIONS,
  POSITIONING_STRATEGY_OPTIONS,
  positioningStrategyInTripLabel,
  positioningStrategyLabel,
  type MotionModeState,
} from '../utils/deviceModeModel';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PickerState = {
  title: string;
  options: readonly string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
};

const MotionModeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<MotionModeState>(DEFAULT_MOTION_MODE);
  const [picker, setPicker] = useState<PickerState | null>(null);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readMotionMode();
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
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await configMotionMode(state);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const SectionTitle: React.FC<{title: string}> = ({title}) => (
    <Text style={styles.section}>{title}</Text>
  );

  return (
    <StackScreenLayout
      title="Motion Mode"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <SectionTitle title="On Start" />
        <TextSwitchCell
          label="Fix On Start"
          value={state.fixOnStart}
          onValueChange={v => setState(s => ({...s, fixOnStart: v}))}
        />
        <TextFieldCell
          label="Number Of Fix On Start"
          value={state.numberOfFixOnStart}
          placeholder="1~10"
          keyboardType="number-pad"
          onChangeText={t => setState(s => ({...s, numberOfFixOnStart: t}))}
        />
        <PickerButtonCell
          label="Pos-Strategy On Start"
          value={positioningStrategyLabel(state.posStrategyOnStart)}
          onPress={() =>
            setPicker({
              title: 'Pos-Strategy On Start',
              options: POSITIONING_STRATEGY_OPTIONS,
              selectedIndex: state.posStrategyOnStart,
              onSelect: i => setState(s => ({...s, posStrategyOnStart: i})),
            })
          }
        />
        <SectionTitle title="In Trip" />
        <TextSwitchCell
          label="Fix In Trip"
          value={state.fixInTrip}
          onValueChange={v => setState(s => ({...s, fixInTrip: v}))}
        />
        <TextFieldCell
          label="Report Interval In Trip"
          value={state.reportIntervalInTrip}
          placeholder="10~86400"
          unit="s"
          keyboardType="number-pad"
          onChangeText={t => setState(s => ({...s, reportIntervalInTrip: t}))}
        />
        <PickerButtonCell
          label="Pos-Strategy In Trip"
          value={positioningStrategyInTripLabel(state.posStrategyInTrip)}
          onPress={() =>
            setPicker({
              title: 'Pos-Strategy In Trip',
              options: POSITIONING_STRATEGY_IN_TRIP_OPTIONS,
              selectedIndex: state.posStrategyInTrip,
              onSelect: i => setState(s => ({...s, posStrategyInTrip: i})),
            })
          }
        />
        <SectionTitle title="On End" />
        <TextSwitchCell
          label="Fix On End"
          value={state.fixOnEnd}
          onValueChange={v => setState(s => ({...s, fixOnEnd: v}))}
        />
        <TextFieldCell
          label="Trip End Timeout"
          value={state.tripEndTimeout}
          placeholder="1~180"
          unit="x10s"
          keyboardType="number-pad"
          onChangeText={t => setState(s => ({...s, tripEndTimeout: t}))}
        />
        <TextFieldCell
          label="Number Of Fix On End"
          value={state.numberOfFixOnEnd}
          placeholder="1~10"
          keyboardType="number-pad"
          onChangeText={t => setState(s => ({...s, numberOfFixOnEnd: t}))}
        />
        <TextFieldCell
          label="Report Interval On End"
          value={state.reportIntervalOnEnd}
          placeholder="10~300"
          unit="s"
          keyboardType="number-pad"
          onChangeText={t => setState(s => ({...s, reportIntervalOnEnd: t}))}
        />
        <PickerButtonCell
          label="Pos-Strategy On End"
          value={positioningStrategyLabel(state.posStrategyOnEnd)}
          onPress={() =>
            setPicker({
              title: 'Pos-Strategy On End',
              options: POSITIONING_STRATEGY_OPTIONS,
              selectedIndex: state.posStrategyOnEnd,
              onSelect: i => setState(s => ({...s, posStrategyOnEnd: i})),
            })
          }
        />
        <SectionTitle title="Stationary" />
        <TextSwitchCell
          label="Fix On Stationary State"
          value={state.fixOnStationary}
          onValueChange={v => setState(s => ({...s, fixOnStationary: v}))}
        />
        <TextFieldCell
          label="Report Interval On Stationary"
          value={state.reportIntervalOnStationary}
          placeholder="1~14400"
          unit="Mins"
          keyboardType="number-pad"
          onChangeText={t =>
            setState(s => ({...s, reportIntervalOnStationary: t}))
          }
        />
        <PickerButtonCell
          label="Pos-Strategy On Stationary"
          value={positioningStrategyLabel(state.posStrategyOnStationary)}
          onPress={() =>
            setPicker({
              title: 'Pos-Strategy On Stationary',
              options: POSITIONING_STRATEGY_OPTIONS,
              selectedIndex: state.posStrategyOnStationary,
              onSelect: i =>
                setState(s => ({...s, posStrategyOnStationary: i})),
            })
          }
        />
        <SectionTitle title="Notify Events" />
        <TextSwitchCell
          label="Notify Event On Start"
          value={state.notifyEventOnStart}
          onValueChange={v => setState(s => ({...s, notifyEventOnStart: v}))}
        />
        <TextSwitchCell
          label="Notify Event In Trip"
          value={state.notifyEventInTrip}
          onValueChange={v => setState(s => ({...s, notifyEventInTrip: v}))}
        />
        <TextSwitchCell
          label="Notify Event On End"
          value={state.notifyEventOnEnd}
          onValueChange={v => setState(s => ({...s, notifyEventOnEnd: v}))}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {picker ? (
        <OptionPickerModal
          visible
          title={picker.title}
          options={[...picker.options]}
          selectedIndex={picker.selectedIndex}
          onSelect={i => {
            picker.onSelect(i);
            setPicker(null);
          }}
          onDismiss={() => setPicker(null)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  section: {
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  bottom: {height: 24},
});

export default MotionModeScreen;
