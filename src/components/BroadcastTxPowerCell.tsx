import React, {useCallback} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {TxPower} from '../sdk/MPSDKDefines';
import {txPowerLabel} from '../utils/bleSettingsModel';

interface Props {
  value: TxPower;
  onChange: (v: TxPower) => void;
}

const MIN = TxPower.Neg40dBm;
const MAX = TxPower.d4;

const BroadcastTxPowerCell: React.FC<Props> = ({value, onChange}) => {
  const label = txPowerLabel(value);

  const onDecrease = useCallback(() => {
    if (value > MIN) {
      onChange((value - 1) as TxPower);
    }
  }, [value, onChange]);

  const onIncrease = useCallback(() => {
    if (value < MAX) {
      onChange((value + 1) as TxPower);
    }
  }, [value, onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tx Power</Text>
      <Text style={styles.note}>(-40,-20,-16,-12,-8,-4,0,+3,+4)</Text>
      <View style={styles.sliderRow}>
        <Pressable onPress={onDecrease} hitSlop={8}>
          <Text style={styles.stepBtn}>−</Text>
        </Pressable>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {width: `${((value - MIN) / (MAX - MIN)) * 100}%`},
            ]}
          />
        </View>
        <Pressable onPress={onIncrease} hitSlop={8}>
          <Text style={styles.stepBtn}>+</Text>
        </Pressable>
        <Text style={styles.valueLabel}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 85,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 12,
  },
  title: {fontSize: 15, color: '#333'},
  note: {fontSize: 13, color: '#dfdfdf', marginTop: 5},
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  stepBtn: {
    fontSize: 22,
    color: '#2F84D0',
    width: 28,
    textAlign: 'center',
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: '#e8e8e8',
    borderRadius: 5,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#2F84D0',
    borderRadius: 5,
  },
  valueLabel: {
    width: 56,
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
  },
});

export default BroadcastTxPowerCell;
