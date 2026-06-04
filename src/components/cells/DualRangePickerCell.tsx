import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  lowValue: string;
  highValue: string;
  onPressLow: () => void;
  onPressHigh: () => void;
  note?: string;
}

/** 对齐 iOS MKLoRaSettingCHCell：左右双选（CH / DR For Payload） */
const DualRangePickerCell: React.FC<Props> = ({
  label,
  lowValue,
  highValue,
  onPressLow,
  onPressHigh,
  note,
}) => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickers}>
        <Pressable style={styles.btn} onPress={onPressLow}>
          <Text style={styles.btnText}>{lowValue}</Text>
        </Pressable>
        <Text style={styles.sep}>-</Text>
        <Pressable style={styles.btn} onPress={onPressHigh}>
          <Text style={styles.btnText}>{highValue}</Text>
        </Pressable>
      </View>
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
  pickers: {flexDirection: 'row', alignItems: 'center'},
  btn: {
    minWidth: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnText: {fontSize: 14, color: '#333', textAlign: 'center'},
  sep: {marginHorizontal: 6, fontSize: 15, color: '#666'},
  note: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    lineHeight: 17,
  },
});

export default DualRangePickerCell;
