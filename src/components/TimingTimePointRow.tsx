import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  hourLabel: string;
  minuteLabel: string;
  onPickHour: () => void;
  onPickMinute: () => void;
  onDelete?: () => void;
}

const TimingTimePointRow: React.FC<Props> = ({
  label,
  hourLabel,
  minuteLabel,
  onPickHour,
  onPickMinute,
  onDelete,
}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.picks}>
      <Pressable style={styles.btn} onPress={onPickHour}>
        <Text style={styles.btnText}>{hourLabel}</Text>
      </Pressable>
      <Text style={styles.sep}>:</Text>
      <Pressable style={styles.btn} onPress={onPickMinute}>
        <Text style={styles.btnText}>{minuteLabel}</Text>
      </Pressable>
      {onDelete ? (
        <Pressable style={styles.del} onPress={onDelete}>
          <Text style={styles.delText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  label: {fontSize: 14, color: '#333', flex: 1},
  picks: {flexDirection: 'row', alignItems: 'center'},
  btn: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btnText: {fontSize: 14, color: '#333', textAlign: 'center'},
  sep: {marginHorizontal: 4, color: '#666'},
  del: {marginLeft: 8, padding: 4},
  delText: {fontSize: 22, color: '#c00', lineHeight: 24},
});

export default TimingTimePointRow;
