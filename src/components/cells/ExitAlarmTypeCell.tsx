import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {useKeyboardScrollOnFocus} from '../KeyboardFormScrollView';
import {filterDecimalInput} from '../../utils/filterByListModel';
import {borderedInputStyle} from './TextFieldCell';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
}

/** 对齐 MKMPAlarmFunctionCell：Exit Alarm Type + Long press + 5~15s */
const ExitAlarmTypeCell: React.FC<Props> = ({value, onChangeText}) => {
  const scrollOnFocus = useKeyboardScrollOnFocus();
  const focusedRef = useRef(false);
  const [text, setText] = useState(value);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(value);
    }
  }, [value]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Exit Alarm Type</Text>
      <Text style={styles.press}>Long press</Text>
      <TextInput
        style={[styles.input, borderedInputStyle]}
        value={text}
        placeholder="5~15"
        placeholderTextColor="#999"
        keyboardType="number-pad"
        maxLength={2}
        onFocus={() => {
          focusedRef.current = true;
          scrollOnFocus?.();
        }}
        onBlur={() => {
          focusedRef.current = false;
        }}
        onChangeText={raw => {
          const next = filterDecimalInput(raw, 2);
          setText(next);
          onChangeText(next);
        }}
      />
      <Text style={styles.unit}>s</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  label: {fontSize: 15, color: '#333', width: 120},
  press: {fontSize: 12, color: '#333', marginRight: 5},
  input: {
    width: 50,
    height: 28,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  unit: {fontSize: 12, color: '#333', marginLeft: 5, width: 15},
});

export default ExitAlarmTypeCell;
