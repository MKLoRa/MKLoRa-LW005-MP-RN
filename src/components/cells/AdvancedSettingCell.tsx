import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MkSwitchToggle from '../MkSwitchToggle';

interface Props {
  value: boolean;
  onValueChange: (v: boolean) => void;
}

/** 对齐 iOS MKLoRaAdvancedSettingCell */
const AdvancedSettingCell: React.FC<Props> = ({value, onValueChange}) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>Advanced Setting (Optional)</Text>
    <View style={styles.row}>
      <Text style={styles.hint}>
        Turn on to configure CH, Duty-cycle, DR, ADR and related parameters.
      </Text>
      <MkSwitchToggle value={value} onValueChange={onValueChange} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 80,
  },
  title: {fontSize: 15, color: '#333', fontWeight: '500', marginBottom: 8},
  row: {flexDirection: 'row', alignItems: 'center'},
  hint: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
    paddingRight: 12,
  },
});

export default AdvancedSettingCell;
