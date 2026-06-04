import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

/** 对齐 iOS MKNormalSliderCell：RSSI -127 ~ 0 dBm */
const RssiSliderCell: React.FC<Props> = ({value, onChange, disabled}) => {
  const step = (delta: number) => {
    if (disabled) {
      return;
    }
    const next = Math.min(0, Math.max(-127, value + delta));
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        RSSI Filter
        <Text style={styles.sub}>   (-127dBm ~ 0dBm)</Text>
      </Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.stepBtn, disabled && styles.disabled]}
          onPress={() => step(-1)}
          disabled={disabled}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          style={[styles.stepBtn, disabled && styles.disabled]}
          onPress={() => step(1)}
          disabled={disabled}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>
        *The device will uplink valid ADV data with RSSI no less than {value}.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 90,
  },
  title: {fontSize: 15, color: '#333'},
  sub: {fontSize: 13, color: '#dfdfdf'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 20,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {fontSize: 22, color: '#333', lineHeight: 24},
  value: {fontSize: 18, fontWeight: '600', color: '#333', minWidth: 48, textAlign: 'center'},
  note: {fontSize: 12, color: '#dfdfdf', marginTop: 10, lineHeight: 16},
  disabled: {opacity: 0.4},
});

export default RssiSliderCell;
