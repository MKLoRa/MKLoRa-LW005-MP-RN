import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  type BatteryCycleInfo,
  formatBatteryPowerMah,
} from '../utils/selftestApi';

interface Props {
  info: BatteryCycleInfo;
  title?: string;
}

const BatteryCycleInfoPanel: React.FC<Props> = ({
  info,
  title = 'All Cycles Battery Information:',
}) => (
  <View style={styles.panel}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.line}>Work Time: {info.workTimes} s</Text>
    <Text style={styles.line}>ADV Count: {info.advCount} times</Text>
    <Text style={styles.line}>
      Axis Wakeup Times: {info.axisWakeupTimes}s
    </Text>
    <Text style={styles.line}>BLE Position Times: {info.blePostionTimes}s</Text>
    <Text style={styles.line}>GPS Position Times: {info.gpsPostionTimes}s</Text>
    <Text style={styles.line}>
      LoRa Send Count: {info.loraSendCount} times
    </Text>
    <Text style={styles.line}>
      LoRa Power Consumption: {info.loraPowerConsumption} mAS
    </Text>
    <Text style={styles.line}>
      Battery Power: {formatBatteryPowerMah(info.batteryPower)}
    </Text>
    <Text style={styles.line}>
      Static Position Count: {info.staticPositionCount} peices of payload 1
    </Text>
    <Text style={styles.line}>
      Move Position Count: {info.movePositionCount} peices of payload 2
    </Text>
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 290,
  },
  title: {fontSize: 15, color: '#333', marginBottom: 10},
  line: {fontSize: 13, color: '#333', marginTop: 10},
});

export default BatteryCycleInfoPanel;
