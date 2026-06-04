import React, {useEffect, useState} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NAVBAR_COLOR} from '../theme/colors';
import {borderedInputStyle} from './cells/TextFieldCell';

interface Props {
  visible: boolean;
  searchKey: string;
  searchRssi: number;
  minRssi?: number;
  onDismiss: () => void;
  onDone: (key: string, rssi: number) => void;
}

const RssiSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}> = ({value, min, max, onChange}) => {
  const [trackWidth, setTrackWidth] = React.useState(280);
  const setFromX = (x: number) => {
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    onChange(Math.round(min + ratio * (max - min)));
  };

  return (
    <View
      style={styles.sliderOuter}
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width || 280)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={e => setFromX(e.nativeEvent.locationX)}
      onResponderMove={e => setFromX(e.nativeEvent.locationX)}>
      <View style={styles.sliderTrack}>
        <View
          style={[
            styles.sliderFill,
            {width: `${((value - min) / (max - min)) * 100}%`},
          ]}
        />
      </View>
      <Text style={styles.rssiValue}>{value}dBm</Text>
    </View>
  );
};

const SearchConditionsModal: React.FC<Props> = ({
  visible,
  searchKey,
  searchRssi,
  minRssi = -127,
  onDismiss,
  onDone,
}) => {
  const insets = useSafeAreaInsets();
  const [key, setKey] = useState(searchKey);
  const [rssi, setRssi] = useState(searchRssi);

  useEffect(() => {
    if (visible) {
      setKey(searchKey);
      setRssi(searchRssi);
    }
  }, [visible, searchKey, searchRssi]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable
          style={[styles.panel, {marginTop: insets.top + 44}]}
          onPress={e => e.stopPropagation()}>
          <TextInput
            style={styles.input}
            value={key}
            onChangeText={setKey}
            placeholder="Device name or MAC"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
          <Text style={styles.rssiLabel}>RSSI</Text>
          <RssiSlider value={rssi} min={minRssi} max={0} onChange={setRssi} />
          <Pressable
            style={styles.doneBtn}
            onPress={() => onDone(key.trim(), Math.round(rssi))}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  panel: {
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    minHeight: 200,
  },
  input: {
    minHeight: 40,
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...borderedInputStyle,
    color: '#333',
    marginBottom: 12,
  },
  rssiLabel: {fontSize: 14, color: '#333', marginBottom: 6},
  rssiValue: {fontSize: 14, color: NAVBAR_COLOR, textAlign: 'right', marginTop: 4},
  sliderOuter: {marginBottom: 12},
  sliderTrack: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: 4,
    backgroundColor: NAVBAR_COLOR,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: NAVBAR_COLOR,
    borderRadius: 4,
    marginTop: 8,
  },
  doneText: {color: '#fff', fontSize: 15, fontWeight: '600'},
});

export default SearchConditionsModal;
