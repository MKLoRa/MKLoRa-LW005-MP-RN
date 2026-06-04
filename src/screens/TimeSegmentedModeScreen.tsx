import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import TimeSegmentedAddSection from '../components/TimeSegmentedAddSection';
import TimeSegmentedPeriodRow from '../components/TimeSegmentedPeriodRow';
import SwipeDeleteRow from '../components/SwipeDeleteRow';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  apiErrorMessage,
  configTimeSegmentedMode,
  readTimeSegmentedMode,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import {
  HOUR_OPTIONS_SEGMENTED,
  MINUTE_OPTIONS,
  POSITIONING_STRATEGY_IN_TRIP_OPTIONS,
  positioningStrategyInTripLabel,
  validateTimeSegmentedSave,
  type TimeSegmentedPeriod,
} from '../utils/deviceModeModel';
import {PositioningStrategy} from '../sdk/MPSDKDefines';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TimePicker = {
  periodIndex: number;
  field: 'startHour' | 'startMinuteGear' | 'endHour' | 'endMinuteGear';
};

const emptyPeriod = (): TimeSegmentedPeriod => ({
  startHour: 0,
  startMinuteGear: 0,
  endHour: 0,
  endMinuteGear: 0,
  interval: '600',
});

const PICKER_TITLES: Record<TimePicker['field'], string> = {
  startHour: 'Start Hour',
  startMinuteGear: 'Start Minute',
  endHour: 'End Hour',
  endMinuteGear: 'End Minute',
};

const TimeSegmentedModeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategy, setStrategy] = useState(0);
  const [periods, setPeriods] = useState<TimeSegmentedPeriod[]>([]);
  const [strategyPicker, setStrategyPicker] = useState(false);
  const [timePicker, setTimePicker] = useState<TimePicker | null>(null);
  /** 当前露出删除按钮的时段行，同时最多一个（对齐 iOS cellCanSelected / shouldSetFrame） */
  const [openSwipeIndex, setOpenSwipeIndex] = useState<number | null>(null);

  const closeSwipe = useCallback(() => {
    setOpenSwipeIndex(null);
  }, []);

  /**
   * 对齐 iOS cellCanSelected：若已有删除按钮露出，先收起并拦截本次操作。
   */
  const guardCellInteraction = useCallback(
    (action: () => void) => {
      if (openSwipeIndex !== null) {
        setOpenSwipeIndex(null);
        return;
      }
      action();
    },
    [openSwipeIndex],
  );

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readTimeSegmentedMode();
      if (!cancelled()) {
        setStrategy(data.strategy);
        setPeriods(data.periods);
        setOpenSwipeIndex(null);
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
    const err = validateTimeSegmentedSave(periods);
    if (err) {
      showToast(err);
      return;
    }
    setSaving(true);
    try {
      if (!(await waitForBleReady())) {
        showToast('The current connection device is in disconnect');
        return;
      }
      await configTimeSegmentedMode(strategy as PositioningStrategy, periods);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addPeriod = () => {
    if (periods.length >= 3) {
      showToast('You can set up to 3 time points!');
      return;
    }
    closeSwipe();
    setPeriods(p => [...p, emptyPeriod()]);
  };

  const removePeriod = (index: number) => {
    closeSwipe();
    setPeriods(p => p.filter((_, i) => i !== index));
  };

  const updatePeriod = (
    index: number,
    patch: Partial<TimeSegmentedPeriod>,
  ) => {
    setPeriods(prev => {
      const next = [...prev];
      const row = {...next[index], ...patch};
      if (patch.startHour === 24) {
        row.startMinuteGear = 0;
      }
      if (patch.endHour === 24) {
        row.endMinuteGear = 0;
      }
      next[index] = row;
      return next;
    });
  };

  const pickerOptions = timePicker?.field.includes('Hour')
    ? HOUR_OPTIONS_SEGMENTED
    : MINUTE_OPTIONS;

  const pickerSelected =
    timePicker == null
      ? 0
      : (periods[timePicker.periodIndex]?.[timePicker.field] as number) ?? 0;

  return (
    <StackScreenLayout
      title="Time-Segmented Mode"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <PickerButtonCell
          label="Positioning Strategy"
          value={positioningStrategyInTripLabel(strategy)}
          onPress={() =>
            guardCellInteraction(() => setStrategyPicker(true))
          }
        />
        <TimeSegmentedAddSection
          onAdd={() => guardCellInteraction(addPeriod)}
        />
        {periods.map((p, i) => (
          <SwipeDeleteRow
            key={`period-${i}`}
            open={openSwipeIndex === i}
            onSwipeWillOpen={closeSwipe}
            onOpen={() => setOpenSwipeIndex(i)}
            onClose={closeSwipe}
            onDelete={() => removePeriod(i)}>
            <TimeSegmentedPeriodRow
              index={i}
              startHourLabel={HOUR_OPTIONS_SEGMENTED[p.startHour] ?? '00'}
              startMinuteLabel={MINUTE_OPTIONS[p.startMinuteGear] ?? '00'}
              endHourLabel={HOUR_OPTIONS_SEGMENTED[p.endHour] ?? '00'}
              endMinuteLabel={MINUTE_OPTIONS[p.endMinuteGear] ?? '00'}
              startMinuteEnabled={p.startHour !== 24}
              endMinuteEnabled={p.endHour !== 24}
              interval={p.interval}
              onPickStartHour={() =>
                guardCellInteraction(() =>
                  setTimePicker({periodIndex: i, field: 'startHour'}),
                )
              }
              onPickStartMinute={() =>
                guardCellInteraction(() =>
                  setTimePicker({periodIndex: i, field: 'startMinuteGear'}),
                )
              }
              onPickEndHour={() =>
                guardCellInteraction(() =>
                  setTimePicker({periodIndex: i, field: 'endHour'}),
                )
              }
              onPickEndMinute={() =>
                guardCellInteraction(() =>
                  setTimePicker({periodIndex: i, field: 'endMinuteGear'}),
                )
              }
              onIntervalChange={t => updatePeriod(i, {interval: t})}
              onIntervalFocus={() => {
                if (openSwipeIndex !== null) {
                  setOpenSwipeIndex(null);
                  return false;
                }
              }}
              onCellTap={closeSwipe}
            />
          </SwipeDeleteRow>
        ))}
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {strategyPicker ? (
        <OptionPickerModal
          visible
          title="Positioning Strategy"
          options={[...POSITIONING_STRATEGY_IN_TRIP_OPTIONS]}
          selectedIndex={strategy}
          onSelect={idx => {
            setStrategy(idx);
            setStrategyPicker(false);
          }}
          onDismiss={() => setStrategyPicker(false)}
        />
      ) : null}
      {timePicker ? (
        <OptionPickerModal
          visible
          title={PICKER_TITLES[timePicker.field]}
          options={[...pickerOptions]}
          selectedIndex={pickerSelected}
          onSelect={idx => {
            updatePeriod(timePicker.periodIndex, {[timePicker.field]: idx});
            setTimePicker(null);
          }}
          onDismiss={() => setTimePicker(null)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  bottom: {height: 24},
});

export default TimeSegmentedModeScreen;
