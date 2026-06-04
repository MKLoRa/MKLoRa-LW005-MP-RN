import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import TextFieldCell from './cells/TextFieldCell';
import {FILTER_PLACEHOLDERS} from '../utils/filterPlaceholders';

const OTHER_RAW_DATA_MAX_HEX_LEN = 29 * 2;

export type FilterConditionFields = {
  dataType: string;
  minIndex: string;
  maxIndex: string;
  rawData: string;
};

interface Props {
  label: string;
  value: FilterConditionFields;
  onChange: (patch: Partial<FilterConditionFields>) => void;
}

const FilterRawDataConditionCell: React.FC<Props> = ({label, value, onChange}) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <TextFieldCell
      label="Data Type"
      value={value.dataType}
      placeholder={FILTER_PLACEHOLDERS.otherDataType}
      maxLength={2}
      keyboardType="ascii-capable"
      inputFilter="hex"
      onChangeText={t => onChange({dataType: t})}
    />
    <TextFieldCell
      label="Min Index"
      value={value.minIndex}
      placeholder={FILTER_PLACEHOLDERS.otherMinIndex}
      keyboardType="number-pad"
      maxLength={2}
      inputFilter="decimal"
      onChangeText={t => onChange({minIndex: t})}
    />
    <TextFieldCell
      label="Max Index"
      value={value.maxIndex}
      placeholder={FILTER_PLACEHOLDERS.otherMaxIndex}
      keyboardType="number-pad"
      maxLength={2}
      inputFilter="decimal"
      onChangeText={t => onChange({maxIndex: t})}
    />
    <TextFieldCell
      label="Raw Data"
      value={value.rawData}
      placeholder={FILTER_PLACEHOLDERS.otherRawData}
      maxLength={OTHER_RAW_DATA_MAX_HEX_LEN}
      keyboardType="ascii-capable"
      inputFilter="hex"
      onChangeText={t => onChange({rawData: t})}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {backgroundColor: '#fff', marginBottom: 8},
  label: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 4,
  },
});

export default FilterRawDataConditionCell;
