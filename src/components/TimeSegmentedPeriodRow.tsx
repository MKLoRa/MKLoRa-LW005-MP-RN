import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import TextFieldCell from './cells/TextFieldCell';

interface Props {
  index: number;
  startHourLabel: string;
  startMinuteLabel: string;
  endHourLabel: string;
  endMinuteLabel: string;
  startMinuteEnabled: boolean;
  endMinuteEnabled: boolean;
  interval: string;
  onPickStartHour: () => void;
  onPickStartMinute: () => void;
  onPickEndHour: () => void;
  onPickEndMinute: () => void;
  onIntervalChange: (t: string) => void;
  /** 对齐 iOS：其它 cell 露出删除时，先收起再允许编辑 */
  onIntervalFocus?: () => void | boolean;
  /** 点击行内空白区域（对齐 iOS contentPanel 点击 mp_cellTapAction） */
  onCellTap?: () => void;
}

const TimeSegmentedPeriodRow: React.FC<Props> = ({
  index,
  startHourLabel,
  startMinuteLabel,
  endHourLabel,
  endMinuteLabel,
  startMinuteEnabled,
  endMinuteEnabled,
  interval,
  onPickStartHour,
  onPickStartMinute,
  onPickEndHour,
  onPickEndMinute,
  onIntervalChange,
  onIntervalFocus,
  onCellTap,
}) => (
  <View style={styles.wrap}>
    <Pressable onPress={onCellTap}>
      <Text style={styles.periodTitle}>{`Time period ${index + 1}`}</Text>
    </Pressable>
    <View style={styles.timeRow}>
      <Pressable style={styles.timeBtn} onPress={onPickStartHour}>
        <Text style={styles.timeBtnText}>{startHourLabel}</Text>
      </Pressable>
      <Text style={styles.colon}>:</Text>
      <Pressable
        style={[styles.timeBtn, !startMinuteEnabled && styles.timeBtnDisabled]}
        onPress={startMinuteEnabled ? onPickStartMinute : undefined}
        disabled={!startMinuteEnabled}>
        <Text
          style={[
            styles.timeBtnText,
            !startMinuteEnabled && styles.timeBtnTextDisabled,
          ]}>
          {startMinuteLabel}
        </Text>
      </Pressable>
      <Text style={styles.toLabel}>to</Text>
      <Pressable style={styles.timeBtn} onPress={onPickEndHour}>
        <Text style={styles.timeBtnText}>{endHourLabel}</Text>
      </Pressable>
      <Text style={styles.colon}>:</Text>
      <Pressable
        style={[styles.timeBtn, !endMinuteEnabled && styles.timeBtnDisabled]}
        onPress={endMinuteEnabled ? onPickEndMinute : undefined}
        disabled={!endMinuteEnabled}>
        <Text
          style={[
            styles.timeBtnText,
            !endMinuteEnabled && styles.timeBtnTextDisabled,
          ]}>
          {endMinuteLabel}
        </Text>
      </Pressable>
    </View>
    <TextFieldCell
      label={`Report Interval ${index + 1}`}
      value={interval}
      placeholder="30~86400"
      unit="s"
      keyboardType="number-pad"
      inputFilter="decimal"
      maxLength={5}
      onChangeText={onIntervalChange}
      onFocus={onIntervalFocus}
    />
    <View style={styles.bottomLine} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#fff',
    minHeight: 110,
  },
  periodTitle: {
    fontSize: 13,
    color: '#333',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 4,
  },
  timeBtn: {
    width: 40,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  timeBtnDisabled: {
    opacity: 0.45,
  },
  timeBtnText: {fontSize: 14, color: '#333'},
  timeBtnTextDisabled: {color: '#999'},
  colon: {marginHorizontal: 4, fontSize: 14, color: '#666'},
  toLabel: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#666',
    width: 50,
    textAlign: 'center',
  },
  bottomLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginHorizontal: 15,
    marginTop: 4,
  },
});

export default TimeSegmentedPeriodRow;
