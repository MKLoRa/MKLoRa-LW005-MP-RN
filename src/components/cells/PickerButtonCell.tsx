import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  value: string;
  onPress: () => void;
}

const PickerButtonCell: React.FC<Props> = ({label, value, onPress}) => (
  <Pressable style={styles.row} onPress={onPress}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.btn}>
      <Text style={styles.btnText} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  label: {fontSize: 15, color: '#333', flex: 1},
  btn: {
    maxWidth: '55%',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnText: {fontSize: 14, color: '#333', textAlign: 'right'},
});

export default PickerButtonCell;
