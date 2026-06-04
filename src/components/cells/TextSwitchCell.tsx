import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MkSwitchToggle from '../MkSwitchToggle';

interface Props {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  /** 对齐 MKTextSwitchCell noteMsg */
  note?: string;
}

const TextSwitchCell: React.FC<Props> = ({
  label,
  value,
  onValueChange,
  disabled,
  note,
}) => (
  <View style={[styles.row, note ? styles.rowTall : null]}>
    <View style={styles.labelCol}>
      <Text style={styles.label}>{label}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
    <MkSwitchToggle
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    />
  </View>
);

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  rowTall: {minHeight: 64},
  labelCol: {flex: 1, paddingRight: 8},
  label: {fontSize: 15, color: '#333'},
  note: {fontSize: 12, color: '#999', marginTop: 4, lineHeight: 16},
});

export default TextSwitchCell;
