import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  /** 列下标 0–7 对应的显示字符 */
  activeDigits: Record<number, string>;
}

/** 对齐 MKMPSelftestCell / MKMPPCBAStatusCell 数字高亮行 */
const StatusDigitRowCell: React.FC<Props> = ({label, activeDigits}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.digits}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <Text key={i} style={styles.digit}>
          {activeDigits[i] ?? ''}
        </Text>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {fontSize: 15, color: '#333', width: 120, paddingTop: 2},
  digits: {flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  digit: {fontSize: 13, color: '#333', width: 24, textAlign: 'center'},
});

export default StatusDigitRowCell;
