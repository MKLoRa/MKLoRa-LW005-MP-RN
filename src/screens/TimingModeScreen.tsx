import React, {useCallback, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import TimingTimePointRow from '../components/TimingTimePointRow';
import OptionPickerModal from '../components/OptionPickerModal';
import {
  apiErrorMessage,
  configTimingMode,
  readTimingMode,
  waitForBleReady,
} from '../utils/filterDeviceApi';
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  POSITIONING_STRATEGY_OPTIONS,
  positioningStrategyLabel,
  type TimingTimePoint,
} from '../utils/deviceModeModel';
import {PositioningStrategy} from '../sdk/MPSDKDefines';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type PointPicker = {
  pointIndex: number;
  field: 'hour' | 'minute';
};

const TimingModeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategy, setStrategy] = useState(0);
  const [points, setPoints] = useState<TimingTimePoint[]>([]);
  const [strategyPicker, setStrategyPicker] = useState(false);
  const [pointPicker, setPointPicker] = useState<PointPicker | null>(null);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      if (!(await waitForBleReady())) {
        if (!cancelled()) {
          showToast('The current connection device is in disconnect');
        }
        return;
      }
      const data = await readTimingMode();
      if (!cancelled()) {
        setStrategy(data.strategy);
        setPoints(data.points);
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
      await configTimingMode(strategy as PositioningStrategy, points);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addPoint = () => {
    if (points.length >= 10) {
      showToast('You can set up to 10 time points!');
      return;
    }
    setPoints(p => [...p, {hour: 0, minuteGear: 0}]);
  };

  const removePoint = (index: number) => {
    setPoints(p => p.filter((_, i) => i !== index));
  };

  const pickerOptions =
    pointPicker?.field === 'hour' ? HOUR_OPTIONS : MINUTE_OPTIONS;

  const pickerSelected =
    pointPicker == null
      ? 0
      : pointPicker.field === 'hour'
        ? points[pointPicker.pointIndex]?.hour ?? 0
        : points[pointPicker.pointIndex]?.minuteGear ?? 0;

  return (
    <StackScreenLayout
      title="Timing Mode"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading || saving}
      saving={saving}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <PickerButtonCell
          label="Positioning Strategy"
          value={positioningStrategyLabel(strategy)}
          onPress={() => setStrategyPicker(true)}
        />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reporting Time Point</Text>
          <Pressable style={styles.addBtn} onPress={addPoint}>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        </View>
        {points.map((pt, i) => (
          <TimingTimePointRow
            key={`tp-${i}`}
            label={`Time Point ${i + 1}`}
            hourLabel={HOUR_OPTIONS[pt.hour] ?? '00'}
            minuteLabel={MINUTE_OPTIONS[pt.minuteGear] ?? '00'}
            onPickHour={() => setPointPicker({pointIndex: i, field: 'hour'})}
            onPickMinute={() =>
              setPointPicker({pointIndex: i, field: 'minute'})
            }
            onDelete={() => removePoint(i)}
          />
        ))}
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
      {strategyPicker ? (
        <OptionPickerModal
          visible
          title="Positioning Strategy"
          options={[...POSITIONING_STRATEGY_OPTIONS]}
          selectedIndex={strategy}
          onSelect={i => {
            setStrategy(i);
            setStrategyPicker(false);
          }}
          onDismiss={() => setStrategyPicker(false)}
        />
      ) : null}
      {pointPicker ? (
        <OptionPickerModal
          visible
          title={pointPicker.field === 'hour' ? 'Hour' : 'Minute'}
          options={[...pickerOptions]}
          selectedIndex={pickerSelected}
          onSelect={idx => {
            setPoints(prev => {
              const next = [...prev];
              const row = {...next[pointPicker.pointIndex]};
              if (pointPicker.field === 'hour') {
                row.hour = idx;
              } else {
                row.minuteGear = idx;
              }
              next[pointPicker.pointIndex] = row;
              return next;
            });
            setPointPicker(null);
          }}
          onDismiss={() => setPointPicker(null)}
        />
      ) : null}
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {fontSize: 14, color: '#666'},
  addBtn: {padding: 6},
  addText: {fontSize: 14, color: '#007AFF'},
  bottom: {height: 24},
});

export default TimingModeScreen;
