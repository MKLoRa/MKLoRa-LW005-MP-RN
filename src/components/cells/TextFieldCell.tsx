import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {useKeyboardScrollOnFocus} from '../KeyboardFormScrollView';
import {
  filterDecimalInput,
  filterHexInput,
} from '../../utils/filterByListModel';

export const borderedInputStyle = {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 6,
  backgroundColor: '#fff',
} as const;

interface Props {
  label: string;
  value: string;
  placeholder?: string;
  unit?: string;
  maxLength?: number;
  onChangeText: (t: string) => void;
  /** 返回 false 时取消聚焦（对齐 iOS cellCanSelected 先收起删除） */
  onFocus?: () => void | boolean;
  editable?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'ascii-capable';
  autoCapitalize?: 'none' | 'characters';
  inputFilter?: 'none' | 'hex' | 'decimal';
  /** text：长文本（如 ADV Name）；numeric：带单位的数字输入（默认） */
  inputLayout?: 'text' | 'numeric';
}

function applyInputFilter(
  raw: string,
  inputFilter: Props['inputFilter'],
  maxLength?: number,
): string {
  if (inputFilter === 'hex') {
    const v = filterHexInput(raw);
    return maxLength !== undefined ? v.slice(0, maxLength) : v;
  }
  if (inputFilter === 'decimal') {
    return filterDecimalInput(raw, maxLength);
  }
  if (maxLength !== undefined) {
    return raw.slice(0, maxLength);
  }
  return raw;
}

const TextFieldCell: React.FC<Props> = ({
  label,
  value,
  placeholder,
  unit,
  maxLength,
  onChangeText,
  onFocus,
  editable = true,
  keyboardType = 'number-pad',
  autoCapitalize = 'none',
  inputFilter = 'none',
  inputLayout = 'numeric',
}) => {
  const isTextLayout = inputLayout === 'text';
  const scrollOnFocus = useKeyboardScrollOnFocus();
  const inputRef = useRef<TextInput>(null);
  const focusedRef = useRef(false);
  const [text, setText] = useState(value);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(value);
    }
  }, [value]);

  const handleChange = (raw: string) => {
    const next = applyInputFilter(raw, inputFilter, maxLength);
    setText(next);
    onChangeText(next);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={0}>
        {label}
      </Text>
      <View style={isTextLayout ? styles.inputWrapText : styles.inputWrapNumeric}>
        <TextInput
          ref={inputRef}
          style={isTextLayout ? styles.inputText : styles.inputNumeric}
          value={text}
          onChangeText={handleChange}
          onFocus={() => {
            if (onFocus?.() === false) {
              inputRef.current?.blur();
              return;
            }
            focusedRef.current = true;
            scrollOnFocus?.();
          }}
          onBlur={() => {
            focusedRef.current = false;
            setText(value);
          }}
          placeholder={placeholder}
          placeholderTextColor="#ccc"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={inputFilter === 'none' ? maxLength : undefined}
          editable={editable}
          clearButtonMode="while-editing"
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
  inputWrapText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    maxWidth: '58%',
  },
  inputWrapNumeric: {
    width: 148,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  inputText: {
    flex: 1,
    minWidth: 120,
    minHeight: 36,
    fontSize: 15,
    color: '#333',
    textAlign: 'left',
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...borderedInputStyle,
  },
  inputNumeric: {
    width: 72,
    minHeight: 36,
    fontSize: 15,
    color: '#333',
    textAlign: 'left',
    paddingHorizontal: 8,
    paddingVertical: 8,
    ...borderedInputStyle,
  },
  unit: {fontSize: 13, color: '#999', marginLeft: 4, flexShrink: 0},
});

export default TextFieldCell;
