import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ScanListItem} from '../types/scan';
import {NAVBAR_COLOR} from '../theme/colors';

/** 对齐 MKMPScanController heightForRowAtIndexPath = 140 */
export const SCAN_CELL_HEIGHT = 140;

const OFFSET_X = 15;
const RSSI_LEFT = 20;
const RSSI_TOP = 10;
const RSSI_ICON_W = 20;
const RSSI_ICON_H = 14;
const RSSI_LABEL_W = 40;
const CONNECT_W = 80;
const CONNECT_H = 30;
const TITLE_GAP = 15;
const METRIC_ROW_H = 30;
const METRIC_ICON = 20;
const METRIC_FONT = 12;

interface Props {
  item: ScanListItem;
  onConnect: () => void;
}

function MetricIconRow({
  icon,
  label,
}: {
  icon: ImageSourcePropType;
  label: string;
}) {
  return (
    <View style={styles.metricItem}>
      <Image source={icon} style={styles.metricIcon} resizeMode="contain" />
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** 对齐 MKMPScanPageCell setDataModel 状态优先级 */
function resolveStateDisplay(item: ScanListItem): {
  icon: ImageSourcePropType;
  text: string;
} {
  if (item.overLoad) {
    return {
      icon: require('../../assets/images/mp_scan_overStateIcon.png'),
      text: 'OverLoad',
    };
  }
  if (item.overCurrent) {
    return {
      icon: require('../../assets/images/mp_scan_overStateIcon.png'),
      text: 'OverCurrent',
    };
  }
  if (item.overPressure) {
    return {
      icon: require('../../assets/images/mp_scan_overStateIcon.png'),
      text: 'OverVoltage',
    };
  }
  if (item.underVoltage) {
    return {
      icon: require('../../assets/images/mp_scan_overStateIcon.png'),
      text: 'SagVoltage',
    };
  }
  if (!item.switchStatus) {
    return {
      icon: require('../../assets/images/mp_scan_stateOffIcon.png'),
      text: 'OFF',
    };
  }
  return {
    icon: require('../../assets/images/mp_scan_stateOnIcon.png'),
    text: 'ON',
  };
}

const ScanDeviceCell: React.FC<Props> = ({item, onConnect}) => {
  const displayName = item.deviceName?.trim() ? item.deviceName : 'N/A';
  const mac = item.macAddress?.trim() ? item.macAddress : 'N/A';
  const showConnect = item.connectable !== false;
  const state = resolveStateDisplay(item);

  const voltageText = `${item.voltage} V`;
  const currentText = `${item.current} A`;
  const powerText = `${item.power} W`;
  const powerFactorText = `${item.powerFactor} %`;
  const frequencyText = `${item.frequencyOfCurrent} HZ`;

  return (
    <View style={styles.cell}>
      {showConnect ? (
        <Pressable
          style={styles.connectBtn}
          onPress={onConnect}
          accessibilityRole="button">
          <View style={styles.connectBtnInner}>
            <Text style={styles.connectText}>CONNECT</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.topRow}>
        <View style={styles.rssiCol}>
          <Image
            source={require('../../assets/images/mp_scan_rssiIcon.png')}
            style={styles.rssiIcon}
            resizeMode="contain"
          />
          <Text style={styles.rssiText}>{`${item.rssi}dBm`}</Text>
        </View>

        <View
          style={[
            styles.titleCol,
            showConnect ? styles.titleColWithConnect : null,
          ]}>
          <Text style={styles.deviceName} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={styles.macLabel} numberOfLines={1}>
            {`MAC: ${mac}`}
          </Text>
          <View style={styles.txRow}>
            <Text style={styles.txPower} numberOfLines={1}>
              {`Tx Power:  ${item.txPower}dBm`}
            </Text>
            <Text style={styles.timeText} numberOfLines={1}>
              {item.scanTime}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricIconRow
          icon={require('../../assets/images/mp_scan_voltageIcon.png')}
          label={voltageText}
        />
        <MetricIconRow
          icon={require('../../assets/images/mp_scan_currentIcon.png')}
          label={currentText}
        />
        <MetricIconRow
          icon={require('../../assets/images/mp_scan_powerIcon.png')}
          label={powerText}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricIconRow
          icon={require('../../assets/images/mp_scan_powerFactorIcon.png')}
          label={powerFactorText}
        />
        <MetricIconRow
          icon={require('../../assets/images/mp_scan_frequencyOfCurrentcon.png')}
          label={frequencyText}
        />
        <MetricIconRow icon={state.icon} label={state.text} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    height: SCAN_CELL_HEIGHT,
    backgroundColor: '#fff',
    paddingHorizontal: OFFSET_X,
    overflow: 'hidden',
  },
  connectBtn: {
    position: 'absolute',
    right: OFFSET_X,
    top: 5,
    width: CONNECT_W,
    height: CONNECT_H,
    borderRadius: 10,
    backgroundColor: NAVBAR_COLOR,
    overflow: 'hidden',
    zIndex: 1,
  },
  connectBtnInner: {
    width: CONNECT_W,
    height: CONNECT_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectText: {
    width: CONNECT_W,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? CONNECT_H : 18,
    ...(Platform.OS === 'android'
      ? {includeFontPadding: false, textAlignVertical: 'center'}
      : {}),
  },
  topRow: {
    flexDirection: 'row',
    paddingTop: RSSI_TOP,
    minHeight: 58,
  },
  rssiCol: {
    width: RSSI_LEFT + RSSI_ICON_W - OFFSET_X,
    alignItems: 'center',
    marginLeft: RSSI_LEFT - OFFSET_X,
  },
  rssiIcon: {
    width: RSSI_ICON_W,
    height: RSSI_ICON_H,
  },
  rssiText: {
    marginTop: 5,
    width: RSSI_LABEL_W,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  titleCol: {
    flex: 1,
    marginLeft: TITLE_GAP,
    justifyContent: 'center',
  },
  titleColWithConnect: {
    marginRight: CONNECT_W + 8,
  },
  deviceName: {
    fontSize: 15,
    color: '#333',
    lineHeight: 18,
  },
  macLabel: {
    marginTop: 3,
    fontSize: 12,
    color: '#666',
    lineHeight: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    minHeight: 14,
  },
  txPower: {
    flex: 1,
    fontSize: METRIC_FONT,
    color: '#333',
    lineHeight: 14,
  },
  timeText: {
    width: CONNECT_W,
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    lineHeight: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    height: METRIC_ROW_H,
    marginTop: 5,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  metricIcon: {
    width: METRIC_ICON,
    height: METRIC_ICON,
  },
  metricLabel: {
    flex: 1,
    marginLeft: 5,
    fontSize: METRIC_FONT,
    color: '#333',
    lineHeight: 16,
  },
});

export default ScanDeviceCell;
