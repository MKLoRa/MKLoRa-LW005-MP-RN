import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MkSwitchToggle from '../MkSwitchToggle';

interface Props {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  note?: string;
}

const NoteTextSwitchCell: React.FC<Props> = ({
  label,
  value,
  onValueChange,
  note,
}) => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <MkSwitchToggle value={value} onValueChange={onValueChange} />
    </View>
    {note ? <Text style={styles.note}>{note}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  label: {fontSize: 15, color: '#333', flex: 1, paddingRight: 8},
  note: {fontSize: 12, color: '#666', marginTop: 6, lineHeight: 17},
});

export default NoteTextSwitchCell;
