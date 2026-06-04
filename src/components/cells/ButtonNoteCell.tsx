import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  buttonTitle: string;
  note?: string;
  onPress: () => void;
  disabled?: boolean;
}

/** 对齐 MKButtonMsgCell */
const ButtonNoteCell: React.FC<Props> = ({
  label,
  buttonTitle,
  note,
  onPress,
  disabled,
}) => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.btn, disabled && styles.btnDisabled]}
        onPress={onPress}
        disabled={disabled}>
        <Text style={styles.btnText}>{buttonTitle}</Text>
      </Pressable>
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
    justifyContent: 'space-between',
  },
  label: {fontSize: 15, color: '#333', flex: 1, paddingRight: 8},
  btn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnDisabled: {opacity: 0.5},
  btnText: {fontSize: 14, color: '#333'},
  note: {fontSize: 12, color: '#666', marginTop: 8, lineHeight: 16},
});

export default ButtonNoteCell;
